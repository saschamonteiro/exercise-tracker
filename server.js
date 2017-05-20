var express = require('express')
var bodyparser = require('body-parser')
var validator = require('express-validator')
var util = require('util')
var mongodb = require('mongodb')
var m = require('moment')
const cors = require('cors')
var app = express()
var port = process.env.PORT || 8080
const mongoose = require('mongoose')
mongoose.Promise = Promise
mongoose.connect(process.env.MONGOLAB_URI )
var db = mongoose.connection;
var User = require("./app/models/user").User
var Exercise = require("./app/models/exercise").Exercise

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() {
    console.log('connected to mogodb!')
    // var usr = new User({ username: 'SaschaM' });
    // usr.save(function (err, u) {
    //     if (err) return console.error(err);
    //     console.log('saved user '+ u.username +' _id:',u._id);
    //     var excs = new Exercise(
    //         {
    //             userId: u._id, 
    //             description: 'Test Run',
    //             duration: 30,
    //             date: m('2017-05-20')
                
    //         }
    //     )
    //     excs.save((err, e) => {
    //         if (err) return console.error(err);
    //         console.log('saved exercise for '+ u.username +' _id:',u._id);
    //         console.log('exercise', e)
    //     })
       
    // });
   
  
})

app.use(cors())

app.use(bodyparser.urlencoded({extended: false}))
app.use(bodyparser.json())
app.use(validator());
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



/* 
POST /api/exercise/new-user {username}
POST /api/exercise/add {userId,description,duration,date}
GET /api/exercise/log?{userId}[&from][&to][&limit]
*/

app.post('/api/exercise/new-user', (req, res) => {
    req.checkBody("username", "Enter a valid username.").notEmpty()
   req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('There have been validation errors: ' + util.inspect(result.array()));
      return;
    }
    var usr = new User({ username: req.body.username });
         usr.save((err, savedUser) => {
             if(err) {
                 console.error(err)
               res.end("Error:"+err)  
             } else {
                 //{"username":"sascham3","_id":"HyqiN4aeb"}
                 res.end(JSON.stringify(savedUser))
             }
         })
  });
        
    
})
app.post('/api/exercise/add', (req, res) => {
    req.checkBody("userId", "Enter a valid userId.").notEmpty()
    req.checkBody("description", "Enter a valid description.").notEmpty()
    req.checkBody("duration", "Enter a valid duration.").notEmpty().isInt()
    req.checkBody("date", "Enter a valid date.").notEmpty().isISO8601()
    req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('There have been validation errors: ' + util.inspect(result.array()));
      return;
    }
    //go ahead
    User.findOne({_id: req.body.userId}, (err, user) => {
        if(err) {
            res.status(400).send('User not found');
            return;
        }
        if(user){
            var excs = new Exercise(
                {
                    userId: req.body.userId, 
                    description: req.body.description,
                    duration: req.body.duration,
                    date: m(req.body.date)
                    
                }
            )
            excs.save((err, e) => {
                if (err) return console.error(err);
                console.log('saved exercise for '+ user.username +' _id:',user._id);
                console.log('exercise', e)
                //{"username":"sascham2","description":"test1","duration":30,"_id":"SJHXNNpxb","date":"Sat May 20 2017"}
                res.end(JSON.stringify(e))
            })
        }else{
            res.status(200).send('User not found');
            return;
        }
    })
    
  })
})
app.get('/api/exercise/log', (req, res) => {
    req.checkQuery("userId", "Enter a valid userId.").notEmpty()
    req.checkQuery("limit", "Enter a valid limit.").optional().isInt()
    req.checkQuery("from", "Enter a valid from date.").optional().isISO8601()
    req.checkQuery("to", "Enter a valid to date.").optional().isISO8601()
    req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      res.status(400).send('There have been validation errors: ' + util.inspect(result.array()));
      return;
    }
    //go ahead
    User.findOne({_id: req.query.userId}, (err, user) => {
        if(err) {
            res.status(400).send('User not found');
            return;
        }
        if(user){
            var find = {
                userId: req.query.userId
            }
            if(req.query.from || req.query.to){
                var o = {}
                if(req.query.from) o.$gte = m(req.query.from)
                if(req.query.to) o.$lt = m(req.query.to)
                find.date = o
            }
            var opt = {
                sort: {date: -1}
            }
            if(req.query.limit){
                opt.limit = parseInt(req.query.limit, 10)
            }
            console.info('query', find)
            console.info('options', opt)
            Exercise.find(find, {},opt , (err, exercises) => {
                if(err){
                    console.log(err)
                    res.status(400).send('Error');
                    return;
                }
                if(exercises){
                    // console.log('exercises', exercises)
                    //fcc {"_id":"SJHXNNpxb","username":"sascham2","count":2,"log":[{"description":"test1","duration":30,"date":"Sat May 20 2017"},{"description":"test1","duration":30,"date":"Fri May 19 2017"}]}
                    //me {"_id":"591fa9101574f309ea0fca42","username":"sascha","count":9,"log":[{"date":"Sa May 20 2017"},{"date":"Sa May 20 2017"},{"date":"Sa May 20 2017"},{"date":"Sa May 20 2017"},{"date":"Sa May 20 2017"},{"date":"Sa May 20 2017"},{"date":"Sa May 20 2017"},{"date":"Sa May 20 2017"},{"date":"Sa May 20 2017"}]}
                    var ret = {
                        _id: user._id,
                        username: user.username,
                        count: exercises.length,
                        
                    }
                    var log = []
                    for(key in exercises){
                        var excs =exercises[key];
                        // console.log('excs', excs)
                        var dt = m(excs.date)
                        var l = {description: excs.description, duration: excs.duration, date: dt.format("ddd MMM DD YYYY")}
                        // console.log('l:', l)
                        log.push(l)
                    }
                    ret.log = log
                    res.end(JSON.stringify(ret))
                }else{
                    res.status(400).send('No exercises found');
            return;
                }
            })
        }else{
            res.status(200).send('User not found');
            return;
        }
    })
    
  })
})
app.listen(port, function() {
  console.log('Example app listening on port ' + port)
})