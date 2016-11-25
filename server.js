'use strict';
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const r = require('rethinkdbdash')({
    host: 'localhost',
    port: '28015',
    db: 'itl'
});

const app = module.exports = express();
const server = app.listen(3000);
const io = require('socket.io').listen(server);


//--use ejs and express layouts
app.set('view engine','ejs');
app.use(expressLayouts);

//use bodyParser
app.use(bodyParser.urlencoded({extended: true}));

//public folder
app.use(express.static(__dirname + '/public'));

//-- app folder files

//all formulas
const formula = require('./app/formula');
//database query
const query = require('./app/query');


//find four critical points 
const fdistance = require('./app/fpoints');


query.signal(function(err, data){
      if(err) {
         console.log("failed to retrieve ambulance list" + err);
      } 
      else {
        console.log("traffic signal list query successful");
      }
});


app.get('/',function(req,res){
    res.render('pages/home')
})


///---socket.io

io.on('connection',function(socket){
    console.log('a user connected');
    
    socket.on('disconnect',function(aaa){
        console.log('user disconnected');
    })

    socket.on('chat message',function(msg){
        console.log('message: ' + msg );
    })

})


server.listen(function(){
    console.log('Server started!')
});