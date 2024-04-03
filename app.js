// These import necessary modules and set some initial variables
require("dotenv").config();
const express = require("express");
const bodyParser = require('body-parser');
const fetch = require("node-fetch");
const convert = require("xml-js");
const rateLimit = require("express-rate-limit");
var cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

// Rate limiting - Goodreads limits to 1/sec, so we should too

// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
// app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 1, // limit each IP to 1 requests per windowMs
});

// Allow CORS from frontend only
app.use(
  cors({
    origin: process.env.TAILFIN_FRONTEND_URL,
  }),
  limiter,
  bodyParser.json({ 
    limit: "10mb",
    type: 'application/json'
  })
);

// Routes

// Test route, visit localhost:3000 to confirm it's working
// should show 'Hello World!' in the browser
app.get("/", (req, res) => res.sendStatus(404));

app.post("/api/search", async (req, res) => {
  try {
    // This uses string interpolation to make our search query string
    // it pulls the posted query param and reformats it for goodreads
    const body = req.body;
    // It uses node-fetch to call the goodreads api, and reads the key from .env
    // const response = await fetch(
    //   `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=hourly,daily,minutely&appid=${process.env.OPEN_WEATHER_MAP_KEY}`
    // );
    const raw = JSON.stringify({
            "user_app_id": {
                "user_id": process.env.CLARIFAI_USER_ID,
                "app_id": process.env.CLARIFAI_APP_ID
            },
            "inputs": [
                {
                    "data": {
                        "image": body
                    }
                }
            ]
        });
        
        const requestOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Key ${process.env.CLARIFAI_PAT}`
            },
            body: raw
        };

        const MODEL_ID = process.env.CLARIFAI_MODEL_ID;
        const MODEL_VERSION = process.env.CLARIFAI_MODEL_VERSION;

        const response = await fetch(`https://api.clarifai.com/v2/models/${MODEL_ID}/versions/${MODEL_VERSION}/outputs`, requestOptions)

        const json = await response.json();

        return res.json({
          success: true,
          json,
        });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// This spins up our sever and generates logs for us to use.
// Any console.log statements you use in node for debugging will show up in your
// terminal, not in the browser console!
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
