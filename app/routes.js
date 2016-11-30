const express = require('express')
const request = require('request')
const path = require('path')
const r = require('rethinkdbdash')({
  port: 28015,
  host: 'localhost',
  db: 'stocks'
});

//create router object
const router = express.Router()

//export router
module.exports = router;

//query
const query = require('./query')

router.get('/',function(req,res){
    res.render('pages/home')
})

router.post('/',function(req,res){
    id = req.body.id;
    authkey = req.body.key;

    for(i = 0; i < query.slen; i++){

      if(id===query.slist[i].id && authkey==='mayhem'){
           console.log('Traffic Signal '+id +' access granted')
           res.render('pages/lights',{
                data : query.slist[i]
           })
           return;
      }
    }
    res.render('pages/denied');
    console.log('Access Denied!');
      
});



//console.log()
router.get('/signalmap',function(req,res){
    res.render('pages/signalmap',{
       slist : query.slist,
       slen : query.slen
    })
})

