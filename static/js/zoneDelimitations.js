

console.log(smartService)
// INITIALIZATION OF THE MAP
var map = L.map("mapid", {fullscreenControl: true}).setView([0, -0], 2);

var roadMutant = L.gridLayer.googleMutant({
    maxZoom: 22,
    type:'roadmap'
}).addTo(map);

var hybridMutant = L.gridLayer.googleMutant({
    maxZoom: 22,
    type:'hybrid'
});

var coordinatesConverted = []; 
var polylineArrayCoordinates = [];
var pointMap = [];
var idZoneSelected;
var editableLayers = new L.FeatureGroup();

L.control.layers({
    StreetsMap: roadMutant,
    SateliteMap: hybridMutant
}, {}, {
    collapsed: false
}).addTo(map);
console.log("init")
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
   var layer = e.layer;
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
        layer.addTo(map)
        map.removeControl(drawControl);
        map.addControl(drawControl2);
        pointMap[0] = layer.getCenter().lat;
        pointMap[1] = layer.getCenter().lng;

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
    fetch(`${smartService}/api/zone`, {
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

