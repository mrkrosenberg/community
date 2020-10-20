const { db } = require('../util/firebase');

exports.getAllPosts = (req, res) => {

    db.collection('posts')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            let posts = [];
            data.forEach(doc => {
                posts.push({
                    postId: doc.id,
                    ...doc.data()
                })
            })
            return res.json(posts);
        })
        .catch(err => console.log('collection error: ', err))
};

exports.createNewPost = (req, res) => {

    if (req.body.body.trim() === '' ) {
        return res.status(400).json({
            body: 'Body must not be empty'
        })
    };

    const newPost = {
        body: req.body.body,
        userHandle: req.user.handle,
        createdAt: new Date().toISOString()
    };

    db.collection('posts')
        .add(newPost)
        .then(doc => {
            return res.json({
                message: `document ${doc.id} created successfully`
            })
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json({
                error: 'error creating your post'
            })
        });
};

exports.getPost = (req, res) => {

    let postData = {};
    db.doc(`/posts/${req.params.postId}`).get()
        .then(doc => {
            if(!doc.exists) {
                return res.status(404).json({
                    error: 'Post not found'
                })
            }
            postData = doc.data();
            postData.postId = doc.id;
            return db.collection('comments')
                .orderBy('createdAt', 'desc')
                .where('postId', '==', req.params.postId)
                .get();
        })
        .then(data => {
            postData.comments = [];
            data.forEach(doc => {
                postData.comments.push(doc.data())
            });
            return res.json(postData);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({
                error: err.code
            })
        });
};