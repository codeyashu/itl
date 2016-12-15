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
     var ssplace;
           
     for(let i = 0; i < query.slen; i++){
        (function(){
            var distance = formula.distance(lat,long,query.slist[i].location.lat,query.slist[i].location.long);
            if(distance < min){
               min = distance;
               ssid = query.slist[i].id;
               ssplace = query.slist[i].place;
            }
        }());
     }
     return {
         distance : min,
         sid : ssid,
         splace : ssplace
     }
}



///--socket.io--///

io.on('connection',function(socket){

    console.log("Client Connected.");
 
    //On disconnection
    socket.on('disconnect',function(){
        console.log('Client Disconnected')
    })

    //On traffic Signal Join
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

   //On Ambulance Join
    socket.on('createAmbulance',function(chosenAmbulance){
        socket.join('emergency ambulance')
        console.log('Ambulance '+chosenAmbulance+' in emergency')
        console.log('Waiting For Location Data')
    })



    var momu = 0
   
   //On Location Sent By App
    socket.on('location sent',function(loclat,loclong){
         
         
         
         console.log("latitude: "+ loclat)
         console.log("longitude: "+ loclong)

         console.log("Calculating distances to traffic signal")
         var nearest = getnearest(loclat,loclong)
         momu++;
         console.log("Nearest signal " +nearest.sid)
         console.log("Location " +nearest.splace)
         console.log("Distance from Ambulance " +nearest.distance + " Km")
         
         console.log("Checking if Approaching "+nearest.splace + " Updating Array")

         (function(){
             var locarray = new Array()
             locarray[momu] = nearest.distance
             if(momu === 10){
                 if((locarray[1]-locarray[10]) > 0){
                     console.log("Confirmed Approaching")
                 }
             }

         }());
           
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
