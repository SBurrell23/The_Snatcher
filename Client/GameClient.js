var socket = null;
var reConnectInterval = null;
var pingInterval = null;
var keys = {};

var serverState = null;
var localState = {
    playerId: -1,
    map: null,
    solidObjects: null,
    items: [],
    roomsIveBeenIn: [],
    ping : 0,
    doorInfo:null,
    skillCheck:false,
    skillCheckItemId: -1,
    events:{
        failedSkillCheck:[],
        magic_monocle:false,
        bbq_chili:false,
        kill_the_power:false
    }
};

var colors = {
    snatcher: '#3d67ff',
    me: '#FF8300',
    otherPlayer: '#81B622',
    key: '#f7d707',
    spotlight: 'rgba(0, 0, 0, .988)'
}

var sc = { //Skill Check Variables
    barMoveAmount : 0,
    barFillSpeed : 1,
    successAreaStart : 0,
    successWidth : 14,
    successAreaX : 0,
    lineX : 0,
    lineWidth: 3,
    barWidth : 150,
    barHeight : 20,
    successAreaColor: 'green'
}
const scReset = JSON.parse(JSON.stringify(sc));

function connectWebSocket() {
    console.log("Attempting to connect to server...");
    serverState = null;
    localState.playerId = -1;
    
    clearInterval(reConnectInterval);
    clearInterval(pingInterval);

    //wss://the-snatcher.onrender.com
    //ws://localhost:8080
    socket = new WebSocket('ws://localhost:8080');  
    socket.addEventListener('open', function () {
        console.log('Server connection established!');
        $("#offlineMessage").css("display", "none");
        pingInterval = setInterval(function() {
            sendPing();
        }, 200);
        socket.addEventListener('message', function (event) {
            recievedServerMessage(event.data);
        });
        requestAnimationFrame(gameLoop);

    });

    socket.addEventListener('close', function(event) {
        console.log('WebSocket connection closed.');
        $("#offlineMessage").css("display", "flex");
        reConnectInterval = setInterval(function() {
            connectWebSocket();
        }, 1000); //On disconnect, try to reconnect every second
    });
}
connectWebSocket();

function recievedServerMessage(message) {
    var m = JSON.parse(message);

    if(m.type == "playerId"){
        localState.playerId = m.id
    }
    else if(m.type == "map"){
        localState.map = m.map;
        roomsIveBeenIn = [];
    }
    else if(m.type == "items"){
        localState.items = m.items;
    }
    else if(m.type == "doorInfo"){
        localState.doorInfo = m.doorInfo;
    }
    else if(m.type == "solidObjects"){
        localState.solidObjects = m.solidObjects;
        //console.log(localState.solidObjects);
    }
    else if(m.type == "gs"){
        serverState = m;
        updateLobby(serverState);
        updateInput(serverState,localState.playerId);
    }else if(m.type == "pong"){
        localState.ping = Date.now() - localState.ping;
    }
    else if(m.type == "skillCheck"){
        if(localState.skillCheck == false){
            sc = JSON.parse(JSON.stringify(scReset));
            sc.successAreaStart = Math.floor(Math.random() * 121) - 60;
            localState.skillCheckItemId = m.data;
            localState.skillCheck = true;
        }
    }else if(m.type == "failedSkillCheck"){
        var failedPlayerId = m.data.playerId;
        localState.events['failedSkillCheck'].push(failedPlayerId);
        setTimeout(function() {
            var index = localState.events['failedSkillCheck'].indexOf(failedPlayerId);
            if (index > -1) 
                localState.events['failedSkillCheck'].splice(index, 1);
        }, m.data.revealTime);
    }else if(m.type == 'magic_monocle'){
        localState.events['magic_monocle'] = true;
        setTimeout(function() {
            localState.events['magic_monocle'] = false;
        }, m.data.revealTime);
    }else if(m.type == 'bbq_chili'){
        localState.events['bbq_chili'] = true;
        setTimeout(function() {
            localState.events['bbq_chili'] = false;
        }, m.data.revealTime);
    }else if(m.type == 'kill_the_power'){
        localState.events['kill_the_power'] = true;
        setTimeout(function() {
            localState.events['kill_the_power'] = false;
        }, m.data.unrevealTime);
    }

}

