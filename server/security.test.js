import { afterAll, describe, expect, it, vi } from 'vitest';

vi.stubEnv('ALLOWED_EMAIL_DOMAIN', '');
vi.stubEnv('ADMIN_EMAILS', 'admin-allowlisted@gmail.com');

const {
  assignRole,
  createSession,
  getSession,
  isInstitutionalEmail,
  isStrongPassword,
  requireResourceOwner,
  requireRole,
  sessionCookie,
} = await import('./security.js');

afterAll(() => vi.unstubAllEnvs());

const createResponse = () => ({
  statusCode: 200,
  setHeader: vi.fn(),
  end: vi.fn(),
});

describe('server security middleware', () => {
  it('accepts standard email domains when no domain allowlist is configured', () => {
    expect(isInstitutionalEmail('person@gmail.com')).toBe(true);
    expect(isInstitutionalEmail('person@hotmail.com')).toBe(true);
    expect(isInstitutionalEmail('not a valid email')).toBe(false);
  });

  it('assigns admin only to an address listed in ADMIN_EMAILS', () => {
    expect(assignRole('admin-allowlisted@gmail.com')).toBe('admin');
    expect(assignRole('person@gmail.com')).toBe('user');
  });

  it('enforces the documented password strength policy', () => {
    expect(isStrongPassword('CanvasAI2026!')).toBe(true);
    expect(isStrongPassword('canvasai123')).toBe(false);
  });

  it('creates an HttpOnly session and resolves it from the cookie', () => {
    const acceptedAt = '2026-10-04T10:30:00.000Z';
    const session = createSession({ id: 'person-1', email: 'person@gmail.com', role: 'admin' }, acceptedAt);
    const request = { headers: { cookie: `canvasai_session=${session.id}` } };

    expect(getSession(request).user).toMatchObject({ id: 'person-1', role: 'user' });
    expect(getSession(request).user.termsAcceptedAt).toBe(acceptedAt);
    expect(sessionCookie(session.id)).toContain('HttpOnly');
    expect(sessionCookie(session.id)).toContain('SameSite=Strict');
  });

  it('blocks access when the requested role is not assigned by the server', () => {
    const session = createSession({ id: 'person-2', email: 'another-person@gmail.com', role: 'admin' });
    const request = { headers: { cookie: `canvasai_session=${session.id}` } };
    const response = createResponse();

    expect(requireRole('admin')(request, response)).toBeNull();
    expect(response.statusCode).toBe(403);
    expect(response.end).toHaveBeenCalledOnce();
  });

  it('hides resources owned by another user', () => {
    const session = { user: { id: 'owner-1', role: 'user' } };
    const request = { headers: { origin: 'http://localhost:5173' } };
    const response = createResponse();

    expect(requireResourceOwner(() => 'owner-2')(request, response, session)).toBe(false);
    expect(response.statusCode).toBe(404);
  });
});
