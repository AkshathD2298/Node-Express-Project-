const express = require("express");
const bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const router = express.Router();
const { check,query, validationResult } = require("express-validator");
const urlencodedParser = express.urlencoded({extended: false})

// Import Restaurant and User Mongoose schemas
let Restaurant_Model = require("../models/restaurant");
let User_Model = require('../models/user');


// Verify JWT Token
function matchToken(req,res,next){
  if(req.cookies.jwt != null){
      const bearer = req.cookies.jwt.split(' ')
      const loginCredential = bearer[1]
      req.token = loginCredential
      next()
  }else{
    res.redirect('/');
  }
}

router.route("/").get(cookieParser(), matchToken,(req,res)=>{
  jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
    if (err){
        res.render('error',{errorCode: 401, errorMessage: "Not Authorised"});
    } else {
              const page = req.query.page;
              const perPage = req.query.perPage;
              const borough = req.query.borough;
              console.log(borough + "________borough");
              Restaurant_Model.countRestaurants().then((count) => {
                      console.log(count);
                      numberOfPages = Math.ceil(count / perPage);
                      if (page <= numberOfPages && perPage < count && page >= 1 && perPage > 1) {
                          console.log(`page: ${page}`);

                          Restaurant_Model.getAllRestaurants(page, perPage, borough).then((restaurants) => {
                                  // console.log("Restaurants");
                                  // console.log(restaurants);
                                  // Render index.hbs for pagination
                                  res.render('index', {
                                      data: restaurants,
                                      count: count,
                                      page: page,
                                      perPage: perPage,
                                      start: (((page - 1) * perPage) + 1),
                                      end: ((page - 1) * perPage) + perPage,
                                      showPrevious: true,
                                      showNext: true,
                                  });
                                  //res.status(200).render("index", {
                                  //   restaurants: restaurants,layout: false 
                                  // });
                                  //  res.status(200).send(restaurants);
                              })
                              .catch((err) => {
                                  res.status(500).json({
                                      message: err.message
                                  });
                              });
                      } else {
                          console.log("false");
                          res.render('error', {errorCode:404, errorMessage:"Not found"});
                      }
                  })
                  .catch((err) => {
                      res.status(500).json({
                          message: err.message
                      });
                  });
    }
  });
});
// .push()

router.route("/search").get(matchToken,(req,res)=>{
    jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
        if (err){
          res.render('error', {errorCode:401, errorMessage: "Not Authorised"});
        } else {
      res.render("search")
        }
      })
})
// router.route("/addRestaurant")
router.route("/login").post(async (req,res)=>{
    // Validate user input
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    User_Model.findOne({ email: email })
      .then((user) => {
        if (!user) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        bcrypt.compare(password, user.password)
          .then((result) => {
            console.log(result);
            if (result === true) {
              const accessToken = jwt.sign({email:email, password:user.password}, process.env.SECRETKEY);
              res.cookie('jwt',`bearer ${accessToken}`);
              console.log("Hello");
              res.redirect("/api/restaurant/");
            } else {
              res.status(401).json({ message: "Invalid email or password" });
            }
          })
          .catch((err) => {
            res.status(500).json({ message: "Internal server error" });
          });
      })
      .catch((err) => {
        res.status(500).json({ message: "Internal server error" });
      });
})
router.route("/register").post(async (req,res)=>{
    try {
        // Validate user input
        const {email, password } = req.body;
        console.log(req.body);
        // Check if the user already exists
        const existingUser = await User_Model.findOne({ email });
        if (existingUser) {
            console.log();
          return res.status(400).json({ message: 'User already exists' });
        }
        // hash password
        bcrypt.hash(password, 10).then(
              async hash=>{ 
                // Create a new user
                let user = User_Model();
                user.email = email
                user.password = hash
                user.isAdmin = false
                try {
                  const result = await user.save();
                  res.redirect("/");  // this will be the new created ObjectId
              } catch(error){
                console.log(error);
              }
            }).catch(err=>{console.log(err); 
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }
}).get((req,res)=>{
    res.render("register", {layout: 'auth'})
})

router.route("/:id").get(matchToken,(req,res) =>{
    jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
      if (err){
        res.render('error', {errorCode:401, errorMessage:"Not Authorized"});
      } else {
        console.log('restaurant by id'+req.params.id);

        Restaurant_Model.getRestaurantById(req.params.id).then((restaurant)=>{
            console.log(restaurant);
          res.render("editForm", {data:restaurant});
        })
        .catch((err) => {
          res.status(500).json({ message: err.message });
        }); 
      }
    })
  })
  .delete(matchToken,(req,res) =>{
    jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
          if (err){
            res.render('error401');
          } else {
          Restaurant_Model.deleteOne({_id:req.params.id})
          .then(()=>{
            res.status(200).send("Deleted Successfully");
          })
          .catch((err) => {
            res.status(500).json({ message: err.message });
          });
        }
      })  
    })
    .put(matchToken,(req,res) =>{
      jwt.verify(req.token, process.env.SECRETKEY, (err, decoded) => {
            if (err){
              res.render('error401');
            } else {
              // TODO: Update Restaurant data 
              const restaurant = {};
              restaurant.cuisine = req.body.cuisine;
              restaurant.borough = req.body.borough;
              console.log("cuisine"+req.body.cuisine);
              console.log("borough"+req.body.borough);
              Restaurant_Model.updateOne({_id:req.params.id},{$set:restaurant})
              .then(()=>{
                //res.status(200).send("Deleted Successfully");
                console.log('Updated Successfully');
                res.status(200).send("Updated Successfully");
                //res.redirect("api/restaurant/"+req.params.id);
              })
              .catch((err) => {
                res.status(500).json({ message: err.message });
              });
            }
      })
  })
// .put().delete()





module.exports = router;
