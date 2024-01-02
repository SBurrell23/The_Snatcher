function Movement() {
}

Movement.prototype.movePlayer = function(gs,map, id, direction,solidObjects) {
    var player = gs.players.find(player => player.id == id);
    if(player){
        //console.log("Moving player " + player.name + " at speed " + player.speed);
        switch(direction){
            case "up":
                if((player.currPos.y - player.speed >= 0)){
                    var destPosY = player.currPos.y - player.speed;
                    var destPosX = player.currPos.x;
                    if(!this.checkForWallCollision(player,destPosX,destPosY,solidObjects)){
                        player.currPos.y = destPosY;
                        this.checkForItemCollision(player,false);
                        this.checkForPlayerCollision(gs,player);
                    }
                } else {
                    this.movePlayerToNewRoom(player,map,player.currRoom.x,player.currRoom.y-1,"south");
                }
                break;

            case "down":
                if((player.currPos.y + player.speed <= global.canvasHeight)){
                    var destPosY = player.currPos.y + player.speed;
                    var destPosX = player.currPos.x;
                    if(!this.checkForWallCollision(player,destPosX,destPosY,solidObjects)){
                        player.currPos.y = destPosY;
                        this.checkForItemCollision(player,false);
                        this.checkForPlayerCollision(gs,player);
                    }
                } else {
                    this.movePlayerToNewRoom(player,map,player.currRoom.x,player.currRoom.y+1,"north");
                }
                break;

            case "left":
                if((player.currPos.x - player.speed >= 0)){
                    var destPosX = player.currPos.x - player.speed;
                    var destPosY = player.currPos.y;
                    if(!this.checkForWallCollision(player,destPosX,destPosY,solidObjects)){
                        player.currPos.x = destPosX;
                        this.checkForItemCollision(player,false);
                        this.checkForPlayerCollision(gs,player);
                    }
                } else {
                    this.movePlayerToNewRoom(player,map,player.currRoom.x+1,player.currRoom.y,"east");
                }
                break;

            case "right":
                if((player.currPos.x + player.speed <= global.canvasWidth)){
                    var destPosX = player.currPos.x + player.speed
                    var destPosY = player.currPos.y;
                    if(!this.checkForWallCollision(player,destPosX,destPosY,solidObjects)){
                        player.currPos.x = destPosX;
                        this.checkForItemCollision(player,false);
                        this.checkForPlayerCollision(gs,player);
                    }
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

Movement.prototype.checkForWallCollision = function(player, destPosX, destPosY, solidObjects) {
    
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
                this.dropKeys(gs,snatchedPlayer.id,false);
            if(snatchedPlayer.hasItem)
                this.dropItem(gs,snatchedPlayer.id,false);
            snatchedPlayer.currPos.x = -1000;
            snatchedPlayer.currPos.y = -1000;
            snatchedPlayer.isAlive = false;
            player.points += global.pointsForSnatching;
            console.log("The snatcher has SNATCHED " + snatchedPlayer.name + "!!! RIP!!!");
            global.checkForGameOver('snatched');
        }
    });
}

Movement.prototype.checkForItemCollision = function(player, pickupRequested) {
    var items = global.items.filter(item => item.currRoom.x == player.currRoom.x && item.currRoom.y == player.currRoom.y);
    items.forEach(item => {
        if (item.ownerId == -1) { //The item is -1 if it is on the ground
            if (
                player.currPos.x + player.radius >= item.currPos.x &&
                player.currPos.x - player.radius <= item.currPos.x + item.width &&
                player.currPos.y + player.radius >= item.currPos.y &&
                player.currPos.y - player.radius <= item.currPos.y + item.height
            ) {
                this.pickupItemIfAllowed(player,item,pickupRequested);
            }
        }
    });
}

Movement.prototype.pickupItemIfAllowed = function(player, item, pickupRequested) {

    const pRoomX = player.currRoom.x;
    const pRoomY = player.currRoom.y;
    
    if (item.type == "key" && player.hasKeys.length < 2 && !item.isConsumed && !player.isSnatcher){
        this.putItemInPlayerInventory(player,item);
        
        console.log("Player " + player.name + " picked up item " + item.id);
        global.sendItemsToClientsInRoom(pRoomX,pRoomY);
    }
    else if(item.type == "exitdoor"){
        if(player.hasKeys.length > 0 && item.specialCount < global.keysNeededToOpenDoor ){

            player.hasKeys = [];
            //Set the players inventory to 0 and go through and use each keyItem on the exit door
            var keyItems = global.items.filter(item => item.type == "key" && item.ownerId == player.id && item.isConsumed == false);
            
            for(var i = 0; i < keyItems.length; i++){
                var keyItem = keyItems[i];
                keyItem.isConsumed = true;
                keyItem.ownerId = -1;
                item.specialCount += 1;
                player.points += global.pointsForKeyAddedToDoor;
                console.log("Player added key to the exit door at " + item.currRoom.x + ", " + item.currRoom.y + "!");
                console.log(JSON.stringify(item));
                global.sendItemsToClientsInRoom(pRoomX,pRoomY);
                if(item.specialCount >= global.keysNeededToOpenDoor )
                    break;
            }
            
        }

        if(item.specialCount >= global.keysNeededToOpenDoor  && player.isAlive){
            player.currPos.x = -1000;
            player.currPos.y = -1000;
            player.isAlive = false;
            player.points += global.pointsForEscape;
            player.rWins += 1;
            console.log("Player " + player.name + " has escaped through the exit door at " + item.currRoom.x + ", " + item.currRoom.y + "!");
            global.sendItemsToClientsInRoom(pRoomX,pRoomY);
            global.checkForGameOver('escaped');
        }
    }
    else if (
        (item.type == 'pf_flyers' || item.type == "the_button" || item.type == "magic_monocle") &&
        !player.hasItem && 
        pickupRequested && 
        !item.isConsumed && 
        !player.isSnatcher
        ){
        this.putItemInPlayerInventory(player,item);
        console.log("Player " + player.name + " picked up item " + item.id);
        global.sendItemsToClientsInRoom(pRoomX,pRoomY);
    }

}

Movement.prototype.putItemInPlayerInventory = function(player,item) {
    item.ownerId = player.id;
    item.currRoom.x = -1;
    item.currRoom.y = -1;
    item.currPos.x = -1000;
    item.currPos.y = -1000;

    if(item.type == "key")
        player.hasKeys.push(true);
    else{
        player.hasItem = {
            type: item.type,
            id: item.id
        };
    }
}

Movement.prototype.pickupItem = function(gs, playerId) {
    var player = gs.players.find(player => player.id == playerId);
    this.checkForItemCollision(player,true);
}

Movement.prototype.dropItem = function(gs, playerId, checkForSwap) {
    var player = gs.players.find(player => player.id === playerId);
    player.hasItem = undefined;

    for (let item of global.items) {
        if(item.type != "key" && item.type != "door"){
            if(item.ownerId == playerId){
                console.log("Player " + player.name + " dropped item " + item.id);

                //A quick sneaky check to see if a player is currently on another item
                //If yes, we pick it up before resetting the old item (A HOT SWAP!)
                if(checkForSwap)
                    this.checkForItemCollision(player,true);
                item.ownerId = -1;
                item.isConsumed = false;
                item.currPos.x = player.currPos.x - player.radius;
                item.currPos.y = player.currPos.y;
                item.currRoom.x = player.currRoom.x;
                item.currRoom.y = player.currRoom.y;
                
                global.sendItemsToClientsInRoom(player.currRoom.x,player.currRoom.y);
                return;
            }
        }
    }
}

Movement.prototype.dropKeys = function(gs, playerId) {
    var player = gs.players.find(player => player.id === playerId);
    player.hasKeys = [];

    var keyNum = -20;
    var additionalOffset = -15
    for (let item of global.items) {
        if(item.type == "key" && item.ownerId == playerId){
            console.log("Player " + player.name + " dropped item " + item.id);
            item.ownerId = -1;
            item.isConsumed = false;
            item.currPos.x = player.currPos.x - player.radius + keyNum;
            item.currPos.y = player.currPos.y + additionalOffset;
            item.currRoom.x = player.currRoom.x;
            item.currRoom.y = player.currRoom.y;
            keyNum += 50;
            additionalOffset += 15;
        }
    }
    global.sendItemsToClientsInRoom(player.currRoom.x,player.currRoom.y);
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