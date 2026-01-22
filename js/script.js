const obs = new OBSWebSocket();
let boundsTypeName = [ "OBS_BOUNDS_NONE", "OBS_BOUNDS_STRETCH", "OBS_BOUNDS_SCALE_INNER", "OBS_BOUNDS_SCALE_OUTER", "OBS_BOUNDS_SCALE_TO_WIDTH", "OBS_BOUNDS_SCALE_TO_HEIGHT", "OBS_BOUNDS_MAX_ONLY" ];

$(function() {

    $('input[name="obs_c_get"]').on('click', e => {
        const address = $('input[name="obs_c_password"]').val();
        const password = $('input[name="obs_c_password"]').val();

        obs.connect({
            address: address
          , password: password
        });

    });

    obs.on('ConnectionOpened', () => {
        let tempScene = $('select[name="obs_c_scene"]').val();
        obs.send('GetSceneList').then(data => {
            console.log(data);
            $('#obs_c_response').val( JSON.stringify(data, null, 2) );

            $('select[name="obs_c_scene"] > option').remove();
            $.each(data.scenes, (index, value) => {
                $('select[name="obs_c_scene"]').append($('<option>').html(value.name).val(value.name));
            });

            $('select[name="obs_c_scene"]').val( tempScene ? tempScene: data.currentScene );

            $("#obs_c_table tbody").html( "" );
	    
	        $('.simple').show();
	    
    	    $('input[name="obs_c_full"]').prop('checked', false);

            obs.send('GetCurrentScene').then(data => {
                console.log(data);
                getData( data.sources, true );
            });

        });            
/*
        obs.send('GetCurrentScene').then(data => {
            $('select[name="obs_c_scene"]').val( data.name );
        

        

        });
*/
    });

    $('input[name="obs_c_send"]').on('click', e => {
        sendData();
    });
    
    $('input[name="obs_c_set"]').on('click', e => {
        let json_data;
	    let col;
	    json_data = tsvJSON( $('textarea[name="obs_c_set_text"]').val() );
        $('textarea[name="obs_c_set_text"]').val('');
	
	    for (var item in json_data) {
            for (var key in json_data[item]) {
                if (key !== 'name') {
		            $('[name="obs_c_' + key + '"]', $('tr[name="' + json_data[item].name + '"]')).val( json_data[item][key] );
		        }
                col = $('tr[name="' + json_data[item].name + '"]').css('background-color');
                $('tr[name="' + json_data[item].name + '"]').animate({ 'backgroundColor': '#1d739a' }, 100, "swing" ); 
                $('tr[name="' + json_data[item].name + '"]').animate({ 'backgroundColor': col }, 200, "swing" ); 
            }	    
        }
	
    });
    
    
    $('input[name="obs_c_full"]').on('change', () => {
        ($('input[name="obs_c_full"]:checked').val() == 'on') ? $('.simple').hide() : $('.simple').show();
    });

    $('input[name="obs_c_radio"]').on('change', () => {
        let arr;
        let type;
        let reverse = true;

        switch ( $('input[name="obs_c_radio"]:checked').val() ){
            case 'all':
                arr = [];
                reverse = false;
                break;
            case 'text':
                arr = ['text_gdiplus', 'text_gdiplus_v2', 'text_gdiplus_v3', 'text_ft2_source_v2'];
                break;
            case 'browser':
                arr = ['browser_source'];
                break;
            case 'other':
                arr = ['text_gdiplus', 'text_gdiplus_v2', 'text_gdiplus_v3', 'text_ft2_source_v2', 'browser_source'];
                reverse = false;
                break;
        }

        $("#obs_c_table tbody tr").each( (i, elm) => {
            type = $('[name="obs_c_type"]', elm).val();
            if( arr.indexOf( type ) >= 0 ) {
                ( reverse ) ? $('td', elm).parent().show('slow') : $('td', elm).parent().hide('slow');
            } else {
                ( reverse ) ? $('td', elm).parent().hide('slow') : $('td', elm).parent().show('slow');
            }
        });
    });

    $(document).on('change', 'input[name="obs_c_volume"]', () => {
        sendVolume();
    });

    $(document).on('change', 'input[name="obs_c_mute"]', () => {
        sendMute();
    });

    $(document).on('change', 'input[name="obs_c_bou_T"]', () => {
        checkBoundsType();
    });

    $(document).on('change', 'input[name="obs_c_bou_A"]', () => {
        checkBoundsAlign();
    });

    $(document).on('change', 'input[name="obs_c_pos_A"]', () => {
        checkPositionAlign();
    });

    $(document).on('change', 'input[name^="obs_c_crop"]', () => {
        checkMinus( 'input[name="obs_c_crop_L"]' );
        checkMinus( 'input[name="obs_c_crop_R"]' );
        checkMinus( 'input[name="obs_c_crop_T"]' );
        checkMinus( 'input[name="obs_c_crop_B"]' );
        
        $("#obs_c_table tbody tr").each( (i, elm) => {
            let param = { "scene-name": "", "item": "", "bounds": {"alignment": 0, "x": 0, "y": 0}, "crop": {"bottom": 0, "left": 0, "right": 0, "top": 0}, "position": { "alignment": 0, "x": 0, "y": 0}, "scale": { "x": 0, "y": 0} };
            param.item =               $('[name="obs_c_name"]',   elm).val();
            param.sourceWidth      =   +$('[name="obs_c_sou_W"]',   elm).val();
            param.sourceHeight     =   +$('[name="obs_c_sou_H"]',   elm).val();
            param.crop.left =          +$('[name="obs_c_crop_L"]', elm).val();
            param.crop.right =         +$('[name="obs_c_crop_R"]', elm).val();
            param.crop.top =           +$('[name="obs_c_crop_T"]', elm).val();
            param.crop.bottom =        +$('[name="obs_c_crop_B"]', elm).val(); 
            $('[name="obs_c_aspect"]', elm).val( aspectCheck( param.sourceWidth - param.crop.left - param.crop.right , param.sourceHeight - param.crop.top - param.crop.bottom ) );
        });

    });

    $(document).on('change', 'input[name^="obs_c_bou"]', () => {
        checkMinus( 'input[name="obs_c_bou_A"]' );
        checkMinus( 'input[name="obs_c_bou_T"]' );
        checkMinus( 'input[name="obs_c_bou_X"]' );
        checkMinus( 'input[name="obs_c_bou_Y"]' );
    });

});


