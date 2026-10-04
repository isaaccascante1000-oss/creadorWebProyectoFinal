const OAUTH_QUERY_PARAMS = ['code', 'state', 'provider'];

export const removeOAuthQueryParams = (search = '') => {
  const params = new URLSearchParams(search);
  let changed = false;

  OAUTH_QUERY_PARAMS.forEach((param) => {
    if (params.has(param)) {
      params.delete(param);
      changed = true;
    }
  });

  return {
    search: params.toString(),
    changed,
  };
};
