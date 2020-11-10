const { admin, db } = require('./firebase');

// Route Authentication
module.exports = (req, res, next) => {

    let idToken;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
        console.error('no token found')
        return res.status(403).json({
            error: 'Unauthorized'
        })
    }

    admin.auth()
        .verifyIdToken(idToken)
        .then(decodedToken => {
            req.user = decodedToken;
            // console.log(decodedToken);
            return db.collection('users')
                        .where('userId', '==', req.user.uid)
                        .limit(1)
                        .get();
        })
        .then(data => {
            dataRef = data.docs[0].data();
            req.user.handle = dataRef.handle;
            req.user.imageUrl = dataRef.imageUrl;
            return next();
        })
        .catch(err => {
            console.error('Token error: ', err);
            return res.status(403).json({
                error: err.code
            });
        });
        
};