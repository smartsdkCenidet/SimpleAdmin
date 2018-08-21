var allParkings = [];
var allZones = [];
var allRoads = [];
//GET ALL ZONES REGISTERED

loadRoads();

async function loadZones () {
    await $.get(`${smartService}/api/zone?status=1`, function(data){
        if(data.length===0){
            console.log("No se encontraron campus ");
        }
        else{
            campus = data;
            campus.forEach(element => {
                allZones[element['idZone']] = element;
            });
    
        }
    });
}

async function loadParkings () {
    await $.get(`${smartService}/api/parking?status=1`, function(data){
        if(data.length===0){
            console.log("No se encontraron pakings ");
        }
        else{
            parking = data;
            parking.forEach(element => {
                allParkings[element['idOffStreetParking']] = element;
            });
        }
    });
}

async function loadRoads () {
    await loadZones();
    await loadParkings();
    await $.get(`${smartService}/api/road?status=1`, function(data){
        if(data.length===0){
            console.log("No se encontraron roads ");
        }
        else{
            roads = data;
            roads.forEach(element => {
            
                var responsible = element.responsible;
                var existResponsible = false;
                if (allZones[element.responsible] != undefined){
                    responsible = allZones[element.responsible].name;
                    existResponsible = true;
                }
                if (allParkings[element.responsible] != undefined){
                    responsible = allParkings[element.responsible].name;
                    existResponsible = true;
                }
                if(existResponsible === false)
                    return;
    
                $('#list').append(
                    '<tr>'+
                    '<td>' + element.idRoad.replace('Road_','') + 
                    '</td><td>' + responsible + 
                    '</td><td>' + element.name + 
                    '</td><td>' + element.description + '</td>'+
                    '<td>'+
                    `<a ref="#" id='delete${element.idRoad}'><i class="fas fa-trash"  ></i></a></td>`+
                    '</tr>');
                allRoads[element['idRoad']] = element;
    
                $(`#delete${element.idRoad}`).click(()=> {
                    if (confirm("Are you sure to delete this item?")){
                        deleteRoad(element.idRoad);
                    }
                    
                });
            });
    
        }
    });
}




function deleteRoad (id) {
    console.log(`${smartService}/api/road/${id}`)
    fetch(`${smartService}/api/road/${id}`, {
        method: 'DELETE',
        headers: {
            'Access-Control-Allow-Methods':'POST, OPTIONS'
        }
    })
    .then((respuesta) => {
        if(!(respuesta.status >= 200 && respuesta.status <= 208)){
            alert("An error has ocurred to delete road");
        }
        else{
            alert("Road deleted successfully"); 
            location.reload(true);
        }
    })
}
