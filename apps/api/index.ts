import express from 'express';
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.ts";
import prismaClient from "@upgrid/store/client";
const app = express();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.post("/website", (req, res) => {
  // Handle the POST request to /website
  res.send("Website endpoint hit");
});


app.get("/status/:websiteId", (req, res) => {
  const { websiteId } = req.params;
  res.send(`Status for website ${websiteId}`);
});



app.listen(process.env.PORT || 5000);