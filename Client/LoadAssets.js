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

    sprites['block1'] = getTileSourceRect(ts,9, 13);
    sprites['block2'] = getTileSourceRect(ts,10, 13);

    sprites['twoWide1'] = getTileSourceAdjustable(ts,6, 15 ,96,48);
    sprites['twoWide2'] = getTileSourceAdjustable(ts,6, 16 ,96,48);
    sprites['twoWide3'] = getTileSourceAdjustable(ts,6, 17 ,96,48);
    sprites['twoWide4'] = getTileSourceAdjustable(ts,6, 18 ,96,48);

    sprites['corner1'] = getTileSourceRect(ts,8, 15);
    sprites['corner2'] = getTileSourceRect(ts,9, 15);
    sprites['corner3'] = getTileSourceRect(ts,10, 15);
    sprites['corner4'] = getTileSourceRect(ts,11, 15);
    sprites['corner5'] = getTileSourceRect(ts,8, 16);
    sprites['corner6'] = getTileSourceRect(ts,9, 16);
    sprites['corner7'] = getTileSourceRect(ts,10, 16);
    sprites['corner8'] = getTileSourceRect(ts,11, 16);

    sprites['chest1'] = getTileSourceRect(ts,2, 0);
    sprites['chest2'] = getTileSourceRect(ts,4, 0);
    sprites['key'] = getTileSourceRect(ts,1, 0);

    sprites['pf_flyers'] = getTileSourceRect(ts,1, 1);
    sprites['the_button'] = getTileSourceRect(ts,0, 2);
    sprites['magic_monocle'] = getTileSourceRect(ts,1, 3);

    sprites['bbq_chili'] = getTileSourceRect(ts,2, 1);
    sprites['spare_eyeballs'] = getTileSourceRect(ts,2, 2);
    sprites['kill_the_power'] = getTileSourceRect(ts,3, 3);

    sprites['playerInventory'] = getTileSourceAdjustable(ts,8, 0 ,240,144);
    sprites['snatcherInventory'] = getTileSourceAdjustable(ts,13, 0 ,144,144);

    sprites['exitdoorClosed'] = getTileSourceAdjustable(ts,9, 3 ,96,96);
    sprites['exitdoorOpen'] = getTileSourceAdjustable(ts,12, 3 ,96,96);

    loadPlayerAnimations(ts);
    loadFireBlockAnimation(ts);
    loadTwoHighAnimations(ts);
    loadGates(ts);
    
    console.log("Assets loaded");
    console.log(sprites);
}

function loadTwoHighAnimations(ts){

    sprites['twoHigh1'] = getTileSourceAdjustable(ts,4, 15 ,48,96);
    sprites['twoHigh2'] = getTileSourceAdjustable(ts,5, 15 ,48,96);
    sprites['twoHigh3'] = getTileSourceAdjustable(ts,4, 17 ,48,96);
    sprites['twoHigh4'] = getTileSourceAdjustable(ts,5, 17 ,48,96);

    sprites['twoHigh5_1'] = getTileSourceAdjustable(ts,14, 16 ,48,96);
    sprites['twoHigh5_2'] = getTileSourceAdjustable(ts,15, 16 ,48,96);
    sprites['twoHigh5_3'] = getTileSourceAdjustable(ts,16, 16 ,48,96);
    sprites['twoHigh5_4'] = getTileSourceAdjustable(ts,17, 16 ,48,96);

    sprites['twoHigh6_1'] = getTileSourceAdjustable(ts,14, 18 ,48,96);
    sprites['twoHigh6_2'] = getTileSourceAdjustable(ts,15, 18 ,48,96);
    sprites['twoHigh6_3'] = getTileSourceAdjustable(ts,16, 18 ,48,96);
    sprites['twoHigh6_4'] = getTileSourceAdjustable(ts,17, 18 ,48,96);

    sprites['twoHigh7_1'] = getTileSourceAdjustable(ts,14, 20 ,48,96);
    sprites['twoHigh7_2'] = getTileSourceAdjustable(ts,15, 20 ,48,96);
    sprites['twoHigh7_3'] = getTileSourceAdjustable(ts,16, 20 ,48,96);
    sprites['twoHigh7_4'] = getTileSourceAdjustable(ts,17, 20 ,48,96);

    sprites['twoHigh8_1'] = getTileSourceAdjustable(ts,14, 22 ,48,96);
    sprites['twoHigh8_2'] = getTileSourceAdjustable(ts,15, 22 ,48,96);
    sprites['twoHigh8_3'] = getTileSourceAdjustable(ts,16, 22 ,48,96);
    sprites['twoHigh8_4'] = getTileSourceAdjustable(ts,17, 22 ,48,96);
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
    sprites['fireBlock1_1'] = getTileSourceRect(ts,9, 11);
    sprites['fireBlock1_2'] = getTileSourceRect(ts,10, 11);
    sprites['fireBlock1_3'] = getTileSourceRect(ts,11, 11);
    sprites['fireBlock1_4'] = getTileSourceRect(ts,12, 11);

    sprites['fireBlock2_1'] = getTileSourceRect(ts,9, 10);
    sprites['fireBlock2_2'] = getTileSourceRect(ts,10, 10);
    sprites['fireBlock2_3'] = getTileSourceRect(ts,11, 10);
    sprites['fireBlock2_4'] = getTileSourceRect(ts,12, 10);
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

