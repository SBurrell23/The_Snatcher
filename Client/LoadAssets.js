var crypt = new Image();
crypt.src = 'Assets/Tilesets/MASTER_TILESET.png';



function loadAssets(){
    loadMasterTileset(crypt);
}



function loadMasterTileset(ts) {
    sprites['ground1'] = getTileSourceRect(ts,8, 0);
    sprites['ground2'] = getTileSourceRect(ts,9, 0);
    sprites['ground3'] = getTileSourceRect(ts,8, 1);
    sprites['ground4'] = getTileSourceRect(ts,9,1);

    sprites['block'] = getTileSourceRect(ts,24, 0);
    sprites['gate'] = getTileSourceRect(ts,22, 8);

    sprites['chest'] = getTileSourceRect(ts,6, 1);
    sprites['key'] = getTileSourceRect(ts,1, 0);

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

function drawSprite(ctx, spriteName, x, y, width, height) {
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
        width,
        height
    );
}

//drawSprite(ctx, 'tileName', x, y, width, height);