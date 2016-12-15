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
function getnearest(loclat,loclong){
     var min = 10000;
     var lat = loclat;
     var long = loclong;
     var ssid;
     var ssloc;
           
     for(let i = 0; i < query.slen; i++){
        (function(){
            var distance = formula.distance(lat,long,query.slist[i].location.lat,query.slist[i].location.long);
            if(distance < min){
               min = distance;
               ssid = query.slist[i].id;
               ssloc = query.slist[i].place;
            }
        }());
     }
     console.log("Nearest signal " +ssid)
     console.log("Location " +ssloc)
     console.log("Distance from Ambulance " +min + " Km")
     
     
     return {
         distance : min,
         ssid : ssid
     }
}

///--socket.io--//





io.on('connection',function(socket){

    console.log("Client connected.");

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

   
  
    socket.on('location sent',function(loclat,loclong){

         // var nearest = getnearest(location)
         // console.log(nearest.distance)
         console.log("latitude: "+ loclat)
         console.log("longitude: "+ loclong)

         getnearest(loclat,long);
         console.log("calculating distances to traffic signal")
         console.log("nearestsignal = " + 1001)
         console.log("side 2")
           
         io.emit('emergency',"1001");
            
      })
      
 })




function gaat(){
  var x = getnearest(12.917049,77.636326)

  console.log(x.distance)
 // console.log(query.slen)
 // console.log(query.slist[0].location.lat)
  //console.log(query.slist)
}
setTimeout(gaat,3000);
      

server.listen(function(){
    console.log('Server started!');
})


//client emits the location
//add the request to the queue
//check for concurrency and syncronization
