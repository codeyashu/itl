//distance between two coordinates

function toradian(num){
               return num*Math.PI/180;
            }

function todegree(num){
               return num*180/Math.PI;
            }


module.exports = {

  distance : function distance(lat1, lon1, lat2, lon2) {
               var p = 0.017453292519943295;    // Math.PI / 180
               var c = Math.cos;
               var a = 0.5 - c((lat2 - lat1) * p)/2 + 
                       c(lat1 * p) * c(lat2 * p) * 
                      (1 - c((lon2 - lon1) * p))/2;
               return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
           },
    
  points : function points(loc,t) {
              var lat = loc.lat;
              var lon = loc.long;
              var R = 6371;
              var d = 0.25;
              var ad = d/R;

              var rlat = toradian(lat);
              var rlon = toradian(lon);

              var plat = new Array(4);
              var plon = new Array(4);

              var t = [t.t1, t.t2, t.t3, t.t4];

             for(i=0;i<4;i++){
                 var rt = toradian(t[i]);
                 plat[i] = Math.asin((Math.sin(rlat) * Math.cos(ad)) + (Math.cos(rlat) * Math.sin(ad) * Math.cos(rt)));
                 plon[i] = rlon + Math.atan2((Math.sin(rt) * Math.sin(ad) * Math.cos(rlat)) , (Math.cos(ad) - Math.sin(rlat) * Math.sin(plat[i])));
             }

             for(i=0;i<4;i++){
                 plat[i] = todegree(plat[i]);
                 plon[i] = todegree(plon[i]);
             }

          //var location = new LocationPackage(plat, plon, t);

              
              return { lat : plat,
                       lon : plon,
                       t : t
                     };
          }

}