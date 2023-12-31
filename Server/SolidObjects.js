
function SolidObjects() {
    this.solidObjects = [];
}

SolidObjects.prototype.get = function() {
    return this.solidObjects;
}

SolidObjects.prototype.createWalls = function(gs,map) {
    const canvasWidth = global.canvasWidth;
    const canvasHeight = global.canvasHeight;
    const wallWidth = 20;
    const doorWidth = 200;

    var doorSize = 0;

    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {

            //Don't bother creating objects in empty rooms.
            const roomType = map[i][j];
            if(roomType == 0)
                continue;

            const roomX = j;
            const roomY = i;

            if(this.isRoom(map,'above',roomX,roomY))
                doorSize = doorWidth;
            else
                doorSize = 0;
            // Top walls
            this.solidObjects.push({
                x: 0,
                y: 0,
                width: (canvasWidth - doorSize) / 2,
                height: wallWidth,
                color: 'black',
                roomXY: [roomX, roomY],
                type:"wall"
            });
            this.solidObjects.push({
                x: (canvasWidth  + doorSize) / 2,
                y: 0,
                width: (canvasWidth- doorSize) / 2,
                height: wallWidth,
                color: 'black',
                roomXY: [roomX, roomY],
                type:"wall"
            });
        
            if(this.isRoom(map,'below',roomX,roomY))
                doorSize = doorWidth;
            else
                doorSize = 0;

            // Bottom walls
            this.solidObjects.push({
                x: 0,
                y: canvasHeight - wallWidth,
                width: (canvasWidth - doorSize) / 2,
                height: wallWidth,
                color: 'black',
                roomXY: [roomX, roomY],
                type:"wall"
            });
            this.solidObjects.push({
                x: (canvasWidth + doorSize) / 2,
                y: canvasHeight - wallWidth,
                width: (canvasWidth - doorSize) / 2,
                height: wallWidth,
                color: 'black',
                roomXY: [roomX, roomY],
                type:"wall"
            });
        
            if(this.isRoom(map,'left',roomX,roomY))
                doorSize = doorWidth;
            else
                doorSize = 0;
            // Left walls
            this.solidObjects.push({
                x: 0,
                y: wallWidth,
                width: wallWidth,
                height: (canvasHeight - (2 * wallWidth) - doorSize) / 2,
                color: 'black',
                roomXY: [roomX, roomY],
                type:"wall"
            });
            this.solidObjects.push({
                x: 0,
                y: (canvasHeight + doorSize) / 2,
                width: wallWidth,
                height: (canvasHeight - (2 * wallWidth) - doorSize) / 2,
                color: 'black',
                roomXY: [roomX, roomY],
                type:"wall"
            });
        
            if(this.isRoom(map,'right',roomX,roomY))
                doorSize = doorWidth;
            else
                doorSize = 0;
            // Right walls
            this.solidObjects.push({
                x: canvasWidth - wallWidth,
                y: wallWidth,
                width: wallWidth,
                height: (canvasHeight - (2 * wallWidth) - doorSize) / 2,
                color: 'black',
                roomXY: [roomX, roomY],
                type:"wall"
            });
            this.solidObjects.push({
                x: canvasWidth - wallWidth,
                y: (canvasHeight + doorSize) / 2,
                width: wallWidth,
                height: (canvasHeight - (2 * wallWidth) - doorSize) / 2,
                color: 'black',
                roomXY: [roomX, roomY],
                type:"wall"
            });

        }
    }
}

SolidObjects.prototype.isRoom = function(map,location,col,row){
    if (location === 'above') {
        if (row > 0 && map[row - 1][col] !== 0) {
            return true;
        }
    } else if (location === 'below') {
        if (row < map.length - 1 && map[row + 1][col] !== 0) {
            return true;
        }
    } else if (location === 'left') {
        if (col < map[row].length - 1 && map[row][col + 1] !== 0) {
            return true;
        }
    } else if (location === 'right') {
        if (col > 0 && map[row][col - 1] !== 0) {
            return true;
        }
    }
    return false;
}

SolidObjects.prototype.createFurniture = function(gs, map) {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {

            // Don't bother creating objects in empty rooms.
            const roomType = map[i][j];
            if (roomType == 0)
                continue;

            const roomX = j;
            const roomY = i;

            var roomFurniture = [];

            const numObjects = 4; // Random number of objects between 3 and 5

            for (let k = 0; k < numObjects; k++) {
                const width = Math.floor(Math.random() * 150) + 130;
                const height = Math.floor(Math.random() * 150) + 130; 

                let x, y;
                
                // Spawn objects in each quadrant of the room
                if (k === 0) {
                    x = Math.floor(Math.random() * 201) + 75 ; // Top-left quadrant
                    y = Math.floor(Math.random() * 51) + 40;
                } else if (k === 1) {
                    x = (global.canvasWidth / 2) + Math.floor(Math.random() * 201) + 75; // Top-right quadrant
                    y = Math.floor(Math.random() * 51) + 40;
                } else if (k === 2) {
                    x = Math.floor(Math.random() * 101) + 75 // Bottom-left quadrant
                    y = (global.canvasHeight /2) + 200 - height + Math.floor(Math.random() * 80) + 15;
                } else if (k === 3) {
                    x = (global.canvasWidth / 2) + Math.floor(Math.random() * 201) + 75; // Bottom-right quadrant
                    y = (global.canvasHeight /2) + 200 - height + Math.floor(Math.random() * 80) + 15;
                }
                console.log("x: " + x + " y: " + y + " width: " + width + " height: " + height);

                roomFurniture.push({
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    color: 'black',
                    roomXY: [roomX, roomY],
                    type: "furniture"
                });
            }
            // Join roomFurniture array with solidObjects
            this.solidObjects = this.solidObjects.concat(roomFurniture);
        }
    }
}

                
module.exports = SolidObjects;

module.exports = SolidObjects;