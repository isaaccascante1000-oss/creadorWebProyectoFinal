# Configuración OAuth de CanvasAI

## URLs locales

Usa estas URLs en desarrollo:

- Frontend: `http://localhost:5173`
- Callback OAuth del backend: `http://localhost:3001/oauth/provider-callback`
- Retorno de la aplicación: `http://localhost:5173/login`

El frontend solo recibe variables `VITE_*` públicas. Los `CLIENT_SECRET` se leen únicamente desde `.env` del servidor OAuth.

## GitHub OAuth App

1. Abre GitHub y entra en **Settings > Developer settings > OAuth Apps**.
2. Pulsa **New OAuth App**.
3. Completa:
   - **Application name**: `CanvasAI Local`.
   - **Homepage URL**: `http://localhost:5173`.
   - **Authorization callback URL**: `http://localhost:3001/oauth/provider-callback`.
4. Guarda la aplicación.
5. Copia **Client ID** en `GITHUB_CLIENT_ID`.
6. Genera un **Client secret** y copia su valor en `GITHUB_CLIENT_SECRET`.
7. No publiques el secret ni lo pongas en una variable `VITE_*`.

## Google OAuth 2.0

1. Abre **Google Cloud Console** y selecciona o crea un proyecto.
2. En **APIs & Services > OAuth consent screen**, configura la pantalla de consentimiento. Para pruebas locales puedes usar el modo **Testing** y añadir tu cuenta como usuario de prueba.
3. En **APIs & Services > Credentials**, pulsa **Create credentials > OAuth client ID**.
4. Selecciona **Web application**.
5. Añade:
   - **Authorized JavaScript origins**: `http://localhost:5173`.
   - **Authorized redirect URIs**: `http://localhost:3001/oauth/provider-callback`.
6. Crea el cliente y copia:
   - **Client ID** en `GOOGLE_CLIENT_ID`.
   - **Client secret** en `GOOGLE_CLIENT_SECRET`.

## Variables

En `.env` del proyecto:

```env
VITE_AUTH_API_URL=http://localhost:3001
VITE_AUTH_APP_URL=http://localhost:5173/login

AUTH_PORT=3001
APP_URL=http://localhost:5173/login
AUTH_REDIRECT_URL=http://localhost:3001/oauth/provider-callback
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Ejecución

Terminal 1:

```bash
npm run auth:dev
```

Terminal 2:

```bash
npm run dev
```

Después abre `http://localhost:5173/login` y prueba GitHub o Google.

En producción, sustituye `localhost` por el dominio real y registra exactamente la misma callback HTTPS en cada proveedor. Usa HTTPS y un almacenamiento de sesión persistente para producción; el mapa en memoria del servidor incluido aquí está pensado para desarrollo local.
