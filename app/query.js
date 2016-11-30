const express = require('express');

const r = require('rethinkdbdash')({
    host: 'localhost',
    port: '28015',
    db: 'itl'
});

(function trafficSignal(){
    r.table('trafficSignal').run()
    .then(function(response){
       module.exports.slist = response;
       module.exports.slen = Object.keys(response).length;
       console.dir(response)
       console.log("trafic signal query successful")
    })
    .error(function(err){
       console.log(err);
    })   
 }());

(function ambulance(){
    r.table('ambulance').run()
    .then(function(response){
       module.exports.alist = response;
       module.exports.alen = Object.keys(response).length;
    })
    .error(function(err){
       console.log(err);
   })   
}());