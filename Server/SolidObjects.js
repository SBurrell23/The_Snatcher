
function SolidObjects() {
    this.solidObjects = {};
    this.color = "#2d211b";
    this.mazeHeight = (global.canvasHeight /global.map.getBlockSize());
    this.mazeWidth = (global.canvasWidth / global.map.getBlockSize());
    //The canvas and block size must divide into an EVEN number

    this.minNumberOfBlocks = 100;
    this.maxNumberOfBlocks = 250;
}

SolidObjects.prototype.get = function() {
    return this.solidObjects;
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
    console.log("Creating maze walls...");

    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {

            // Don't bother creating objects in empty rooms.
            const roomType = map[i][j];
            if (roomType == 0)
                continue;
            
            
            const rX = j;
            const rY = i;

            this.solidObjects[rX+","+rY] = [];

            var isMazeFun = false;
            while (isMazeFun == false){

                var maze = [];
                for (let i = 0; i < this.mazeHeight; i++) {
                    maze[i] = [];
                    for (let j = 0; j < this.mazeWidth; j++) {
                        maze[i][j] = '■';
                    }
                }
                //Ratio is 10 to 14, each door must be 2 75px blocks wide
                //Ratio must multiply into canvas ratio or doors wont work
                
                //4 DOORS
                if(this.isRoom(map,'north',rX,rY) && this.isRoom(map,'south',rX,rY) && this.isRoom(map,'west',rX,rY) && this.isRoom(map,'east',rX,rY)){
                    this.createRandomPath(maze,'north','south');//The actual path
                    this.createRandomPath(maze,'east','west');//The actual path
                    this.openDoors(maze,['north','south','east','west']);
                    //This actually is guaranteed to work because the paths MUST cross
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
                else if(this.isRoom(map,'north',rX,rY)){
                    this.createRandomPath(maze,'north','middle');
                    this.openDoors(maze,['north','middle']);
                }
                //South
                else if(this.isRoom(map,'south',rX,rY)){
                    this.createRandomPath(maze,'south','middle');
                    this.openDoors(maze,['south','middle']);
                }
                //East
                else if(this.isRoom(map,'east',rX,rY)){
                    this.createRandomPath(maze,'east','middle');
                    this.openDoors(maze,['east','middle']);
                }
                //West
                else if(this.isRoom(map,'west',rX,rY)){
                    this.createRandomPath(maze,'west','middle');
                    this.openDoors(maze,['west','middle']);
                }

                //Adjust the killer starting room and make sure he has space to spawn
                if(rX == Math.floor(map.length/2) && rY == Math.floor(map[i].length/2)){
                    //no need to check east and north because these are guaranteed to be rooms based on the map generation
                    this.createRandomPath(maze,'middle','east');
                    this.createRandomPath(maze,'middle','north');
                    this.createRandomPath(maze,'middle','south');
                    this.createRandomPath(maze,'middle','west');
                    this.openDoors(maze,['middle']);
                }

                //Adjust the door rooms and make sure they have plenty of space to spawn
                if(roomType == 3){
                    if(this.isRoom(map,'north',rX,rY)){
                        this.createRandomPath(maze,'middle','north');
                        this.openDoors(maze,['middle','north']);
                    }
                    if(this.isRoom(map,'south',rX,rY)){
                        this.createRandomPath(maze,'middle','south');
                        this.openDoors(maze,['middle','south']);
                    }
                    if(this.isRoom(map,'east',rX,rY)){
                        this.createRandomPath(maze,'middle','east');
                        this.openDoors(maze,['middle','east']);
                    }
                    if(this.isRoom(map,'west',rX,rY)){
                        this.createRandomPath(maze,'middle','west');
                        this.openDoors(maze,['middle','west']);
                    }
                }

                //Adjust the player starting rooms and make sure they have space to spawn
                for (let p = 0; p < gs.players.length; p++) {
                    const player = gs.players[p];
                    if (player.currRoom.x == rX && player.currRoom.y == rY) {
                        if(this.isRoom(map,'north',rX,rY)){
                            this.createRandomPath(maze,'middle','north');
                            this.openDoors(maze,['middle']); 
                        }
                        else if(this.isRoom(map,'south',rX,rY)){
                            this.createRandomPath(maze,'middle','south');
                            this.openDoors(maze,['middle']);
                        }
                        else if(this.isRoom(map,'east',rX,rY)){
                            this.createRandomPath(maze,'middle','east');
                            this.openDoors(maze,['middle']);
                        }
                        else if(this.isRoom(map,'west',rX,rY)){
                            this.createRandomPath(maze,'middle','west');
                            this.openDoors(maze,['middle']);
                        }
                    }
                }

                //Lastly, count how many solid objects are left in the maze,
                //If its too few, we'll go again, else the maze is fun!
                let blockCount = 0; 
                for (let k = 0; k < maze.length; k++)
                    for (let l = 0; l < maze[k].length; l++) 
                        if (maze[k][l] == '■') 
                            blockCount++; 

                //THESE ARE THE MOST IMPORTANT VARIABLES TO TWEAK FOR MAZE DIFFICULTY
                //TOO LOW MIN AND SOME LEVELS ARE EMPTY
                //TOO HIGH MAX AND TOO MANY LEVELS ARE SINGLE PATHS
                if(blockCount > this.minNumberOfBlocks && blockCount < this.maxNumberOfBlocks)
                    isMazeFun = true;

                //Add another check here for large open areas. if a room is a yin-yang, its not fun.
            }

            //Finally after all the pathing is done turn any leftover '■' into solidObjects to build the room
            for (let k = 0; k < maze.length; k++) {
                for (let l = 0; l < maze[k].length; l++) {
                    const value = maze[k][l];
                    if (value == '■') {
                        //console.log("Creating maze wall at " + l + ", " + k);
                        var type = "block";
                        if(k == 0 || k == maze.length-1 || l == 0 || l == maze[k].length-1)
                            type = "gate";

                        this.solidObjects[rX+","+rY].push({
                            x: (l * global.map.getBlockSize()),
                            y: (k * global.map.getBlockSize()),
                            width: global.map.getBlockSize(),
                            height: global.map.getBlockSize(),
                            color: this.color,
                            type:type
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
        startY = (this.mazeWidth/2)-1;
        startX = 1;
    }
    else if(from == 'south'){
        startY = (this.mazeWidth/2)-1;
        startX = this.mazeHeight-2;
    }
    else if(from == 'west'){
        startY = 1;
        startX = this.mazeHeight/2;
    }
    else if(from == 'east'){
        startY = this.mazeWidth-2;
        startX = this.mazeHeight/2;
    }
    else if(from == 'middle'){
        startY = (this.mazeWidth/2)-1;
        startX = this.mazeHeight/2;
    }

    if(to == 'north'){
        endY = (this.mazeWidth/2)-1;
        endX = 1;
    }
    else if(to == 'south'){
        endY = (this.mazeWidth/2)-1;
        endX = this.mazeHeight-2;
    }
    else if(to == 'west'){
        endY = 1;
        endX = this.mazeHeight/2;
    }
    else if(to == 'east'){
        endY = this.mazeWidth-2;
        endX = this.mazeHeight/2;
    }
    else if(to == 'middle'){
        endY = this.mazeHeight/2;
        endX = (this.mazeWidth/2)-1;
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

            // Check if the new position is within the grid and not yet visited and not on an edge
            if (newX > 0 &&
                newY > 0 &&
                newX < grid.length - 1 &&
                newY < grid[0].length - 1 &&
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
            maze[0][(this.mazeWidth/2)-1] = ' ';
            maze[0][(this.mazeWidth/2)] = ' ';
            maze[1][(this.mazeWidth/2)-1] = ' ';
            maze[1][(this.mazeWidth/2)] = ' ';
        } else if (direction === 'south') {
            maze[this.mazeHeight-1][(this.mazeWidth/2)-1] = ' ';
            maze[this.mazeHeight-1][(this.mazeWidth/2)] = ' ';
            maze[this.mazeHeight-2][(this.mazeWidth/2)-1] = ' ';
            maze[this.mazeHeight-2][(this.mazeWidth/2)] = ' ';
        } else if (direction === 'west') {
            maze[(this.mazeHeight/2)-1][0] = ' ';
            maze[(this.mazeHeight/2)][0] = ' ';
            maze[(this.mazeHeight/2)-1][1] = ' ';
            maze[(this.mazeHeight/2)][1] = ' ';
        } else if (direction === 'east') {
            maze[(this.mazeHeight/2)-1][this.mazeWidth - 1] = ' ';
            maze[(this.mazeHeight/2)][this.mazeWidth - 1] = ' ';
            maze[(this.mazeHeight/2)-1][this.mazeWidth - 2] = ' ';
            maze[(this.mazeHeight/2)][this.mazeWidth - 2] = ' ';
        }else if (direction === 'middle') {
            maze[(this.mazeHeight/2)-1][(this.mazeWidth/2)-1] = ' ';
            maze[(this.mazeHeight/2)-1][(this.mazeWidth/2)] = ' ';
            maze[(this.mazeHeight/2)][(this.mazeWidth/2)-1] = ' ';
            maze[(this.mazeHeight/2)][(this.mazeWidth/2)] = ' ';
        }
    }
}

module.exports = SolidObjects;