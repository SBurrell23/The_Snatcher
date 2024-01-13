var masterTileset = new Image();
masterTileset.src = 'Assets/Tilesets/MASTER_TILESET.png';

// Load fonts
new FontFace('Metal Mania','url(Assets/Fonts/MetalMania-Regular.ttf)').load().then(function(lf) {document.fonts.add(lf);});
new FontFace('Jolly Lodger','url(Assets/Fonts/JollyLodger-Regular.ttf)').load().then(function(lf) {document.fonts.add(lf);});

function loadAssets(){
    loadMasterTileset(masterTileset);
}

function loadMasterTileset(ts) {
    sprites['ground1'] = getTileSourceRect(ts,0, 10);
    sprites['ground2'] = getTileSourceRect(ts,1, 10);
    sprites['ground3'] = getTileSourceRect(ts,0, 11);
    sprites['ground4'] = getTileSourceRect(ts,1,11);

    sprites['block'] = getTileSourceRect(ts,25, 0);
    sprites['grave1'] = getTileSourceAdjustable(ts,4, 15 ,48,96);
    sprites['grave2'] = getTileSourceAdjustable(ts,5, 15 ,48,96);
    sprites['sidewaysStone1'] = getTileSourceAdjustable(ts,6, 15 ,96,48);
    sprites['sidewaysStone2'] = getTileSourceAdjustable(ts,6, 16 ,96,48);

    sprites['pool1'] = getTileSourceRect(ts,8, 15);
    sprites['pool2'] = getTileSourceRect(ts,9, 15);

    sprites['chest1'] = getTileSourceRect(ts,2, 0);
    sprites['chest2'] = getTileSourceRect(ts,4, 0);
    sprites['key'] = getTileSourceRect(ts,0, 0);

    sprites['pf_flyers'] = getTileSourceRect(ts,0, 1);
    sprites['the_button'] = getTileSourceRect(ts,1, 2);
    sprites['magic_monocle'] = getTileSourceRect(ts,1, 3);

    sprites['bbq_chili'] = getTileSourceRect(ts,3, 1);
    sprites['spare_eyeballs'] = getTileSourceRect(ts,3, 2);
    sprites['kill_the_power'] = getTileSourceRect(ts,2, 3);

    sprites['playerInventory'] = getTileSourceAdjustable(ts,8, 0 ,240,144);
    sprites['snatcherInventory'] = getTileSourceAdjustable(ts,13, 0 ,144,144);

    sprites['exitdoorClosed'] = getTileSourceAdjustable(ts,9, 3 ,96,96);
    sprites['exitdoorOpen'] = getTileSourceAdjustable(ts,12, 3 ,96,96);

    loadPlayerAnimations(ts);
    loadFireBlockAnimation(ts);
    loadGates(ts);
    
    console.log("Assets loaded");
    console.log(sprites);
}

function loadGates(ts){
    sprites['gnw'] = getTileSourceRect(ts,0, 16);
    sprites['gne'] = getTileSourceRect(ts,1, 16);
    sprites['gsw'] = getTileSourceRect(ts,0, 18);
    sprites['gse'] = getTileSourceRect(ts,1, 18);

    sprites['gn'] = getTileSourceRect(ts,1, 17);
    sprites['gs'] = getTileSourceRect(ts,1, 17);
    sprites['gw'] = getTileSourceRect(ts,0, 17);
    sprites['ge'] = getTileSourceRect(ts,0, 17);
}

function loadFireBlockAnimation(ts){
    sprites['fireBlock1'] = getTileSourceRect(ts,9, 11);
    sprites['fireBlock2'] = getTileSourceRect(ts,10, 11);
    sprites['fireBlock3'] = getTileSourceRect(ts,11, 11);
    sprites['fireBlock4'] = getTileSourceRect(ts,12, 11);
}

function loadPlayerAnimations(ts){

    for (var i = 0; i <= 17; i++) {
        for (var j = 5; j <= 8; j++) {
            
            var player;
            if(i < 3) player = 'player1';
            if(i >= 3 && i < 6) player = 'player2';
            if(i >= 6 && i < 9) player = 'player3';
            if(i >= 9 && i < 12) player = 'player4';
            if(i >= 12 && i < 15) player = 'player5';
            if(i >= 15 && i < 18) player = 'player6';
            
            var dir;
            if(j == 5) dir = 's' + ((i%3)+1);
            if(j == 6) dir = 'w' + ((i%3)+1);
            if(j == 7) dir = 'e' + ((i%3)+1);
            if(j == 8) dir = 'n' + ((i%3)+1);

            sprites[player + dir] = getTileSourceRect(ts,i, j);
        }
    }
    //console.log(sprites);
}


function getTileSourceRect(tileset, tileX, tileY) {
    var tileSize = 48;
    return {
        tileset: tileset,
        x: tileX * tileSize,
        y: tileY * tileSize,
        width: tileSize,
        height: tileSize
    };
}

function getTileSourceAdjustable(tileset, tileX, tileY,chonkWidth,chonkHeight) {
    var tileSize = 48;
    return {
        tileset: tileset,
        x: tileX * tileSize,
        y: tileY * tileSize,
        width: chonkWidth,
        height: chonkHeight
    };
}

function drawSprite(ctx, spriteName, x, y) {
    var sprite = sprites[spriteName];
    if (!sprite) 
        throw 'Sprite "' + spriteName + '" does not exist';
    
    ctx.drawImage(
        sprite.tileset,
        sprite.x,
        sprite.y,
        sprite.width,
        sprite.height,
        x,
        y,
        sprite.width,
        sprite.height
    );
}

