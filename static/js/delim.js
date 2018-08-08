
// INITIALIZATION OF THE MAP
var map = L.map("mapid", {fullscreenControl: true}).setView([0, -0], 2);

var roadMutant = L.gridLayer.googleMutant({
    maxZoom: 22,
    type:'roadmap'
}).addTo(map);

//var fsControl = new L.Control.FullScreen();
		// add fullscreen control to the map
//		map.addControl(fsControl);
//GLOBAL VARIABLES 
var coordinatesConverted = []; 
var polylineArrayCoordinates = [];
var pointMap = [];
var idZoneSelected;
var editableLayers = new L.FeatureGroup();

map.addLayer(editableLayers);

//DRAW CONTROLS OF MAP
var drawControl = new L.Control.Draw({
    position: 'topleft',
    draw: {
        polygon:{   
            shapeOptions: {
                color: '#3498db'
            },        
            showArea: true
        },
        marker : false,
        polyline : false,
        rectangle : false,
        circle: false,
        circlemarker: false
    },
    edit: {
        featureGroup: editableLayers,
        poly: {
            allowIntersection: false
        }
    }
});

var drawControl2 = new L.Control.Draw({
    position: 'topleft',
    draw: {
        polygon:false,
        marker : false,
        polyline : false,
        rectangle : false,
        circle: false,
        circlemarker: false
    },
    edit: {
        featureGroup: editableLayers,
        poly: {
            allowIntersection: false
        }
    }
});

map.addControl(drawControl);

//FUNCTION TO CONTROLS THE DRAWING OF A SHAPE.

map.on('draw:created', function (e) {
   var type = e.layerType;
   console.log(type);
   var layer = e.layer;
   if (type === 'marker'){
        console.log("CREANDO MARCADOR");
        let coordinates = layer.getLatLng();
        console.log(coordinates);
    }
    if (type === 'polygon') {
        console.log("CREANDO POLÍGONO");
        var polygon = layer.toGeoJSON();
        var polygonCoordinates = polygon['geometry']['coordinates'];
        //CONVERT COORDINATES [LON,LAT] GeoJSON IN [LAT,LON] COORDINATES.
        coordinatesConverted = [];
        for(let i=0; i<polygonCoordinates.length;i++){
          for(let j=0; j<polygonCoordinates[i].length;j++){
            coordinatesConverted.push([polygonCoordinates[i][j][1],polygonCoordinates[i][j][0]]);         
          }
        }
        console.log(JSON.stringify(polygon));
        console.log(polygonCoordinates);
        console.log("Coordenadas  [lat,long] del polígono ");
        console.log(coordinatesConverted.join(";"));  
        layer.addTo(map)
        map.removeControl(drawControl);
        map.addControl(drawControl2);
        console.log(layer.getCenter()) 
        console.log(layer.getCenter().lat + "," + layer.getCenter().lng) 
        pointMap[0] = layer.getCenter().lat;
        pointMap[1] = layer.getCenter().lng;

    }
    if(type === 'polyline'){
        console.log("CREANDO POLILÍNEA");
        var polylineCoordinates = layer.getLatLngs();
        //CONVERT POLYLINE COORDINATES INTO ARRAY OF COORDINATES 
        polylineCoordinates.forEach(element => {
            polylineArrayCoordinates.push([element['lat'],element['lng']])
        });
        console.log(polylineCoordinates);
        console.log(polylineArrayCoordinates);
    }
    if(type === 'rectangle'){
        console.log("CREANDO RECTANGULO");
    }
   // Do whatever else you need to. (save to db; add to map etc)
   editableLayers.addLayer(layer);
   //drawnItems.addLayer(layer);
});
map.on('draw:edited', function (e) {
    var layers = e.layers;
    layers.eachLayer(function (layer) {
        var polygon = layer.toGeoJSON();
        var polygonCoordinates = polygon['geometry']['coordinates'];
        //CONVERT COORDINATES [LON,LAT] GeoJSON IN [LAT,LON] COORDINATES.
        coordinatesConverted = [];
        for(let i=0; i<polygonCoordinates.length;i++){
          for(let j=0; j<polygonCoordinates[i].length;j++){
            coordinatesConverted.push([polygonCoordinates[i][j][1],polygonCoordinates[i][j][0]]);         
          }
        }
        console.log(JSON.stringify(polygon));
        console.log(polygonCoordinates);
        console.log("Coordenadas  [lat,long] del polígono ");
        console.log(coordinatesConverted.join(";")); 
        var center = layer.getCenter();
        console.log(center.toString()) 
        pointMap[0] = layer.getCenter().lat;
        pointMap[1] = layer.getCenter().lng;
        
    });
});
map.on('draw:deleted', function (e) {
    map.removeControl(drawControl2);
    map.addControl(drawControl);
});
//FUNCTION TO SEARCH THE ADDRESS SPECIFIED.
function searchAddress(){
    //REQUEST GOOGLE GEOCODE API SERVICE
    $.get("https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent($("#zoneAddress").val()) + "&key=AIzaSyDCflB_l_yiXG9F29g65Q33boBrCJTepmM", function(data){
        if (data.status !== "OK") { 
            throw new Error("Unable to geocode address"); 
        }
        else{
            pointMap[0] = data.results[0].geometry.location.lat;
            pointMap[1] = data.results[0].geometry.location.lng;
            console.log(pointMap)
            //COMMENT- map.setView() immediately set the new view to the desired location/zoom level.
            map.setView(new L.LatLng(pointMap[0], pointMap[1]), 18);
            //COMMENT- map.panTo() will pan to the location with zoom/pan animation
            //map.panTo(new L.LatLng(pointMap[0], pointMap[1]));
            return;            
        }
    });
    if(pointMap){
        return pointMap;
    }  
}
function searchZones(){
    fetch("https://smartsecurity-webservice.herokuapp.com/api/zone", {
        method: 'GET',
        headers: {
            'Access-Control-Allow-Methods':'GET, POST, OPTIONS, PUT, PATCH, DELETE'
        },
    })
    .then((res) => res.json())
    .then((data)=> {
        console.dir(data)    
        data.forEach(element =>{
            $('#zoneReference').append($('<option>', {
                value: element['idZone'],
                text: element['name']
            })); 
        })
    })
}
$('#zoneReference').change(function() {
    idZoneSelected = $(this).val()
    //GET ALL INFORMATION OF A SPECIFIC ZONE
    fetch("https://smartsecurity-webservice.herokuapp.com/api/zone/"+idZoneSelected, {
        method: 'GET',
        headers: {
            'Access-Control-Allow-Methods':'GET'
        },
    })
    .then((res) => res.json())
    .then((data) => {
        console.log(data);
        map.setView(new L.LatLng(data['centerPoint'][0], data['centerPoint'][1]), 18);
        polyline = L.polyline(data['location'], {color: '#ff6666'}).addTo(map);
    })
});
// FUNCTION TO CLEAR THE ADDRESS INPUT OF ZONE
function clearAddress(){
    $("#zoneAddress").val("");    
    map.setView(new L.LatLng(0,0), 2);
    return;
}
//FUNCTION TO CLEAR THE ALL THE INPUTS OF ZONE  
function clearInputsZone(){
    $("#zoneName").val("");
    $("#zoneAddress").val("");    
    $('select[name=zoneCategories]').val("select an option");
    $('#zoneDescription').val("");
    map.setView(new L.LatLng(0,0), 2);
    return;
}

