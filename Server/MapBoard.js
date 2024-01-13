
function MapBoard(numRunners) {
    this.gameMap = [];

    var mapSize = 0;

    if(numRunners == 1 || numRunners == 0)
        mapSize = 11;
    else if(numRunners == 2)
        mapSize = 12;
    else if(numRunners == 3)
        mapSize = 13;
    else if(numRunners == 4)
        mapSize = 14;
    else if(numRunners == 5)
        mapSize = 15;
    else   
        mapSize = 16; //THIS SHOULD NOT HAPPEN! Runner maximum is 5

    this.rows = mapSize;
    this.cols = mapSize;
    this.totalRooms = Math.floor((this.rows*this.cols) * .65); //Should not be > then ~.85
    this.middleSize = 4; //Probably should stay as 4

    this.blockSize = 48;//
    //Room Types: 0 = empty, 1 = room, 3 = exit door
    this.availableRooms = 0;
}

MapBoard.prototype.generateNewMap = function() {
    console.log("Generating New Map");

    var map = [];
    const rows = this.rows;
    const cols = this.cols;
    const totalRooms = this.totalRooms;
    const middleSize = this.middleSize;

    // Initialize the map with default values of 0
    for (let i = 0; i < rows; i++) {
        map[i] = [];
        for (let j = 0; j < cols; j++) {
            map[i][j] = 0;
        }
    }
    
    // Firstly add a square of rooms to the middle of the map
    var roomCount = 0;
    const startRow = Math.floor(rows / 2) - (middleSize /2);
    const startCol = Math.floor(cols / 2) - (middleSize /2);
    for (let i = startRow; i < startRow + middleSize; i++) {
        for (let j = startCol; j < startCol + middleSize; j++) {
            map[i][j] = 1;
            roomCount++;
        }
    }

    // Then add random rooms on the edges until roomCount reaches totalRooms
    while (roomCount < totalRooms) {
        const randomRow = Math.floor(Math.random() * rows);
        const randomCol = Math.floor(Math.random() * cols);

        if (map[randomRow][randomCol] === 1) {
            // Randomly select a direction (left, right, top, or bottom)
            const directions = ['left', 'right', 'top', 'bottom'];
            const randomDirection = directions[Math.floor(Math.random() * directions.length)];

            let newRow = randomRow;
            let newCol = randomCol;

            switch (randomDirection) {
                case 'left':   newCol--; break;
                case 'right':  newCol++; break;
                case 'top':    newRow--; break;
                case 'bottom': newRow++; break;
            }

            // Check if the new position is within the map boundaries and the room is currently 0
            if (newRow >= 1 && newRow < (rows-1) && newCol >= 1 && newCol < (cols-1) && map[newRow][newCol] === 0) {
                map[newRow][newCol] = 1;
                roomCount++;
            }
        }
    }

    //Lasty, we go back in and punch some holes into any large sections of 1s
    const largeBlock = 3;
    for (let i = 0; i < rows - (largeBlock-1); i++) {
        for (let j = 0; j < cols -  (largeBlock-1); j++) {
            let section = true;

            // Check if the largeBlock section is all 1s
            for (let k = i; k < i + largeBlock; k++) {
                for (let l = j; l < j + largeBlock; l++) {
                    if (map[k][l] !== 1) {
                        section = false;
                        break;
                    }
                }
                if (!section) {
                    break;
                }
            }

            if (section) {
                const randHoleMaxWorH = 2; //Holes can end up touching so bigger is meh
                const randHoleMinWorH = 1;
                // Pick a random position within the section
                const randomRow = i + Math.floor(Math.random() * (largeBlock));
                const randomCol = j + Math.floor(Math.random() * (largeBlock));

                const randHoleWidth = Math.floor(Math.random() * randHoleMaxWorH) + randHoleMinWorH;
                const randHoleHeight = Math.floor(Math.random() * randHoleMaxWorH) + randHoleMinWorH;
                // Set a 2x2 block to 0
                for (let k = randomRow; k < randomRow + randHoleWidth; k++) {
                    for (let l = randomCol; l < randomCol + randHoleHeight; l++) {
                        if (map[k] && map[k][l])
                            map[k][l] = 0;
                    }
                }
            }
            
        }
    }

    // Re-add the middle square of rooms in case it was punched out
    for (let i = startRow; i < startRow + middleSize; i++) {
        for (let j = startCol; j < startCol + middleSize; j++) {
            map[i][j] = 1;
        }
    }

    //Sweep through the map again and remove and 1's that do not have any other 1's on their left/right/top/bottom
    for (let i = 1; i < rows - 1; i++) {
        for (let j = 1; j < cols - 1; j++) {
            if(map[i][j] == 1){
                var hasNeighbor = false;
                if(map[i-1][j] == 1){
                    hasNeighbor = true;
                }
                if(map[i+1][j] == 1){
                    hasNeighbor = true;
                }
                if(map[i][j-1] == 1){
                    hasNeighbor = true;
                }
                if(map[i][j+1] == 1){
                    hasNeighbor = true;
                }
                if(hasNeighbor == false){
                    map[i][j] = 0;
                }
            }
        }
    }

    //Fill any two blocks that are only touching diagonally
    var diagonalBlockRoomFillType = 1;
    for (let i = 1; i < rows - 1; i++) {
        for (let j = 1; j < cols - 1; j++) {
            if (map[i][j] === 1) {
                if (map[i-1][j-1] === 1 && map[i-1][j] === 0 && map[i][j-1] === 0) {
                    map[i-1][j] = diagonalBlockRoomFillType;
                    map[i][j-1] = diagonalBlockRoomFillType;
                }
                if (map[i-1][j+1] === 1 && map[i-1][j] === 0 && map[i][j+1] === 0) {
                    map[i-1][j] = diagonalBlockRoomFillType;
                    map[i][j+1] = diagonalBlockRoomFillType;
                }
                if (map[i+1][j-1] === 1 && map[i+1][j] === 0 && map[i][j-1] === 0) {
                    map[i+1][j] = diagonalBlockRoomFillType;
                    map[i][j-1] = diagonalBlockRoomFillType;
                }
                if (map[i+1][j+1] === 1 && map[i+1][j] === 0 && map[i][j+1] === 0) {
                    map[i+1][j] = diagonalBlockRoomFillType;
                    map[i][j+1] = diagonalBlockRoomFillType;
                }
            }
        }
    }

    // Set any rooms to 0 that cannot be reached from the midRoom
    const midRoom = {x: Math.floor(rows / 2), y: Math.floor(cols / 2)};
    const visited = new Array(rows).fill(false).map(() => new Array(cols).fill(false));
    const queue = [];
    queue.push(midRoom);
    while (queue.length > 0) {
        const { x, y } = queue.shift();
        visited[x][y] = true;

        // Check adjacent rooms
        const adjacentRooms = [
            { x: x - 1, y },
            { x: x + 1, y },
            { x, y: y - 1 },
            { x, y: y + 1 }
        ];

        for (const room of adjacentRooms) {
            const { x: adjX, y: adjY } = room;

            if (adjX >= 0 && adjX < rows && adjY >= 0 && adjY < cols && !visited[adjX][adjY] && map[adjX][adjY] === 1) {
                queue.push(room);
                visited[adjX][adjY] = true;
            }
        }
    }
    // Set unreachable rooms to 0
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (!visited[i][j]) {
                map[i][j] = 0;
            }
        }
    }

    //Some really clever logic to determine and set the exit doors
    this.setExitRooms(map,rows,cols);

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (map[i][j] === 1) {
                this.availableRooms++;
            }
        }
    }
    console.log("Total open rooms spawned: " + this.availableRooms);

    //Finally, a good lookin' map!
    this.gameMap = map;
    return map;
}

