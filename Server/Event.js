
function Event() {
    this.failedSkillCheckRevealTime = 5000;
}


Event.prototype.triggerItemEvent = function(gs,player,item) {

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


module.exports = Event;