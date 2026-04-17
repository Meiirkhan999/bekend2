const { describe, it, before, after } = require('node:test');
const request = require('supertest');
const assert = require('node:assert');
process.env.SQLITE_STORAGE = ':memory:';
const { app, sequelize } = require('../src/index');

let authToken;

before(async () => {
  await sequelize.sync({ force: true });
});

after(async () => {
  await sequelize.close();
});

describe('Backend API', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Password123', name: 'Test User' });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.email, 'test@example.com');
    authToken = res.body.token;
  });

  it('should login existing user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password123' });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token);
  });

  it('should fetch supplies list', async () => {
    const res = await request(app).get('/api/supplies');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.supplies));
  });
});
