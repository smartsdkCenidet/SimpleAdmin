var allRoads = {};

load();

async function loadRoads () {
    await $.get(`${smartService}/api/road?status=1`, function(data){
        if(data.length===0){
            console.log("No se encontraron campus ");
        }
        else{
            roads = data;
            roads.forEach(element => {
                allRoads[element['idRoad']] = element;
            });

        }
    });
}

async function loadRoadSegments() {
    await $.get(`${smartService}/api/roadSegment?status=1`, function(data){
        console.log(allRoads)
        if(data.length===0){
            console.log("No se encontraron roadSegments ");
        }
        else{
            roads = data;
            roads.forEach(element => {
                var refRoad = element.refRoad;
                console.log(allRoads[element.refRoad] === undefined)
                if (allRoads[element.refRoad] === undefined)
                    return;
                else 
                    refRoad = allRoads[element.refRoad].name;

                $('#list').append(
                    '<tr>'+
                    '<td>' + element.idRoadSegment.replace('RoadSegment_','') + 
                    '</td><td>' + refRoad+ 
                    '</td><td>' + element.name + 
                    '</td><td>' + element.laneUsage.join(",")+ '</td>'+
                    '</td><td>' + "Max :"+ element.maximumAllowedSpeed + ",Min :"+ element.minimumAllowedSpeed + '</td>'+
                    '</td><td>' + element.width+ '</td>'+                
                    '<td>'+
                    `<a ref="#" id='delete${element.idRoadSegment}'><i class="fas fa-trash"  ></i></a></td>`+
                    '</tr>');
                allRoads[element['idRoadSegment']] = element;

                $(`#delete${element.idRoadSegment}`).click(()=> {
                    if (confirm("Are you sure to delete this item?")){
                        deleteRoadSegment(element.idRoadSegment);
                    }
                    
                });
            });

        }
    });
}

async function load () {
    await loadRoads();
    await loadRoadSegments();
}

function deleteRoadSegment (id) {
    console.log(`ejecutando ..`)
    fetch(`${smartService}/api/roadSegment/${id}`, {
        method: 'DELETE',
        headers: {
            'Access-Control-Allow-Methods':'POST, OPTIONS'
        }
    })
    .then((respuesta) => {
        if(!(respuesta.status >= 200 && respuesta.status <= 208)){
            alert("An error has ocurred to delete roadSegment");
        }else{
            alert("RoadSegment deleted successfully"); 
            location.reload(true);
        }
    })
}
