import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import { prismaClient } from 'store/client';

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.post('/website', async (_req, res, next) => {
  try {
    await prismaClient.website.create({
      data: {
        url: 'https://example11.com',
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

app.listen(process.env.PORT || 5000);