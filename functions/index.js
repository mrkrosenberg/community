const functions = require('firebase-functions');
const app = require('express')();

// DB ref
const { db } = require('./util/firebase');

// Firebase
const firebaseConfig = require('./config');
const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

// Route imports
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
    updateProfile, 
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead 
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
app.get('/user/:handle', getUserDetails);
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, updateProfile);
app.post('/notifications', FBAuth, markNotificationsRead)

// API entry point
exports.api = functions.https.onRequest(app);

// Database Triggers

// Like notification
exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
    .onCreate(snapshot => {

        return db.doc(`/posts/${snapshot.data().postId}`).get()
            .then(doc => {
                if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'like',
                        read: false,
                        postId: doc.id
                    })
                }
            })
            .catch(err => {
                console.err(err);
                return;
            });
    });

// Delete like notification
exports.deleteNotificationOnUnlike = functions.firestore.document('likes/{id}')
    .onDelete(snapshot => {

        return db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .catch(err => {
                console.error(err);
                return;
            });
    });

// Comment notification
exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
    .onCreate((snapshot) => {

        return db.doc(`/posts/${snapshot.data().postId}`).get()
            .then(doc => {
                if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'comment',
                        read: false,
                        postId: doc.id
                    })
                }
            })
            .catch(err => {
                console.err(err);
                return;
            });
    });


