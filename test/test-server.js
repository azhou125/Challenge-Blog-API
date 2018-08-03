const chai=require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;

const {app,runServer,closeServer} = require("../server");

chai.use(chaiHttp);

describe("Blog List", function(){
	
	before(function(){
		return runServer();
	});
	
	after(function(){
		return closeServer();
	});
	
	//test get request
	it("should list blogs on GET", function(){
		return chai
			.request(app)
			.get("/blog-posts")
			.then(function(res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				//console.log(`XXXXXXXXXXXXXXXXXXXXXXXX\n${JSON.stringify(res.body)}\nXXXXXXXXXXXXXXXXX`);
				
				expect(res.body).to.be.a("array");
				
				expect(res.body.length).to.be.at.least(1);
				const expectedKeys = ["id","title", "content", "author"];
				res.body.forEach(function(item){
					expect(item).to.be.a("object");
					expect(item).to.include.keys(expectedKeys);
				});
			});
	});
	
	//test post request
	it("should add a blog on POST", function(){
		const newBlog1 = {title:"meeting",content:"Today's meeting is successful.", author:"Andy"};
		return chai
			.request(app)
			.post("/blog-posts")
			.send(newBlog1)
			.then(function(res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.a("object");
				const expectedKeys = ["id","title", "content", "author","publishDate"];
				expect(res.body).to.include.keys(expectedKeys);
				expect(res.body.id).to.not.equal(null);
				expect(res.body).to.deep.equal(
					Object.assign(newBlog1, {id:res.body.id}, {publishDate:res.body.publishDate})
				);
			});
	});
	
	//test put request
	it("should update blog on PUT", function(){
		const updateData = {
			title: "class",
			content: "web development",
			author: "nelsome",
			publishDate: "June 1st, 2018"
		}
		return chai
			.request(app)
			.get("/blog-posts")
			.then(function(res){
				updateData.id = res.body[0].id;
				return chai
					.request(app)
					.put(`/blog-posts/${updateData.id}`)
					.send(updateData);
			})
			.then(function(res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.a("object");
				expect(res.body).to.deep.equal(updateData);
			});
	
	});

	//test delete request
	it("should delete blog on DELETE", function(){
		return chai
			.request(app)
			.get("/blog-posts")
			.then(function(res){
				return chai.request(app).delete(`/blog-posts/${res.body[0].id}`);
			})
			.then(function(res){
				expect(res).to.have.status(204);
			})
	})
})