/*
GetCurrentScene.sources.type                <input type="text"     name="obs_c_type"    class="obs_c_td10" placeholder="textgdiplus" readonly="true">
GetCurrentScene.sources.id                  <input type="number"   name="obs_c_id"      class="obs_c_td03" placeholder="id" readonly="true">
GetCurrentScene.sources.name                <input type="text"     name="obs_c_name"    class="obs_c_td10" placeholder="name" readonly="true">
GetSceneItemProperties.sourceWidth          <input type="number"   name="obs_c_sou_W"   class="obs_c_td05" placeholder="sou_W" readonly="true">
GetSceneItemProperties.sourceHeight         <input type="number"   name="obs_c_sou_H"   class="obs_c_td05" placeholder="sou_H" readonly="true">
GetSceneItemProperties.bounds.type          <input type="number"   name="obs_c_bou_T"   class="obs_c_td03" placeholder="bou_T">
GetSceneItemProperties.bounds.alignment     <input type="number"   name="obs_c_bou_A"   class="obs_c_td03" placeholder="bou_A">
GetSceneItemProperties.bounds.x             <input type="number"   name="obs_c_bou_X"   class="obs_c_td05" placeholder="bou_X">
GetSceneItemProperties.bounds.y             <input type="number"   name="obs_c_bou_Y"   class="obs_c_td05" placeholder="bou_Y">
GetSceneItemProperties.crop.left            <input type="number"   name="obs_c_crop_L"  class="obs_c_td05" placeholder="crop_L">
GetSceneItemProperties.crop.right           <input type="number"   name="obs_c_crop_R"  class="obs_c_td05" placeholder="crop_R">
GetSceneItemProperties.crop.top             <input type="number"   name="obs_c_crop_T"  class="obs_c_td05" placeholder="crop_T">
GetSceneItemProperties.crop.bottom          <input type="number"   name="obs_c_crop_B"  class="obs_c_td05" placeholder="crop_B">
**                                          <input type="text"     name="obs_c_aspect"  class="obs_c_td05" placeholder="aspect">
GetSceneItemProperties.position.alignment   <input type="number"   name="obs_c_pos_A"   class="obs_c_td03" placeholder="pos_A">
GetSceneItemProperties.position.x           <input type="number"   name="obs_c_pos_X"   class="obs_c_td05" placeholder="pos_X">
GetSceneItemProperties.position.y           <input type="number"   name="obs_c_pos_Y"   class="obs_c_td05" placeholder="pos_Y">
GetSceneItemProperties.width                <input type="number"   name="obs_c_view_W"  class="obs_c_td05" placeholder="view_W">
GetSceneItemProperties.height               <input type="number"   name="obs_c_view_H"  class="obs_c_td05" placeholder="view_H">
GetSourceSettings.text                      <textarea              name="obs_c_text"    class="obs_c_td30" placeholder="text"></textarea>
GetSourceSettings.url                       <textarea              name="obs_c_url"     class="obs_c_td20" placeholder="url"></textarea>
GetVolume.volume                            <input type="number"   name="obs_c_volume"  class="obs_c_td05 realtime" placeholder="volume">
GetVolume.mute                              <input type="checkbox" name="obs_c_mute"    class="obs_c_td05 realtime" placeholder="mute">
GetCurrentScene.sources.name                <input type="text"     name="obs_c_name2"   class="obs_c_td10" placeholder="name" readonly="true">
*/

