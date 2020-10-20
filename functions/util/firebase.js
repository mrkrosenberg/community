const admin = require('firebase-admin');
const firebase = require('firebase');

// Initialize application
admin.initializeApp();

const db = admin.firestore();

module.exports = { db, admin };
