import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import { prismaClient } from 'store/client';
import { AuthInput } from './types.ts';

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

app.post("/user/signup", async (req, res, next) => {
     const data = AuthInput.parse(req.body.data);
     if (!data) {
        return res.status(400).send("Invalid input");
     }
      try {
          const user = await prismaClient.user.create({
              data: {
                  username: data.data.username,
                  password: data.data.password,
                  name: data.data.name,
              },
          });
          res.json({user_id: user.id, username: user.username});
      } catch (error) {
          next(error);
      }
});


app.post("/user/signin", async (req, res, next) => {
      const data = AuthInput.parse(req.body.data);
      if (!data) {
          return res.status(400).send("Invalid input");
      }
      try {
          const user = await prismaClient.user.findUnique({
              where: { username: data.data.username },
          });
          if (!user || user.password !== data.data.password) {
              return res.status(401).send("Invalid credentials");
          }
          res.json({user_id: user.id, username: user.username});
      } catch (error) {
          next(error);
      }
})


app.listen(process.env.PORT || 5000);