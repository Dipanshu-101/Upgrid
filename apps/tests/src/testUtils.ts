import axios from 'axios';
import { BACKEND_URL } from './config.js';

export interface CreatedUser {
  id: string;
  username: string;
  password: string;
  jwt: string;
}

export async function createUser(): Promise<CreatedUser> {
  const username = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const password = 'password';

  const signupRes = await axios.post(`${BACKEND_URL}/user/signup`, {
    username,
    password,
  });

  const signinRes = await axios.post(`${BACKEND_URL}/user/signin`, {
    username,
    password,
  });

  return {
    id: signupRes.data.user_id ?? signupRes.data.id,
    username,
    password,
    jwt: signinRes.data.jwt,
  };
}
