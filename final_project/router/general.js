const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');
const session = require('express-session');

let reviews = [];


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

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  res.send(JSON.stringify(books,null,2))
});

public_users.get('/books', async (req, res) => {
  try {
    const response = await axios.get('Enter valid hosted URL for booksdb.json');
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

public_users.get('/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  new Promise((resolve, reject) => {
    try {
      const bookDetails = books[isbn];
      resolve(bookDetails);
    } catch (error) {
      reject(error);
    }
  })
  .then((bookDetails) => {
    if (bookDetails) {
      res.send(bookDetails);
    } else {
      res.status(404).json({ message: "Book not found" });
    }
  })
  .catch((error) => {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch book details' });
  });
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

public_users.get('/author/:author', (req, res) => {
  const author = req.params.author;

  new Promise((resolve, reject) => {
    try {
      const authorList = books.filter((book) => book.author === author);
      resolve(authorList);
    } catch (error) {
      reject(error);
    }
  })
  .then((authorList) => {
    if (authorList.length > 0) {
      res.send(authorList);
    } else {
      res.status(404).json({ message: "No books found for the given author" });
    }
  })
  .catch((error) => {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch book details' });
  });
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

public_users.get('/title/:title', (req, res) => {
  const title = req.params.title;

  new Promise((resolve, reject) => {
    try {
      const titleList = books.filter((book) => book.title === title);
      resolve(titleList);
    } catch (error) {
      reject(error);
    }
  })
  .then((titleList) => {
    if (titleList.length > 0) {
      res.send(titleList);
    } else {
      res.status(404).json({ message: "No books found for the given title" });
    }
  })
  .catch((error) => {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch book details' });
  });
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
  
  public_users.use("/customer",session({
    secret: "fingerprint_customer",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  }))
  
  public_users.post("/customer/login", (req,res) => {
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
  
  
  public_users.post("/review", (req,res) => {
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
  
  public_users.put("/review", (req,res) => {
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
  
  public_users.delete("/auth/review/:isbn", (req,res) => {
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














  
module.exports.general = public_users;