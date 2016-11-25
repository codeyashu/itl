var express = require('express');
var request = require('request');
var path = require('path');
var r = require('rethinkdbdash')({
  port: 28015,
  host: 'localhost',
  db: 'stocks'
});

//create router object
var router = express.Router();

//export router
module.exports = router;

//query
var query = require('./query');


router.get('/',function(req,res){
    res.render('pages/home')
})

router.post('/',function(req,res){
    id = req.body.id;
    authkey = req.body.key;

    query.signal(function(err, data){
      if(err) {
         console.log("failed to retrieve ambulance list for AUTH" + err);
      } 
      else {

        for(i = 0; i < data.slen; i++){
            console.log('checking id ' + data.slist[i].id)
            if(id===data.slist[i].id && authkey==='mayhem'){
               res.render('pages/lights',{
                 data : data.slist
              });
              return;
            }
        }
        res.render('pages/denied');
      }
   });
});