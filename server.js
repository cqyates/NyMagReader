// General Dependencies
const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const db = require("./models")

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

mongoose.connect(MONGODB_URI, { useNewUrlParser: true })

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});

app.get("/", function (req, res) {
    res.render(path.join(__dirname, "public/index.html"));
})

app.get("/scrape", function (req, response) {
    console.log("hit the route");
    // First, we grab the body of the html with axios
    axios.get("http://nymag.com/intelligencer/politics/").then(async function (res) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        $ = cheerio.load(res.data);

        var results = [];

        // Now, we grab every h2 within an article tag, and do the following:
        $(".article-wrap").each(function (index, element) {

            // Save an empty result object
            var title = $(element).find(".headline").text();
            var link = $(element).find(".link-text").attr("href");
            var summary = $(element).find(".teaser").text();
            var img = $(element).find(".article-img").attr("src");

            var article = {
                title,
                link,
                summary,
                img
            }
            // Save these results in an object that we'll push into the results array we defined earlier
            results.push(article);
            //Create a new Article using the `result` object built from scraping
        });


        const dbData = await db.Article.find({})
        const newArticles = await results.filter(article => {
            for (var i = 0; i < dbData.length; i++) {
                if (dbData[i].link === article.link) {
                    return false
                }
            }
            return true
        })

        try {
            if(!newArticles){
                response.json(dbData)
            } else {
                const dbArticle = await db.Article.create(newArticles)
                const allArticles = await db.Article.find({})
                response.json(allArticles)
            }

        } catch (error) {
            response.send(error.message)
        }
    })
    response.redirect("/")
})

app.get("/articles", function(req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
      .then(function(dbArticle) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  // Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
      // ..and populate all of the notes associated with it
      .populate("comment")
      .then(function(dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Comment.create(req.body)
      .then(function(dbComment) {
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbComment._id }, { new: true });
      })
      .then(function(dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
  

