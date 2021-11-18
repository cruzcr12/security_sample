//jshint esversion:6
// require and config the dotenv
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

// Connect to the DB
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

// Create a userSchema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// Apply a plugin to extend the functionality of the schema. 
// This must go before the model
// Define the field to encrypt
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

// Create a user model
const User = new mongoose.model("User", userSchema);

/**
 * GET Home route
 */
app.get("/", function(req, res) {
    res.render("home");
});

/**
 * GET Login route
 */
app.get("/login", function(req, res) {
    res.render("login");
});

/**
 * POST Login route
 */
app.post("/login", function(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username }, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                if (foundUser.password === password) {
                    // If it is the correct user
                    res.render("secrets");
                }
            }
        }
    });
});

/**
 * GET Register route
 */
app.get("/register", function(req, res) {
    res.render("register");
});

/**
 * POST Register route
 */
app.post("/register", function(req, res) {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    // Save new user
    newUser.save(function(err) {
        if (err) {
            console.log(err);
        } else {
            res.render("secrets");
        }
    });
});





app.listen(3000, function() {
    console.log("Server started on port 3000");
});