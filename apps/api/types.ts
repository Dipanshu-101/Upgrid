import {z} from "zod";
export const AuthInput = z.object({
  username: z.string(),
  password: z.string().min(6),
  name: z.string().min(1),
});