// FUNCTION TO SAVE THE ZONE INFORMATION
function saveZone(){
    let zone = {
        name: $("#zoneName").val(),
        address:  $("#zoneAddress").val(),
        description: $('#zoneDescription').val(),
        centerPoint: pointMap,
        location: coordinatesConverted
    };
    console.log(zone);
    fetch("https://smartsecurity-webservice.herokuapp.com/api/zone", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Methods':'POST, OPTIONS'
        },
        body : JSON.stringify(zone)
    })
    .then((respuesta) => {
        if(respuesta.status != 201){
            alert("An error has ocurred to save the subzone entity");
            clearInputsZone();
        }
        else{
            console.log(respuesta);
            alert("Zone save successfully");
            clearInputsZone();
        }
    })
    return;
}



//ROADS DINAMICOS
var roadRegistred 

var drawRoads = () =>{
    console.log("ZONEDANI")

    var overpassQuery =  buildOverpassApiUrl("highway")

    fetch(overpassQuery, {
        method: 'GET',
        headers: {
            'Access-Control-Allow-Methods':'GET'
        },
    })
    .then((res) => res.json())
    .then((data) => { 
        data.elements.map((way)=>{
            if (way.geometry){
                //
                let road = L.polyline (convertOSMCoordinates(way.geometry), {
                    color: '#3498db',
                    weight: 4
                })
                .on('click', ()=> {
                    console.log("PREESS")
                    if (way.tags.name){
                        console.log(way.tags.name)
                        $("#roadName").val(way.tags.name);
                    }else {
                        $("#roadName").val("");
                    }
                })
                .addTo(map);
                
                road.bindPopup('<a href="#" data-toggle="modal" data-target="#roadModal">Registre this Road</a>');
                
                /*road.on('click', function() {
                    this.setStyle({
                        color: '#e74c3c'   //or whatever style you wish to use;
                    });
                });*/
                
            }
        })
    })
    return;  

}

var drawParkings = () =>{
    console.log("ZONEDANI")

    var overpassQuery =  buildOverpassApiUrl("parking")

    fetch(overpassQuery, {
        method: 'GET',
        headers: {
            'Access-Control-Allow-Methods':'GET'
        },
    })
    .then((res) => res.json())
    .then((data) => { 
        data.elements.map((way)=>{
            if (way.geometry){
                //
                let road = L.polygon (convertOSMCoordinates(way.geometry), {
                    color: '#2980b9',
                    weight: 3
                })
                .on('click', ()=> {
                    console.log("PREESS")
                    if (way.tags.name){
                        console.log(way.tags.name)
                        $("#roadName").val(way.tags.name);
                    }else {
                        $("#roadName").val("");
                    }
                })
                .addTo(map);
                
                road.bindPopup('<a href="#" data-toggle="modal" data-target="#roadModal">Registre this Parking</a>');
                
                /*road.on('click', function() {
                    this.setStyle({
                        color: '#e74c3c'   //or whatever style you wish to use;
                    });
                });*/
                
            }
        })
    })
    return;  

}

var buildOverpassApiUrl =  (overpassQuery, coord) =>  {
    var bounds =map.getBounds().getSouth() + ',' + map.getBounds().getWest() + ',' + map.getBounds().getNorth() + ',' + map.getBounds().getEast();
    //bounds = coord
    //var nodeQuery = 'node[' + overpassQuery + '](' + bounds + ');';
    var wayQuery = 'way[' + overpassQuery + '](' + bounds + ');';
    //var relationQuery = 'relation[' + overpassQuery + '](' + bounds + ');';
   
    var query = '?data=[out:json][timeout:15];('  + wayQuery  + ');out body geom; out skel qt;';
    var baseUrl = 'https://overpass-api.de/api/interpreter';
    var resultUrl = baseUrl + query;
    console.log(resultUrl)
    return resultUrl;
}

var convertOSMCoordinates = (coords) =>{
    var temp = []
    coords.map((coor)=>{
        temp.push([coor.lat, coor.lon])
    })
    return temp
}
