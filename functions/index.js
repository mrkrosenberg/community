const functions = require('firebase-functions');
const app = require('express')();

// Firebase
const firebaseConfig = require('./config');
const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

// Routes
const { getAllPosts, createNewPost } = require('./handlers/posts');
const { signup, login } = require('./handlers/users');

// Auth Middleware
const FBAuth = require('./util/fbAuth');

// Posts Routes
app.get('/posts', getAllPosts);
app.post('/post', FBAuth, createNewPost);

// Authentication Routes
app.post('/signup', signup);
app.post('/login', login);

// API entry point
exports.api = functions.https.onRequest(app);