MapBoard.prototype.setExitRooms = function(map,rows,cols) {
    //Flips a coin, and either puts the exit on the top/bottom or left/right
    //The algorithm makes (attemptsMax) attempts to find a random open(1) room in a topmost/leftmost etc row/column
    //If it fails all attemptsMax attempts, it will try again on the next row/column moving inwards
    const attemptsMax = 2;
    //A lower attemptsMax value means the exits might not be on the very edge of the map (but usually are)
    //A value 5 or higher ALMOST ALWAYS guarantees the exits will be on the edge of the map
    //The 2 value will place exits on the edge 70% of the time, else they are usually 1 or 2 row/column in
    if ((Math.floor(Math.random() * 2) + 1) == 1) {
        let found = false;
        let row = 0;
        let randomColumn;
        let attempts = 0;

        // Find top room
        while (!found && row < rows) {
            attempts = 0;
            while (!found && attempts < attemptsMax) {
                randomColumn = Math.floor(Math.random() * cols);
                if (map[row][randomColumn] === 1) {
                    map[row][randomColumn] = 3;
                    found = true;
                } else {
                    attempts++;
                }
            }
            if (!found) {
                row++;
            }
        }

        found = false;
        row = rows - 1;
        // Find bottom room
        while (!found && row >= 0) {
            attempts = 0;
            while (!found && attempts < attemptsMax) {
                randomColumn = Math.floor(Math.random() * cols);
                if (map[row][randomColumn] === 1) {
                    map[row][randomColumn] = 3;
                    found = true;
                } else {
                    attempts++;
                }
            }
            if (!found) {
                row--;
            }
        }
    } else {
        found = false;
        let column = 0;
        let randomRow;
        let attempts = 0;
        // Find leftmost room
        while (!found && column < cols) {
            attempts = 0;
            while (!found && attempts < attemptsMax) {
                randomRow = Math.floor(Math.random() * rows);
                if (map[randomRow][column] === 1) {
                    map[randomRow][column] = 3;
                    found = true;
                } else {
                    attempts++;
                }
            }
            if (!found) {
                column++;
            }
        }

        found = false;
        column = cols - 1;
        // Find rightmost room
        while (!found && column >= 0) {
            attempts = 0;
            while (!found && attempts < attemptsMax) {
                randomRow = Math.floor(Math.random() * rows);
                if (map[randomRow][column] === 1) {
                    map[randomRow][column] = 3;
                    found = true;
                } else {
                    attempts++;
                }
            }
            if (!found) {
                column--;
            }
        }
    }
}

