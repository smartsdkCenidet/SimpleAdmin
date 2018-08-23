var allParkings = [];
var allZones = [];

load();
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
async function loadParkings (){
    await $.get(`${smartService}/api/parking?status=1`, function(data){
        if(data.length===0){
            console.log("No se encontraron campus ");
        }
        else{
            campus = data;
            campus.forEach(element => {
                var zone = "";
                if (allZones[element.areaServed] === undefined){
                    return;
                }else{
                    zone = allZones[element.areaServed].name; 
                }
                $('#list').append(
                    '<tr>'+
                    '<td>' + element.idOffStreetParking.replace('OffStreetParking_','') + 
                    '</td><td>' + zone + 
                    '</td><td>' + element.name + 
                    '</td><td>' + element.description + '</td>'+
                    '<td>'+
                    `<a ref="#" id='delete${element.idOffStreetParking}'><i class="fas fa-trash"  ></i></a></td>`+
                    '</tr>');
                allParkings[element['idOffStreetParking']] = element;

                $(`#delete${element.idOffStreetParking}`).click(()=> {
                    if (confirm("Are you sure to delete this item? ")){
                        deleteParking(element.idOffStreetParking);
                    }
                    
                });
            });

        }
    });
}

async function load() {
    await loadZones();
    await loadParkings();
}

function deleteParking (id) {
    console.log(`${smartService}/api/parking/${id}`)
    fetch(`${smartService}/api/parking/${id}`, {
        method: 'DELETE',
        headers: {
            'Access-Control-Allow-Methods':'POST, OPTIONS'
        }
    })
    .then((respuesta) => {
        if(!(respuesta.status >= 200 && respuesta.status <= 208)){
            alert("An error has ocurred to delete parking");
        }
        else{
            alert("Parking deleted successfully"); 
            location.reload(true);
        }
    })
}