function getData( sources, checkFirst ) {
    return new Promise(resolve => {
        if ( checkFirst ) {
            $('#obs_c_wrapper').hide('fast', () => {
                $('.cssload-thecube').show('fast', () => {
                    const promiseArray = [];
                    
                    for(const source of sources) {
                        const promise = getRequest(source);
                        promiseArray.push(promise);
                    }
            
                    Promise.all(promiseArray)
                        .then(() => {
                        sortTable().then(() => {
                        $("input[name='obs_c_radio'][value='" + $("input[name='obs_c_radio']:checked").val() + "']").prop('checked',true).trigger('change');
                        $('#obs_c_wrapper').show();
                        $('.cssload-thecube').hide();
    		            });
                    });
                });
            });
        } else {
            const promiseArray = [];
            
            for(const source of sources) {
                const promise = getRequest(source);
                promiseArray.push(promise);
            }
            
            Promise.all(promiseArray)
                .then(() => {
                sortTable()
		            .then(() => {
                    $("input[name='obs_c_radio'][value='" + $("input[name='obs_c_radio']:checked").val() + "']").prop('checked',true).trigger('change');
                    $('#obs_c_wrapper').show();
                    $('.cssload-thecube').hide();
    	            });
                });
        }
    });
}

function getRequest( source ) {
    let scene_name = $('select[name="obs_c_scene"]:selected').val();
    
    if ( source.type === 'group') {
        getData( source.groupChildren , false );
        $('#obs_c_response').val( JSON.stringify(source.groupChildren, null, 2) );
    }
    
    let elm = sourceCheck(source.id);
    
    if ( !elm ) {
        elm = $('<tr />');
	    elm.attr('name', source.name);
        elm.append('<td><input type="text"     name="obs_c_type"   class="obs_c_td10" placeholder="textgdiplus" readonly="true"></td> ');
        elm.append('<td><input type="number"   name="obs_c_id"     class="obs_c_td03" placeholder="id" readonly="true"></td>          ');
        elm.append('<td><input type="text"     name="obs_c_name"   class="obs_c_td10" placeholder="name" readonly="true"></td>        ');
        elm.append('<td class="simple"><input type="number"   name="obs_c_sou_W"   class="obs_c_td05" placeholder="sou_W" readonly="true"></td>       ');
        elm.append('<td class="simple"><input type="number"   name="obs_c_sou_H"   class="obs_c_td05" placeholder="sou_H" readonly="true"></td>       ');
        elm.append('<td class="simple"><input type="number"   name="obs_c_bou_T"   class="obs_c_td03" placeholder="bou_T"></td>                       ');
        elm.append('<td class="simple"><input type="number"   name="obs_c_bou_A"   class="obs_c_td03" placeholder="bou_A"></td>                       ');
        elm.append('<td class="simple"><input type="number"   name="obs_c_bou_X"   class="obs_c_td05" placeholder="bou_X"></td>                       ');
        elm.append('<td class="simple"><input type="number"   name="obs_c_bou_Y"   class="obs_c_td05" placeholder="bou_Y"></td>                       ');
        elm.append('<td><input type="number"   name="obs_c_crop_L" class="obs_c_td05" placeholder="crop_L"></td>                      ');
        elm.append('<td><input type="number"   name="obs_c_crop_R" class="obs_c_td05" placeholder="crop_R"></td>                      ');
        elm.append('<td><input type="number"   name="obs_c_crop_T" class="obs_c_td05" placeholder="crop_T"></td>                      ');
        elm.append('<td><input type="number"   name="obs_c_crop_B" class="obs_c_td05" placeholder="crop_B"></td>                      ');
        elm.append('<td><input type="text"     name="obs_c_aspect" class="obs_c_td05" placeholder="aspect" readonly="true"></td>      ');
        elm.append('<td class="simple"><input type="number"   name="obs_c_pos_A"   class="obs_c_td03" placeholder="pos_A"></td>                       ');
        elm.append('<td class="simple"><input type="number"   name="obs_c_pos_X"   class="obs_c_td05" placeholder="pos_X"></td>                       ');
        elm.append('<td class="simple"><input type="number"   name="obs_c_pos_Y"   class="obs_c_td05" placeholder="pos_Y"></td>                       ');
        elm.append('<td class="simple"><input type="number"   name="obs_c_view_W"  class="obs_c_td05" placeholder="view_W"></td>                      ');
        elm.append('<td class="simple"><input type="number"   name="obs_c_view_H"  class="obs_c_td05" placeholder="view_H"></td                       ');
        elm.append('<td><textarea              name="obs_c_text"   class="obs_c_td30" placeholder="text"></textarea></td>             ');
        elm.append('<td><textarea              name="obs_c_url"    class="obs_c_td20" placeholder="url"></textarea></td>              ');
        elm.append('<td><input type="number"   name="obs_c_volume" class="obs_c_td05 realtime" placeholder="volume"></td>             ');
        elm.append('<td><input type="checkbox" name="obs_c_mute"   class="obs_c_td05 realtime" placeholder="mute"></td>               ');
        elm.append('<td><input type="text"     name="obs_c_name2"  class="obs_c_td10" placeholder="name" readonly="true"></td>        ');
        $("#obs_c_table tbody").append( elm );
    }

    let arr;
    
    $('[name="obs_c_type"]', elm).val( source.type );
    $('[name="obs_c_name"]', elm).val( source.name );
    $('[name="obs_c_name2"]', elm).val( source.name );
    $('[name="obs_c_id"]', elm).val( source.id );

    obs.send('GetSceneItemProperties', {'scene-name' : scene_name , 'item' : { 'name' : source.name, 'id' : source.id } }).then(data => {
        $('[name="obs_c_sou_W"]',   elm).val( round( data.sourceWidth, 1) );
        $('[name="obs_c_sou_H"]',   elm).val( round( data.sourceHeight, 1) );
        $('[name="obs_c_bou_T"]',   elm).val( boundsTypeName.indexOf( data.bounds.type ) );
        $('[name="obs_c_bou_A"]',   elm).val( data.bounds.alignment );
        $('[name="obs_c_bou_X"]',   elm).val( round( data.bounds.x, 1) );
        $('[name="obs_c_bou_Y"]',   elm).val( round( data.bounds.y, 1) );
        $('[name="obs_c_crop_L"]', elm).val( round( data.crop.left, 1) );
        $('[name="obs_c_crop_R"]', elm).val( round( data.crop.right, 1) );
        $('[name="obs_c_crop_T"]', elm).val( round( data.crop.top, 1) );
        $('[name="obs_c_crop_B"]', elm).val( round( data.crop.bottom, 1) );
        $('[name="obs_c_aspect"]', elm).val( aspectCheck( data.sourceWidth - data.crop.left - data.crop.right , data.sourceHeight - data.crop.top - data.crop.bottom ) );
        $('[name="obs_c_pos_A"]',   elm).val( data.position.alignment );
        $('[name="obs_c_pos_X"]',   elm).val( round( data.position.x, 1) );
        $('[name="obs_c_pos_Y"]',   elm).val( round( data.position.y, 1) );
        $('[name="obs_c_view_W"]',  elm).val( round( data.width, 1) );
        $('[name="obs_c_view_H"]',  elm).val( round( data.height, 1) );

        arr = ['text_gdiplus', 'text_gdiplus_v2', 'text_gdiplus_v3', 'text_ft2_source', 'text_ft2_source_v2'];
        if(arr.indexOf(source.type) >= 0) {
            obs.send('GetSourceSettings', { 'sourceName' : source.name } ).then(data => {
                $('[name="obs_c_text"]', elm).val( data.sourceSettings.text );
            })
        } else {
            $('[name="obs_c_text"]', elm).prop('disabled', true );
        }
        arr = ['browser_source'];
        if(arr.indexOf(source.type) >= 0) {
            obs.send('GetSourceSettings', { 'sourceName' : source.name } ).then(data => {
                $('[name="obs_c_url"]', elm).val( data.sourceSettings.url );
            })
        } else {
            $('[name="obs_c_url"]', elm).prop('disabled', true );
        }
        arr = ['browser_source', 'wasapi_input_capture', 'dshow_input', 'ffmpeg_source'];
        if(arr.indexOf(source.type) >= 0) {
            obs.send('GetVolume', { 'source' : source.name } ).then(data => {
                $('[name="obs_c_volume"]', elm).val( round( data.volume*100, 0) );
                $('[name="obs_c_mute"]', elm).prop('checked', data.muted );
            })
        } else {
            $('[name="obs_c_volume"]', elm).prop('disabled', true );
            $('[name="obs_c_mute"]', elm).prop('disabled', true );
            $('[name="obs_c_mute_rotation"]', elm).prop('disabled', true );
        }
        if ( $('[name="obs_c_bou_T"]', elm).val() * 1 === 0 ) {
            $('[name="obs_c_bou_A"]', elm).prop('disabled', true);
            $('[name="obs_c_bou_X"]', elm).prop('disabled', true);
            $('[name="obs_c_bou_Y"]', elm).prop('disabled', true);
            $('[name="obs_c_view_W"]', elm).prop('disabled', false);
            $('[name="obs_c_view_H"]', elm).prop('disabled', false);
        } else {
            $('[name="obs_c_bou_A"]', elm).prop('disabled', false);
            $('[name="obs_c_bou_X"]', elm).prop('disabled', false);
            $('[name="obs_c_bou_Y"]', elm).prop('disabled', false);
            $('[name="obs_c_view_W"]', elm).prop('disabled', true);
            $('[name="obs_c_view_H"]', elm).prop('disabled', true);
        }
 
    })    
}

