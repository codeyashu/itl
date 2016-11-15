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

//distance between two coordinates
const fdistance = require('./app/fdistance');
//find four critical points 
const fpoints = require('./app/fpoints');
//database query
const query = require('./app/query');

console.log(fdistance)
function getSignalList(){
  console.log(query.companyList());
}


  

function my(data){
  return data;
}



app.get('/',function(req,res){
    res.render('pages/home')
})

app.listen(3000,function(){
    console.log('Server started!')
})