MapBoard.prototype.spawnPlayers = function(players) {
    console.log("Spawning Players");

    for (let player of players) {
        if (player.isSnatcher) {
            // Set the snatcher's currRoom to the middle room
            player.currRoom.x = Math.floor(this.rows / 2);
            player.currRoom.y = Math.floor(this.cols / 2);
            continue;
        }

        let randomX, randomY;
        let roomFound = false;

        while (!roomFound) {
            randomX = Math.floor(Math.random() * this.cols);
            randomY = Math.floor(Math.random() * this.rows);

            if (this.gameMap[randomY][randomX] === 1 && !this.inMiddleOfMap(randomX, randomY) && !this.isPlayerInRoom(players,randomX,randomY)) {
                roomFound = true;
                player.currRoom.x = randomX;
                player.currRoom.y = randomY;
            }
        }
    }

    //After determining rooms, place each player in the middle of their room
    for (let player of players) {
        player.currPos.x = global.canvasWidth / 2;
        player.currPos.y = global.canvasHeight / 2;
    }

    for (let player of players) {
        console.log("Player Spawned: " + JSON.stringify(player));
    }
}

MapBoard.prototype.inMiddleOfMap = function(x, y) {
    const middleGridStartX = Math.floor(this.rows / 2) - Math.floor(this.rows / 4);
    const middleGridStartY = Math.floor(this.cols / 2) - Math.floor(this.rows / 4);
    const middleGridEndX = middleGridStartX + Math.floor(this.rows / 2);
    const middleGridEndY = middleGridStartY +  Math.floor(this.cols / 2);

    return x >= middleGridStartX && x <= middleGridEndX && y >= middleGridStartY && y <= middleGridEndY;
}

MapBoard.prototype.isPlayerInRoom = function(players,x, y) {
    for (let player of players) {
        if(player.currRoom.x == x && player.currRoom.y == y){
            return true;
        }
    }
    return false;
}

MapBoard.prototype.sendSnatcherDoorInfo = function(gs) {
    const snatcher = gs.players.find(player => player.isSnatcher);
    const snatcherRoomX = snatcher.currRoom.x;
    const snatcherRoomY = snatcher.currRoom.y;

    //Right now this just finds the nearest player IF there is one in that direction 
    //and the player is within a certain radius

    //An alternative would be to find out how many rooms away the nearest player is in each direction
    //This might be nice but could aso be too easy?

    let nearestNorth = this.rows;
    let nearestSouth = this.rows;
    let nearestEast = this.cols;
    let nearestWest = this.cols;
    //This is a minimum radius around the snatcher for a door to light up.
    //Without this, a player could be 1 south & 10 east and the south door would be hot red which is too missleading
    //This also means doors will only light up if the snatcher is getting close
    const mustBeInRadius = Math.floor( ((this.rows + this.cols)/2) / 2);
    //console.log(mustBeInRadius);

    for (let player of gs.players) {
        if (!player.isSnatcher && player.currRoom.y < snatcherRoomY && this.isPlayerWithinRadius(snatcherRoomX,snatcherRoomY,mustBeInRadius,player)) {
            const distance = snatcherRoomY - player.currRoom.y;
            if (distance < nearestNorth) {
                nearestNorth = distance;
            }
        }
        if (!player.isSnatcher && player.currRoom.y > snatcherRoomY && this.isPlayerWithinRadius(snatcherRoomX,snatcherRoomY,mustBeInRadius,player)) {
            const distance = player.currRoom.y - snatcherRoomY;
            if (distance < nearestSouth) {
                nearestSouth = distance;
            }
        }
        if (!player.isSnatcher && player.currRoom.x > snatcherRoomX && this.isPlayerWithinRadius(snatcherRoomX,snatcherRoomY,mustBeInRadius,player)) {
            const distance = player.currRoom.x - snatcherRoomX;
            if (distance < nearestWest) {
                nearestWest = distance;
            }
        }
        if (!player.isSnatcher && player.currRoom.x < snatcherRoomX && this.isPlayerWithinRadius(snatcherRoomX,snatcherRoomY,mustBeInRadius,player)) {
            const distance = snatcherRoomX - player.currRoom.x;
            if (distance < nearestEast) {
                nearestEast = distance;
            }
        }
    }

    if(this.isRoom(this.gameMap,'north',snatcherRoomX,snatcherRoomY))
        nearestNorth = (nearestNorth/this.rows).toFixed(2);
    else
        nearestNorth = undefined;

    if(this.isRoom(this.gameMap,'south',snatcherRoomX,snatcherRoomY))
        nearestSouth = (nearestSouth/this.rows).toFixed(2);
    else
        nearestSouth = undefined;

    if(this.isRoom(this.gameMap,'east',snatcherRoomX,snatcherRoomY))
        nearestEast = (nearestEast/this.cols).toFixed(2);
    else
        nearestEast = undefined;

    if(this.isRoom(this.gameMap,'west',snatcherRoomX,snatcherRoomY))
        nearestWest = (nearestWest/this.cols).toFixed(2);
    else
        nearestWest = undefined;


    // console.log("Nearest North: " + nearestNorth);
    // console.log("Nearest South: " + nearestSouth);
    // console.log("Nearest East: " + nearestEast);
    // console.log("Nearest West: " + nearestWest);
    // console.log("-----Lower means closer-----");

    //Some fun calcuation to create the alpha values.
    var doorInfo = {
        north: (((1 - parseFloat(nearestNorth)) - 0.5) * 2),
        south: (((1 - parseFloat(nearestSouth)) - 0.5) * 2),
        east:  (((1 - parseFloat(nearestEast)) - 0.5) * 2),
        west:  (((1 - parseFloat(nearestWest)) - 0.5) * 2)
    };

    global.sendSnatcherDoorInfo(doorInfo);

}

