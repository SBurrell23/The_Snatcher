var crypt = new Image();
crypt.src = 'Assets/Tilesets/Crypt.png';

var jungle = new Image();
jungle.src = 'Assets/Tilesets/RA_Jungle.png';


function loadAssets(){
    loadCryptAssets(crypt);
    //loadJungleAssets(jungle);
}

var tileSize = 48;

function loadCryptAssets(ts) {
    sprites['ground'] = getTileSourceRect(ts,6, 0);
    sprites['block'] = getTileSourceRect(ts,6, 1);


}

function loadJungleAssets(ts) {
    sprites['ground1'] = getTileSourceRect(ts,6, 34);

    sprites['rock1'] = getTileSourceRect(ts,23, 31);
    sprites['rock2'] = getTileSourceRect(ts,24 , 31);
    sprites['rock3'] = getTileSourceRect(ts,25, 31);
    sprites['rock4'] = getTileSourceRect(ts,26 , 31);
    sprites['rock5'] = getTileSourceRect(ts,23, 32);
    sprites['rock6'] = getTileSourceRect(ts,24, 32);
    sprites['rock7'] = getTileSourceRect(ts,25, 32);
    sprites['rock8'] = getTileSourceRect(ts,26, 32);
}

function getTileSourceRect(tileset, tileX, tileY) {
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