function updateLobby(gs) {
    var playerQueue = $('#playerQueue tbody');
    playerQueue.empty(); // Clear the table

    for (var i = 0; i < gs.players.length; i++) {
        var player = gs.players[i];
        var row = $('<tr></tr>').appendTo(playerQueue);
        $('<td></td>').text(player.name).appendTo(row);
        $('<td></td>').text(player.points).appendTo(row);
        $('<td></td>').text(player.rWins).appendTo(row);
        $('<td></td>').text(player.sWins).appendTo(row);
    }
}

function updateInput(gs, id) {
    var input = $('#playerNameInput');
    var joinButton = $('#joinGameButton');

    if (gs.players.some(player => player.id === id)) {
        // input.prop('disabled', true);
        // joinButton.prop('disabled', true);
    } else {
        input.prop('disabled', false);
        joinButton.prop('disabled', false);
    }
}

function sendPing() {
    localState.ping = Date.now();
    socket.send(JSON.stringify({ type: 'ping', id: localState.playerId }));
}

function gameLoop() {
    if (serverState){
        drawGameState(serverState);
        handlePlayerMovement();
    }
    requestAnimationFrame(gameLoop); // schedule next game loop
}

function drawGameState(gs) {
    
    var ctx = document.getElementById('canvas').getContext('2d');
    
    //Draw the lobby
    if(gs.state == "lobby")
        drawLobbyScene(ctx,gs);

    //Draw the game
    if(gs.state == "playing" && getMe(gs).currRoom != undefined){
        var currentRoomX = getMe(gs).currRoom.x;
        var currentRoomY = getMe(gs).currRoom.y;
    
        drawBackground(ctx);
        
        drawSolidObjects(ctx, currentRoomX, currentRoomY);  
        drawItems(ctx,currentRoomX, currentRoomY);
        if(getMe(gs).isSnatcher)
            drawSnatcherDoorInfo(ctx,gs,localState.doorInfo);
        drawPlayers(ctx, gs, currentRoomX, currentRoomY);
        drawSkillCheck(ctx,getMe(gs));

        //This needs to come after objects that are under the spotlight and before things over it
        //drawSpotlights(ctx, gs, currentRoomX, currentRoomY);
        
        drawMap(ctx,gs,localState.map);
        drawPlayerInventory(ctx, gs);

        drawPing(ctx);
        
    }

}   

function drawMap(ctx, gs, map) {
    const roomSize = 9;
    const walloffset = 20;
    if (map) {

        var noRoom = 'rgba(0, 0, 0, .65)';
        ctx.fillStyle = noRoom;
        ctx.fillRect(
            ctx.canvas.width - (map[0].length * roomSize) - walloffset, 
            walloffset, 
            roomSize * map[0].length, 
            roomSize * map.length
        );

        const emptyRoom = 'rgba(255, 0, 0, .65)';
        const exitDoor = 'rgba(182, 129, 0, .65)';

        for (let row = 0; row < map.length; row++) {
            for (let col = 0; col < map[row].length; col++) {
                const room = map[row][col];
                const roomX = ctx.canvas.width - (roomSize * (col + 1));
                const roomY = roomSize * row;

                var roomColor = 'gray';
                if(isAnyPlayerInThisRoom(gs,row,col)){
                    if(getSnatcher(gs).currRoom.x == col && getSnatcher(gs).currRoom.y == row)
                        roomColor = colors.snatcher;
                    else if(getMe(gs).currRoom.x == col && getMe(gs).currRoom.y == row){
                        roomColor = colors.me;
                        if(!localState.roomsIveBeenIn.some(room => room[0] == row && room[1] == col))
                            localState.roomsIveBeenIn.push([row,col]);
                    }
                    else
                        roomColor = colors.otherPlayer;
                }
                else if(room === 0)
                    continue;
                else if (room === 1 || room === 2) //Snatcher spawn not important anymore 
                    roomColor = emptyRoom;
                else if (room === 3) 
                    roomColor = exitDoor;

                ctx.fillStyle = roomColor;

                if (!getMe(gs).isSnatcher){
                    if(localState.events['kill_the_power']){
                        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
                        ctx.fillRect(roomX - walloffset, roomY + walloffset, roomSize, roomSize);
                    }
                    else if(localState.events['magic_monocle'])
                        ctx.fillRect(roomX - walloffset, roomY + walloffset, roomSize, roomSize);
                    else if(haveIBeenInThisRoom(row,col) || (roomColor == colors.snatcher)){
                        if(roomColor = colors.otherPlayer) //We don't show other players on the map unless magic monocle.
                            roomColor = emptyRoom;
                        ctx.fillRect(roomX - walloffset, roomY + walloffset, roomSize, roomSize);
                    }
                }
                else if(getMe(gs).isSnatcher){

                    if(localState.events['bbq_chili']){
                        //We do nothing here because the default state will show doors and players
                        //The following blocks will hide players & doors
                    }else if(localState.events['failedSkillCheck'].length > 0 && localState.events['failedSkillCheck'].includes(getPlayerInRoom(gs,row,col))){
                        //If a player is in the room and has failed a skill check, draw them
                        ctx.fillStyle = colors.otherPlayer;
                    }else if(roomColor != colors.snatcher){ //Else override any other room color to just be empty (doors included)
                        ctx.fillStyle = emptyRoom;
                    }
                    ctx.fillRect(roomX - walloffset, roomY + walloffset, roomSize, roomSize);
                }
            }
        }
    }
}  

