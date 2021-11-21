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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
    password: String,
    googleId: String,
    secret: String
});

// 4. Plugin the userSchema to use the passportLocalMongoose to hash and 
// salt the password and save the user in the MongoDB
userSchema.plugin(passportLocalMongoose);
// Plugin the findOrCreate to the user schema
userSchema.plugin(findOrCreate);

// Create a user model
const User = new mongoose.model("User", userSchema);

// 5. Set up the passport local configuration
// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

// Replace the serialize and deserialize methods with the ones 
// provided by passportjs
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function(err, user) {
            return cb(err, user);
        });
    }
));




/**
 * GET Home route
 */
app.get("/", function(req, res) {
    res.render("home");
});

/**
 * GET Autho Google route to authenticate the user with OAut 2.0
 */
// app.get("/auth/google", function(req, res) {
//     passport.authenticate("google", passport.authenticate('google', { scope: ['profile'] }));
// });
app.route('/auth/google')
    .get(passport.authenticate('google', {
        scope: ['profile']
    }));

/**
 * GET Auth/Google/Secrets. This is the redirected path given by google when the user is authorized
 */
app.get("/auth/google/secrets", passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect to secrets page.
        res.redirect('/secrets');
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
    // Select all the user which the secret field is not null
    User.find({ "secret": { $ne: null } }, function(err, foundUsers) {
        if (err) {
            console.log(err);
        } else {
            if (foundUsers) {
                res.render("secrets", { usersWithSecrets: foundUsers });
            }
        }
    });


});

/**
 * GET Submit. Shows the secret page
 */
app.get("/submit", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        console.log("User not authenticated");
        res.redirect("/login");
    }
});

/**
 * POST Submit. Submits the secret of the user
 */
app.post("/submit", function(req, res) {
    const submittedSecret = req.body.secret;

    console.log(req.user.id);

    // Get the user
    User.findById(req.user.id, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function() {
                    res.redirect("/secrets");
                });
            }
        }
    });
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});