/*
SetCurrentScene.sources.type                <input type="text"     name="obs_c_type"    class="obs_c_td10" placeholder="textgdiplus" readonly="true">
SetCurrentScene.sources.name                <input type="text"     name="obs_c_name"    class="obs_c_td10" placeholder="name" readonly="true">
SetSceneItemProperties.sourceWidth          <input type="number"   name="obs_c_sou_W"    class="obs_c_td05" placeholder="sou.W" readonly="true">
SetSceneItemProperties.sourceHeight         <input type="number"   name="obs_c_sou_H"    class="obs_c_td05" placeholder="sou.H" readonly="true">
SetSceneItemProperties.bounds.type          <input type="number"   name="obs_c_bou_T"    class="obs_c_td03" placeholder="bou.T">
SetSceneItemProperties.bounds.alignment     <input type="number"   name="obs_c_bou_A"    class="obs_c_td03" placeholder="bou.A">
SetSceneItemProperties.bounds.x             <input type="number"   name="obs_c_bou_X"    class="obs_c_td05" placeholder="bou.X">
SetSceneItemProperties.bounds.y             <input type="number"   name="obs_c_bou_Y"    class="obs_c_td05" placeholder="bou.Y">
SetSceneItemProperties.crop.left            <input type="number"   name="obs_c_crop_L"  class="obs_c_td05" placeholder="crop.L">
SetSceneItemProperties.crop.right           <input type="number"   name="obs_c_crop_R"  class="obs_c_td05" placeholder="crop.R">
SetSceneItemProperties.crop.top             <input type="number"   name="obs_c_crop_T"  class="obs_c_td05" placeholder="crop.T">
SetSceneItemProperties.crop.bottom          <input type="number"   name="obs_c_crop_B"  class="obs_c_td05" placeholder="crop.B">
*                                           <input type="text"     name="obs_c_aspect"  class="obs_c_td05" placeholder="aspect" readonly="true">
SetSceneItemProperties.position.alignment   <input type="number"   name="obs_c_pos_A"    class="obs_c_td03" placeholder="pos.A">
SetSceneItemProperties.position.x           <input type="number"   name="obs_c_pos_X"    class="obs_c_td05" placeholder="pos.X">
SetSceneItemProperties.position.y           <input type="number"   name="obs_c_pos_Y"    class="obs_c_td05" placeholder="pos.Y">
SetSceneItemProperties.width *read-only     <input type="number"   name="obs_c_view_W"   class="obs_c_td05" placeholder="view.W">
SetSceneItemProperties.height *read-only    <input type="number"   name="obs_c_view_H"   class="obs_c_td05" placeholder="view.H">
SetSceneItemProperties.scale.x              GetSceneItemProperties.width / GetSceneItemProperties.sourceWidth
SetSceneItemProperties.scale.y              GetSceneItemProperties.height / GetSceneItemProperties.sourceHeight
SetSourceSettings.text                      <textarea              name="obs_c_text"    class="obs_c_td30" placeholder="text"></textarea>
SetSourceSettings.url                       <textarea              name="obs_c_url"     class="obs_c_td20" placeholder="url"></textarea>
SetVolume.volume                            <input type="number"   name="obs_c_volume"  class="obs_c_td05 realtime" placeholder="volume">
SetMute.mute                                <input type="checkbox" name="obs_c_mute"    class="obs_c_td05 realtime" placeholder="mute">
SetCurrentScene.sources.name                <input type="text"     name="obs_c_name2"   class="obs_c_td10" placeholder="name" readonly="true">
*/

