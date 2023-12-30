function Movement() {
}

Movement.prototype.movePlayer = function(gs,map, id, direction) {
    var player = gs.players.find(player => player.id == id);
    if(player){
        switch(direction){
            case "up":
                if(player.currPos.y - player.speed >= 0){
                    player.currPos.y -= player.speed;
                } else {
                    this.movePlayerToNewRoom(player,map,player.currRoom.x,player.currRoom.y-1,"south");
                }
                break;
            case "down":
                if(player.currPos.y + player.speed <= global.canvasHeight){
                    player.currPos.y += player.speed;
                } else {
                    this.movePlayerToNewRoom(player,map,player.currRoom.x,player.currRoom.y+1,"north");
                }
                break;
            case "left":
                if(player.currPos.x - player.speed >= 0){
                    player.currPos.x -= player.speed;
                } else {
                    this.movePlayerToNewRoom(player,map,player.currRoom.x+1,player.currRoom.y,"east");
                }
                break;
            case "right":
                if(player.currPos.x + player.speed <= global.canvasWidth){
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
        console.log("Player " + player.name + " moved to " + newYRoom + ", " + newXRoom);
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

module.exports = Movement;