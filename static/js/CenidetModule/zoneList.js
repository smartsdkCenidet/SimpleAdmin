var allZones = [];
//GET ALL ZONES REGISTERED
$.get(`${smartService}/api/zone?status=1`, function(data){
    if(data.length===0){
        console.log("No se encontraron campus ");
    }
    else{
        campus = data;
        campus.forEach(element => {
            $('#zoneList').append(
                '<tr>'+
                '<td>' + element.idZone.replace('Zone_','') + 
                '</td><td>' + element.owner + 
                '</td><td>' + element.address + 
                '</td><td>' + element.description + '</td>'+
                '<td>'+
                `<a ref="#" id='delete${element.idZone}'><i class="fas fa-trash"  ></i></a></td>`+
                '</tr>');
            allZones[element['idZone']] = element;

            $(`#delete${element.idZone}`).click(()=> {
                if (confirm("Are you sure to delete this item?")){
                    deleteZone(element.idZone);
                }
                
            });
        });

    }
});


function deleteZone (id) {
    console.log(`${smartService}/api/zone/${id}`)
    fetch(`${smartService}/api/zone/${id}`, {
        method: 'DELETE',
        headers: {
            'Access-Control-Allow-Methods':'POST, OPTIONS'
        }
    })
    .then((respuesta) => {
        if(!(respuesta.status >= 200 && respuesta.status <= 208)){
            alert("An error has ocurred to delete zone entity");
        }
        else{
            alert("Zone deleted successfully");
            location.reload(true);
        }
    })
}