function sendData() {
    return new Promise(resolve => {
        $('#obs_c_wrapper').hide('fast', () => {
            $('.cssload-thecube').show('fast', () => {
            const promiseArray = [];
            
            $("#obs_c_table tbody tr").each( (i, elm) => {
                const promise = sendRequest( i, elm );
                promiseArray.push(promise);
            });
        
            Promise.all(promiseArray)
                .then(() => {
                obs.send('GetCurrentScene')
		    .then(data => {
                    getData( data.sources , false)
		    })
		    .then(() => {
                        sortTable()
			.then(() => {
                        $('#obs_c_wrapper').hide();
                        $('.cssload-thecube').show();
            	        });
                    });
                });
            });
        });
    });
}

function sendRequest( i, elm ) {
    let scene_name = $('select[name="obs_c_scene"]:selected').val();
    let param = {};
    let arr;

    param = { "scene-name": scene_name, "item": {"name" : "", "id" : 0 }, "bounds": {"alignment": 0, "x": 0, "y": 0}, "crop": {"bottom": 0, "left": 0, "right": 0, "top": 0}, "position": { "alignment": 0, "x": 0, "y": 0}, "scale": { "x": 0, "y": 0} };
    param.item.name =           $('[name="obs_c_name"]',   elm).val();
    param.item.id =            +$('[name="obs_c_id"]',     elm).val();
/*
    param.sourceWidth      =   +$('[name="obs_c_sou_W"]',   elm).val();
    param.sourceHeight     =   +$('[name="obs_c_sou_H"]',   elm).val();
*/
    param.bounds.type =        boundsTypeName[ +$('[name="obs_c_bou_T"]', elm).val() ];
    param.bounds.alignment =   +$('[name="obs_c_bou_A"]',   elm).val();
    param.bounds.x =           +$('[name="obs_c_bou_X"]',   elm).val();
    param.bounds.y =           +$('[name="obs_c_bou_Y"]',   elm).val();
    param.crop.left =          +$('[name="obs_c_crop_L"]', elm).val();
    param.crop.right =         +$('[name="obs_c_crop_R"]', elm).val();
    param.crop.top =           +$('[name="obs_c_crop_T"]', elm).val();
    param.crop.bottom =        +$('[name="obs_c_crop_B"]', elm).val(); 
    param.position.alignment = +$('[name="obs_c_pos_A"]',   elm).val();
    param.position.x =         +$('[name="obs_c_pos_X"]',   elm).val();
    param.position.y =         +$('[name="obs_c_pos_Y"]',   elm).val();
/*
    param.width =              +$('[name="obs_c_view_W"]',  elm).val();
    param.height=              +$('[name="obs_c_view_H"]',  elm).val();
*/
    param.scale.x =            $('[name="obs_c_view_W"]',  elm).val() / $('[name="obs_c_sou_W"]',   elm).val();
    param.scale.y =            $('[name="obs_c_view_H"]',  elm).val() / $('[name="obs_c_sou_H"]',   elm).val();

    console.log( param );
    
    obs.send('SetSceneItemProperties', param );

    arr = ['text_gdiplus', 'text_gdiplus_v2', 'text_gdiplus_v3', 'text_ft2_source', 'text_ft2_source_v2'];
    if(arr.indexOf( $('[name="obs_c_type"]', elm).val() ) >= 0) {
        param = { "sourceName" : "", "sourceType" : "", "sourceSettings" : { "text" : "" } }; 
        param.sourceName = $('[name="obs_c_name"]', elm).val();
        param.sourceType = $('[name="obs_c_type"]', elm).val();
        param.sourceSettings.text = $('[name="obs_c_text"]', elm).val();
        obs.send('SetSourceSettings', param );
    }
    arr = ['browser_source'];
    if(arr.indexOf( $('[name="obs_c_type"]', elm).val() ) >= 0) {
        param = { "sourceName" : "", "sourceType" : "", "sourceSettings" : { "url" : "" } }; 
        param.sourceName = $('[name="obs_c_name"]', elm).val();
        param.sourceType = $('[name="obs_c_type"]', elm).val();
        param.sourceSettings.url = $('[name="obs_c_url"]', elm).val();
        obs.send('SetSourceSettings', param );
    }
/*
    if ( $("#obs_c_table tbody tr").length <= i + 1 ) {
    
        obs.send('GetCurrentScene').then(data => {
            $('select[name="obs_c_scene"]').val( data.name );
        
            $('#obs_c_response').val( JSON.stringify(data, null, 2) );
            
            getData( data.sources , false);
        })
    };
*/
}

