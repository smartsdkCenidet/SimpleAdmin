
$("#form").submit(function(event){
    queryAlerts();
    event.preventDefault();
});
searchZones();
var firstTimeZones = false;
var firstTimeSubzones = false;
var marker;
var markerLayer = L.layerGroup()

L.MakiMarkers.accessToken = 'pk.eyJ1IjoiaGFpZGVlIiwiYSI6ImNqOXMwenczMTBscTIzMnFxNHVyNHhrcjMifQ.ILzRx4OtBRK7az_4uWQXyA';

var options = {
    fullscreenControl: true,
    center: [0, -0],
    zoom: 2,
    layers: [markerLayer]
}


var map = L.map("mapid",options);

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

//CENTER MARKER
function markerOnClick(e){
    map.panTo(this.getLatLng());
}

$('#alerts-visualization').change(function() {
    map.setView(new L.LatLng(0, 0), 2); 
    markerLayer.clearLayers();
    map.removeLayer(markerLayer)
})
function centerMap(value, category){
    fetch("https://smartsecurity-webservice.herokuapp.com/api/"+category+"/"+value, {
        method: 'GET',
        headers: {
            'Access-Control-Allow-Methods':'GET'
        },
    })
    .then((res) => res.json())
    .then((data)=> {
        console.dir(data)   
        map.setView(new L.LatLng(data['centerPoint'][0], data['centerPoint'][1]), 19);
        polyline = L.polyline(data['location'], {color: '#ff6666'}).addTo(map);
    })
}
function showZones(zones){
    if(!firstTimeZones){
        for(let i=0; i<zones.length;i++){
            $('#option-search-1').append($('<option>', {
                value: zones[i]['idZone'],
                text: zones[i]['name']
            })); 
        }
        firstTimeZones = true;
    }
}
function searchZones(){
    fetch("https://smartsecurity-webservice.herokuapp.com/api/zone", {
        method: 'GET',
        headers: {
            'Access-Control-Allow-Methods':'GET, OPTIONS'
        },
    })
    .then((res) => res.json())
    .then((data)=> {
        console.dir(data)   
        zones = data; 
        showZones(zones);
    })
}

function queryAlerts(){
    let zoneSelected = $('#option-search-1').val();
    centerMap(zoneSelected, "zone");
    if($('#alerts-visualization').val()==="history"){
        getAlerts("history", "zone", zoneSelected)
    }
    else if($('#alerts-visualization').val()==="current"){
        getAlerts("current", "zone", zoneSelected)
    }
}
function getAlerts(alertsVisualization, category, value){
    markerLayer.clearLayers();
    map.removeLayer(markerLayer)
    fetch("https://smartsecurity-webservice.herokuapp.com/service/alerts/"+category+"/"+alertsVisualization+"/"+value, {
        method: 'GET',
        headers: {
            'Access-Control-Allow-Methods':'GET, OPTIONS'
        },
    })
    .then((res) => res.json())
    .then((data)=> {
        var colorAlert;
        console.log(data);
        if(!$.isEmptyObject(data)){
            data.forEach((element, index)=>{
                let tempLocation = JSON.parse("["+element['location']+"]")
                console.log(tempLocation);
                if(element['severity']==="informational"){
                    colorAlert = '#A69E9A'
                }
                else if(element['severity']==="low"){
                    colorAlert = '#4A9EDD'
                }
                else if(element['severity']==="medium"){
                    colorAlert = '#fa0'
                }
                else if(element['severity']==="high"){
                    colorAlert = '#FA6819'
                }
                else if(element['severity']==="critical"){
                    colorAlert = '#D50615'
                }
                marker = L.marker(JSON.parse("["+element['location']+"]"), {
                    icon: L.MakiMarkers.icon({
                        icon: "car",
                        color: colorAlert,
                        size: "l"
                    })
                })
                .on('click', markerOnClick)
                .bindPopup('Category: '+element['category']+'<br/> Subcategory: '+element['subCategory']+'<br/> Severity: '+element['severity']).openPopup()
                .addTo(markerLayer);
            })
        }
        markerLayer.addTo(map);
    })
}
