// restaurantDB.js

const mongoose = require('mongoose');

// Define the Restaurant schema
const restaurantSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  restaurant_id: {
    type: String,
    required: true
  },
  grades: [{
    date: Date,
    grade: String,
    score: String
  }],
  address: {
    building: String,
    coord: [Number],
    street: String,
    zipcode: String
  },
  cuisine: {
    type: String,
    required: true
  },
  borough: {
    type: String,
    required: true
  }
});

// Define the Restaurant model
const Restaurant_model = mongoose.model('Restaurant', restaurantSchema);

// Function to initialize the connection and model
function initialize(connectionString) {
  return new Promise((resolve, reject) => {
    mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => {
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
}

// Function to add a new restaurant
function addNewRestaurant(data) {
  const newRestaurant = new Restaurant_model(data);
  return newRestaurant.save();
}

// Function to get all restaurants with pagination and optional borough filter
function getAllRestaurants(page, perPage, borough) {
  const skip = (page - 1) * perPage;
  let query = Restaurant_model.find().skip(skip).limit(perPage).lean().sort({ restaurant_id: 1 });
  if (borough) {
    query = query.where('borough').equals(borough);
  }
  return query.exec();
}

// Function to get a restaurant by ID
function getRestaurantById(id) {
  return Restaurant_model.findById(id).lean().exec();
}

// Function to update a restaurant by ID
function updateRestaurantById(data, id) {
  return Restaurant_model.findByIdAndUpdate(id, data, { new: true }).exec();
}

// Function to delete a restaurant by ID
function deleteRestaurantById(id) {
  return Restaurant_model.findByIdAndDelete(id).exec();
}

function countRestaurants() {
    return Restaurant_model.countDocuments().exec();
}

module.exports = {
  Restaurant_model,
  initialize,
  addNewRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurantById,
  deleteRestaurantById,
  countRestaurants
};
