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

//-- app folder files --//

//all formulas
const formula = require('./app/formula');
//database query
const query = require('./app/query');

//find four critical points 
const fdistance = require('./app/fpoints');

//routes
var router = require('./app/routes');
app.use('/',router);


//public folder
app.use(express.static(__dirname + '/public'));


query.signal(function(err, data){
      if(err) {
         console.log("failed to retrieve ambulance list" + err);
      } 
      else {
        console.log("traffic signal list query successful");
      }
});

///--socket.io--//

io.on('connection',function(socket){

    socket.on('disconnect',function(){
        console.log('user disconnected');
    })

    socket.on('createSignal',function(chosenSignal){
        socket.join('traffic signal');
        console.log(chosenSignal +' joined');
        console.log(socket.id)
        r.table('trafficSignal').get(chosenSignal.toString()).update({socketId: socket.id}).run(function(err,response){
            if(err){
               console.log('error updating socket id');
            }
            else{
                console.log('socket id of signal '+ chosenSignal+' updated');
            }
        })
    })


   aaa(); 
    

})

function aaa(){ 
io.emit('emergency',"ulalalalalala");
}

server.listen(function(){
    console.log('Server started!')
});