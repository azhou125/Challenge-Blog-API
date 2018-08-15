"use strict"; 

const mongoose = require("mongoose");

const authorSchema = mongoose.Schema({
	firstName: 'string',
	lastName: 'string',
	userName:{
		type: 'string',
		unique: true
	}
});

const commentSchema = mongoose.Schema({ content: 'string' });

// this is our schema to represent a blog
const blogSchema = mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' },
  publishDate: { type: Date },
  comments: [{type:commentSchema}]
});

blogSchema.pre('find', function(next) {
  this.populate('author');
  next();
});

blogSchema.pre('findById', function(next) {
  this.populate('author');
  next();
});

blogSchema.pre('findByIdAndUpdate', function(next) {
  this.populate('author');
  next();
});

// blogSchema.pre('serializeWithComments', function(next) {
  // this.populate('author');
  // next();
// });

blogSchema.virtual("authorName").get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

// this is an *instance method* which will be available on all instances
// of the model. This method will be used to return an object that only
// exposes *some* of the fields we want from the underlying data
blogSchema.methods.serialize = function() {
  return {
    title: this.title,
    content: this.content,
    author: this.authorName,
    created: this.publishDate
  };
};

blogSchema.methods.serializeWithComments = function() {
  return {
    title: this.title,
    content: this.content,
    author: this.authorName,
    created: this.publishDate,
	comments: this.comments
  };
};

authorSchema.methods.serialize = function() {
  return {
    "_id": this._id,
	"name": `${this.firstName} ${this.lastName}`,
	"userName": this.userName
  };
};

const Author = mongoose.model('Author', authorSchema);
const BlogPost = mongoose.model('BlogPost', blogSchema);

// note that all instance methods and virtual properties on our
// schema must be defined *before* we make the call to `.model`.

module.exports = { Author, BlogPost };
