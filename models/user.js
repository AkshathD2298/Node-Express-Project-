let mongoose = require("mongoose");

let userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        required: true
    }
});
let User = module.exports = mongoose.model("users", userSchema);