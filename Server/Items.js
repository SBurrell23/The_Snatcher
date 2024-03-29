
const Event = require('./Event.js');

function Items() {
}

Items.prototype.spawnItems = function(gs) {
    console.log("Spawning Items");

    global.items = [];
    var gameMap = global.map.get();
    //console.log(gameMap);

    var availableRooms = global.map.getAvailableRooms();

    //Name, number of items, width, height
    //We MUST spawn the exit doors 1st so we don't accidentally spawn another item in the room first
    this.createItems(gs,'exitdoor','all', 2, 82,82); //2 exit doors ONLY!

    const itemSize = global.map.getBlockSize() *  .8;

    var numKeys = (gs.players.length - 1) * 5 + 5;
    this.createItems(gs,'key','all', numKeys, itemSize,itemSize);

    var numPlayerItems = Math.floor((availableRooms/2)/3);//2nd num should be num player items
    this.createItems(gs,'pf_flyers','runner', numPlayerItems, itemSize,itemSize);
    this.createItems(gs,'the_button','runner', numPlayerItems, itemSize,itemSize);
    this.createItems(gs,'magic_monocle','runner', numPlayerItems, itemSize,itemSize);

    var numSnatcherItems = Math.floor((availableRooms/4)/4);//2nd num should be num snatcher items
    this.createItems(gs,'book_of_the_dead','snatcher', numSnatcherItems, itemSize,itemSize);
    this.createItems(gs,'bbq_chili','snatcher', numSnatcherItems + 3, itemSize,itemSize);
    this.createItems(gs,'spare_eyeballs','snatcher', numSnatcherItems, itemSize,itemSize);
    this.createItems(gs,'kill_the_power','snatcher', numSnatcherItems, itemSize,itemSize);
    
    //check to make sure available rooms is less then num items with some margin for error..
    while(global.items.length > (availableRooms-10)){ //10 Is a buffer zone of empty rooms we want to keep just because..
        console.log("Not enough rooms to spawn items! " + availableRooms + " rooms available and " + global.items.length + " items to spawn!");
        //This will only trim runner items as to not remove keys/doors/snatcher items are more limited anyway
        this.trimItemsIftooMany();
    }


    var itemCounts = {};

    for (let item of global.items) {
        if (itemCounts[item.type]) {
            itemCounts[item.type]++;
        } else {
            itemCounts[item.type] = 1;
        }
    }

    console.log("Item Counts:", itemCounts);

    console.log("Spawning " + global.items.length + " items in " + availableRooms + " rooms");

    for (let item of global.items) {

        if(item.type == 'exitdoor'){
            var exitDoorRoom = this.findExitDoorRoom();
            item.currRoom.x = exitDoorRoom.x;
            item.currRoom.y = exitDoorRoom.y;
            item.currPos.x = (global.canvasWidth / 2) - Math.ceil(item.width / 2);
            item.currPos.y = (global.canvasHeight / 2) - Math.ceil(item.height / 2);
            //console.log("Exit Door: " + JSON.stringify(item));
            continue;
        }

        let randomX, randomY;
        let roomFound = false;
        
        while (!roomFound) { //We can't give up spanwing 
            randomX = Math.floor(Math.random() * gameMap[0].length);
            randomY = Math.floor(Math.random() * gameMap.length);
            if (
                gameMap[randomY][randomX] === 1 && 
                !this.isPlayerInRoom(gs.players,randomX,randomY) &&
                !this.isItemInRoom(randomX,randomY)
                ) {

                var spot = global.map.findOpenSpotInRoom(randomX,randomY);
                if(spot == null){
                    console.log("Couldn't find an open spot in room " + randomX + ", " + randomY + " for item " + item.id + " trying new room..");
                }else{
                    roomFound = true;

                    item.currPos.x = (spot.x + Math.floor((global.map.getBlockSize() - item.width) / 2)) - 5;
                    item.currPos.y = (spot.y + Math.floor((global.map.getBlockSize() - item.height) / 2)) - 5;
    
                    item.currRoom.x = randomX;
                    item.currRoom.y = randomY;
                    //console.log("Item Spawned: " + JSON.stringify(item));
                }
            }
        }
    }
    console.log("Finished Spawning Items");
}


