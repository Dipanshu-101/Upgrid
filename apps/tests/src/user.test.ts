import axios from 'axios';
import { describe, expect, it } from 'vitest';
import { BACKEND_URL } from './config.js';

const USER_NAME = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

describe('Signup endpoints', () => {
  it('rejects an invalid signup body', async () => {
    await expect(
      axios.post(`${BACKEND_URL}/user/signup`, {
        email: USER_NAME,
        password: 'password',
      }),
    ).rejects.toBeDefined();
  });

  it('creates a user with a valid signup body', async () => {
    const res = await axios.post(`${BACKEND_URL}/user/signup`, {
      username: USER_NAME,
      password: 'password',
    });

    expect(res.status).toBe(200);
    expect(res.data.user_id).toBeDefined();
    expect(res.data.username).toBe(USER_NAME);
  });
});

describe('Signin endpoints', () => {
  it('rejects an invalid signin body', async () => {
    await expect(
      axios.post(`${BACKEND_URL}/user/signin`, {
        email: USER_NAME,
        password: 'password',
      }),
    ).rejects.toBeDefined();
  });

  it('signs in with valid credentials', async () => {
    const res = await axios.post(`${BACKEND_URL}/user/signin`, {
      username: USER_NAME,
      password: 'password',
    });

    expect(res.status).toBe(200);
    expect(res.data.jwt).toBeDefined();
  });
});
