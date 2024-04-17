require('dotenv').config()
const express = require("express");
const path = require("path");
const handlebars = require('express-handlebars');
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const jwt=require('jsonwebtoken');
// Set constant for port
const PORT = process.env.PORT || 8000;

var restaurant_routes = require("./routes/routes");

// Import Restaurant and User Mongoose schemas
let Restaurant_Model = require("./models/restaurant");
let User_Model = require('./models/user');


// Verify JWT Token
function matchToken(req,res,next){
  if(req.cookies.jwt != null){
      const bearer = req.cookies.jwt.split(' ')
      const loginCredential = bearer[1]
      req.token = loginCredential
      next()
  }
  next()
}


// Connect to database

let host=process.env.URL;
let mydb=process.env.myDB;
mongoose.connect(host+mydb)
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Error connecting to MongoDB:', err));
let db = mongoose.connection;

// Initialize express app
const app = express();

// Initialize built-in middleware for urlencoding and json
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())
app.use(express.static("public"));
app.engine('.hbs', handlebars.engine(
    {
        extname: '.hbs',
        helpers: {
            next: function(page) {
                return parseInt(page)+1;
            },
            previous: function(page) {
                console.log(page);
                return parseInt(page)-1;
            }
        },
    }
));
app.set('view engine', 'hbs');
console.log(restaurant_routes);
app.use("/api/restaurant", restaurant_routes);

app.use("/",matchToken,(req, res) => {
    jwt.verify(req.token, process.env.SECRETKEY, (err, decoded)=> {
        if (err)
            res.render("login", { layout: 'auth' });
        else{
            console.log("Idhar kaise aayega");
            res.redirect('/api/restaurant')
        }
    })
  });
// Listen on a port
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));