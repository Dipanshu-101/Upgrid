import 'dotenv/config';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import jwt from 'jsonwebtoken';
import { prismaClient } from 'store/client';
import { AuthInput } from './types.js';
import swaggerSpec from './swagger.js';

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.post('/website', async (_req, res, next) => {
  try {
    const prisma = prismaClient as any;
    await prisma.website.create({
      data: {
        url: 'https://example11.com',
        userId: 'demo-user-id',
        timeAdded: new Date(),
      },
    });
    res.send('Website endpoint hit');
  } catch (error) {
    next(error);
  }
});

app.get('/status/:websiteId', (req, res) => {
  const { websiteId } = req.params;
  res.send(`Status for website ${websiteId}`);
});

app.post('/user/signup', async (req, res, next) => {
  try {
    const data = AuthInput.parse(req.body);
    const prisma = prismaClient as any;

    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: data.password,
      },
    });

    res.json({ user_id: user.id, username: user.username });
  } catch (error) {
    next(error);
  }
});

app.post('/user/signin', async (req, res, next) => {
  try {
    const data = AuthInput.parse(req.body);
    const prisma = prismaClient as any;

    const user = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (!user || user.password !== data.password) {
      return res.status(401).send('Invalid credentials');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign({ userId: user.id }, secret);
    res.json({ jwt: token });
  } catch (error) {
    next(error);
  }
});

app.listen(process.env.PORT || 5000);