MapBoard.prototype.isPlayerWithinRadius = function(snatcherRoomX,snatcherRoomY,radius,player){
    var playerRoomX = player.currRoom.x;
    var playerRoomY = player.currRoom.y;

    var distance = Math.sqrt(Math.pow((snatcherRoomX - playerRoomX),2) + Math.pow((snatcherRoomY - playerRoomY),2));

    if(distance <= radius)
        return true;
    else
        return false;
}

MapBoard.prototype.isRoom = function(map,location,col,row){
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

MapBoard.prototype.findOpenSpotInRoom = function(roomX, roomY) {

    var spot = {
        x: 0,
        y: 0,
        width: this.blockSize/2,
        height: this.blockSize/2
    };

    let spotFound = false;

    const solidObjectsInRoom = this.getSolidObjectsInRoom(roomX, roomY);

    var totalTrys = 1000; //If something DOES go wrong, we would rather the server crash then hang.
    while (!spotFound && totalTrys > 0) {
        let randX;
        do {
            randX = Math.floor(Math.random() * this.rows) * this.blockSize;
        } while (randX < (global.canvasWidth*.25) || randX > (global.canvasWidth*.75));
        let randY;
        do {
            randY = Math.floor(Math.random() * this.cols) * this.blockSize;
        } while (randY < (global.canvasHeight*.25) || randY > (global.canvasHeight*.75));
        spot.x = randX;
        spot.y = randY;

        // Check if the spot intersects with any solid object
        let intersects = false;
        for (let solidObject of solidObjectsInRoom) {
            if (spot.x < solidObject.x + solidObject.width &&
                spot.x + spot.width > solidObject.x &&
                spot.y < solidObject.y + solidObject.height &&
                spot.y + spot.height > solidObject.y) {
                intersects = true;
                break;
            }
        }
        if (!intersects) {
            spotFound = true;
        }
        totalTrys--;
        //console.log("Looking for spot in room " + roomX + ", " + roomY + "...");
    }

    if(totalTrys == 0){
        console.log("ERROR: Could not find a spot in room " + roomX + ", " + roomY + "!");
        //This is rare but can happen if the room is too full of solid objects
        return null;//This needs to be handled in any calling function
    }
    
    //Adjust the x,y to be in the middle of the spot instead of the top left corner
    return spot;
}

MapBoard.prototype.getSolidObjectsInRoom = function(x,y) {
    var solidObjects = global.solidObjects.get()[x+","+y];
    if(!solidObjects)
        return [];
    else
        return solidObjects;
}

MapBoard.prototype.get = function() {
    return this.gameMap;
}

MapBoard.prototype.getBlockSize = function() {
    return this.blockSize;
}

MapBoard.prototype.getAvailableRooms = function() {
    return this.availableRooms;
}

module.exports = MapBoard;