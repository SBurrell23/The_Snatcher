var crypt = new Image();
crypt.src = 'Assets/Tilesets/MASTER_TILESET.png';



function loadAssets(){
    loadMasterTileset(crypt);
}



function loadMasterTileset(ts) {
    sprites['ground1'] = getTileSourceRect(ts,0, 10);
    sprites['ground2'] = getTileSourceRect(ts,1, 10);
    sprites['ground3'] = getTileSourceRect(ts,0, 11);
    sprites['ground4'] = getTileSourceRect(ts,1,11);

    sprites['block'] = getTileSourceRect(ts,24, 0);
    sprites['gate'] = getTileSourceRect(ts,22, 8);

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

    loadPlayerAnimations(ts);

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

