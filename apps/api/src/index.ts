import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import jwt from 'jsonwebtoken';
import { prismaClient } from 'store/client';
import { AuthInput } from './types.js';
import swaggerSpec from './swagger.js';
import { authMiddleware } from './middleware.js';

type AuthRequest = express.Request & { userId?: string };

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

function getRegionMetadata(region: { id: string; name: string }) {
  const lower = region.name.toLowerCase();
  if (lower === 'india' || lower.includes('mumbai') || lower === 'ap-south-1') {
    return { id: region.id, name: region.name, code: 'AP-SOUTH-1', location: 'Mumbai' };
  }
  if (lower === 'america' || lower === 'us' || lower.includes('virginia') || lower === 'us-east-1') {
    return { id: region.id, name: region.name, code: 'US-EAST-1', location: 'Virginia' };
  }
  return {
    id: region.id,
    name: region.name,
    code: region.name.toUpperCase().replace(/\s+/g, '-'),
    location: region.name,
  };
}

app.get('/regions', async (req, res, next) => {
  try {
    const rawRegions = await prismaClient.region.findMany({
      orderBy: { name: 'asc' },
    });
    const formatted = rawRegions.map(getRegionMetadata);
    res.json(formatted);
  } catch (error) {
    next(error);
  }
});

app.post('/website', authMiddleware, async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    if (!userId) {
      return res.status(401).send('Unauthorized');
    }

    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    if (!url) {
      return res.status(400).send('URL is required');
    }

    const rawInterval = req.body?.interval;
    const parsedInterval = typeof rawInterval === 'number'
      ? rawInterval
      : typeof rawInterval === 'string'
      ? parseInt(rawInterval, 10)
      : 180;
    const interval = !Number.isNaN(parsedInterval) && parsedInterval > 0 ? parsedInterval : 180;

    const requestedRegions: string[] = Array.isArray(req.body?.regions) ? req.body.regions : [];

    const allDbRegions = await prismaClient.region.findMany();
    const matchedRegionIds: string[] = [];

    for (const reqRegion of requestedRegions) {
      const match = allDbRegions.find((r) => {
        const meta = getRegionMetadata(r);
        return (
          r.id === reqRegion ||
          r.name.toLowerCase() === reqRegion.toLowerCase() ||
          meta.code.toLowerCase() === reqRegion.toLowerCase()
        );
      });
      if (match && !matchedRegionIds.includes(match.id)) {
        matchedRegionIds.push(match.id);
      }
    }

    // Default to all active regions if no valid regions were selected
    const targetRegionIds = matchedRegionIds.length > 0 ? matchedRegionIds : allDbRegions.map((r) => r.id);

    const website = await prismaClient.website.create({
      data: {
        url,
        userId,
        interval,
        timeAdded: new Date(),
        regions: {
          connect: targetRegionIds.map((id) => ({ id })),
        },
      },
      include: {
        regions: true,
      },
    });

    res.json(website);
  } catch (error) {
    next(error);
  }
});

app.get('/status/:websiteId', authMiddleware, async (req, res) => {
  const authReq = req as AuthRequest;
  const userId = authReq.userId;
  const websiteId = Array.isArray(req.params.websiteId)
    ? req.params.websiteId[0]
    : req.params.websiteId;

  if (!userId || !websiteId) {
    return res.status(401).send('Unauthorized or missing website id');
  }

  const website = await prismaClient.website.findFirst({
    where: {
      userId,
      id: websiteId,
    },
    include: {
      regions: true,
      ticks: {
        orderBy: [{ createdAt: 'desc' }],
        take: 100,
        include: {
          region: true,
        },
      },
    },
  });

  if (!website) {
    return res.status(404).send('Website not found');
  }

  // If website has no regions connected yet (legacy), fallback to all active DB regions
  if (!website.regions || website.regions.length === 0) {
    const allRegions = await prismaClient.region.findMany({ orderBy: { name: 'asc' } });
    (website as any).regions = allRegions;
  }

  res.json(website);
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
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'secret-jwt-key';

    const token = jwt.sign({ userId: user.id }, secret);
    res.json({ jwt: token });
  } catch (error) {
    next(error);
  }
});

app.get("/websites", authMiddleware, async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;

    if (!userId) {
      return res.status(401).send('Unauthorized');
    }

    const websites = await prismaClient.website.findMany({
      where: { userId },
      include: {
        regions: true,
        ticks: {
          orderBy: [{ createdAt: 'desc' }],
          take: 20,
          include: {
            region: true,
          },
        },
      },
    });

    const allRegions = await prismaClient.region.findMany({ orderBy: { name: 'asc' } });
    for (const site of websites) {
      if (!site.regions || site.regions.length === 0) {
        (site as any).regions = allRegions;
      }
    }

    res.json(websites);
  } catch (error) {
    next(error);
  }
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.name === 'ZodError' || err?.issues || err?.errors) {
    const issues = err.issues || err.errors;
    const firstErr = Array.isArray(issues) ? issues[0] : null;
    const message = firstErr?.message
      ? `${firstErr.path && firstErr.path.length > 0 ? firstErr.path.join('.') + ': ' : ''}${firstErr.message}`
      : 'Validation error';
    return res.status(400).json({ message });
  }
  if (err?.code === 'P2002') {
    return res.status(400).json({ message: 'Username is already taken' });
  }
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

app.listen(process.env.PORT || 3003);