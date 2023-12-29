const GameMap = {
    generateMap: function(){
        console.log("Generating New Map");

        var map = [];
        const rows = 26;
        const cols = 26;
        const totalRooms = Math.floor((rows*cols) * .65); //Should not be > then ~.85
        const middleSize = 2; //Probably should stay as 2

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

        // THen add random rooms on the edges until roomCount reaches totalRooms
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


        //Set the middle room to be the starting room (for the snatcher)
        var startingRoomType = 2;
        map[Math.floor(rows / 2)][Math.floor(cols / 2)] = startingRoomType;


        //Decide if we want to spawn the doors N/S or E/W
        const leftOrRightDoorSpawns = Math.floor(Math.random() * 2) + 1;

        //Spawn the doors on the top and bottom of the map
        if(leftOrRightDoorSpawns == 1){
            // Find the topmost 1 room and set it to 3
            let topmostRoomFound = false;
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    if (map[i][j] === 1) {
                        map[i][j] = 3;
                        topmostRoomFound = true;
                        break;
                    }
                }
                if (topmostRoomFound) {
                    break;
                }
            }
            // Find the bottommost 1 room and set it to 3
            let bottommostRoomFound = false;
            for (let i = rows - 1; i >= 0; i--) {
                for (let j = 0; j < cols; j++) {
                    if (map[i][j] === 1) {
                        map[i][j] = 3;
                        bottommostRoomFound = true;
                        break;
                    }
                }
                if (bottommostRoomFound) {
                    break;
                }
            }
        }

        //Spawn the doors on the left and right of the map
        if(leftOrRightDoorSpawns == 2){
            // Find the leftmost 1 room and set it to 3
            let leftmostRoomFound = false;
            for (let j = 0; j < cols; j++) {
                for (let i = 0; i < rows; i++) {
                    if (map[i][j] === 1) {
                        map[i][j] = 3;
                        leftmostRoomFound = true;
                        break;
                    }
                }
                if (leftmostRoomFound) {
                    break;
                }
            }

            // Find the rightmost 1 room and set it to 3
            let rightmostRoomFound = false;
            for (let j = cols - 1; j >= 0; j--) {
                for (let i = 0; i < rows; i++) {
                    if (map[i][j] === 1) {
                        map[i][j] = 3;
                        rightmostRoomFound = true;
                        break;
                    }
                }
                if (rightmostRoomFound) {
                    break;
                }
            }
        }

        //Finally, a good lookin' map!
        return map;
    }
};

module.exports = GameMap;