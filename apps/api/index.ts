import express from 'express';
const app = express();

app.post("/website", (req, res) => {
  // Handle the POST request to /website
  res.send("Website endpoint hit");
});


app.get("/status/:websiteId", (req, res) => {
  const { websiteId } = req.params;
  res.send(`Status for website ${websiteId}`);
});


app.listen(process.env.PORT || 3000);