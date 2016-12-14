'use strict';
const express = require('express')
const path = require('path')
const expressLayouts = require('express-ejs-layouts')
const bodyParser = require('body-parser')
const r = require('rethinkdbdash')({
    host: 'localhost',
    port: '28015',
    db: 'itl'
})

const app = module.exports = express()
const server = app.listen(3000)

//database query
const query = require('./app/query')

const io = require('socket.io').listen(server)

//--use ejs and express layouts
app.set('view engine','ejs')
app.use(expressLayouts)

//use bodyParser
app.use(bodyParser.urlencoded({extended: true}))

//-- app folder files --//

//all formulas
const formula = require('./app/formula')

//routes
var router = require('./app/routes')
app.use('/',router)

//public folder
app.use(express.static(__dirname + '/public'))


//get nearest traffic Signal
function getnearest(location){
     var min = 1000;
     var lat = location.lat;
     var long = location.long;
           
     for(let i = 0; i < global.slen; i++){
        (function(){
            var distance = formula.distance(lat,long,global.slist[i].lat,global.slist[i].long);
            if(distance < min){
               min = distance;
               var sid = global.slist[i].id;
            }
        }());
     }
     return {
         distance : min,
         sid : sid
     }
}

///--socket.io--//

io.on('connection',function(socket){

    socket.on('disconnect',function(){
        console.log('user disconnected')
    })

    socket.on('createSignal',function(chosenSignal){
        socket.join('traffic signal')
        console.log("a traffic signal joined")
        console.log(chosenSignal +' joined')
        console.log(socket.id)
        r.table('trafficSignal').get(chosenSignal.toString()).update({socketId: socket.id}).run(function(err,response){
            if(err){
               console.log('error updating socket id')
            }
            else{
                console.log('Socket id of signal '+ chosenSignal+' updated')
            }
        })
    })

    socket.on('createAmbulance',function(chosenAmbulance){
        socket.join('emergency ambulance')
        console.log('Ambulance '+chosenAmbulance+' in emergency')
    })

   
  
    socket.on('location sent',function(location){

         // var nearest = getnearest(location)
         //  console.log(nearest.distance)
         console.log("latitude: "+ location.lat)
         console.log("longitude: "+ location.long)
         console.log("calculating distances to traffic signal")
         console.log("nearestsignal = " + 1001)
         console.log("side 2")
           
         io.emit('emergency',"1001");
            
      })
      
 })
             

server.listen(function(){
    console.log('Server started!')
})

