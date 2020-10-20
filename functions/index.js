const functions = require('firebase-functions');
const app = require('express')();

// Firebase
const firebaseConfig = require('./config');
const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

// Routes
const { getAllPosts, createNewPost, getPost } = require('./handlers/posts');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/users');

// Auth Middleware
const FBAuth = require('./util/fbAuth');
const fbAuth = require('./util/fbAuth');

// Posts Routes
app.get('/posts', getAllPosts);
app.post('/posts', FBAuth, createNewPost);
app.get('/posts/:postId', getPost);

// Users Routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', fbAuth, getAuthenticatedUser);

// API entry point
exports.api = functions.https.onRequest(app);
