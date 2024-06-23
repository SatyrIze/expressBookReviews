const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');

let reviews = [];

public_users.post("/register", (req,res) => {
  //Write your code here
  return res.status(300).json({message: "Yet to be implemented"});
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  res.send(JSON.stringify(books,null,2))
});

public_users.get('/books', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5000/booksdb.js');
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch book list' });
  }
});



// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  res.send(books[isbn]);
  
});

// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author;
  let authorList = [];
  for(let isbn in books){
    if(books[isbn].author == author){
      authorList.push(books[isbn]);
    }
  }
  res.send(authorList);
  
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title;
  let titleList = [];
  for(let isbn in books){
    if(books[isbn].title == title){
      titleList.push(books[isbn]);
    } else {
      res.status(404).json({ message: "Title not found" });
    }
  }
  res.send(titleList);
  
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  if (books[isbn] && books[isbn].reviews) {
    res.send(books[isbn].reviews);
  } else {
    res.status(404).json({ message: "Review not found for the given ISBN" });
  }
});



public_users.post("/register", (req,res) => {
  const username = req.query.username;
  const password = req.query.password;

  if (!username || !password) {
      return res.status(400).json({message: "Username and password are required!"});
    }
  
    if (username && password) {
      if (!doesExist(username)) { 
        users.push({"username":username,"password":password});
        return res.status(200).json({message: "User successfully registered. Now you can login"});
      } else {
        return res.status(409).json({message: "User already exists!"});    
      }
    } 
    return res.status(500).json({message: "Unable to register user."});
  });


module.exports.general = public_users;
