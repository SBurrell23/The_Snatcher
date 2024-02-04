
function SolidObjects() {
    this.solidObjects = {};
    this.color = "#2d211b";
    this.mazeHeight = (global.canvasHeight /global.map.getBlockSize());
    this.mazeWidth = (global.canvasWidth / global.map.getBlockSize());
    //The canvas and block size must divide into an EVEN number

    this.minNumberOfBlocks = 75;
    this.maxNumberOfBlocks = 140;
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

    var roomNumber = 1;

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

                //North
                if(this.isRoom(map,'north',rX,rY))
                    this.openDoors(maze,['north']);
                //South
                if(this.isRoom(map,'south',rX,rY))
                    this.openDoors(maze,['south']);
                //East
                if(this.isRoom(map,'east',rX,rY))
                    this.openDoors(maze,['east']);
                //West
                if(this.isRoom(map,'west',rX,rY))
                    this.openDoors(maze,['west']);
                
                this.createRandomPath(maze,'north','south');//The actual path
                this.createRandomPath(maze,'east','west');//The actual path


                //Adjust the killer starting room and make sure he has space to spawn
                if(rX == Math.floor(map.length/2) && rY == Math.floor(map[i].length/2)){
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
                if(blockCount > this.minNumberOfBlocks && 
                    blockCount < this.maxNumberOfBlocks &&
                    this.largeSpots(maze, ' ', 5) == false &&  //5
                    this.largeSpots(maze, '■' , 5) == false //6
                    )
                    isMazeFun = true;

            }
            
            gs.lm = "digging graves "+  roomNumber + " / " + (global.map.getAvailableRooms() + 2);
            global.sendAllClientsGS();

            //Finally after all the pathing is done turn any leftover '■' into solidObjects to build the room
            for (let k = 0; k < maze.length; k++) {
                for (let l = 0; l < maze[k].length; l++) {
                    const value = maze[k][l];
                    if (value == '■') {
                        this.solidObjects[rX+","+rY].push({
                            x: (l * global.map.getBlockSize()),
                            y: (k * global.map.getBlockSize()),
                            width: global.map.getBlockSize(),
                            height: global.map.getBlockSize(),
                            randSeed: Math.random(),
                            type: this.getBlockType(maze,k,l)
                        });
                    }
                }
            }  
            roomNumber++;

        }
    }
}

SolidObjects.prototype.largeSpots = function(maze, spotType, spotSize){
    let hasEmptyBlocks = false;
    //This has the potential to SERIOUSLY slow down room generation time...

    for (let i = 0; i < maze.length - spotSize; i++) {
        for (let j = 0; j < maze[i].length - spotSize; j++) {
            let isEmptyBlock = true;

            for (let k = i; k < i + spotSize; k++) {
                for (let l = j; l < j + spotSize; l++) {
                    if (maze[k][l] !== spotType) {
                        isEmptyBlock = false;
                        break;
                    }
                }
                if (!isEmptyBlock) {
                    break;
                }
            }

            if (isEmptyBlock) {
                return true;
            }
        }
        if (hasEmptyBlocks) {
            break;
        }
    }

    return hasEmptyBlocks;
}

//This function is used to determine what a block type is based on its location and surroundings
SolidObjects.prototype.getBlockType = function(maze,x,y){


    if(x == 0 && y == 0)
        return "gnw";
    else if(x == 0 && y == maze[x].length-1)
        return "gne";
    else if(x == maze.length-1 && y == 0)
        return "gsw";
    else if(x == maze.length-1 && y == maze[x].length-1)
        return "gse";
    else if(x == 0)
        return "gn";
    else if(x == maze.length-1)
        return "gs";
    else if(y == 0)
        return "gw";
    else if(y == maze[x].length-1)
        return "ge";

    var blockType = 'b';

    // Check south block
    if (x < maze.length-1 && maze[x+1][y] === '■') {
        blockType += 's';
    }

    // Check north block
    if (x > 0 && maze[x-1][y] === '■') {
        blockType += 'n';
    }

    // Check east block
    if (y < maze[x].length-1 && maze[x][y+1] === '■') {
        blockType += 'e';
    }
    
    // Check west block
    if (y > 0 && maze[x][y-1] === '■') {
        blockType += 'w';
    }


    
    return blockType;
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