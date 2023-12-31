
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

            if(this.isRoom(map,'north',roomX,roomY))
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
        
            if(this.isRoom(map,'south',roomX,roomY))
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
        
            if(this.isRoom(map,'west',roomX,roomY))
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
        
            if(this.isRoom(map,'east',roomX,roomY))
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
    if (location === 'north') {
        if (row > 0 && map[row - 1][col] !== 0) {
            return true;
        }
    } else if (location === 'south') {
        if (row < map.length - 1 && map[row + 1][col] !== 0) {
            return true;
        }
    } else if (location === 'west') {
        if (col < map[row].length - 1 && map[row][col + 1] !== 0) {
            return true;
        }
    } else if (location === 'east') {
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

            const rX = j;
            const rY = i;

            var isMazeFun = false;
            while (isMazeFun == false){
                var maze = [
                    ['■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■'],
                    ['■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■'],
                    ['■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■'],
                    ['■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■'],
                    ['■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■'],
                    ['■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■'],
                    ['■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■'],
                    ['■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■'],
                    ['■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■'],
                    ['■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■', '■']
                ];
                //Ratio is 10 to 14, each door must be 2 75px blocks wide

                
                //4 DOORS
                if(this.isRoom(map,'north',rX,rY) && this.isRoom(map,'south',rX,rY) && this.isRoom(map,'west',rX,rY) && this.isRoom(map,'east',rX,rY)){
                    this.createRandomPath(maze,'north','south');//The actual path
                    this.createRandomPath(maze,'east','west');//The actual path
                    this.openDoors(maze,['north','south','east','west']);
                    //This actually is guaranteed to work because the paths MUST cross
                    //Usually we end up with a pretty empty room
                }

                // 3 DOORS
                //North, South, East
                else if(this.isRoom(map,'north',rX,rY) && this.isRoom(map,'south',rX,rY) && this.isRoom(map,'east',rX,rY)){
                    this.createRandomPath(maze,'north','south');
                    this.createRandomPath(maze,'south','east');
                    this.openDoors(maze,['north','south','east']);
                }
                //North, South, West
                else if(this.isRoom(map,'north',rX,rY) && this.isRoom(map,'south',rX,rY) && this.isRoom(map,'west',rX,rY)){
                    this.createRandomPath(maze,'north','south');
                    this.createRandomPath(maze,'north','west');
                    this.openDoors(maze,['north','south','west']);
                }
                //North, East, West
                else if(this.isRoom(map,'north',rX,rY) && this.isRoom(map,'east',rX,rY) && this.isRoom(map,'west',rX,rY)){
                    this.createRandomPath(maze,'east','west');
                    this.createRandomPath(maze,'north','west');
                    this.openDoors(maze,['north','east','west']);
                }
                //South, East, West
                else if(this.isRoom(map,'south',rX,rY) && this.isRoom(map,'east',rX,rY) && this.isRoom(map,'west',rX,rY)){
                    this.createRandomPath(maze,'east','west');
                    this.createRandomPath(maze,'south','east');
                    this.openDoors(maze,['south','east','west']);
                }

                // 2 DOORS
                //East to West
                else if(this.isRoom(map,'east',rX,rY) && this.isRoom(map,'west',rX,rY)){
                    this.createRandomPath(maze,'east','west');
                    this.openDoors(maze,['east','west']);
                }
                //North to south
                else if(this.isRoom(map,'north',rX,rY) && this.isRoom(map,'south',rX,rY)){
                    this.createRandomPath(maze,'north','south');
                    this.openDoors(maze,['north','south']);
                }
                //South to West
                else if(this.isRoom(map,'south',rX,rY) && this.isRoom(map,'west',rX,rY)){
                    this.createRandomPath(maze,'south','west');
                    this.openDoors(maze,['south','west']);
                }
                //West to North
                else if(this.isRoom(map,'west',rX,rY) && this.isRoom(map,'north',rX,rY)){
                    this.createRandomPath(maze,'west','north');
                    this.openDoors(maze,['west','north']);
                }
                //North to East
                else if(this.isRoom(map,'north',rX,rY) && this.isRoom(map,'east',rX,rY)){
                    this.createRandomPath(maze,'north','east');
                    this.openDoors(maze,['north','east']);
                }
                //East to South
                else if(this.isRoom(map,'east',rX,rY) && this.isRoom(map,'south',rX,rY)){
                    this.createRandomPath(maze,'east','south');
                    this.openDoors(maze,['east','south']);
                }

                // 1 DOOR (AKA DEAD ENDS!)
                //North
                else if(this.isRoom(map,'north',rX,rY))
                    this.openDoors(maze,['north']);
                //South
                else if(this.isRoom(map,'south',rX,rY))
                    this.openDoors(maze,['south']);
                //East
                else if(this.isRoom(map,'east',rX,rY))
                    this.openDoors(maze,['east']);
                //West
                else if(this.isRoom(map,'west',rX,rY))
                    this.openDoors(maze,['west']);


                //Lastly, count how many solid objects are left in the maze,
                //If its too few, we'll go again, else the maze is fun!
                let blockCount = 0; 
                for (let k = 0; k < maze.length; k++)
                    for (let l = 0; l < maze[k].length; l++) 
                        if (maze[k][l] == '■') 
                            blockCount++; 

                const minNumberOfBlocks = 28; //AKA DIFFICULTY FACTOR!
                if(blockCount > minNumberOfBlocks)
                    isMazeFun = true;
            }

            const blockSize = 75;
            //Finally after all the pathing is done turn any leftover '■' into solidObjects to build the room
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
                            roomXY: [rX, rY],
                            type:"mazeWall"
                        });
                    }
                }
            }  

        }
    }
}

