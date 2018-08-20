

//SELECTOR CHANGE VALUE: NAME=SELECTOR ZONE
$('#zonelist2').change(function() {
    let idZone = $(this).val()
    //GET ALL INFORMATION OF A SPECIFIC CAMPUS
    $.get(`${smartService}/api/zone/${idZone}?status=1`, function(data){
        if(data.length===0){
            console.log("No se encontró información del campus");
        }
        else{
            zoneLocation = data['location'];
            map.setView(new L.LatLng(data['centerPoint'][0], data['centerPoint'][1]), 18);
            polyline = L.polyline( data['location'], {color: '#ff6666'}).addTo(map);
        }
    });
});
function showDeviceOnMap(dataDevice){
    markerLayer.clearLayers();
    map.removeLayer(markerLayer)
    let locationTemp = dataDevice[0]['location'].split(",")
    map.setView(new L.LatLng(Number(locationTemp[0]), Number(locationTemp[1])), 19);
    polyline = L.polyline(zoneLocation).addTo(map);
    fetch(`${smartService}/api/user?id=${dataDevice[0]['owner']}&status=1`, {
        method: 'GET',
        headers: {
            'Access-Control-Allow-Methods':'GET, POST, OPTIONS, PUT, PATCH, DELETE'
        },
    })
    .then((res) => res.json())
    .then((dataUser)=> {
        if(dataUser){
            marker = L.marker(locationTemp, {
                icon: L.MakiMarkers.icon({
                    icon: "pitch",
                    color: "#3498db",
                    size: "l"
                })
            }).addTo(map)
            .bindPopup('ID Device: '+dataDevice[0]['id']+'<br> Owner ID: '+dataDevice[0]['owner']+'<br> Name User: '+dataUser[0]['firstName']+ ' '+dataUser[0]['lastName']+'<br> Phone Number: +'+dataUser[0]['phoneNumber'])
            .openPopup()
            .addTo(markerLayer);
            markerLayer.addTo(map);
        }
    })
    .catch((error)=>{
        console.log(error);
    })
}
function searching2(){
    let phone = $('#phonenumber-countrycode').val()+$('#input-search2').val();
    fetch(`${smartService}/service/devices/zone/${$("#zonelist2").val()}/owner?phoneNumber=${phone}`, {
        method: 'GET',
        headers: {
            'Access-Control-Allow-Methods':'GET, POST, OPTIONS, PUT, PATCH, DELETE'
        },
    })
    .then((res) => res.json())
    .then((data)=> {
        if(data.length === 0){
            alert("This device has not been found in the zone");
        }  
        else{
            showDeviceOnMap(data);
        }
    })
    .catch((error)=>{
        console.log(error);
    })
}




    