function drawSkillCheck(ctx,player){
    if(localState.skillCheck == false)
        return;

    var skillCheckY = player.currPos.y - sc.barHeight - player.radius - 10;

    ctx.clearRect(player.currPos.x - sc.barWidth / 2, skillCheckY, sc.barWidth, sc.barHeight);

    // Draw the bar outline
    ctx.fillStyle = '#000';
    ctx.fillRect(player.currPos.x - sc.barWidth / 2, skillCheckY, sc.barWidth, sc.barHeight);

    // Draw the success area
    ctx.fillStyle = sc.successAreaColor;
    sc.successAreaX = player.currPos.x + sc.successAreaStart;
    ctx.fillRect(sc.successAreaX , skillCheckY, sc.successWidth, sc.barHeight);

    // Draw the moving line
    ctx.fillStyle = 'white';
    sc.lineX = (player.currPos.x - sc.barWidth / 2) + sc.barMoveAmount;
    ctx.fillRect(sc.lineX, skillCheckY, sc.lineWidth, sc.barHeight);
    

    sc.barMoveAmount += sc.barFillSpeed;
    
    if (sc.barMoveAmount >= sc.barWidth) {
        sc.barFillSpeed = sc.barFillSpeed * -1;
    } else if (sc.barMoveAmount <= 0) {
        sc.barFillSpeed = sc.barFillSpeed * -1;
    }   

}

function drawLobbyScene(ctx,gs){
        // Fill the canvas with black
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
        // Draw red text in the center
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 55px Nunito';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('THE SNATCHER', ctx.canvas.width / 2, (ctx.canvas.height / 2)-25);
}

function drawSpotlights(ctx, gs, currentRoomX, currentRoomY) {
    ctx.fillStyle = colors.spotlight;

    for (let i = 0, len = gs.players.length; i < len; i++) {
        var player = gs.players[i];
        if (player.currRoom.x == currentRoomX && player.currRoom.y == currentRoomY) {
            if (isSnatcher(gs, player.id) && isMe(player.id)){
                ctx.beginPath();
                ctx.rect(0, 0, canvas.width, canvas.height);
                ctx.arc(player.currPos.x, player.currPos.y, player.spotlight, 0, Math.PI * 2, true);
                ctx.fill('evenodd');
                return;
            }else if(isMe(player.id)){
                ctx.beginPath();
                ctx.rect(0, 0, canvas.width, canvas.height);
                ctx.arc(player.currPos.x, player.currPos.y, player.spotlight, 0, Math.PI * 2, true);
                ctx.fill('evenodd');
                return;
            }
        }
    }
}

