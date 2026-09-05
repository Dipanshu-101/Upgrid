import swaggerJsdoc from 'swagger-jsdoc';

const port = process.env.PORT || 3003;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Upgrid API',
      version: '1.0.0',
      description: 'API documentation for Upgrid',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;