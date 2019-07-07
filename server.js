// General Dependencies
const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");

const axios = require("axios");
const cheerio = require("cheerio");

const PORT = 3000;

const app = express();

// Configure middleware
// Use morgan logger for logging requests
app.use(logger("dev"));

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/projectscrape";

mongoose.connect(MONGODB_URI)

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});

app.get("/", function (req, res) {
    res.render(path.join(__dirname, "public/index.html"));
})

app.get("/scrape", function (req, res) {
    console.log("hit the route");
    // First, we grab the body of the html with axios
    axios.get("http://nymag.com/intelligencer/politics/").then(function (res) {
       // Then, we load that into cheerio and save it to $ for a shorthand selector
         $ = cheerio.load(res.data);

        // Now, we grab every h2 within an article tag, and do the following:
        $("article-wrap").each(function (index, element) {

            var results = [];
            // Save an empty result object
            var title = $(element).find(".headline").text();
            var link = $(element).find(".link-text").attr("href");
            var summary = $(element).find(".teaser").text();
            var img = $(element).find(".article-img").attr("src");

            // Save these results in an object that we'll push into the results array we defined earlier
            results.push({
                title,
                link,
                summary,
                img
            });
        })
    })
})

