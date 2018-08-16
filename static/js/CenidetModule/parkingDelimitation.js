 //GLOBAL VARIABLES 
var coordinatesConverted = []; 
var polylineArrayCoordinates = [];
var pointMap = [];
var idZoneSelected;
var editableLayers = new L.FeatureGroup();
var allZones = [];

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
                color: '#3498db'
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
   console.log(type);
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

function save () {

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
        }
        else{
            console.log(respuesta);
            alert("Parking save successfully");
            clear();
        }
    })
    return;
}

$("#cancel").click(clear);

function clear () {
    location.reload(true);
    return;
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
                text: element['owner']
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