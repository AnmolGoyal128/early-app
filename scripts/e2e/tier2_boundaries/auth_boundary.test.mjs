/**
 * Tier 2 Boundary & Corner Cases: Authentication & Session Management
 */

export default function({ client, describe, it, assert, fixtures }) {
  describe('Tier 2: Auth Boundary & Corner Cases', () => {
    const existingEmail = 'aarav.sharma@synthetic-early-demo.in';

    it('TC-AUTH-B01: Registration with already existing email returns 409 Conflict', async () => {
      const res = await client.post('/api/v1/auth/register', {
        email: existingEmail,
        password: 'Password123!',
        fullName: 'Duplicate User',
        role: 'PATIENT'
      });
      client.assertEnvelope(res);
      assert.equal(res.status, 409, 'Expected HTTP 409 Conflict');
      assert.equal(res.data.error.code, 'CONFLICT');
    });

    it('TC-AUTH-B02: Registration with missing password returns 400 Validation Error', async () => {
      const res = await client.post('/api/v1/auth/register', {
        email: `new-${Date.now()}@early-test.in`,
        fullName: 'Missing Password User',
        role: 'PATIENT'
      });
      client.assertEnvelope(res);
      assert.equal(res.status, 400, 'Expected HTTP 400 Bad Request');
      assert.equal(res.data.error.code, 'VALIDATION_ERROR');
    });

    it('TC-AUTH-B03: Registration with malformed email string returns 400 Validation Error', async () => {
      const res = await client.post('/api/v1/auth/register', {
        email: 'invalid-email-format-not-an-email',
        password: 'Password123!',
        fullName: 'Malformed Email User',
        role: 'PATIENT'
      });
      client.assertEnvelope(res);
      assert.equal(res.status, 400, 'Expected HTTP 400 Bad Request');
      assert.equal(res.data.error.code, 'VALIDATION_ERROR');
    });

    it('TC-AUTH-B04: Login with incorrect password returns 401 Unauthorized', async () => {
      const res = await client.post('/api/v1/auth/login', {
        email: existingEmail,
        password: 'WrongPassword999!'
      });
      client.assertEnvelope(res);
      assert.equal(res.status, 401, 'Expected HTTP 401 Unauthorized');
      assert.equal(res.data.error.code, 'UNAUTHORIZED');
    });

    it('TC-AUTH-B05: Access protected /auth/me without Authorization header returns 401', async () => {
      client.clearToken();
      const res = await client.get('/api/v1/auth/me', { 'Content-Type': 'application/json', 'Authorization': '' });
      client.assertEnvelope(res);
      assert.equal(res.status, 401, 'Expected HTTP 401 Unauthorized');
      assert.equal(res.data.error.code, 'UNAUTHORIZED');
    });

    it('TC-AUTH-B06: Access protected /auth/me with expired token returns 401 Unauthorized', async () => {
      const res = await client.get('/api/v1/auth/me', client.createHeaders('expired_token'));
      client.assertEnvelope(res);
      assert.equal(res.status, 401, 'Expected HTTP 401 Unauthorized');
      assert.equal(res.data.error.code, 'UNAUTHORIZED');
    });

    it('TC-AUTH-B07: Access protected /auth/me with malformed JWT token returns 401', async () => {
      const res = await client.get('/api/v1/auth/me', client.createHeaders('malformed_token_string_abc_xyz'));
      client.assertEnvelope(res);
      assert.equal(res.status, 401, 'Expected HTTP 401 Unauthorized');
      assert.equal(res.data.error.code, 'UNAUTHORIZED');
    });

    it('TC-AUTH-B08: Login with leading and trailing whitespace in email succeeds with trimming', async () => {
      const res = await client.post('/api/v1/auth/login', {
        email: `  ${existingEmail}  `,
        password: 'hashed_password_123'
      });
      client.assertEnvelope(res);
      assert.equal(res.status, 200, 'Expected HTTP 200 OK after whitespace trimming');
    });

    it('TC-AUTH-B09: Refresh token endpoint with expired or tampered token returns 401', async () => {
      const res = await client.post('/api/v1/auth/refresh', {
        refreshToken: 'ref_tampered_invalid_token'
      });
      client.assertEnvelope(res);
      assert.equal(res.status, 401, 'Expected HTTP 401 Unauthorized');
      assert.equal(res.data.error.code, 'UNAUTHORIZED');
    });

    it('TC-AUTH-B10: Refresh token endpoint with empty payload returns 400 Validation Error', async () => {
      const res = await client.post('/api/v1/auth/refresh', {});
      client.assertEnvelope(res);
      assert.equal(res.status, 400, 'Expected HTTP 400 Bad Request');
      assert.equal(res.data.error.code, 'VALIDATION_ERROR');
    });
  });
}