Items.prototype.createItems = function(gs,type,whoIsFor,numItems,width,height) {

    gs.lm = "unearthing treasures " + global.items.length;
    global.sendAllClientsGS();

    var doesItemStartInChest = true;
    var specialCount2 = 0;

    for (let i = 1; i <= numItems; i++) {
        if(type == 'exitdoor')
            doesItemStartInChest = false;
        if(type == 'exitdoor')
            specialCount2 = global.keysNeededToOpenDoor;
        global.items.push({
            type: type,
            id: type + (global.items.length + 1),
            currPos: {
                x: -1,
                y: -1
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
            specialCount2: specialCount2,
            whoIsFor:whoIsFor,
            inChest:doesItemStartInChest,
            skillCheckInProgress:false
        });
    }
}

Items.prototype.useItem = function(gs, playerId) {
    var player = gs.players.find(player => player.id == playerId);
    var item = global.items.find(item => (item.ownerId == player.id && item.type != "key" && item.type != "door"));
    if(item)
        new Event().triggerItemEvent(gs,player,item);
}

Items.prototype.trimItemsIftooMany = function() {
    var index = global.items.findIndex(item => item.type === 'pf_flyers');
    if (index !== -1) global.items.splice(index, 1);

    index = global.items.findIndex(item => item.type === 'the_button');
    if (index !== -1) global.items.splice(index, 1);

    index = global.items.findIndex(item => item.type === 'magic_monocle');
    if (index !== -1) global.items.splice(index, 1);
}

Items.prototype.pickupItemIfAllowed = function(player, item, pickupRequested) {

    const pRoomX = player.currRoom.x;
    const pRoomY = player.currRoom.y;
    
    if (item.type == "key" && player.hasKeys.length < 2 && !item.isConsumed && !player.isSnatcher){
        this.putItemInPlayerInventory(player,item);
        
        sendSoundToClient(player.id,"keyPickup");
        console.log("Player " + player.name + " picked up item " + item.id);
        global.sendItemsToClientsInRoom(pRoomX,pRoomY);
    }
    else if(item.type == "exitdoor"){
        if(player.hasKeys.length > 0 && item.specialCount < global.keysNeededToOpenDoor ){

            // The player must be moving on the exit door to unlock it
            if(player.hasKeys[0] <= 800){
                if(player.hasKeys[0] == 150){
                    global.sendEventToSnatcher("eventMessage",{
                        text: "A player is unlocking an escape passage!"
                    });
                    global.sendEventToClient("eventMessage",player.id,{
                        text: "The snatcher hears you unlocking the passage!"
                    });
                }
                player.hasKeys[0] += 1.5;
            }else{
                player.hasKeys.shift();
                //Set the players inventory to 0 and go through and use the first found item key on the door
                var keyItems = global.items.filter(item => item.type == "key" && item.ownerId == player.id && item.isConsumed == false);
                for(var i = 0; i < keyItems.length; i++){
                    var keyItem = keyItems[i];
                    keyItem.isConsumed = true;
                    keyItem.ownerId = -1;
                    item.specialCount += 1;
                    player.points += global.pointsForKeyAddedToDoor;
                    sendSoundToClient(player.id,"keyAdded");
                    console.log("Player added key to the exit door at " + item.currRoom.x + ", " + item.currRoom.y + "!");
                    console.log(JSON.stringify(item));
                    global.sendItemsToClientsInRoom(pRoomX,pRoomY);
                    if(item.specialCount >= global.keysNeededToOpenDoor){
                        global.sendEventToAllClients("eventMessage", {
                            text: player.name + " opened an escape passage! All runners are revealed!"
                        });
                        global.sendEventToSnatcher("bbq_chili",{revealTime: 4000});
                        //This is really to just show the exit door on the snatchers map
                        global.sendEventToAllClients("exitDoorData", item);    
                        break;
                    }else{
                        global.sendEventToAllClients("eventMessage", {
                            text: player.name + " has added a key to an escape passage!"
                        });
                    }
                    break; //This is a little hack so only one key is used per unlock
                }
            }
            
        }

        if(item.specialCount >= global.keysNeededToOpenDoor && player.isAlive && pickupRequested && !player.isSnatcher){
            player.currPos.x = -1000;
            player.currPos.y = -1000;
            setTimeout(function() {
                player.currRoom.x = -1000;
                player.currRoom.y = -1000;
            }, 1000);
            player.isAlive = false;
            player.points += global.pointsForEscape;
            console.log("Player " + player.name + " has escaped through the exit door at " + item.currRoom.x + ", " + item.currRoom.y + "!");
            global.sendEventToAllClients("eventMessage", {
                text: player.name + " has escaped through an exit door!"
            });
            global.sendItemsToClientsInRoom(pRoomX,pRoomY);
            global.checkForGameOver('escaped');
        }
    }
    else if (item.whoIsFor == 'runner' && !player.hasItem && pickupRequested && !item.isConsumed && !player.isSnatcher){
        this.putItemInPlayerInventory(player,item);
        console.log("Player " + player.name + " picked up item " + item.id);
        global.sendItemsToClientsInRoom(pRoomX,pRoomY);
    }
    else if (
        (item.whoIsFor == 'snatcher') &&
        !player.hasItem && 
        pickupRequested && 
        !item.isConsumed && 
        player.isSnatcher
        ){
        this.putItemInPlayerInventory(player,item);
        console.log("Player " + player.name + " picked up item " + item.id);
        global.sendItemsToClientsInRoom(pRoomX,pRoomY);
    }

}

Items.prototype.skillCheckResult = function(gs,playerId,itemId,result){
    var player = gs.players.find(player => player.id == playerId);
    var item = global.items.find(item => item.id == itemId);
    if(!player || player.isAlive == false)
        return;
    const pRoomX = player.currRoom.x;
    const pRoomY = player.currRoom.y;

    if(result == 'success'){
        item.inChest = false;
        item.skillCheckInProgress = false;
        console.log("Player succeeded skillcheck!");
    }else{
        item.skillCheckInProgress = false;
        new Event().triggerFailedSkillCheck(gs,player);
        console.log("Player failed skillcheck!");
    }
    global.sendItemsToClientsInRoom(pRoomX,pRoomY);
}

Items.prototype.putItemInPlayerInventory = function(player,item) {
    item.ownerId = player.id;
    item.currRoom.x = -1;
    item.currRoom.y = -1;
    item.currPos.x = -2000;
    item.currPos.y = -2000;

    if(item.type == "key")
        player.hasKeys.push(0);
    else{
        sendSoundToClient(player.id,"itemPickupOrDrop");
        player.hasItem = {
            type: item.type,
            id: item.id
        };
    }
}

Items.prototype.isItemStillInChest = function(player){
    var items = global.items.filter(item => item.currRoom.x == player.currRoom.x && item.currRoom.y == player.currRoom.y);
    var wellIsItBuddy = false;
    items.forEach(item => {
        if (item.ownerId == -1 && item.inChest) { //The item is -1 if it is on the ground
            if (
                player.currPos.x + player.radius >= item.currPos.x &&
                player.currPos.x - player.radius <= item.currPos.x + item.width &&
                player.currPos.y + player.radius >= item.currPos.y &&
                player.currPos.y - player.radius <= item.currPos.y + item.height
            ) {
                if(
                    item.skillCheckInProgress == false &&
                    (player.isSnatcher == false && item.whoIsFor == 'runner') ||
                    (player.isSnatcher == true && item.whoIsFor == 'snatcher')
                ){
                    console.log("Player " + player.name + " started skillcheck for item " + item.id);
                    wellIsItBuddy = true;
                    item.skillCheckInProgress = true;
                    new Event().triggerSkillCheck(player,item);
                }
                
            }
        }
    });
    return wellIsItBuddy;
}

Items.prototype.pickupItem = function(gs, playerId) {
    var player = gs.players.find(player => player.id == playerId);

    if(this.isItemStillInChest(player)) //We start the skillcheck here
        return;


    this.checkForItemCollision(player,true);
}

Items.prototype.dropItem = function(gs, playerId, checkForSwap) {
    var player = gs.players.find(player => player.id === playerId);

    if(this.isItemStillInChest(player)) //We start the skillcheck here
        return;

    sendSoundToClient(player.id,"itemPickupOrDrop");
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
                item.currPos.x = player.currPos.x - 24;
                item.currPos.y = player.currPos.y - 24;
                item.currRoom.x = player.currRoom.x;
                item.currRoom.y = player.currRoom.y;
                
                global.sendItemsToClientsInRoom(player.currRoom.x,player.currRoom.y);
                return;
            }
        }
    }
}

Items.prototype.dropKeys = function(gs, playerId) {
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

Items.prototype.checkForItemCollision = function(player, pickupRequested) {
    var items = global.items.filter(item => item.currRoom.x == player.currRoom.x && item.currRoom.y == player.currRoom.y);
    var isPlayerColliding = false;
    items.forEach(item => {
        if (item.ownerId == -1) { //The item is -1 if it is on the ground
            if (
                player.currPos.x + player.radius >= item.currPos.x &&
                player.currPos.x - player.radius <= item.currPos.x + item.width &&
                player.currPos.y + player.radius >= item.currPos.y &&
                player.currPos.y - player.radius <= item.currPos.y + item.height
            ) {
                new Items().pickupItemIfAllowed(player,item,pickupRequested);
                isPlayerColliding = true;
            }
        }
    });
    if(!isPlayerColliding){
        if(player.hasKeys[0])
            player.hasKeys[0] = 0;
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