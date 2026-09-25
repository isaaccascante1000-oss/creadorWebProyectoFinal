import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';

const loadEnvFile = () => {
  const envPath = '.env';
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*["']?(.*?)["']?\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
};

loadEnvFile();

const PORT = Number(process.env.AUTH_PORT || 3001);
const APP_URL = process.env.APP_URL || 'http://localhost:5173/login';
const AUTH_REDIRECT_URL = process.env.AUTH_REDIRECT_URL || `http://localhost:${PORT}/oauth/provider-callback`;
const FRONTEND_ORIGIN = new URL(APP_URL).origin;
const pendingStates = new Map();
const oneTimeCodes = new Map();

const providerConfig = {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userUrl: 'https://api.github.com/user',
    scope: 'read:user user:email',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
  },
};

const json = (response, status, body) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': FRONTEND_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
  });
  response.end(JSON.stringify(body));
};

const redirect = (response, url) => {
  response.writeHead(302, { Location: url });
  response.end();
};

const createToken = () => randomBytes(32).toString('hex');

const cleanExpiredEntries = () => {
  const now = Date.now();
  for (const [key, value] of pendingStates) if (value.expiresAt < now) pendingStates.delete(key);
  for (const [key, value] of oneTimeCodes) if (value.expiresAt < now) oneTimeCodes.delete(key);
};

const getProviderUser = async (provider, accessToken) => {
  const config = providerConfig[provider];
  const response = await fetch(config.userUrl, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(provider === 'github' ? { 'User-Agent': 'CanvasAI OAuth' } : {}),
    },
  });
  if (!response.ok) throw new Error(`No se pudo obtener el perfil de ${provider}.`);
  const profile = await response.json();

  let email = profile.email;
  if (provider === 'github' && !email) {
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`, 'User-Agent': 'CanvasAI OAuth' },
    });
    const emails = await emailResponse.json();
    email = emails.find((item) => item.primary)?.email || emails[0]?.email;
  }
  if (!email) throw new Error('El proveedor no devolvió un correo electrónico.');

  return {
    id: `${provider}:${profile.id || profile.sub}`,
    email,
    name: profile.name || profile.login || profile.email.split('@')[0],
    role: 'user',
    provider,
  };
};

const exchangeCode = async (provider, code) => {
  const config = providerConfig[provider];
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: AUTH_REDIRECT_URL,
  });
  if (provider === 'google') body.set('grant_type', 'authorization_code');

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) throw new Error(tokenData.error_description || 'No se pudo intercambiar el código OAuth.');
  return getProviderUser(provider, tokenData.access_token);
};

const readBody = async (request) => {
  let data = '';
  for await (const chunk of request) data += chunk;
  return data ? JSON.parse(data) : {};
};

const server = createServer(async (request, response) => {
  cleanExpiredEntries();
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': FRONTEND_ORIGIN,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    });
    response.end();
    return;
  }

  if (request.method === 'GET' && url.pathname.startsWith('/oauth/')) {
    const provider = url.pathname.split('/')[2];
    if (provider === 'callback') {
      const errorRedirect = new URL(APP_URL);
      errorRedirect.searchParams.set('error', url.searchParams.get('error') || 'oauth_error');
      redirect(response, errorRedirect.toString());
      return;
    }
    const config = providerConfig[provider];
    const state = url.searchParams.get('state');
    const returnUrl = url.searchParams.get('redirect_uri') || APP_URL;
    if (!config || !config.clientId || !config.clientSecret || !state) {
      json(response, 503, { error: `OAuth de ${provider || 'este proveedor'} no está configurado.` });
      return;
    }
    try {
      const safeReturnUrl = new URL(returnUrl);
      if (safeReturnUrl.origin !== FRONTEND_ORIGIN) throw new Error('redirect_uri no permitido.');
      pendingStates.set(state, { provider, returnUrl: safeReturnUrl.toString(), expiresAt: Date.now() + 10 * 60 * 1000 });
      const authorizationUrl = new URL(config.authorizationUrl);
      authorizationUrl.searchParams.set('client_id', config.clientId);
      authorizationUrl.searchParams.set('redirect_uri', AUTH_REDIRECT_URL);
      authorizationUrl.searchParams.set('response_type', 'code');
      authorizationUrl.searchParams.set('scope', config.scope);
      authorizationUrl.searchParams.set('state', state);
      if (provider === 'google') authorizationUrl.searchParams.set('access_type', 'offline');
      redirect(response, authorizationUrl.toString());
    } catch (error) {
      json(response, 400, { error: error.message });
    }
    return;
  }

  if (request.method === 'GET' && url.pathname === '/oauth/provider-callback') {
    const state = url.searchParams.get('state');
    const code = url.searchParams.get('code');
    const pending = pendingStates.get(state);
    if (pending && url.searchParams.get('error')) {
      pendingStates.delete(state);
      const returnUrl = new URL(pending.returnUrl);
      returnUrl.searchParams.set('error', 'oauth_cancelled');
      redirect(response, returnUrl.toString());
      return;
    }
    if (!pending || !code) {
      json(response, 400, { error: 'Estado OAuth inválido o expirado.' });
      return;
    }
    pendingStates.delete(state);
    try {
      const user = await exchangeCode(pending.provider, code);
      const oneTimeCode = createToken();
      oneTimeCodes.set(oneTimeCode, { user, state, provider: pending.provider, expiresAt: Date.now() + 60 * 1000 });
      const returnUrl = new URL(pending.returnUrl);
      returnUrl.searchParams.set('code', oneTimeCode);
      returnUrl.searchParams.set('state', state);
      returnUrl.searchParams.set('provider', pending.provider);
      redirect(response, returnUrl.toString());
    } catch (error) {
      const returnUrl = new URL(pending.returnUrl);
      returnUrl.searchParams.set('error', error.message);
      redirect(response, returnUrl.toString());
    }
    return;
  }

  if (request.method === 'POST' && url.pathname === '/oauth/callback') {
    try {
      const body = await readBody(request);
      const pending = oneTimeCodes.get(body.code);
      if (!pending || pending.state !== body.state || pending.provider !== body.provider) {
        json(response, 400, { error: 'Código OAuth inválido o expirado.' });
        return;
      }
      oneTimeCodes.delete(body.code);
      json(response, 200, { user: pending.user });
    } catch (error) {
      json(response, 400, { error: error.message || 'Solicitud OAuth inválida.' });
    }
    return;
  }

  json(response, 404, { error: 'Ruta no encontrada.' });
});

server.listen(PORT, () => {
  console.log(`Servidor OAuth CanvasAI activo en http://localhost:${PORT}`);
});
