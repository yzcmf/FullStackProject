/**
 * Created by zyx on 2/1/17.
 */
var express = require('express');
var MongoClient = require('mongodb').MongoClient;//node mongo driver
var ObjectId = require('mongodb').ObjectId;//node mongo driver
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs'); // only the user can remember their password
var jwt = require('jwt-simple');
var app = express();

var JWT_SECRET = 'catsmeow'; // keep the users login in;
var db = null;

MongoClient.connect("mongodb://localhost:27017/zyx", function (err, dbconn) {
    if (!err) {
        console.log("we are connected");
        db = dbconn;
    }
});


app.use(bodyParser.json());       // to support JSON-encoded bodies

app.use(express.static('public'));

var meows = [
    'Hello this is yuxuan',
    'I love to play violin',
    'I love magic',
    'I am a good student'
];

app.get('/meows', function (req, res, next) {
    db.collection('meows', function (err, meowsCollection) {
        meowsCollection.find().toArray(function (err, meows) {
            return res.json(meows);
        });
    });
});

app.post('/meows', function (req, res, next) {
    var token = req.headers.authorization;
    var user = jwt.decode(token,JWT_SECRET);

    db.collection('meows', function (err, meowsCollection) {
        var newMeow = {
            text: req.body.newMeow,
            user: user._id,
            username:user.username
        };

        meowsCollection.insert(newMeow, {w: 1}, function (err) {
            return res.send();
        });
    });
});

app.put('/meows/remove', function (req, res, next) {

    var token = req.headers.authorization;
    var user = jwt.decode(token,JWT_SECRET);

    db.collection('meows', function (err, meowsCollection) {
        var meowId = req.body.meow._id;
        meowsCollection.remove({_id: ObjectId(meowId),user:user._id},{w: 1}, function (err) {
            return res.send();
        });
    });
});

app.post('/users', function (req, res, next) {
    db.collection('users', function (err, usersCollection) {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(req.body.password, salt, function (err, hash) {
                var newUser = {
                    username: req.body.username,
                    password: hash
                };
                usersCollection.insert(newUser, {w: 1}, function (err) {
                    return res.send();
                })
            })
        })
    });
});

app.put('/users/signin', function (req, res, next) {
    db.collection('users', function (err, usersCollection) {

        usersCollection.findOne({
                username: req.body.username
            }, function (err, user) {
                bcrypt.compare(req.body.password, user.password, function (err, result) {
                    if (result) {
                        var token= jwt.encode(user,JWT_SECRET);
                        return res.json({token:token});
                    }
                    else {
                        return res.status(400).send();
                    }
                })
            }
        )
    })
})

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});