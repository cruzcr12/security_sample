//jshint esversion:6
// require and config the dotenv
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// 1. Require the packages
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

// 2. Use express-session, set the properties for the session
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: true,
    cookie: {}
}));

// 3.1 Initialize the passport
app.use(passport.initialize());
// 3.2 Tell the app to use passport to deal with the sessions
app.use(passport.session());

// Connect to the DB
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

// Create a userSchema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// 4. Plugin the userSchema to use the passportLocalMongoose to hash and 
// salt the password and save the user in the MongoDB
userSchema.plugin(passportLocalMongoose);

// Create a user model
const User = new mongoose.model("User", userSchema);

// 5. Set up the passport local configuration
// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    // Use the login method from password
    req.login(user, function(err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });

});

/**
 * GET Logout route
 */
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
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
    User.register({ username: req.body.username }, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });

});

/**
 * GET Secrets route
 */
app.get("/secrets", function(req, res) {
    console.log("Validating the user in the secrets page");

    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        console.log("User not authenticated");
        res.redirect("/login");
    }
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});