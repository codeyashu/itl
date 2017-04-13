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


//MY FUNCTIONS

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
            //Push to Array
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
        showgreen(ssid,sidearray.indexOf(Math.min(...sidearray)))
    })
    .error(function(err){
         console.log(err + "Error while determining side");
    }) 
}


//---socket.io---//

var momu = 0;
var domu = -1;
var tomu = -1;
var locarray = new Array()
var locarray2 = new Array()
var nearest = new Object()
var pisig = new Array()
var reqside;

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
            if(err){nearest[domu].sid
               console.log('error updating socket id')
            }
            else{
                console.log('Socket id of signal '+ chosenSignal+' updated')
            }
        })
    })

    socket.on('createPiSignal',function(num){
        pisig.push(parseINT(num))
    })


   //On Ambulance Join
    socket.on('createAmbulance',function(chosenAmbulance){
        socket.join('emergency ambulance')
        console.log('Ambulance '+chosenAmbulance+' in emergency')
        console.log('Waiting For Location Data')
    })
    

    function firstcoord(loclat,loclong){
         console.log("latitude: "+ loclat)
         console.log("longitude: "+ loclong)
         console.log("Calculating distances to traffic signal")

         nearest = getnearest(loclat,loclong)

         console.log("Traffic Signal Order by distance is ")
         console.dir(nearest)
         domu++;
         console.log("Nearest signal " +nearest[domu].sid)
         console.log("Place " +nearest[domu].splace)
         console.log("Distance from Ambulance " +nearest[domu].sdist + " Km")
    }

   //On repeated Sending     //On Location Sent By App First Time
    socket.on('location sent',function(loclat,loclong){
        momu++;

        if(momu===1){
            firstcoord(loclat,loclong)
            return;
        }

        if(momu > 10){
            console.log(".")
            tomu++;
            var testdist2 = formula.distance(loclat,loclong,nearest[domu].lat,nearest[domu].long)
            locarray2[tomu] = testdist2;
            if(tomu>=3){
             //   console.log(locarray2[tomu]-locarray2[tomu-3])
                if((locarray2[tomu]-locarray2[tomu-3]) > 0){
                    console.log("Signal Passed")
                    momu = 0;
                    domu = -1;
                    tomu = -1;
                    emergencyover();
                }
            } 
            return;
        }

        console.log("Checking if Approaching "+nearest[domu].splace + " ---Updating Array");
        var testdist = formula.distance(loclat,loclong,nearest[domu].lat,nearest[domu].long) 
        console.log("distance: "+testdist);
        (function(){
             locarray[momu] = testdist
             if(momu === 10){
                 if((locarray[2]-locarray[10]) > 0){
                     console.log(".\n.\nConfirmed Approaching\n.\n.")
                     console.log("Checking Side")
                     checkside(loclat,loclong,nearest[domu].sid)
                 }
                 else{
                     console.log("Moving away from signal "+ nearest[domu].splace)
                     console.log("Checking Next Signal")
                     domu++;
                     if(domu === query.slen){
                         console.log("Restarting!")
                         domu=-1;
                         momu=0;
                         return;
                     }
                     momu = 1;
                 }
             }
         }());
      })

      // emit green signal
       global.showgreen = function(sid,sside){
           var aside = sside+1;
           console.log("Signal Side "+ aside)
           console.log("Requesting to grant green")
           if(sid == 1001){
              socket.emit('sig1',aside);
           }
           if(sid == 1002){
              socket.emit('sig2',aside);
           }
           r.table('trafficSignal').get(sid).pluck('socketId').run()
           .then(function(response){
               reqside = response.socketId;
               console.log(reqside)
             //  io.to(response.socketId).emit('emergency ',aside)
               socket.broadcast.to(reqside).emit('emergency', aside)
               console.log("green granted")
            })
            .error(function(err){
               console.log("Error while retrieving socket ID")
            })
        } 

        function emergencyover(){
               socket.emit('emerover',"YAY!");
               socket.broadcast.to(reqside).emit('cleared', "restart");
               return;

        } 
 })

 

server.listen(function(){
    console.log('Server started!');
})
