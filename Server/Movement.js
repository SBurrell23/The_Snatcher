function Movement() {
}

Movement.prototype.movePlayer = function(gs,map, id, direction) {
    var player = gs.players.find(player => player.id == id);
    if(player){
        switch(direction){
            case "up":
                if((player.currPos.y - player.speed >= 0)){
                    var destinationPos = player.currPos.y - player.speed;
                    if(this.checkForCollision(player,destinationPos,gs.solidObjects) == false)
                        player.currPos.y -= player.speed;
                } else {
                    this.movePlayerToNewRoom(player,map,player.currRoom.x,player.currRoom.y-1,"south");
                }
                break;
            case "down":
                if((player.currPos.y + player.speed <= global.canvasHeight)){
                    var destinationPos = player.currPos.y + player.speed;
                    if(this.checkForCollision(player,destinationPos,gs.solidObjects) == false)
                        player.currPos.y += player.speed;
                } else {
                    this.movePlayerToNewRoom(player,map,player.currRoom.x,player.currRoom.y+1,"north");
                }
                break;
            case "left":
                if((player.currPos.x - player.speed >= 0)){
                    var destinationPos = player.currPos.x - player.speed;
                    if(this.checkForCollision(player,destinationPos,gs.solidObjects) == false)
                        player.currPos.x -= player.speed;
                } else {
                    this.movePlayerToNewRoom(player,map,player.currRoom.x+1,player.currRoom.y,"east");
                }
                break;
            case "right":
                if((player.currPos.x + player.speed <= global.canvasWidth)){
                    var destinationPos = player.currPos.x + player.speed;
                    if(this.checkForCollision(player,destinationPos,gs.solidObjects) == false)
                        player.currPos.x += player.speed;
                } else {
                    this.movePlayerToNewRoom(player,map,player.currRoom.x-1,player.currRoom.y,"west");
                }
                break;
        }
    }
}

Movement.prototype.movePlayerToNewRoom = function(player,map, newXRoom, newYRoom, directionToSpawn) {

    if (map[newYRoom][newXRoom] > 0) { // Room is not empty.
        //console.log("Player " + player.name + " moved to " + newYRoom + ", " + newXRoom);
        player.currRoom.x = newXRoom;
        player.currRoom.y = newYRoom;

        // Set player's current position near the directionToSpawn
        switch (directionToSpawn) {
            case 'north':
                player.currPos.y = 0;
                break;
            case 'south':
                player.currPos.y = global.canvasHeight;
                break;
            case 'east':
                player.currPos.x = global.canvasWidth;
                break;
            case 'west':
                player.currPos.x = 0;
                break;
            default:
                player.currPos.x = global.canvasWidth / 2;
                player.currPos.y = global.canvasHeight / 2;
                break;
        }
    } else {
        //console.log("Player " + player.name + " cannot move to this room!");
    }
}

Movement.prototype.checkForCollision = function(player, destinationPos, solidObjects) {
    for (var i = 0; i < solidObjects.length; i++) {
        var solidObject = solidObjects[i];
        if (
            //update this so the desitionPos passes both the X AND Y variables...
            destinationPos >= solidObject.y &&
            destinationPos <= solidObject.y + solidObject.height &&
            destinationPos >= solidObject.x &&
            destinationPos <= solidObject.x + solidObject.width
        ) {
            return true;
        }
    }
    return false;
}


Movement.prototype.didPlayerTouchSnatcher = function(gs, id) {
    var player = gs.players.find(player => player.id == id);
    if(player){
        if(player.currRoom.x == gs.theSnatcher.currRoom.x && player.currRoom.y == gs.theSnatcher.currRoom.y){
            if(player.currPos.x >= gs.theSnatcher.currPos.x - 50 && player.currPos.x <= gs.theSnatcher.currPos.x + 50){
                if(player.currPos.y >= gs.theSnatcher.currPos.y - 50 && player.currPos.y <= gs.theSnatcher.currPos.y + 50){
                    return true;
                }
            }
        }
    }
    return false;
}

module.exports = Movement;