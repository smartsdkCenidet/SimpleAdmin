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
var pointMap = [];
var zoneSelected;
var allZones = {};
var editableLayers = new L.FeatureGroup();
var layer = null;

L.control.layers({
    StreetsMap: roadMutant,
    SateliteMap: hybridMutant
}, {}, {
    collapsed: false
}).addTo(map);


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

$("#save").click(()=> {

    var category = [];
    if ($("#privateCheck").is(':checked')){
        category.push("Private")
    }
    if ($("#employeesCheck").is(':checked')){
        category.push("For employees")
    }
    if ($("#visitorsCheck").is(':checked')){
        category.push("For Visitors")
    }
    if ($("#studentsCheck").is(':checked')){
        category.push("For Students")
    }

    let parking = {
        areaServed : $("#zonelist").val(),
        name: $("#name").val(),
        description: $('#description').val(),
        location: coordinatesConverted,
        category 
    };
    console.log(parking)
    fetch(`${smartService}/api/parking`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Methods':'POST, OPTIONS'
        },
        body : JSON.stringify(parking)
    })
    .then((respuesta) => {
        if(respuesta.status != 201){
            alert("An error has ocurred to save the subzone entity");
            clearInputsZone();
        }
        else{
            console.log(respuesta);
            alert("Parking save successfully");
            clear();
        }
    })
    return;
});

$("#cancel").click(()=> {
    $("#name").val("");  
    $('select[name=zonelist]').val("no");
    $("#privateCheck").prop('checked', false);
    $("#employeesCheck").prop('checked', false);
    $("#visitorsCheck").prop('checked', false);
    $("#studentsCheck").prop('checked', false);
    $('#description').val("");
    map.setView(new L.LatLng(0,0), 2);
});

// FUNCTION TO SAVE THE ZONE INFORMATION
function saveZone(){
    
}

//GET ALL ZONES REGISTERED
$.get(`${smartService}/api/zone?status=1`, function(data){
    if(data.length===0){
        console.log("No se encontraron campus ");
    }
    else{
        campus = data;
        campus.forEach(element => {
            $('#zonelist').append($('<option>', {
                value: element['idZone'],
                text: element['name']
            })); 
            allZones[element['idZone']] = element;
        });
    }
});

//SELECTOR CHANGE VALUE: NAME=SELECTOR ZONE
$('#zonelist').change(function() {
    let idZone = $(this).val()
    //GET ALL INFORMATION OF A SPECIFIC CAMPUS
    zoneSelected = allZones[idZone]
    zoneLocation = zoneSelected['location'];
    map.setView(new L.LatLng(zoneSelected['centerPoint'][0], zoneSelected['centerPoint'][1]), 18);
    polyline = L.polyline( zoneLocation, {color: '#ff6666'}).addTo(map);
});