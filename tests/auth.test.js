const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');

// Unique username per test run so re-running locally doesn't collide
// with leftover data from a previous run.
const testUsername = `testuser_${Date.now()}`;
const testPassword = 'testpass123';

describe('Health check', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth flow', () => {
  let token;

  it('registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: testUsername, password: testPassword });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe(testUsername);
  });

  it('rejects duplicate registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: testUsername, password: testPassword });

    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUsername, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUsername, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('accesses protected route with valid token', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(testUsername);
  });

  it('rejects protected route without token', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });
});

// Disconnect Prisma after tests so Jest doesn't hang waiting for open handles.
afterAll(async () => {
  await prisma.$disconnect();
});