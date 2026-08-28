import { z } from 'zod';

export const AuthInput = z.object({
  username: z.string(),
  password: z.string().min(6)
});
