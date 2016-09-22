const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const Handlebars = require('handlebars')
const fs = require('fs')
const sqlite = require('sqlite3').verbose()
var db = new sqlite.Database('my_db.db')

db.serialize(function () {
    var query = 'CREATE TABLE if not exists profiles (id INTEGER NOT NULL PRIMARY KEY, name varchar, bio varchar, fb_id varchar)'
    db.run(query, function (err, response) {
        console.log('create table:', err, response)
    });
})

app.use(express.static(__dirname + '/'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res) {
    var html = Handlebars.compile(fs.readFileSync('./index.html', 'utf8'))();
    res.send(html)
})

app.get('/profiles', function (req, res) {
    var query = 'SELECT id,name from profiles'
    db.all(query, function (err, people) {
        if (err) return res.send(err.code || err.status || 500).send(err)
        var peopleInTriplets = []
        var triplet = []
        people.forEach(function (person, index) {
            triplet.push(person)
            if (index % 3 === 2) {
                peopleInTriplets.push(triplet)
                triplet = []
            }
        })
        if (triplet.length > 0) {
            peopleInTriplets.push(triplet)
        }
        res.send(peopleInTriplets)
    })
})
app.post('/profiles', function (req, res) {
    var name = JSON.stringify(req.body.name)
    var bio = JSON.stringify(req.body.bio)
    var fb_id = JSON.stringify(req.body.fb_id)
    var query = 'INSERT INTO profiles (name, bio, fb_id) VALUES ( ' + name + ', ' + bio + ', ' + fb_id + ')'
    db.run(query, function (err, response) {
        if (err) return res.status(err.code || err.status || 500).send(err)
        res.status(200).send(response)
    })
})
app.get('/profiles/:profileId', function (req, res) {
    var query = 'SELECT * FROM profiles WHERE id    =' + req.params.profileId
    db.all(query, function (err, response) {
        if (err) return res.status(err.code || err.status || 500).send(err)
        response[0].picture = 'http://graph.facebook.com/' + response[0].fb_id + '/picture'
        res.status(200).send(response)
    })
})

app.put('/profiles/:profileId', function (req, res) {
    var setName = req.body.newName ? 'name=' + JSON.stringify(req.body.newName): ''
    var setBio = req.body.newBio ? 'bio=' + JSON.stringify(req.body.newBio) : ''
    var setFb_id = req.body.newFb_id ? 'fb_id=' + JSON.stringify(req.body.newFb_id) : ''
    var whatToSetArray = [setName, setBio, setFb_id]
    var whatToSetString = ''
    whatToSetArray = whatToSetArray.filter(function (field) {
        return field
    })
    whatToSetArray.forEach(function (field, index) {
        if (index < whatToSetArray.length - 1) {
            whatToSetString += field + ', '
        }
        else {
            whatToSetString += field
        }
    })
    var query = whatToSetString ? 'UPDATE profiles SET ' + whatToSetString + ' WHERE id=' + req.body.id : ''
    if (query) {
        db.run(query, function (err, response) {
            if (err) return res.status(err.code || err.status || 500).send(err)
            res.status(200).send(response)
        })
    }
    else {
        res.status(200).send('nothing to update here')
    }
})

app.delete('/profiles/:profileId', function(req,res){
    var query = 'DELETE FROM profiles WHERE id=' + req.params.profileId
    db.run(query, function(err, response){
        if (err) return res.status(err.code || err.status || 500).send(err)
        res.status(200).send(response)
    })
})
const port = process.env.PORT || 3000
app.listen(port, function () {
    console.log('listening on port ' + port)
})
