"use strict";

const express = require('express');
const mongoose = require('mongoose');

const morgan = require('morgan'); // for test

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require("./config");
const { Author, BlogPost } = require("./models");

const app = express();
app.use(express.json());

// log the http layer
app.use(morgan('common')); // for test
app.use(express.static('public'));

// the main page
app.get("/", (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});


// GET requests to /blog-posts => return 10 blogs
app.get("/blog-posts", (req, res) => {
  const filters = {};
    const queryableFields = ['title', 'content','author','created'];
    queryableFields.forEach(field => {
        if (req.query[field]) {
            filters[field] = req.query[field];
        }
    });
    BlogPost
        .find(filters).populate('author')
        .then(Blogs => res.json(
            Blogs.map(blog => blog.serialize())
        ))
        .catch(err => {
            console.error(err);
            res.status(500).json({message: 'Internal server error'})
        });
});

// can also request by ID
app.get("/blog-posts/:id", (req, res) => {
  BlogPost
    // this is a convenience method Mongoose provides for searching
    // by the object _id property
    .findById(req.params.id).populate('author')
    .then(blog => res.json(blog.serializeWithComments()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    });
});

app.post("/blog-posts", (req, res) => {
  const requiredFields = ['title', 'content','author_id'];
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  Author.findById(req.body.author_id)
	.then(author=>{
		if(!author){
			const message = `Wrong author_id in the request body`;
			console.error(message);
			return res.status(400).send(message);  
		}
	})
  
  BlogPost.create({
	title: req.body.title,
	content: req.body.content,
	author: req.body.author_id,
	publishDate: req.body.publishDate || new Date()
  })
	.then(newBlog => 
		BlogPost.findById(newBlog._id).populate('author'))
	.then(blog => {
		res.status(201).json(blog.serializeWithComments());})
	.catch(err => {
		console.error(err);
		res.status(500).json({ message: "Internal server error" });
	});	
});

app.put("/blog-posts/:id", (req, res) => {
  // ensure that the id in the request path and the one in request body match
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message =
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({ message: message });
  }

  // we only support a subset of fields being updateable.
  // if the user sent over any of the updatableFields, we udpate those values
  // in document
  const toUpdate = {};
  const updateableFields = ["title", "content"];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  BlogPost
    // all key/value pairs in toUpdate will be updated -- that's what `$set` does
    .findByIdAndUpdate(req.params.id, { $set: toUpdate },{new:true}).populate('author')
    .then(blog => res.status(200).json(blog.serialize()))
    .catch(err => res.status(500).json({ message: "Internal server error" }));
});

app.delete("/blog-posts/:id", (req, res) => {
  BlogPost.findByIdAndRemove(req.params.id)
    .then(blog => res.status(204).end())
    .catch(err => res.status(500).json({ message: "Internal server error" }));
});

app.post("/authors", (req, res) => {
  if(req.body.userName){
	  Author.findOne({userName: req.body.userName})
		.then(author=>{
				if(author){
					const message = `userName already exists`;
					console.error(message);
					return res.status(400).json({ message: message });
				}
			}
		)
  }

  Author.create({
	firstName: req.body.firstName,
	lastName: req.body.lastName,
	userName: req.body.userName
  })
	.then(author => res.status(201).json(author.serialize()))
	.catch(err => res.status(500).json({ message: "Internal server error" }));
});

app.put("/authors/:id", (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message =
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({ message: message });
  }
  
  if(req.body.userName){
	Author.findOne({userName: req.body.userName})
		.then(author => {
			if(author){
				const message = `userName already exists`;
				console.error(message);
				//console.error(Author.findOne({userName: req.body.userName}));
				return res.status(400).json({ message: message });
			}
		})
  }
  
  //if(req.body.userName && Author.findOne({userName: req.body.userName})){
	//const message = `userName already exists`;
    //console.error(message);
	//console.error(Author.findOne({userName: req.body.userName}));
    //return res.status(400).json({ message: message });
  //}
  
  const toUpdate = {};
  const updateableFields = ["firstName", "lastName", "userName"];
  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Author
    // all key/value pairs in toUpdate will be updated -- that's what `$set` does
    .findByIdAndUpdate(req.params.id, { $set: toUpdate }, {new:true})
    .then(author => res.status(200).json(author.serialize()))
    .catch(err => res.status(500).json({ message: "Internal server error" }));
});

app.delete("/authors/:id", (req, res) => {
  Author.findByIdAndRemove(req.params.id)
    .then(blog => res.status(204).end())
    .catch(err => res.status(500).json({ message: "Internal server error" }));
});


app.use(function(err,req,res,next){
	if(res.headersSent){
		return next(err);
	}
	return res.status(500).json({ message: "Internal server error" })
})


// catch-all endpoint if client makes request to non-existent endpoint
app.use("*", function(req, res) {
  res.status(404).json({ message: "Not Found" });
});











// runServer and closeServer part
let server;
// this function connects to our database, then starts the server
function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(
      databaseUrl,
      err => {
        if (err) {
          return reject(err);
        }
        server = app
          .listen(port, () => {
            console.log(`Your app is listening on port ${port}`);
            resolve();
          })
          .on("error", err => {
            mongoose.disconnect();
            reject(err);
          });
      }
    );
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log("Closing server");
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };