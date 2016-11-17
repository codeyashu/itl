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
    var lat = "lat"+i;
    var long = "long"+i;
    var vlat = p.lat[i];
    var vlong = p.long[i];
    r.table('test').get('id').update({"cpoint":{lat:vlat,long:vlong}}).run()
    .then(function(response){
        console.log('traffic signal critical points updated'+response);
    })
    .catch(function(err){
        console.log('error while updating critical points'+err);
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
           //  console.log(data.slist[i].id)
           console.log(point.lat[i]);
             
        }
      }
});



/*
formula.points(loc.lat,loc.long,function(){
                console.log(plat);
                console.log(plon);
                console.log(t);
             });
*/