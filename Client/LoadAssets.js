var tilesetImage = new Image();
tilesetImage.src = 'Assets/Tilesets/Graveyard.png';

var tileSize = 48; // The size of a tile in the tileset

function getTileSourceRect(tileX, tileY) {
    return {
        x: tileX * tileSize,
        y: tileY * tileSize,
        width: tileSize,
        height: tileSize
    };
}

//sprites is located in GameClient.js
function loadAssets() {
    sprites['ground1'] = getTileSourceRect(0, 3);

    sprites['rock1'] = getTileSourceRect(6, 6);
    sprites['rock2'] = getTileSourceRect(6, 5);
    sprites['rock3'] = getTileSourceRect(7, 6);
    sprites['rock4'] = getTileSourceRect(7, 5);
    sprites['rock5'] = getTileSourceRect(8, 6);
    sprites['rock6'] = getTileSourceRect(8, 5);
    sprites['rock7'] = getTileSourceRect(9, 6);
    sprites['rock8'] = getTileSourceRect(9, 5);
    sprites['rock9'] = getTileSourceRect(10, 6);
    sprites['rock10']= getTileSourceRect(10, 5);

    console.log(sprites);
    console.log('Assets loaded');
}

function drawSprite(ctx, spriteName, x, y, width, height) {
    var sprite = sprites[spriteName];
    if (!sprite) 
        throw 'Sprite "' + spriteName + '" does not exist';
    
    ctx.drawImage(
        tilesetImage,
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