function sendVolume() {
    $("#obs_c_table tbody tr").each( (i, elm) => {
        if ( $('[name="obs_c_volume"]', elm).val() * 1 < 0) {
             $('[name="obs_c_volume"]', elm).val(0);
    }
        if ( $('[name="obs_c_volume"]', elm).val() * 1 > 100) {
             $('[name="obs_c_volume"]', elm).val(100);
    }
        let param = { "source" : "", "volume" : 0 };
        param.source = $('[name="obs_c_name"]', elm).val();
        param.volume = +$('[name="obs_c_volume"]', elm).val() / 100;
        obs.send( 'SetVolume', param );
    });
}

function sendMute() {
    $("#obs_c_table tbody tr").each( (i, elm) => {
        let param = { "source" : "", "mute" : true };
        param.source = $('[name="obs_c_name"]', elm).val();
        param.mute = $('[name="obs_c_mute"]', elm).prop('checked');
        obs.send( 'SetMute', param );
    });
}

function checkBoundsType() {
    $("#obs_c_table tbody tr").each( (i, elm) => {
        $('[name="obs_c_bou_T"]', elm).val( round( $('[name="obs_c_bou_T"]', elm).val(), 0) );
        if ( $('[name="obs_c_bou_T"]', elm).val() * 1 < 0 ) {
             $('[name="obs_c_bou_T"]', elm).val(0);
        }
        if ( $('[name="obs_c_bou_T"]', elm).val() * 1 > 7 ) {
             $('[name="obs_c_bou_T"]', elm).val(7);
        }
            
        if ( $('[name="obs_c_bou_T"]', elm).val() * 1 == 0 ) {
            $('[name="obs_c_bou_A"]', elm).prop('disabled', true);
            $('[name="obs_c_bou_X"]', elm).prop('disabled', true);
            $('[name="obs_c_bou_Y"]', elm).prop('disabled', true);
            $('[name="obs_c_view_W"]', elm).prop('disabled', false);
            $('[name="obs_c_view_H"]', elm).prop('disabled', false);
        } else {
            $('[name="obs_c_bou_A"]', elm).prop('disabled', false);
            $('[name="obs_c_bou_X"]', elm).prop('disabled', false);
            $('[name="obs_c_bou_Y"]', elm).prop('disabled', false);
            $('[name="obs_c_view_W"]', elm).prop('disabled', true);
            $('[name="obs_c_view_H"]', elm).prop('disabled', true);
        }
    });
}

