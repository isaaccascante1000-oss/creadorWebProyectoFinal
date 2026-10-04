import { describe, expect, it } from 'vitest';
import { removeOAuthQueryParams } from '../oauthUrl';

describe('removeOAuthQueryParams', () => {
  it('removes OAuth values while preserving unrelated query parameters', () => {
    expect(removeOAuthQueryParams('?code=secret&state=token&provider=github&view=grid')).toEqual({
      search: 'view=grid',
      changed: true,
    });
  });

  it('leaves a URL query unchanged when it has no OAuth values', () => {
    expect(removeOAuthQueryParams('?view=grid')).toEqual({
      search: 'view=grid',
      changed: false,
    });
  });
});
