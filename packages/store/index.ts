import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
dotenv.config({
	path: fileURLToPath(new URL('../.env', import.meta.url)),
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

export const prismaClient = new PrismaClient({ adapter });