function drawSnatcherDoorInfo(ctx, gs, doorInfo) {

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const rectWidth = 30;
    const rectHeight = 150;
    const rectOffset = 5;
    
    // Draw red rectangle on the north side
    if(doorInfo.north){
        ctx.fillStyle ='rgba(255, 0, 0, '+doorInfo.north+')';
        ctx.fillRect((canvasWidth - rectHeight) / 2, rectOffset, rectHeight, rectWidth);
    }
    
    // Draw red rectangle on the south side
    if(doorInfo.south){
        ctx.fillStyle ='rgba(255, 0, 0, '+doorInfo.south+')';
        ctx.fillRect((canvasWidth - rectHeight) / 2, canvasHeight - rectWidth - rectOffset, rectHeight, rectWidth);
    }
    
    // Draw red rectangle on the east side
    if(doorInfo.east){
        ctx.fillStyle ='rgba(255, 0, 0, '+doorInfo.east+')';
        ctx.fillRect(canvasWidth - rectWidth - rectOffset, (canvasHeight - rectHeight) / 2, rectWidth, rectHeight);
    }
    
    // Draw red rectangle on the west side
    if(doorInfo.west){
        ctx.fillStyle ='rgba(255, 0, 0, '+doorInfo.west+')';
        ctx.fillRect(rectOffset, (canvasHeight - rectHeight) / 2, rectWidth, rectHeight);
    }
    
    //console.log(doorInfo);
}

function drawBackground(ctx) {
    ctx.fillStyle = '#98ABC7';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    var lineWidth = 5;
    ctx.fillStyle = '#4F3100';
    ctx.fillRect(0, 0, ctx.canvas.width, lineWidth);
    ctx.fillRect(0, 0, lineWidth, ctx.canvas.height);
    ctx.fillRect(ctx.canvas.width - lineWidth, 0, lineWidth, ctx.canvas.height);
    ctx.fillRect(0, ctx.canvas.height - lineWidth, ctx.canvas.width, lineWidth);
}

function drawWalls(ctx,map,gs) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const wallWidth = 10;
    const gapWidth = 120;
    const gapOffset = (canvasWidth - gapWidth) / 2;
    const gapVerticalOffset = (canvasHeight - (2 * wallWidth) - gapWidth) / 2;

    // Top wall
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvasWidth, wallWidth);
    // Bottom wall
    ctx.fillRect(0, canvasHeight - wallWidth, canvasWidth, wallWidth);
    // Left wall
    ctx.fillRect(0, 0, wallWidth, canvasHeight);
    // Right wall
    ctx.fillRect(canvasWidth - wallWidth, 0, wallWidth, canvasHeight);

    ctx.fillStyle = 'brown';

    // Top gap
    if(isRoom(gs,map,'above'))
        ctx.fillRect(gapOffset, 0, gapWidth, wallWidth);
    // Bottom gap
    if(isRoom(gs,map,'below'))
        ctx.fillRect(gapOffset, canvasHeight - wallWidth, gapWidth, wallWidth);
    // Left gap
    if(isRoom(gs,map,'left'))
        ctx.fillRect(0, wallWidth + gapVerticalOffset, wallWidth, gapWidth);
    // Right gap
    if(isRoom(gs,map,'right'))
        ctx.fillRect(canvasWidth - wallWidth, wallWidth + gapVerticalOffset, wallWidth, gapWidth);
}

function isRoom(gs, map, location) {
    if(!map)
        return false;

    const me = getMe(gs);

    if(me.currRoom == undefined)
        return false;

    const row = me.currRoom.y;
    const col = me.currRoom.x;
    
    if(row == -1 || col == -1)
        return false;

    if (location === 'above') {
        if (row > 0 && map[row - 1][col] !== 0) {
            return true;
        }
    } else if (location === 'below') {
        if (row < map.length - 1 && map[row + 1][col] !== 0) {
            return true;
        }
    } else if (location === 'left') {
        if (col < map[row].length - 1 && map[row][col + 1] !== 0) {
            return true;
        }

    } else if (location === 'right') {
        if (col > 0 && map[row][col - 1] !== 0) {
            return true;
        }
    }
    return false;
}

function haveIBeenInThisRoom(row,col){
    for (let i = 0; i < localState.roomsIveBeenIn.length; i++) {
        const room = localState.roomsIveBeenIn[i];
        if(room[0] == row && room[1] == col)
            return true;
    }
    return false;
}

