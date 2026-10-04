const isRecord = (value) => value !== null && typeof value === 'object';

export const getErrorMessage = (error, fallback = 'Ocurrió un error inesperado.') => {
  const candidates = [
    error?.response?.data?.error,
    error?.response?.data?.message,
    error?.data?.error,
    error?.error,
    error?.message,
    error,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (isRecord(candidate) && typeof candidate.message === 'string' && candidate.message.trim()) {
      return candidate.message.trim();
    }
  }

  return fallback;
};
