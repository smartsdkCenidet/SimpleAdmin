//GLOBAL VARIABLES 
var coordinatesConverted = []; 
var polylineArrayCoordinates = [];
var pointMap = [];
var idZoneSelected;
var editableLayers = new L.FeatureGroup();
$("#alert").hide();
$("#form").submit(function(event){
    if(coordinatesConverted.length <= 0){
        $("#alert").show();
    }else{
        $("#alert").hide();
        save();
    }
    
    event.preventDefault();
});
// // INITIALIZATION OF THE MAP
var map = L.map("mapid", {fullscreenControl: true}).setView([0, -0], 2);

var roadMutant = L.gridLayer.googleMutant({
    maxZoom: 22,
    type:'roadmap'
}).addTo(map);

var hybridMutant = L.gridLayer.googleMutant({
    maxZoom: 22,
    type:'hybrid'
});


L.control.layers({
    StreetsMap: roadMutant,
    SateliteMap: hybridMutant
}, {}, {
    collapsed: false
}).addTo(map);



map.addLayer(editableLayers);

//DRAW CONTROLS OF MAP
var drawControl = new L.Control.Draw({
    position: 'topleft',
    draw: {
        marker: false,
        polygon:{   
            shapeOptions: {
                color: '#ff6666'
            },        
            showArea: true
        },
        polyline: false,
        circle: false,
        circlemarker: false,
        rectangle : false
    },
    edit: {
        featureGroup: editableLayers, //REQUIRED!!
    }
});
map.addControl(drawControl);

var drawControl2 = new L.Control.Draw({
    position: 'topleft',
    draw: {
        marker: false,
        polygon:false,
        polyline: false,
        circle: false,
        circlemarker: false,
        rectangle : false
    },
    edit: {
        featureGroup: editableLayers, //REQUIRED!!

    }
});
//FUNCTION TO CONTROLS THE DRAWING OF A SHAPE.
map.on('draw:created', function (e) {
   var type = e.layerType;
   var layer = e.layer;
    if (type === 'polygon') {
        var polygon = layer.toGeoJSON();
        var polygonCoordinates = polygon['geometry']['coordinates'];
        //CONVERT COORDINATES [LON,LAT] GeoJSON IN [LAT,LON] COORDINATES.
        coordinatesConverted = [];
        for(let i=0; i<polygonCoordinates.length;i++){
          for(let j=0; j<polygonCoordinates[i].length;j++){
            coordinatesConverted.push([polygonCoordinates[i][j][1],polygonCoordinates[i][j][0]]);         
          }
        }
        map.removeControl(drawControl);
        map.addControl(drawControl2);   
        editableLayers.addLayer(layer);
        pointMap[0] = layer.getCenter().lat;
        pointMap[1] = layer.getCenter().lng;
    }
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
            //COMMENT- map.setView() immediately set the new view to the desired location/zoom level.
            map.setView(new L.LatLng(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng), 18);
            return;            
        }
    });
}
// FUNCTION TO CLEAR THE ADDRESS INPUT OF ZONE
function clearAddress(){
    $("#zoneAddress").val("");    
    map.setView(new L.LatLng(0,0), 2);
    return;
}
//FUNCTION TO CLEAR THE ALL THE INPUTS OF ZONE  
function clear () {
    location.reload(true);
    return;
}

$("#cancel").click(clear);

// FUNCTION TO SAVE THE ZONE INFORMATION
function save () {
    let zone = {
        owner: $("#zoneName").val(),
        address:  $("#zoneAddress").val(),
        description: $('#zoneDescription').val(),
        centerPoint: pointMap,
        location: coordinatesConverted
    };
    /*fetch(`${smartService}/api/zone`, {
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
        }
        else{
            console.log(respuesta);
            alert("Zone save successfully");
            clear();
        }
    })*/
    console.log(JSON.stringify(zone))
    return;
}

