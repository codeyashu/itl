var express = require('express')
var app = express()

var googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyD2AEMX59gWYN9Um7VLeddsd-xyLkWSrtw'
});


googleMapsClient.distanceMatrix({
  origins: ['BTM 1st stage'],
  destinations: ['jayanagar 4th block']
 // mode: 'driving'
}, function(err, response) {
  if (!err) {
    console.dir(response.json.results);
  }
});








app.get('/',function(req,res){
    res.send('Hello World!!')
})

app.listen(3000,function(){
    console.log('server started')
})