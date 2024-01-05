
function Event() {
}


Event.prototype.triggerItemEvent = function(gs,player,item) {

}

Event.prototype.triggerSkillCheck = function(player,item) {
    global.sendEventToClient("skillCheck",player.id,item.id);
}

Event.prototype.triggerFailedSkillCheck = function(gs,player) {
    var snatcher = gs.players.find(player => player.isSnatcher == true);
    global.sendEventToClient("failedSkillCheck",snatcher.id,player.id);
}


module.exports = Event;