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


router.get('/',function(req,res){
    res.render('pages/home')
})

router.get('/lights',function(req,res){
    res.render('pages/lights')
})