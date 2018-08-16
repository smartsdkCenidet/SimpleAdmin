
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
$("#form2").submit(function(event){
    saveRoad();
    $("#roadName").val("");
    $("#description").val("");
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

//GLOBAL VARIABLES 
var coordinatesConverted = []; 
var polylineArrayCoordinates = [];
var pointMap = [];
var idZoneSelected;
var parkingSelected;
var roadSelected;
var zoneSelected;
var editableLayers = new L.FeatureGroup();
var allZones = [];
var allParkings = [];
var allRoads = [];

var inParking = false;

map.addLayer(editableLayers);

//DRAW CONTROLS OF MAP
var drawControl = new L.Control.Draw({
    position: 'topleft',
    draw: {
        marker: false,
        polyline:{   
            shapeOptions: {
                color: '#2ecc71'
            },        
            showArea: true
        },
        polygon: false,
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
    if (type === 'polyline') {
        var polygon = layer.toGeoJSON();
        var polygonCoordinates = polygon['geometry']['coordinates'];
        //CONVERT COORDINATES [LON,LAT] GeoJSON IN [LAT,LON] COORDINATES.
        coordinatesConverted = [];
        for(let i=0; i<polygonCoordinates.length;i++){
           coordinatesConverted.push([polygonCoordinates[i][1], polygonCoordinates[i][0]])
        }
        map.removeControl(drawControl);
        map.addControl(drawControl2);   
        editableLayers.addLayer(layer);
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
            coordinatesConverted.push([polygonCoordinates[i][1], polygonCoordinates[i][0]])
         }
    });
});

map.on('draw:deleted', function (e) {
    map.removeControl(drawControl2);
    map.addControl(drawControl);
});

function save () {
    var lane  = [];
    if ($("#forwardCheck").is(':checked')){
        lane.push("forward");
    }
    if ($("#backwardCheck").is(':checked')){
        lane.push("backward");
    }

    let roadSegment = {
        name: $("#name").val(),
        location: coordinatesConverted,
        refRoad : roadSelected["idRoad"],
        startPoint : coordinatesConverted[0],
        endPoint :  coordinatesConverted[1],
        totalLaneNumber : lane.length ,
        maximumAllowedSpeed : $("#max").val() , 
        minimumAllowedSpeed : $("#min").val(),
        laneUsage : lane,
        width : $("#width").val() 
    };
    console.log(roadSegment)
    fetch(`${smartService}/api/roadSegment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Methods':'POST, OPTIONS'
        },
        body : JSON.stringify(roadSegment)
    })
    .then((respuesta) => {
        if(respuesta.status != 201){
            alert("An error has ocurred to save the roadSegment entity");
            clear();
        }
        else{
            console.log(respuesta);
            alert("RoadSegment save successfully");
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

function getParkings (zone) {
    //GET ALL PARKING REGISTERED
    $.get(`${smartService}/api/parking?status=1&areaServed=${zone}`, function(data){
        $( '#parkinglist' ).empty();
        $('#parkinglist').append($('<option>', {
            value: "",
            text: "Select an option"
        })); 
        if(data.length===0){
            console.log("No se encontraron campus ");
        }
        else{
            campus = data;
            campus.forEach(element => {
                $('#parkinglist').append($('<option>', {
                    value: element['idOffStreetParking'],
                    text: element['name']
                })); 
                allParkings[element['idOffStreetParking']] = element;
            });
        }
    });
}

function getRoads (responsible) {
    //GET ALL PARKING REGISTERED
    $.get(`${smartService}/api/road?status=1&responsible=${responsible}`, function(data){
        $( '#roadList' ).empty();
        $('#roadList').append($('<option>', {
            value: "",
            text: "Select an option"
        })); 
        if(data.length===0){
            console.log("No se encontraron campus ");
        }
        else{
            
            campus = data;
            campus.forEach(element => {
                $('#roadList').append($('<option>', {
                    value: element['idRoad'],
                    text: element['name']
                })); 
                allRoads[element['idRoad']] = element;
            });
        }
    });
}

//SELECTOR CHANGE VALUE: NAME=SELECTOR ZONE
$('#zonelist').change(function() {
    let idZone = $(this).val()
    //GET ALL INFORMATION OF A SPECIFIC CAMPUS
    zoneSelected = allZones[idZone]
    zoneLocation = zoneSelected['location'];
    map.setView(new L.LatLng(zoneSelected['centerPoint'][0], zoneSelected['centerPoint'][1]), 18);
    polyline = L.polyline( zoneLocation, {color: '#ff6666'}).addTo(map);
    getParkings(idZone);
    console.log(inParking)
    if (inParking === false) {
        getRoads(idZone);
    }
});

//SELECTOR CHANGE VALUE: NAME=SELECTOR ZONE
$('#parkinglist').change(function() {
    let idParking = $(this).val()
    if (idParking != "") {
        //GET ALL INFORMATION OF A SPECIFIC CAMPUS
        parkingSelected = allParkings[idParking]
        parkingLocation = parkingSelected['location'];
        polyline = L.polyline( parkingLocation, {color: '#3498db'}).addTo(map);
        getRoads(idParking);
    }
    
});
//SELECTOR CHANGE VALUE: NAME=SELECTOR ZONE
$('#roadList').change(function() {
    let idRoad = $(this).val();
    if (idRoad != "") {
        roadSelected  = allRoads[idRoad];
    }
    
});

$( "#parkingListDiv" ).hide();
$("#parkinglist").prop('required',false);
$('input[type=radio][name=associatedRadio]').change(function() {
    $( '#roadList' ).empty();
    $('#roadList').append($('<option>', {
        value: "",
        text: "Select an option"
    }));  
    if(this.value == 'parking'){
        $( "#parkingListDiv" ).show();
        inParking = true;
        $("#parkinglist").prop('required',true);
        if (zoneSelected !== undefined){
            getParkings(zoneSelected["idZone"])
        }
        
    }else {
        parkingSelected = undefined;
        inParking = false;
        $("#parkinglist").prop('required',false);
        $( "#parkingListDiv" ).hide();
        if (zoneSelected !== undefined){
            getRoads(zoneSelected["idZone"])
        }
    }

});

function saveRoad() {
    var responsible = "";
    if (parkingSelected !== undefined && inParking !== false){
        responsible = parkingSelected["idOffStreetParking"];
    }else if (zoneSelected !== undefined){
        responsible = zoneSelected["idZone"];
    }else {
        return 
    }
    let road = {
        responsible : responsible,
        name: $("#roadName").val(),
        description: $('#description').val()
    };
    fetch(`${smartService}/api/road`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Methods':'POST, OPTIONS'
        },
        body : JSON.stringify(road)
    })
    .then((respuesta) => {
        if(respuesta.status != 201){
            alert("An error has ocurred to save the road entity");
        }
        else{
            console.log(respuesta);
            alert("Road save successfully");
            var responsible = "";
            if (parkingSelected !== undefined && inParking !== false){
                responsible = parkingSelected["idOffStreetParking"]
            }else{
                responsible = zoneSelected["idZone"]
            }
            getRoads(responsible);
            $("#roadModal .close").click()
        }
    })
    return;
}