function checkBoundsAlign() {
    $("#obs_c_table tbody tr").each( (i, elm) => {
        $('[name="obs_c_bou_A"]', elm).val( round( $('[name="obs_c_bou_A"]', elm).val(), 0) );
        if ( $('[name="obs_c_bou_A"]', elm).val() * 1 > 10 ) {
             $('[name="obs_c_bou_A"]', elm).val(10);
        }
        if ( $('[name="obs_c_bou_A"]', elm).val() * 1 == 3 ) {
             $('[name="obs_c_bou_A"]', elm).val(4);
        }
        if ( $('[name="obs_c_bou_A"]', elm).val() * 1 == 7 ) {
             $('[name="obs_c_bou_A"]', elm).val(8);
        }
    });
}

function checkPositionAlign() {
    $("#obs_c_table tbody tr").each( (i, elm) => {
        $('[name="obs_c_pos_A"]', elm).val( round( $('[name="obs_c_pos_A"]', elm).val(), 0) );
        if ( $('[name="obs_c_pos_A"]', elm).val() < 0 ) {
             $('[name="obs_c_pos_A"]', elm).val(0);
        }
        if ( $('[name="obs_c_pos_A"]', elm).val() > 10 ) {
             $('[name="obs_c_pos_A"]', elm).val(10);
        }
        if ( $('[name="obs_c_pos_A"]', elm).val() == 3 ) {
             $('[name="obs_c_pos_A"]', elm).val(4);
        }
        if ( $('[name="obs_c_pos_A"]', elm).val() == 7 ) {
             $('[name="obs_c_pos_A"]', elm).val(8);
        }
    });
}

