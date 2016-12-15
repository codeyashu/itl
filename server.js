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


//sort array of objects
var sort_by = function(field, reverse, primer){
   var key = function (x) {return primer ? primer(x[field]) : x[field]};

   return function (a,b) {
	  var A = key(a), B = key(b);
	  return ( (A < B) ? -1 : ((A > B) ? 1 : 0) ) * [-1,1][+!!reverse];                  
   }
}

//get distance to traffic Signal
function getnearest(loclat,loclong){
    // var min = 10000;
     var lat = loclat;
     var long = loclong;

     var testnear = new Object();
           
     for(let i = 0; i < query.slen; i++){
        (function(){
            var sdist = formula.distance(lat,long,query.slist[i].location.lat,query.slist[i].location.long);

            testnear[i].sdist = sdist;
            testnear[i].sid = query.slist[i].id;
            testnear[i].splace = query.slist[i].place;
          
          /*  if(distance < min){
               min = distance;
               ssid = query.slist[i].id;
               ssplace = query.slist[i].place;
            }
        */ 
        }());
     }

     testnear.sort(sort_by('sdist', true, parseFloat));

/*
     return {
         distance : min,
         sid : ssid,
         splace : ssplace
     }

     */

    return testnear;
}


function checkside(loclat,loclong,ssid){
    var sidearray = new Array;
    var minside;
    sidearray[0] =  formula.distance(lat,long,query.slist[ssid].cpoint.lat1,query.slist[ssid].cpoint.long1);
    sidearray[1] =  formula.distance(lat,long,query.slist[ssid].cpoint.lat2,query.slist[ssid].cpoint.long2);
    sidearray[2] =  formula.distance(lat,long,query.slist[ssid].cpoint.lat3,query.slist[ssid].cpoint.long3);
    sidearray[3] =  formula.distance(lat,long,query.slist[ssid].cpoint.lat4,query.slist[ssid].cpoint.long4);
    return arr.indexOf(Math.max(...sidearray));
   // return Math.min(...sidearray);
}


///--socket.io--///

var momu = -1;
var domu = -1;
var locarray = new Array()

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
    
   
   //On Location Sent By App
    socket.on('location sent',function(loclat,loclong){
         
         console.log("latitude: "+ loclat)
         console.log("longitude: "+ loclong)

         console.log("Calculating distances to traffic signal")

         var testnear = getnearest(loclat,loclong)

         console.log("Traffic Signal Order is ")
         console.dir(testnear)
         momu++;
         domu++;
         console.log("Nearest signal " +testnear[domu].sid)
         console.log("Place " +testnear[domu].splace)
         console.log("Distance from Ambulance " +testnear[domu].sdist + " Km")
         
         console.log("Checking if Approaching "+testnear[domu].splace + " ---Updating Array");

         (function(){
             locarray[momu] = testnear[domu].sdist
             if(momu === 10){
                 if((locarray[0]-locarray[10]) > 0){
                     console.log("\n.\n.Confirmed Approaching\n.\n.")
                     console.log("Checking Side")
                     var sside = checkside(loclat,loclong,testnear[domu].sid)
                     sside++;
                     console.log("testnear[domu] Side is "+ sside)
                     showgreen(sside);
                 }
                 else{
                     console.log("Moving away from signal "+ testnear[domu].splace)
                     console.log("Checking Next Signal")
                     domu++;
                 }
             }

         }());  
            
      })


      // emit green signal
   function showgreen(sside){
       io.emit('emergency',"1001");
   }
      
 })




function gaat(){
  var x = getnearest(12.917049,77.636326)
  console.dir(x);
}
setTimeout(gaat,3000);
      

server.listen(function(){
    console.log('Server started!');
})


//client emits the location
//add the request to the queue
//check for concurrency and syncronization
