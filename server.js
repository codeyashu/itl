'use strict';
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const r = require('rethinkdbdash')({
    host: 'localhost',
    port: '28015',
    db: 'itl'
});

const app = module.exports = express();
const server = require('http').Server(app);

//--use ejs and express layouts
app.set('view engine','ejs');
app.use(expressLayouts);

//use bodyParser
app.use(bodyParser.urlencoded({extended: true}));

//public folder
app.use(express.static(__dirname + '/public'));

//-- app folder files

//all formulas
const formula = require('./app/formula');
//database query
const query = require('./app/query');


//find four critical points 
const fdistance = require('./app/fpoints');


query.signal(function(err, data){
      if(err) {
         console.log("failed to retrieve ambulance list" + err);
      } 
      else {
        console.log("traffic signal list query successful");
      }
});



app.get('/',function(req,res){
    res.render('pages/home')
})

app.listen(3000,function(){
    console.log('Server started!')
})