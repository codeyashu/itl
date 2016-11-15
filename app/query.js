var express = require('express');

var r = require('rethinkdbdash')({
    host: 'localhost',
    port: '28015',
    db: 'itl'
});

/*
exports.signalList = function signalList(){
    r.table('trafficSignal').run()
    .then(function(response){
        console.log(response);
       return {
         
         slist: response,
         slen: Object.keys(response).length
      };
     //next(null, list);
   })
  .error(function(err){
     console.log(err);
     //next(err);
  })   
}

function ambulanceList(){
    r.table('ambulance').run()
    .then(function(response){
       return {
         alist: response,
         alen: Object.keys(response).length
      };
     //next(null, list);
   })
  .error(function(err){
     console.log(err);
     //next(err);
  })   
}


module.exports = signalList();
module.exports = ambulanceList();
*/

exports.companyList = function(){
    r.table('trafficSignal').run()
    .then(function(response){
       var list = {
         clist: response,
         clen: Object.keys(response).length,
     };    
   })
  .error(function(err){
     console.log(err);
  })   
};