SolidObjects.prototype.createRandomPath = function(maze, from, to) {

    var startY = null;
    var startX = null;
    var endY = null;
    var endX = null;

    if(from == 'north'){
        startY = 6;
        startX = 0;
    }
    else if(from == 'south'){
        startY = 6;
        startX = 9;
    }
    else if(from == 'west'){
        startY = 0;
        startX = 5;
    }
    else if(from == 'east'){
        startY = 13;
        startX = 5;
    }

    if(to == 'north'){
        endY = 6;
        endX = 0;
    }
    else if(to == 'south'){
        endY = 6;
        endX = 9;
    }
    else if(to == 'west'){
        endY = 0;
        endX = 5;
    }
    else if(to == 'east'){
        endY = 13;
        endX = 5;
    }

    grid = JSON.parse(JSON.stringify(maze));    

    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Up, Down, Left, Right
    const path = [];
    const stack = [[startX,startY]];

    while (stack.length > 0) {
        let [x, y] = stack.pop();
        path.push([x, y]);

        if (x === endX && y === endY) {
            break;
        }

        // Randomize directions
        directions.sort(() => Math.random() - 0.5);

        for (let [dx, dy] of directions) {
            let newX = x + dx;
            let newY = y + dy;

            // Check if the new position is within the grid and not yet visited
            if ( newX >= 0 &&
                 newY >= 0 &&
                 newX < grid.length && 
                 newY < grid[0].length && 
                 grid[newX][newY] != 1
            ) {
                stack.push([newX, newY]);
                // Mark as visited
                grid[newX][newY] = 1;
            }
        }
    }

    //Finally, loop through all the path x,y's and clear them from the actual maze
    for (let [x, y] of path)
        maze[x][y] = ' ';
};

SolidObjects.prototype.openDoors = function(maze, directions) {
    for (let i = 0; i < directions.length; i++) {
        let direction = directions[i];
        if (direction === 'north') {
            maze[0][6] = ' ';
            maze[0][7] = ' ';
        } else if (direction === 'south') {
            maze[9][6] = ' ';
            maze[9][7] = ' ';
        } else if (direction === 'west') {
            maze[4][0] = ' ';
            maze[5][0] = ' ';
        } else if (direction === 'east') {
            maze[5][13] = ' ';
            maze[4][13] = ' ';
        }
    }
}

module.exports = SolidObjects;