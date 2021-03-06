const { db, admin } = require('../util/firebase');

// Firebase
const firebaseConfig = require('../config');
const firebase = require('firebase');
// firebase.initializeApp(firebaseConfig)

// Validators
const { validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validators');

// Signup
exports.signup = (req, res) => {

    const newUser = {
        // email: req.body.email,
        // password: req.body.password,
        // confirmPassword: req.body.confirmPassword,
        // handle: req.body.handle,
        ...req.body
    };
    let token, userId;
    const avatarImage = 'avatar.png';
    const { valid, errors } = validateSignupData(newUser);
    
    if(!valid) return res.status(400).json(errors);

    db.doc(`/users/${newUser.handle}`)
        .get()
        .then(doc => {
            if(doc.exists) {
                return res.status(400).json({
                    handle: 'Username already exists'
                })
            } else {
                return firebase.auth()
                        .createUserWithEmailAndPassword(newUser.email, newUser.password) 
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(idToken => {
            token = idToken;
            const userCredentials = {
                userId: userId,
                handle: newUser.handle,
                email: newUser.email,
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${avatarImage}?alt=media`,
                createdAt: new Date().toISOString()
            }
            return db.doc(`/users/${newUser.handle}`)
                .set(userCredentials)
        })
        .then(() => {
            return res.status(201).json({ token })
        })
        .catch(err => {
            console.error(err);
            if(err.code === 'auth/email-already-in-use') {
                return res.status(400).json({
                    email: 'Email is already in use'
                })
            } else {
                return res.status(500).json({
                        error: err.code,
                        general: 'Something went wrong, please try again'
                    })
            }
            
        });
};

// Login
exports.login = (req, res) => {

    const user = {
        // email: req.body.email,
        // password: req.body.password
        ...req.body
    };

    const { valid, errors } = validateLoginData(user);
    
    if(!valid) return res.status(400).json(errors);

    firebase.auth()
            .signInWithEmailAndPassword(user.email, user.password)
            .then(data => {
                return data.user.getIdToken();
            })
            .then(token => {
                return res.json({ token })
            })
            .catch(err => {
                console.error(err);
                return res.status(403).json({
                    general: 'Wrong credentials, please try again'
                })
            })
};

// Add user details
exports.updateProfile = (req, res) => {

    let userDetails = reduceUserDetails(req.body);

    db.doc(`/users/${req.user.handle}`).update(userDetails)
        .then(() => {
            return res.json({
                message: 'Profile updated successfully'
            })
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({
                error: err.code
            })
        });
};

// Get current user details
exports.getAuthenticatedUser = (req, res) => {

    let userData = {};
    db.doc(`/users/${req.user.handle}`).get()
        .then(doc => {
            if(doc.exists) {
                userData.credentials = doc.data();
                return db.collection('likes').where('userHandle', '==', req.user.handle)
                            .get();
            }
        })
        .then(data => {
            userData.likes = [];
            data.forEach(doc => {
                userData.likes.push(doc.data())
            });
            return db.collection('notifications')
                        .where('recipient', '==', req.user.handle)
                        .orderBy('createdAt', 'desc')
                        .get()
        })
        .then(dataNote => {
            userData.notifications = [];
            dataNote.forEach(doc => {
                userData.notifications.push({
                    notificationId: doc.id,
                    // recipient: doc.data().recipient,
                    // sender: doc.data().sender,
                    // createdAt: doc.data().createdAt,
                    // postId: doc.data().postId,
                    // type: doc.data().type,
                    // read: doc.data().read,
                    ...doc.data()
                })
            });
            return res.json(userData)
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({
                error: err.code
            })
        })
};

// Get another user's details
exports.getUserDetails = (req, res) => {

    let userData = {};

    db.doc(`/users/${req.params.handle}`)
        .get()
        .then(doc => {
            if(doc.exists) {
                userData.user = doc.data();
                return db.collection('posts').where('userHandle', '==', req.params.handle)
                            .orderBy('createdAt', 'desc')
                            .get();
            } else {
                return res.status(404).json({
                    error: 'User not found'
                })
            }
        })
        .then(data => {
            userData.posts = [];
            data.forEach(doc => {
                userData.posts.push({
                    postId: doc.id,
                    // body: doc.data().body,
                    // createdAt: doc.data().createdAt,
                    // userHandle: doc.data().userHandle,
                    // userImage: doc.data().userImage,
                    // likecount: doc.data().likecount,
                    // commentCount: doc.data().commentCount
                    ...doc.data()
                })
            })
            return res.json(userData);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({
                error: err.code
            })
        });
};

// Upload profile image
exports.uploadImage = (req, res) => {

    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({
        headers: req.headers
    });

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {

        if(mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({
                error: 'Wrong file type submitted'
            })
        }

        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${Math.round(Math.random() * 1000000000)}.${imageExtension}`;
        const filePath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {
            filePath,
            mimetype
        };
        file.pipe(fs.createWriteStream(filePath));
        busboy.on('finish', () => {
            admin.storage().bucket().upload(imageToBeUploaded.filePath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimetype
                    }
                }
            })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;
                return db.doc(`/users/${req.user.handle}`).update({
                    imageUrl
                })
            })
            .then(() => {
                return res.json({
                    message: 'Image uploaded successfully'
                })
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({
                    error: err.code
                })
            })
        });
    });
    busboy.end(req.rawBody);
};

// Mark notifications read
exports.markNotificationsRead = (req, res) => {

    let batch = db.batch();

    req.body.forEach(notificationId => {
        const notification = db.doc(`/notifications/${notificationId}`);
        batch.update(notification, {
            read: true
        })
    });
    batch.commit()
        .then(() => {
            return res.json({
                message: 'Notifications marked as read'
            })
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({
                error: err.code
            })
        });
};


