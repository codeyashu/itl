'use strict';
const r = require('rethinkdbdash')({
    host: 'localhost',
    port: '28015',
    db: 'itl'
});

//all formulas
const formula = require('./formula');
//database query
const query = require('./query');

function update(p,i,data){
    var id = data[i].id;

    r.table('trafficSignal').get(id).update({"cpoint":{lat1:p.lat[0],long1:p.long[0],
                                                       lat2:p.lat[1],long2:p.long[1],
                                                       lat3:p.lat[2],long3:p.long[2],
                                                       lat4:p.lat[3],long4:p.long[3]}})
                                                      .run()
         .then(function(results){
             console.log('traffic signal ' +id , 'critical points updated');
             console.dir(results);
         })
         .catch(function(err){
             console.log('error while updating critical points'+err);
             console.dir(err);
         })
}

query.signal(function(err, data){
      if(err) {
         console.log("failed to retrieve ambulance list in updatepoints js file" + err);
      } 
      else {
        for(let i = 0; i < data.slen; i++){
          
             var loc = data.slist[i].location;
             var theta = data.slist[i].theta;
           
             var point =   formula.points(loc,theta);
             
             update(point,i,data.slist);
           
       }
     }
});