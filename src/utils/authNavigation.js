export const getAuthenticatedHome = (role) => (
  ['admin', 'administrador'].includes(String(role || '').toLowerCase()) ? '/admin' : '/canvas'
);
