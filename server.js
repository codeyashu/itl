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
    var lat = loclat;
    var long = loclong;

    var testnear = new Array();
    
    console.log("Sorting By Distance to Traffic Signals")
           
    for(let i = 0; i < query.slen; i++){
        (function(){
            var justtest = new Object;
            var sdist = formula.distance(lat,long,query.slist[i].location.lat,query.slist[i].location.long);

            justtest.sdist = sdist;
            justtest.sid = query.slist[i].id;
            justtest.splace = query.slist[i].place;
            justtest.lat = query.slist[i].location.lat;
            justtest.long = query.slist[i].location.long;

            testnear.push(justtest);      
        }());
    }

    testnear.sort(sort_by('sdist', true, parseFloat));
    return testnear;
}


function checkside(loclat,loclong,ssid){
    var sidearray = new Array;
    r.table('trafficSignal').get(ssid).pluck('cpoint').run()
    .then(function(response){
        sidearray[0] =  formula.distance(loclat,loclong,response.cpoint.lat1,response.cpoint.long1)
        sidearray[1] =  formula.distance(loclat,loclong,response.cpoint.lat2,response.cpoint.long2)
        sidearray[2] =  formula.distance(loclat,loclong,response.cpoint.lat3,response.cpoint.long3)
        sidearray[3] =  formula.distance(loclat,loclong,response.cpoint.lat4,response.cpoint.long4)
        console.log(arr.indexOf(Math.min(...sidearray)))
        showgreen(arr.indexOf(Math.min(...sidearray)))
    })
    .error(function(err){
         console.log(err + "Error while determining side");
    }) 
    // return Math.min(...sidearray);
}


///--socket.io--///

var momu = -1;
var domu = -1;
var locarray = new Array()
var nearest = new Object()

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

         nearest = getnearest(loclat,loclong)

         console.log("Traffic Signal Order is ")
         console.dir(nearest)
         domu++;
         console.log("Nearest signal " +nearest[domu].sid)
         console.log("Place " +nearest[domu].splace)
         console.log("Distance from Ambulance " +nearest[domu].sdist + " Km")
    })

    socket.on('location sending',function(loclat,loclong){
         console.log("Checking if Approaching "+nearest[domu].splace + " ---Updating Array");
         var testdist = formula.distance(loclat,loclong,nearest[domu].lat,nearest[domu].long) 
         console.log("distance: "+testdist);
         momu++;

         if(momu<=10){
        
             (function(){
                 locarray[momu] = testdist
                 if(momu === 10){
                     if((locarray[0]-locarray[10]) > 0){
                         console.log("\n.\n.\nConfirmed Approaching\n.\n.")
                         console.log("Checking Side")
                         checkside(loclat,loclong,nearest[domu].sid)
                     }
                     else{
                         console.log("Moving away from signal "+ nearest[domu].splace)
                         console.log("Checking Next Signal")
                         domu++;
                         if(domu === 4){
                             console.log("Restarting!")
                             domu=0;
                         }
                         momu = -1;
                     }
                 }
             }());
         }  
    })


      // emit green signal
   function showgreen(sside){
       console.log("Signal Side "+ sside)
       io.emit('emergency',"1001");
   }
      
 })


function gaat(){
 var x = getnearest(12.9179065,77.5870897)
  console.dir(x);
  console.log(x[0].sdist)      
}
setTimeout(gaat,3000);
      

server.listen(function(){
    console.log('Server started!');
})


//client emits the location
//add the request to the queue
//check for concurrency and syncronization
