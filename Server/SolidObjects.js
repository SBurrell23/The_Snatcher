
function SolidObjects() {
    this.solidObjects = [];
}

SolidObjects.prototype.get = function() {
    return this.solidObjects;
}

SolidObjects.prototype.createWalls = function(gs,map) {
    const canvasWidth = global.canvasWidth;
    const canvasHeight = global.canvasHeight;
    const wallWidth = 15;
    const doorWidth = 150;

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

SolidObjects.prototype.createMazeWalls = function(gs, map) {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {

            // Don't bother creating objects in empty rooms.
            const roomType = map[i][j];
            if (roomType == 0)
                continue;

            const roomX = j;
            const roomY = i;
            var maze = [
                [' ', '■', '■', '■', '■', '■', ' ', ' ', ' ', '■', ' ', ' ', ' ', ' ', ' '],
                [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                [' ', ' ', '■', '■', '■', ' ', ' ', ' ', '■', '■', ' ', ' ', ' ', ' ', ' '],
                [' ', ' ', ' ', '■', ' ', ' ', ' ', ' ', '■', '■', ' ', ' ', ' ', ' ', '■'],
                [' ', ' ', ' ', '■', ' ', '■', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                [' ', ' ', ' ', '■', ' ', '■', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                [' ', ' ', ' ', '■', ' ', ' ', '■', ' ', ' ', '■', ' ', ' ', ' ', ' ', '■'],
                [' ', ' ', ' ', '■', ' ', ' ', '■', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                [' ', ' ', ' ', '■', ' ', ' ', '■', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                [' ', ' ', ' ', '■', ' ', '■', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
            ];

            //Ratio is 10 to 14
            //The ratio but be both even or odd or doors wont line up


            const blockSize = 75;
            //Turn the maze into solid objects
            for (let k = 0; k < maze.length; k++) {
                for (let l = 0; l < maze[k].length; l++) {
                    const value = maze[k][l];
                    if (value == '■') {
                        //console.log("Creating maze wall at " + l + ", " + k);
                        this.solidObjects.push({
                            x: (l * blockSize),
                            y: (k * blockSize),
                            width: blockSize,
                            height: blockSize,
                            color: 'black',
                            roomXY: [roomX, roomY],
                            type:"mazeWall"
                        });
                    }
                }
            }  

        }
    }
}

function createMaze(rows, cols) {

}


module.exports = SolidObjects;