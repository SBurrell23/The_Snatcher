function Event() {
    this.failedSkillCheckRevealTime = 6000;

    this.pfFlyersSpeed = 300;
    this.pfFlyersTime = 5000;

    this.magicMonocleRevealTime = 3500;

    this.bbqChiliRevealTime = 3000;

    this.spareEyeballsSpotlight = 400;
    this.spareEyeballsTime = 5000;

    this.killThePowerUnrevealTime = 10000;
}

let spare_eyeballsTimeoutId;
Event.prototype.triggerItemEvent = function(gs,player,item) {

    console.log("Player " + player.name + " used item " + item.id);

    // player.hasItem = undefined;
    // item.isConsumed = true;
    // item.ownerId = -1;
    // item.currRoom.x = -1;
    // item.currRoom.y = -1;
    // item.currPos.x = -2000;
    // item.currPos.y = -2000;

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
            break;
        case "bbq_chili":
            var data = {revealTime: this.bbqChiliRevealTime};
            global.sendEventToClient("bbq_chili",player.id,data);
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
    global.sendEventToClient("failedSkillCheck",snatcher.id,data);
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
            roomFound = true;
            player.currRoom.x = randomX;
            player.currRoom.y = randomY;
        }
    }
    
    var spot = global.map.findOpenSpotInRoom(player.currRoom.x,player.currRoom.y);

    player.currPos.x = spot.x;
    player.currPos.y = spot.y;

    console.log("Player teleported to : " + player.currRoom.x + ", " + player.currRoom.y);
}





module.exports = Event;