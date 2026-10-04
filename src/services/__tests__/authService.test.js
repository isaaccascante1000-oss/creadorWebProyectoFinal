import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { authService } from '../authService';

describe('authService GitHub OAuth errors', () => {
  beforeEach(() => {
    sessionStorage.setItem('canvasai_oauth_state', 'expected-state');
    sessionStorage.setItem('canvasai_oauth_provider', 'github');
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('reports cancellation only for an explicit GitHub access denial', async () => {
    await expect(authService.completeOAuthCallback('?error=access_denied'))
      .resolves.toEqual({
        success: false,
        error: 'La autenticación fue cancelada o rechazada.',
      });
  });

  it('reports GitHub exchange failures as authentication failures', async () => {
    await expect(authService.completeOAuthCallback('?error=github_failed'))
      .resolves.toEqual({
        success: false,
        error: 'No se pudo completar la autenticación.',
      });
  });
});
