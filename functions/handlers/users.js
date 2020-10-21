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
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
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
                        error: err.code
                    })
            }
            
        })
};

// Login
exports.login = (req, res) => {

    const user = {
        email: req.body.email,
        password: req.body.password
    };

    const { valid, errors } = validateLoginData(user);
    
    if(!valid) return res.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json({ token })
        })
        .catch(err => {
            console.error(err);
            if(err.code === 'auth/wrong-password') {
                return res.status(403).json({
                    general: 'Wrong credentials, please try again'
                })
            } else return res.status(500).json({
                error: err.code
            })
        })
};

// Add user details
exports.addUserDetails = (req, res) => {

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

// Get current details
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
            return res.json(userData);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({
                error: err.code
            })
        })
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
        };

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


