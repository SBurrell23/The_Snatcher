function Movement() {
}

Movement.prototype.movePlayer = function(gs,map, id, direction,solidObjects) {
    var player = gs.players.find(player => player.id == id);
    if(player){
        switch(direction){
            case "up":
                if((player.currPos.y - player.speed >= 0)){
                    var destPosY = player.currPos.y - player.speed;
                    var destPosX = player.currPos.x;
                    if(!this.checkForCollision(player,destPosX,destPosY,solidObjects))
                        player.currPos.y = destPosY;
                } else {
                    this.movePlayerToNewRoom(player,map,player.currRoom.x,player.currRoom.y-1,"south");
                }
                break;

            case "down":
                if((player.currPos.y + player.speed <= global.canvasHeight)){
                    var destPosY = player.currPos.y + player.speed;
                    var destPosX = player.currPos.x;
                    if(!this.checkForCollision(player,destPosX,destPosY,solidObjects))
                        player.currPos.y = destPosY;
                } else {
                    this.movePlayerToNewRoom(player,map,player.currRoom.x,player.currRoom.y+1,"north");
                }
                break;

            case "left":
                if((player.currPos.x - player.speed >= 0)){
                    var destPosX = player.currPos.x - player.speed;
                    var destPosY = player.currPos.y;
                    if(!this.checkForCollision(player,destPosX,destPosY,solidObjects))
                        player.currPos.x = destPosX;
                } else {
                    this.movePlayerToNewRoom(player,map,player.currRoom.x+1,player.currRoom.y,"east");
                }
                break;

            case "right":
                if((player.currPos.x + player.speed <= global.canvasWidth)){
                    var destPosX = player.currPos.x + player.speed
                    var destPosY = player.currPos.y;
                    if(!this.checkForCollision(player,destPosX,destPosY,solidObjects))
                        player.currPos.x = destPosX;
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

Movement.prototype.checkForCollision = function(player, destPosX, destPosY, solidObjects) {
    
    // Calculate the boundaries of the player's circle
    var playerLeft = destPosX - player.radius;
    var playerRight = destPosX + player.radius;
    var playerTop = destPosY - player.radius;
    var playerBottom = destPosY + player.radius;

    // Check for collision with each solid object
    for (var i = 0; i < solidObjects.length; i++) {
        var object = solidObjects[i];

        if (object.roomXY[0] != player.currRoom.x || object.roomXY[1] != player.currRoom.y) {
            continue; // Skip solid objects in other rooms
        }

        // Calculate the boundaries of the solid object's rectangle
        var objectLeft = object.x;
        var objectRight = object.x + object.width;
        var objectTop = object.y;
        var objectBottom = object.y + object.height;

        // Check for overlap between the player's circle and the solid object's rectangle
        if (playerLeft < objectRight && playerRight > objectLeft && playerTop < objectBottom && playerBottom > objectTop) {
            return true; // Collision detected
        }
    }

    return false; // No collision detected
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