function drawPlayerInventory(ctx, gs) {
    var me = getMe(gs);

    ctx.fillStyle = 'rgba(255, 255, 255, .65)';
    ctx.fillRect(20, 20, 140, 140);

    // Draw INVENTORY text
    ctx.font = '18px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText("INVENTORY", 90, 40);

    if (me.hasKeys.length > 0) {
        for (let i = 1; i <= me.hasKeys.length; i++) {
            ctx.font = '16px Arial';
            ctx.fillStyle = colors.key;
            ctx.textAlign = 'center';
            ctx.fillText("KEY#" + i, 90, 45 + (i * 25));
        }
    }
    if (me.hasItem) {
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'magenta';
        ctx.fillText(me.hasItem.type.toUpperCase(), 90, 130);
    }
}

function drawPlayers(ctx, gs, currentRoomX, currentRoomY) {
    for (let i = 0, len = gs.players.length; i < len; i++) {
        var player = gs.players[i];
        if (player.currRoom.x == currentRoomX && player.currRoom.y == currentRoomY) {
            var color = colors.otherPlayer;
            
            if (isSnatcher(gs, player.id)){
                color = colors.snatcher;
            }
            else if (isMe(player.id)){
                color = colors.me;
            }

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(player.currPos.x, player.currPos.y, player.radius, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

function drawItems(ctx, currentRoomX, currentRoomY) {
    for (let i = 0; i < localState.items.length; i++) {
        var item = localState.items[i];
        if (
            item.currRoom.x == currentRoomX && 
            item.currRoom.y == currentRoomY &&
            item.isConsumed == false &&
            item.ownerId == -1
            ) {
            if(item.type == 'key'){
                ctx.fillStyle = colors.key;
                ctx.font = '18px Arial';
                ctx.fillRect(item.currPos.x, item.currPos.y, item.width, item.height);
            }
            else if(item.type == 'exitdoor'){
                ctx.fillStyle = '#522a00';
                ctx.fillRect(item.currPos.x, item.currPos.y, item.width, item.height);
                ctx.fillStyle = colors.key
                ctx.font = '18px Arial';
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("("+item.specialCount+")", item.currPos.x + Math.ceil(item.width/2), item.currPos.y + Math.ceil(item.height/2));
            }
            else{
                if(item.inChest){
                    ctx.fillStyle = '#4F3100';
                    ctx.fillRect(item.currPos.x, item.currPos.y, item.width, item.height);
                    ctx.fillStyle = 'magenta';
                    ctx.font = '12px Arial';
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText("CHEST", item.currPos.x + item.width / 2, item.currPos.y + item.height / 2);
                }else{
                    ctx.fillStyle = 'magenta';
                    ctx.fillRect(item.currPos.x, item.currPos.y, item.width, item.height);
                    ctx.fillStyle = 'black';
                    ctx.font = '14px Arial';
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(item.type.toUpperCase(), item.currPos.x + item.width / 2, item.currPos.y + item.height / 2);
                }
            }
        }
    }  
}

function drawSolidObjects(ctx,currentRoomX, currentRoomY) {
    const solidObjects = localState.solidObjects;
    if (solidObjects) {
        for (let i = 0; i < solidObjects.length; i++) {
            const solidObject = solidObjects[i];
            if(
                solidObject.roomXY[0] == currentRoomX && 
                solidObject.roomXY[1] == currentRoomY
                ){
                ctx.fillStyle = solidObject.color;
                ctx.fillRect(solidObject.x, solidObject.y, solidObject.width, solidObject.height);
            }
        }
    }
}

function drawPing(ctx){
    var player = getMe(serverState);
    ctx.fillStyle = 'white';
    ctx.font = '15px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`X: ${player.currRoom.x}, Y: ${player.currRoom.y}`, 20, canvas.height-50);

    ctx.fillStyle = '#1cfc03';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'left';

    if(localState.ping > 10000){
        ctx.fillText("Ping: ?", 20, canvas.height - 20);
        return;
    }
    ctx.fillText("Ping: "+Math.ceil(localState.ping), 20, canvas.height - 20);
}

function isAnyPlayerInThisRoom(gs, row, col) {
    if (gs.players) {
        for (let i = 0; i < gs.players.length; i++) {
            const player = gs.players[i];
            if (player.currRoom.x == col && player.currRoom.y == row)
                return true;
        }
    }
    return false;
}

function getPlayerInRoom(gs, row, col) {
    if (gs.players) {
        for (let i = 0; i < gs.players.length; i++) {
            const player = gs.players[i];
            if (player.currRoom.x == col && player.currRoom.y == row)
                return player.id;
        }
    }
    return -1;
}

function getSnatcher(gs) {
    return gs.players.find(player => player.isSnatcher) || false;
}

function isSnatcher(gs,id){
    return id == getSnatcher(gs).id;
}

function getMe(gs) {
    return gs.players.find(player => isMe(player.id)) || false;
}

function getPlayer(playerId) {
    return gs.players.find(player => player.id == playerId) || false;
}

function isMe(id){
    return id == localState.playerId;
}

function handlePlayerMovement(){
    if(localState.skillCheck)
        return;

    if(keys['w'] && keys['a']){
        movePlayer("ul");
    }
    else if(keys['w'] && keys['d']){
        movePlayer("ur");
    }
    else if(keys['s'] && keys['a']){
        movePlayer("dl");
    }
    else if(keys['s'] && keys['d']){
        movePlayer("dr");
    }
    else if(keys['w']){
        movePlayer("u");
    }
    else if(keys['s']){
        movePlayer("d");
    }
    else if(keys['a']){
        movePlayer("l");
    }
    else if(keys['d'] ){
        movePlayer("r");
    }
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
    keys[e.key] = true;
    if (e.which === 13) { // Enter key
        e.preventDefault();
        socket.send(JSON.stringify({
            type: "generateMap"
        }));
    }else if (e.which === 32) { // Space to pickup or drop an item or do a skill check
        e.preventDefault();
        if(!isSpaceDown){
            isSpaceDown = true;
            if(serverState && serverState.state == "playing" && getMe(serverState).isAlive && localState.skillCheck && sc.barFillSpeed != 0){
                //This is used to stop the bar from moving, but we want to wait a sec
                //so the player can see their result before formally ending the skill check and sending the rsponse
                sc.barFillSpeed = 0;
                var isSCGood = (sc.lineX >= sc.successAreaX && (sc.lineX+sc.lineWidth) <= sc.successAreaX + sc.successWidth);
                
                if(!isSCGood)
                    sc.successAreaColor = 'red';

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
                }, 1500);

            }
            else if(serverState && serverState.state == "playing" && getMe(serverState).isAlive){
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

$(document).ready(function() {   

    $('#joinGameButton').click(function() {
        var playerName = $('#playerNameInput').val();
        //if(playerName == ""){
          playerName = "Player #"+ (Math.floor(Math.random() * 100) + 1);
          $('#playerNameInput').val(playerName);
        //}
        socket.send(JSON.stringify({
            type:"playerJoin",
            name:playerName,
            id:String(Date.now())
        }));
    });

    $('#playerNameInput').keypress(function(e) {
        if (e.which === 13) {
            $('#joinGameButton').click();
        }
    });

    $('#startGameButton').click(function() {
        socket.send(JSON.stringify({
            type:"startGame",
            id:localState.playerId
        }));
    });

});

// let config = {
//     type: Phaser.AUTO,
//     width: 1050,
//     height: 750,
//     parent: 'gameContainer',
//     fps: {
//         target: 60,
//         forceSetTimeOut: true
//     },
//     scene: {
//         preload: preload,
//         create: create,
//         update: update
//     }
// };

// let game = new Phaser.Game(config);


// function preload(){
    
// }

// function create(){
//     cursors = this.input.keyboard.addKeys({
//         up: Phaser.Input.Keyboard.KeyCodes.W,
//         down: Phaser.Input.Keyboard.KeyCodes.S,
//         left: Phaser.Input.Keyboard.KeyCodes.A,
//         right: Phaser.Input.Keyboard.KeyCodes.D
//     });
// }

// function update(){
//     if (cursors.up.isDown && cursors.left.isDown) {
//         movePlayer("ul");
//     } else if (cursors.up.isDown && cursors.right.isDown) {
//         movePlayer("ur");
//     } else if (cursors.down.isDown && cursors.left.isDown) {
//         movePlayer("dl");
//     } else if (cursors.down.isDown && cursors.right.isDown) {
//         movePlayer("dr");
//     } else if (cursors.up.isDown) {
//         movePlayer("u");
//     } else if (cursors.down.isDown) {
//         movePlayer("d");
//     } else if (cursors.left.isDown) {
//         movePlayer("l");
//     } else if (cursors.right.isDown) {
//         movePlayer("r");
//     }
// }


