
function Items() {
}

Items.prototype.spawnItems = function(gs) {
    console.log("Spawning Items");

    global.items = [];
    var gameMap = global.map.get();
    console.log(gameMap);

    //Name, number of items, width, height
    //We MUST spawn the exit doors 1st so we don't accidentally spawn another item in the room first
    this.createItems('exitdoor','all', 2, 76,150); //2 exit doors ONLY!
    this.createItems('key','all', 20, 30,20);

    this.createItems('pf_flyers','runner', 9, 50,50);
    this.createItems('the_button','runner', 9, 50,50);
    this.createItems('magic_monocle','runner', 9, 50,50);

    this.createItems('bbq_chili','snatcher', 2, 50,50);
    this.createItems('spare_eyeballs','snatcher', 2, 50,50);
    this.createItems('kill_the_power','snatcher', 2, 50,50);
    

    for (let item of global.items) {

        if(item.type == 'exitdoor'){
            var exitDoorRoom = this.findExitDoorRoom();
            item.currRoom.x = exitDoorRoom.x;
            item.currRoom.y = exitDoorRoom.y;
            console.log("Exit Door: " + JSON.stringify(item));
            continue;
        }

        let randomX, randomY;
        let roomFound = false;

        while (!roomFound) {
            randomX = Math.floor(Math.random() * gameMap[0].length);
            randomY = Math.floor(Math.random() * gameMap.length);
            if (
                gameMap[randomY][randomX] === 1 && 
                !this.isPlayerInRoom(gs.players,randomX,randomY) &&
                !this.isItemInRoom(randomX,randomY)
                ) {
                roomFound = true;
                item.currRoom.x = randomX;
                item.currRoom.y = randomY;
                console.log("Item Spawned: " + JSON.stringify(item));
            }
        }
    }
}

Items.prototype.createItems = function(type,whoIsFor,numItems,width,height) {
    for (let i = 1; i <= numItems; i++) {
        global.items.push({
            type: type,
            id: type + (global.items.length + 1),
            currPos: {
                x: (global.canvasWidth / 2) - Math.ceil(width / 2),
                y: (global.canvasHeight / 2) - Math.ceil(height / 2)
            },
            currRoom: {
                x: -1,
                y: -1
            },
            width: width,
            height:height,
            ownerId: -1,
            isConsumed: false,
            specialCount: 0,
            whoIsFor:whoIsFor
        });
    }
}

Items.prototype.findExitDoorRoom = function() {
    var gameMap = global.map.get();
    for (let y = 0; y < gameMap.length; y++) {
        for (let x = 0; x < gameMap[y].length; x++) {
            if (gameMap[y][x] == 3 && !this.isItemInRoom(x, y)) {
                return { x: x, y: y };
            }
        }
    }
    return null; // Return null if no room with a value of 3 is found or if there is already an exit door item in the room
}

Items.prototype.isItemInRoom = function(x, y) {
    for (let item of global.items) {
        if(item.currRoom.x == x && item.currRoom.y == y){
            return true;
        }
    }
    return false;
}

Items.prototype.isPlayerInRoom = function(players,x, y) {
    for (let player of players) {
        if(player.currRoom.x == x && player.currRoom.y == y){
            return true;
        }
    }
    return false;
}

Items.prototype.get = function() {
    return global.items;
}

module.exports = Items;