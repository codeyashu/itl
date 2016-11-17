var express = require('express');

var r = require('rethinkdbdash')({
    host: 'localhost',
    port: '28015',
    db: 'itl'
});

module.exports = {
  signal : function(next){
    r.table('trafficSignal').run()
    .then(function(response){
       var list = {
         slist: response,
         slen: Object.keys(response).length
      };
     next(null, list);
   })
  .error(function(err){
     console.log(err);
     next(err);
  })   
},

ambulance : function(next){
    r.table('ambulance').run()
    .then(function(response){
       var list = {
         alist: response,
         alen: Object.keys(response).length
      };
     next(null, list);
   })
  .error(function(err){
     console.log(err);
     next(err);
  })   
}

}
