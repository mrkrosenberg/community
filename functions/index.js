const functions = require('firebase-functions');
const app = require('express')();

// Firebase
const firebaseConfig = require('./config');
const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

// Routes
const { 
    getAllPosts, 
    createNewPost, 
    getPost, 
    commentOnPost, 
    likePost, 
    unlikePost,
    deletePost 
} = require('./handlers/posts');
const { 
    signup, 
    login, 
    uploadImage, 
    addUserDetails, 
    getAuthenticatedUser 
} = require('./handlers/users');

// Auth Middleware
const FBAuth = require('./util/fbAuth');

// Posts Routes
app.get('/posts', getAllPosts);
app.get('/posts/:postId', getPost);
app.get('/posts/:postId/like', FBAuth, likePost);
app.get('/posts/:postId/unlike', FBAuth, unlikePost);
app.post('/posts', FBAuth, createNewPost);
app.post('/posts/:postId/comment', FBAuth, commentOnPost);
app.delete('/posts/:postId', FBAuth, deletePost)

// Users Routes
app.get('/user', FBAuth, getAuthenticatedUser);
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);

// API entry point
exports.api = functions.https.onRequest(app);