function checkMinus( selector ) {
    $("#obs_c_table tbody tr").each( (i, elm) => {
        if ( $(selector, elm).val() < 0 ) {
             $(selector, elm).val(0);
        }
    });
}

/*
function muteRotation() {
    let mute_list;
    
    $("#obs_c_table tbody tr").each( (i, elm) => {
        if ( $('[name="obs_c_mute"]', elm).prop('disabled') ) {
            mute_list.push(i);
        }
    });
    mute_list.e
}
*/

function sourceCheck(id) {
    let ret = false;
    $("#obs_c_table tbody tr").each( (i, elm) => {
        if ( $('[name="obs_c_id"]', elm ).val() == id ) {
            ret = elm;
        }
    });
    return ret;
}

function sortTable() {
    return $('#obs_c_table tbody').promise().done(function() {
        $('#obs_c_table tbody').html(     
            $('#obs_c_table tbody tr').sort(function(a, b) {
                if ($(a).find('[name="obs_c_type"]').eq(0).val() > $(b).find('[name="obs_c_type"]').eq(0).val()) {
                    return 1;
                } else if ($(a).find('[name="obs_c_type"]').eq(0).val() < $(b).find('[name="obs_c_type"]').eq(0).val()) {
                    return -1;
                } else {
                    if ($(a).find('[name="obs_c_name"]').eq(0).val() > $(b).find('[name="obs_c_name"]').eq(0).val()) {
                        return 1;
                    } else if ($(a).find('[name="obs_c_name"]').eq(0).val() < $(b).find('[name="obs_c_name"]').eq(0).val()) {
                        return -1;
                    } else {
                        if ($(a).find('[name="obs_c_id"]').eq(0).val() > $(b).find('[name="obs_c_id"]').eq(0).val()) {
                            return 1;
                        } else {
                            return -1;
                        }
            }
                }
                return 0;
            })
        );
    });
}

function aspectCheck(w, h) {
    let g = gcd(w,h);
    let x = w / g;
    let y = h / g;
    return x + ":" + y;
}

function round(number, precision) {
    var shift = function (number, precision, reverseShift) {
        if (reverseShift) {
            precision = -precision;
        }  
        var numArray = ("" + number).split("e");
        return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
    };
    return shift(Math.round(shift(number, precision, false)), precision, true);
}

function gcd(x, y){
    if(y === 0) return x
    return gcd(y, x % y)
}

function tsvJSON(tsv) {
  const lines = tsv.split('\n');
  const headers = lines.shift().split('\t');
  return lines.map(line => {
    const data = line.split('\t');
    return headers.reduce((obj, nextKey, index) => {
      obj[nextKey] = data[index];
      return obj;
    }, {});
  });
}





