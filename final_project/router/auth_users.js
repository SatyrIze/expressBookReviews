const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const doesExist = (username)=>{
  let userswithsamename = users.filter((user)=>{
    return user.username === username
  });
  if(userswithsamename.length > 0){
    return true;
  } else {
    return false;
  }
}

const authenticatedUser = (username,password)=>{
  let validusers = users.filter((user)=>{
    return (user.username === username && user.password === password)
  });
  if(validusers.length > 0){
    return true;
  } else {
    return false;
  }
}

regd_users.use("/customer",session({
  secret: "fingerprint_customer",
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false },
}))

regd_users.post("/customer/login", (req,res) => {
  const username = req.query.username;
  const password = req.query.password;

  if (!username || !password) {
      return res.status(404).json({message: "Error logging in"});
  }

  if (authenticatedUser(username,password)) {
    let accessToken = jwt.sign({
      data: password
    }, 'access', { expiresIn: 60 * 60 });

    req.session.authorization = {
      accessToken,username
  }
  return res.status(200).send("User successfully logged in");
  } else {
    return res.status(208).json({message: "Invalid Login. Check username and password"});
  }
});


regd_users.post("/review", (req,res) => {
  const isbn = req.query.isbn;
  const review = req.query.review;
  const username = req.username;

  if (!isbn || !review) {
      return res.status(400).json({message: "ISBN and review are required!"});
  }

  if (books[isbn]) {
      if (!Array.isArray(books[isbn].reviews)) {
          books[isbn].reviews = [];
      }
      const existingReview = books[isbn].reviews.find(r => r.username === username);

      if (existingReview) {
          existingReview.review = review;
          return res.status(200).json({message: "Review updated successfully"});
      } else {
          books[isbn].reviews.push({review, username});
          return res.status(200).json({message: "Review added successfully"});
      }
  } else {
      return res.status(404).json({message: "Book not found for the given ISBN"});
  }
});

regd_users.put("/review", (req,res) => {
  const isbn = req.query.isbn;
  const review = req.query.review;
  const username = req.username;

  if (!isbn || !review) {
      return res.status(400).json({message: "ISBN and review are required!"});
  }

  if (books[isbn]) {
      if (!Array.isArray(books[isbn].reviews)) {
          books[isbn].reviews = [];
      }
      const existingReview = books[isbn].reviews.find(r => r.username === username);

      if (existingReview) {
          existingReview.review = review;
          return res.status(200).json({message: "Review updated successfully"});
      } else {
          return res.status(404).json({message: "Review not found for the given ISBN and username"});
      }
  } else {
      return res.status(404).json({message: "Book not found for the given ISBN"});
  }
});

regd_users.delete("/auth/review/:isbn", (req,res) => {
  const isbn = req.params.isbn;
  const username = req.username;

  if (!isbn) {
      return res.status(400).json({message: "ISBN is required!"});
  }

  if (books[isbn]) {
      if (!Array.isArray(books[isbn].reviews)) {
          books[isbn].reviews = [];
      }
      const existingReview = books[isbn].reviews.find(r => r.username === username);

      if (existingReview) {
          books[isbn].reviews = books[isbn].reviews.filter(r => r.username !== username);
          return res.status(200).json({message: "Review deleted successfully"});
      } else {
          return res.status(403).json({message: "You are not authorized to delete this review"});
      }
  } else {
      return res.status(404).json({message: "Book not found for the given ISBN"});
  }
});

module.exports.authenticated = regd_users;
module.exports.doesExist = doesExist;
module.exports.users = users;