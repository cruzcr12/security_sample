//jshint esversion:6
// require and config the dotenv
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// Require bcrypt and define the number of salt rounds
const bcrypt = require('bcrypt');
const saltRounds = 10;

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
                // Use bcrypt.compar method. Load hash from your password DB
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    // result == true
                    res.render("secrets");
                });
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

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User({
            email: req.body.username,
            password: hash
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


});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});