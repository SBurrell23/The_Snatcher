function handlePlayerMovement(){
    if(localState.skillCheck)
        return;

    if((keys['w'] && keys['a']) || (keys['ArrowUp'] && keys['ArrowLeft'])){
        movePlayer("ul");
    }
    else if((keys['w'] && keys['d']) || (keys['ArrowUp'] && keys['ArrowRight'])){
        movePlayer("ur");
    }
    else if((keys['s'] && keys['a']) || (keys['ArrowDown'] && keys['ArrowLeft'])){
        movePlayer("dl");
    }
    else if((keys['s'] && keys['d']) || (keys['ArrowDown'] && keys['ArrowRight'])){
        movePlayer("dr");
    }
    else if((keys['w']) || (keys['ArrowUp'])){
        movePlayer("u");
    }
    else if((keys['s']) || (keys['ArrowDown'])){
        movePlayer("d");
    }
    else if((keys['a']) || (keys['ArrowLeft'])){
        movePlayer("l");
    }
    else if((keys['d'] ) || (keys['ArrowRight'])){
        movePlayer("r");
    }
}

function isPlayerMoving(){
    return keys['w'] || keys['a'] || keys['s'] || keys['d'] || keys['ArrowUp'] || keys['ArrowLeft'] || keys['ArrowDown'] || keys['ArrowRight'];
}

function movePlayer(direction){
    if(serverState && serverState.state == "playing" && getMe(serverState).isAlive){
        socket.send(JSON.stringify({
            type:"mp",
            id:localState.playerId,
            dir:direction
        }));
    }
}

let isSpaceDown = false;
$(document).keydown(function(e) {
    if(!serverState || !socket || socket.readyState != 1)
        return;

    keys[e.key] = true;

    // if (e.which === 75)
    //     socket.close(4006);

    if (e.which === 13) { // Enter key
        e.preventDefault();
        socket.send(JSON.stringify({
            type: "randomTeleportPls",
            id: localState.playerId
        }));
    }else if (e.which === 80) { // P key
        e.preventDefault();
        socket.send(JSON.stringify({
            type: "newGamePls",
            id: localState.playerId
        }));
    }else if (e.which === 32) { // Space to pickup or drop an item or do a skill check
        e.preventDefault();
        if(!isSpaceDown){
            isSpaceDown = true;
            if(serverState && serverState.state == "playing" && getMe(serverState).isAlive && localState.skillCheck && sc.barFillSpeed != 0){
                //This is used to stop the bar from moving, but we want to wait a sec
                //so the player can see their result before formally ending the skill check and sending the rsponse
                sc.barFillSpeed = 0;
                var isSCGood = (sc.lineX >= sc.successAreaX && (sc.lineX) <= sc.successAreaX + sc.successWidth);
                
                console.log("Skill check result: " + isSCGood);
                console.log("LineX: " + sc.lineX + " SuccessAreaX: " + sc.successAreaX + " SuccessWidth: " + sc.successWidth + " LineWidth: " + sc.lineWidth)
                if(!isSCGood){
                    sc.successAreaColor = 'red';
                    sounds['scFailed'].play();
                }
                else
                    sounds['chestOpen'].play();

                var scTimeout = 1800;
                if(getMe(serverState).isSnatcher)
                    scTimeout = 2000;

                setTimeout(function() {
                    if(isSCGood){
                        socket.send(JSON.stringify({
                            type: "skillCheckResult",
                            id: localState.playerId,
                            itemId: localState.skillCheckItemId,
                            result: 'success'
                        }));
                    }else{
                        socket.send(JSON.stringify({
                            type: "skillCheckResult",
                            id: localState.playerId,
                            itemId: localState.skillCheckItemId,
                            result: 'failure'
                        }));
                    }
                    localState.skillCheck = false;
                }, scTimeout);

            }
            else if(serverState && serverState.state == "playing" && getMe(serverState).isAlive && !localState.skillCheck){
                if(getMe(serverState).hasItem == undefined){
                    socket.send(JSON.stringify({
                        type: "pickupItem",
                        id: localState.playerId
                    }));
                }else{
                    socket.send(JSON.stringify({
                        type: "dropItem",
                        id: localState.playerId
                    }));
                }
            }
        }
    }else if(e.which === 69 || e.which === 82){ // E or R to use an item
        e.preventDefault();
        if(serverState && serverState.state == "playing" && getMe(serverState).isAlive){
            if(getMe(serverState).hasItem != undefined){
                sounds['itemUsed'].play();
                socket.send(JSON.stringify({
                    type: "useItem",
                    id: localState.playerId,
                }));
            }
        }
    }
});

window.onkeyup = function(e) {
    keys[e.key] = false;
    if (e.which === 32)
        isSpaceDown = false;
};