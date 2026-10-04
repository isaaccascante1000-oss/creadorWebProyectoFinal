import process from 'node:process';

const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export const createGeminiGenerateUrl = (
  apiKey,
  model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
) => {
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
  );
  url.searchParams.set('key', apiKey);
  return url;
};
