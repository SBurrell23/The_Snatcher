const Items = require('./Items.js');

function Movement() {
    
}

Movement.prototype.movePlayer = function(gs,map, id, direction,deltaTime) {
    var player = gs.players.find(player => player.id == id);
    if(player){
        let moveAmount = player.speed * deltaTime; // Units per second
        //console.log("Moving player " + player.name + " at speed " + moveAmount);

        if(direction == "u" || direction == "ul" || direction == "ur"){
                player.lastDirection = "north";
                if((player.currPos.y - moveAmount >= 0)){
                    var destPosY = player.currPos.y - moveAmount;
                    var destPosX = player.currPos.x;
                    if(!this.checkForWallCollision(player,destPosX,destPosY)){
                        player.currPos.y = destPosY;
                        new Items().checkForItemCollision(player,false);
                        this.checkForPlayerCollision(gs,player);
                    }
                } else {
                    this.movePlayerToNewRoom(gs,player,map,player.currRoom.x,player.currRoom.y-1,"south");
                }
        }
        if(direction == "d" || direction == "dl" || direction == "dr"){
                player.lastDirection = "south";
                if((player.currPos.y + moveAmount <= global.canvasHeight)){
                    var destPosY = player.currPos.y + moveAmount;
                    var destPosX = player.currPos.x;
                    if(!this.checkForWallCollision(player,destPosX,destPosY)){
                        player.currPos.y = destPosY;
                        new Items().checkForItemCollision(player,false);
                        this.checkForPlayerCollision(gs,player);
                    }
                } else {
                    this.movePlayerToNewRoom(gs,player,map,player.currRoom.x,player.currRoom.y+1,"north");
                }
        }
        if(direction == "l" || direction == "ul" || direction == "dl"){
                player.lastDirection = "west";
                if((player.currPos.x - moveAmount >= 0)){
                    var destPosX = player.currPos.x - moveAmount;
                    var destPosY = player.currPos.y;
                    if(!this.checkForWallCollision(player,destPosX,destPosY)){
                        player.currPos.x = destPosX;
                        new Items().checkForItemCollision(player,false);
                        this.checkForPlayerCollision(gs,player);
                    }
                } else {
                    this.movePlayerToNewRoom(gs,player,map,player.currRoom.x+1,player.currRoom.y,"east");
                }
        }
        if(direction == "r" || direction == "ur" || direction == "dr"){
                player.lastDirection = "east";
                if((player.currPos.x + moveAmount <= global.canvasWidth)){
                    var destPosX = player.currPos.x + moveAmount
                    var destPosY = player.currPos.y;
                    if(!this.checkForWallCollision(player,destPosX,destPosY)){
                        player.currPos.x = destPosX;
                        new Items().checkForItemCollision(player,false);
                        this.checkForPlayerCollision(gs,player);
                    }
                } else {
                    this.movePlayerToNewRoom(gs,player,map,player.currRoom.x-1,player.currRoom.y,"west");
                }
        }
        
    }
}

Movement.prototype.movePlayerToNewRoom = function(gs,player,map, newXRoom, newYRoom, directionToSpawn) {

    if(player.isAlive == false)
        return;
    
    if (map[newYRoom][newXRoom] > 0) { // Room is not empty.
        //console.log("Player " + player.name + " moved to " + newYRoom + ", " + newXRoom);
        player.currRoom.x = newXRoom;
        player.currRoom.y = newYRoom;


        global.map.sendSnatcherDoorInfo(gs);

        // Set player's current position near the directionToSpawn
        switch (directionToSpawn) {
            case 'north':
                player.currPos.y = 0;
                global.sendItemsToClientsInRoom(player.currRoom.x,player.currRoom.y);
                break;
            case 'south':
                player.currPos.y = global.canvasHeight;
                global.sendItemsToClientsInRoom(player.currRoom.x,player.currRoom.y);
                break;
            case 'east':
                player.currPos.x = global.canvasWidth;
                global.sendItemsToClientsInRoom(player.currRoom.x,player.currRoom.y);
                break;
            case 'west':
                player.currPos.x = 0;
                global.sendItemsToClientsInRoom(player.currRoom.x,player.currRoom.y);
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

Movement.prototype.checkForWallCollision = function(player, destPosX, destPosY) {
    
    // Calculate the boundaries of the player's circle
    var playerLeft = destPosX - player.radius;
    var playerRight = destPosX + player.radius;
    var playerTop = destPosY - player.radius;
    var playerBottom = destPosY + player.radius;

    // Check for collision with each solid object
    var solidObjects = global.map.getSolidObjectsInRoom(player.currRoom.x, player.currRoom.y);
    if(solidObjects == undefined)
        return false;

    for (var i = 0; i < solidObjects.length; i++) {
        var object = solidObjects[i];

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

Movement.prototype.checkForPlayerCollision = function(gs, player) {
    //If the player is not the snatcher, we don't really care since friendly players CAN collide
    if(player.isSnatcher == false)
        return;

    var otherPlayers = gs.players.filter(otherPlayer => otherPlayer.id != player.id && otherPlayer.currRoom.x == player.currRoom.x && otherPlayer.currRoom.y == player.currRoom.y);
    otherPlayers.forEach(snatchedPlayer => {
        if (
            player.currPos.x + player.radius >= snatchedPlayer.currPos.x - snatchedPlayer.radius &&
            player.currPos.x - player.radius <= snatchedPlayer.currPos.x + snatchedPlayer.radius &&
            player.currPos.y + player.radius >= snatchedPlayer.currPos.y - snatchedPlayer.radius &&
            player.currPos.y - player.radius <= snatchedPlayer.currPos.y + snatchedPlayer.radius
        ) {
            if(snatchedPlayer.hasKeys.length > 0)
                new Items().dropKeys(gs,snatchedPlayer.id,false);
            if(snatchedPlayer.hasItem)
                new Items().dropItem(gs,snatchedPlayer.id,false);
            
            snatchedPlayer.currPos.x = -1000;
            snatchedPlayer.currPos.y = -1000;
            snatchedPlayer.currRoom.x = -1000;
            snatchedPlayer.currRoom.y = -1000;
            snatchedPlayer.isAlive = false;
            player.points += global.pointsForSnatching;
            console.log("The snatcher has SNATCHED " + snatchedPlayer.name + "!!! RIP!!!");
            global.map.sendSnatcherDoorInfo(gs);
            global.checkForGameOver('snatched');
        }
    });
}

module.exports = Movement;