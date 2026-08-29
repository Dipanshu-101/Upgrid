import axios from 'axios';
import { beforeAll, describe, expect, it } from 'vitest';
import { BACKEND_URL } from './config.js';
import { createUser } from './testUtils.js';

describe('Website creation', () => {
  let token: string;

  beforeAll(async () => {
    const user = await createUser();
    token = user.jwt;
  });

  it('fails when url is missing', async () => {
    await expect(
      axios.post(
        `${BACKEND_URL}/website`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
    ).rejects.toBeDefined();
  });

  it('creates a website when url is present', async () => {
    const response = await axios.post(
      `${BACKEND_URL}/website`,
      { url: 'https://google.com' },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    expect(response.status).toBe(200);
    expect(typeof response.data).toBe('string');
  });

  it('fails when auth header is missing', async () => {
    await expect(
      axios.post(`${BACKEND_URL}/website`, {
        url: 'https://google.com',
      }),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });
  });
});

describe('Fetch website by id', () => {
  let token1: string;
  let userId1: string;
  let token2: string;

  beforeAll(async () => {
    const user1 = await createUser();
    const user2 = await createUser();

    token1 = user1.jwt;
    userId1 = user1.id;
    token2 = user2.jwt;
  });

  it('returns the website created by the current user', async () => {
    const websiteResponse = await axios.post(
      `${BACKEND_URL}/website`,
      { url: 'https://example.com' },
      {
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      },
    );

    const getWebsiteResponse = await axios.get(
      `${BACKEND_URL}/status/${websiteResponse.data.id}`,
      {
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      },
    );

    expect(getWebsiteResponse.status).toBe(200);
    expect(getWebsiteResponse.data.id).toBe(websiteResponse.data.id);
    expect(getWebsiteResponse.data.userId).toBe(userId1);
  });

  it('blocks access to a website created by another user', async () => {
    const websiteResponse = await axios.post(
      `${BACKEND_URL}/website`,
      { url: 'https://another-example.com' },
      {
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      },
    );

    await expect(
      axios.get(`${BACKEND_URL}/status/${websiteResponse.data.id}`, {
        headers: {
          Authorization: `Bearer ${token2}`,
        },
      }),
    ).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
