function Event() {
    this.failedSkillCheckRevealTime = 5000;

    this.pfFlyersSpeed = 250;
    this.pfFlyersTime = 5000;

    this.magicMonocleRevealTime = 7000;

    this.bbqChiliRevealTime = 3200;

    this.spareEyeballsSpotlight = 400;
    this.spareEyeballsTime = 8000;

    this.killThePowerUnrevealTime = 12000;
}

let spare_eyeballsTimeoutId;
Event.prototype.triggerItemEvent = function(gs,player,item) {

    console.log("Player " + player.name + " used item " + item.id);

    player.hasItem = undefined;
    item.isConsumed = true;
    item.ownerId = -1;
    item.currRoom.x = -1;
    item.currRoom.y = -1;
    item.currPos.x = -2000;
    item.currPos.y = -2000;

    switch(item.type) {
        case "pf_flyers":
            //Can't clear timeouts because multiple players can be using this item
            player.speed = JSON.parse(global.baseSpeed) + this.pfFlyersSpeed;
            setTimeout(function() {
                player.speed = JSON.parse(global.baseSpeed);
            }, this.pfFlyersTime);
            break;
        case "the_button":
            //Need this here because of a circular dependency issue
            const Items = require('./Items.js');
            new Items().dropKeys(gs,player.id);
            this.teleportPlayerToRandomRoom(gs,player);
            break;
        case "magic_monocle":
            var data = {revealTime: this.magicMonocleRevealTime};
            global.sendEventToClient("magic_monocle",player.id,data);
            global.sendEventToClient("eventMessage",player.id,{
                text: "Your map tells all..."
            });
            break;
        case "bbq_chili":
            var data = {revealTime: this.bbqChiliRevealTime};
            global.sendEventToClient("bbq_chili",player.id,data);
            global.sendEventToClient("eventMessage",player.id,{
                text: "The runners look delicious..."
            });
            global.sendEventToAllRunners("eventMessage", {
                text: "The snatcher has revealed all runners!"
            });
            break;
        case "spare_eyeballs":
            player.spotlight = this.spareEyeballsSpotlight;
            clearTimeout(spare_eyeballsTimeoutId);
            spare_eyeballsTimeoutId = setTimeout(function() {
                player.spotlight = JSON.parse(global.killerBaseSpotlight);
            }, this.spareEyeballsTime);
            break;
        case "kill_the_power":
            var data = {unrevealTime: this.killThePowerUnrevealTime};
            global.sendEventToAllClients("kill_the_power",data);
            global.sendEventToClient("eventMessage",player.id,{
                text: "The runners maps have gone dark..."
            });
            global.sendEventToAllRunners("eventMessage", {
                text: "The snatcher has cut the power!"
            });
            break;
        default:
            console.log("Item event not found!");
    }

}

Event.prototype.triggerSkillCheck = function(player,item) {
    global.sendEventToClient("skillCheck",player.id,item.id);
}

Event.prototype.triggerFailedSkillCheck = function(gs,player) {
    var snatcher = gs.players.find(player => player.isSnatcher == true);
    var data = {
        playerId: player.id,
        revealTime: this.failedSkillCheckRevealTime
    };
    
    if(!player.isSnatcher){
        global.sendEventToClient("failedSkillCheck",snatcher.id,data);
        global.sendEventToClient("eventMessage",snatcher.id,{
            text: "A runner lacks skill..."
        });
        global.sendEventToClient("eventMessage",player.id,{
            text: "You've been revealed to the snatcher!"
        });
    }else{ //Snatcher failed skill check, embarass him and tell the players
        global.sendEventToAllRunners("eventMessage", {
            text: "The snatcher lacks skill..."
        });
    }
}

Event.prototype.teleportPlayerToRandomRoom = function(gs,player) {
   var map = global.map.get();

    let randomX, randomY;
    let roomFound = false;

    while (!roomFound) {
        randomX = Math.floor(Math.random() * map[0].length);
        randomY = Math.floor(Math.random() * map.length);

        //Room is a valid room
        //Room is not the player's current room
        if (map[randomY][randomX] === 1 &&  randomX != player.currRoom.x && randomY != player.currRoom.y) {

            var spot = global.map.findOpenSpotInRoom(randomX,randomY);
            if(spot != null){
                roomFound = true;
                player.currRoom.x = randomX;
                player.currRoom.y = randomY;
                player.currPos.x = spot.x + Math.floor((global.map.getBlockSize()) / 2);
                player.currPos.y = spot.y + Math.floor((global.map.getBlockSize()) / 2);
                global.sendItemsToClientsInRoom(player.currRoom.x,player.currRoom.y);
            }
        }
    }
    
    console.log("Player teleported to : " + player.currRoom.x + ", " + player.currRoom.y);
}



module.exports = Event;