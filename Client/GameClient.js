var socket = null;
var reConnectInterval = null;
var pingInterval = null;
var keys = {};
var font = "Metal Mania";
var font2 = "Jolly Lodger";

var serverState = null; //In case we need to access the server state in the future
var localState = { //A local state needed to store things specific to the client
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

var joinButtons = {}; //Lobby screen join/leave button x,y,w,h
var startGameButton = {}; //Lobby screen start game button x,y,w,h
var isGameLoading = false;

const lerpTime = 0.165; // Time taken to interpolate - higher is smooother/less responsive
let playerInterpolations = {}; // Store interpolation data for each player

var colors = { //Map colors
    otherPlayer: '#32CD32',
    key: '#f7d707',
    spotlight: 'rgba(0, 0, 0, .92)'
}

var sprites = {};
let currentFrame = 0;

var sc = { //Skill Check Variables
    barMoveAmount : 0,
    barFillSpeed : 1,
    successAreaStart : 0,
    successWidth : 13,
    successAreaX : 0,
    lineX : 0,
    lineWidth: 3,
    barWidth : 150,
    barHeight : 20,
    successAreaColor: 'green'
}
const scReset = JSON.stringify(sc);

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

loadAssets();
connectWebSocket();

function recievedServerMessage(message) {
    var m = JSON.parse(message);

    if(m.type == "playerId"){
        localState.playerId = m.id
    }else if(m.type == "map"){
        localState.map = m.map;
        roomsIveBeenIn = [];
    }else if(m.type == "items"){
        localState.items = m.items;
    }else if(m.type == "doorInfo"){
        localState.doorInfo = m.doorInfo;
    }else if(m.type == "solidObjects"){
        localState.solidObjects = m.solidObjects;
        //console.log(localState.solidObjects);
    }else if(m.type == "skillCheck"){
        if(localState.skillCheck == false){
            sc = JSON.parse(scReset);
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
    }else if(m.type == "pong"){
        localState.ping = Date.now() - localState.ping;
    }else if(m.type == "gs"){
        serverState = m;
    }else if(m.type == "loadingGame"){
        console.log("Loading game...");
        isGameLoading = true;
    }

}

function sendPing() {
    localState.ping = Date.now();
    socket.send(JSON.stringify({ type: 'ping', id: localState.playerId }));
}

function gameLoop() {
    currentFrame++;
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
        drawLobby(ctx,gs);
    //Draw the game
    else if(gs.state == "playing" && getMe(gs).isAlive){
        isGameLoading = false;
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
    }else{
        if(gs.state == "playing")
            drawGameInProgress(ctx);
        else if(gs.state == "gameover")
            drawGameOver(ctx,gs);
    }

}   

function drawGameInProgress(ctx) {
    var canvas = document.getElementById('canvas');
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;

    // Fill the canvas with black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.font = '40px '+font2;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('Game is currently in progress...', centerX, centerY);
}

function drawGameOver(ctx, gs) {
    localState.playerId = -1;
    var gameOverMessage = 'Game Over!';
    var reason = gs.endReason.split(":")[0];
    var timeBeforeReset = gs.endReason.split(":")[1];
    var subText = "Returning to lobby in " + timeBeforeReset + "..."

    if (reason == "snatched") {
        gameOverMessage = 'The Snatcher has snatched all players!';
    } else if (reason == "escaped") {
        gameOverMessage = 'All players have escaped and won!';
    } else if (reason == "ragequit") {
        gameOverMessage = 'The Snatcher has rage quit!';
    }

    // Fill the canvas with black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    var canvas = document.getElementById('canvas');
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    ctx.font = '65px '+ font;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(gameOverMessage, centerX, centerY - 90);
    ctx.font = '35px '+ font;
    ctx.fillText(subText, centerX, centerY + 50);
}

function drawMap(ctx, gs, map) {
    const roomSize = 9;
    const walloffset = 20;
    if (map) {

        var noRoom = 'rgba(255, 255, 255, .65)';
        ctx.fillStyle = noRoom;
        ctx.fillRect(
            walloffset, 
            walloffset, 
            roomSize * map[0].length, 
            roomSize * map.length
        );

        const emptyRoom = 'rgba(36, 66, 117, .65)';
        const exitDoor = 'rgba(66, 29, 4, .75)';

        for (let row = 0; row < map.length; row++) {
            for (let col = map[row].length - 1; col >= 0; col--) { // Reverse the loop for horizontal flipping
                const room = map[row][col];
                const roomX = walloffset + 10 + (roomSize * (map[row].length - col));
                const roomY = roomSize * row;

                var roomColor = 'gray';
                if(isAnyPlayerInThisRoom(gs,row,col)){
                    if(getSnatcher(gs).currRoom.x == col && getSnatcher(gs).currRoom.y == row)
                        roomColor = getSnatcher(gs).color;
                    else if(getMe(gs).currRoom.x == col && getMe(gs).currRoom.y == row){
                        roomColor = getMe(gs).color;
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
                    else if(haveIBeenInThisRoom(row,col) || (roomColor == getSnatcher(gs).color)){
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
                    }else if(roomColor != getSnatcher(gs).color){ //Else override any other room color to just be empty (doors included)
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

function drawLobby(ctx, gs) {
    // Fill the canvas with black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw red text in the center
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 85px ' + font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('THE SNATCHER', ctx.canvas.width / 2, (ctx.canvas.height / 2) - 245);

    // Draw Snatcher
    var centerX = ctx.canvas.width / 2;
    var centerY = (ctx.canvas.height / 2);
    ctx.beginPath();
    ctx.arc(centerX, centerY - 80, 19, 0, 2 * Math.PI);
    ctx.fillStyle = '#d90f0f';
    ctx.fill();

    // Draw snatcher's name
    ctx.fillStyle = '#d90f0f';
    ctx.font = 'bold 20px '+ font;
    ctx.textAlign = 'center'; ;
    ctx.fillText("Snatcher", centerX, centerY - 80 - 42);

    if(!isPlayerSpotTaken(gs, "snatcher") && !alreadyConnected(gs, localState.playerId))
        drawJoinLeaveButton(ctx, centerX, centerY - 80 + 45, "JOIN", 'green', "snatcher", "red");
    else if(isMe("snatcher"))
        drawJoinLeaveButton(ctx, centerX, centerY - 80 + 45, "LEAVE", 'red', "snatcher", "red");
    else
        joinButtons['snatcher'] = {};

    // Draw Players
    var spacing = 135;
    var colors = ['#0f2abf', 'orange', '#d616e0', '#51de14','#edda0c'];
    var names = ['george', 'vincent', 'rose', 'daniel', 'taylor'];

    for (var i = 0; i < 5; i++) {
        var x = centerX + (i - 2) * spacing;
        var y = centerY + 120;

        ctx.beginPath();
        ctx.arc(x, y, 19, 0, 2 * Math.PI);
        ctx.fillStyle = colors[i];
        ctx.fill();

        // Draw player's name
        ctx.fillStyle = colors[i];
        ctx.font = '20px '+ font;
        ctx.textAlign = 'center'; ;
        ctx.fillText(names[i].charAt(0).toUpperCase() + names[i].slice(1), x, y - 42);


        if(!isPlayerSpotTaken(gs, names[i]) && !alreadyConnected(gs, localState.playerId))
            drawJoinLeaveButton(ctx, x, y + 45, "JOIN",'green', names[i], colors[i]);
        else if(isMe(names[i]))
            drawJoinLeaveButton(ctx, x, y + 45, "LEAVE",'red', names[i], colors[i]);
        else
            joinButtons[names[i]] = {};
    }

    // Draw Start Game Button
    if (gs.players.length >= 1 && gs.players.length <= 6 && isMe("snatcher") && !isGameLoading) {
        drawStartGameButton(ctx, centerX, centerY + 260, "START GAME", 'green', 200,50);
    } else {
        startGameButton = {};
    }

}

function drawStartGameButton(ctx, x, y, text, color, width, height) {
    ctx.fillStyle = color;
    ctx.fillRect(x - (width / 2), y - (height / 2), width, height);
    
    ctx.fillStyle = 'white';
    ctx.font = '32px '+ font2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y+2);

    startGameButton.enabled = true;
    startGameButton.x = x - (width / 2);
    startGameButton.y = y - (height / 2);
    startGameButton.width = width;
    startGameButton.height = height;
}

function drawJoinLeaveButton(ctx, x, y, text, color, id, playerColor) {

    if(isGameLoading)
        return;

    var width = 80;
    var height = 30;
    var x = x - 40;
    var y = y - 10;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = 'white';
    ctx.font = '20px '+font2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width/2, 1+y+height/2);

    joinButtons[id] = {};
    joinButtons[id].x = x;
    joinButtons[id].y = y;
    joinButtons[id].width = width;
    joinButtons[id].height = height;
    joinButtons[id].playerColor = playerColor;
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

    if(!doorInfo)
        return;

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const rectWidth = 32;
    const rectHeight = 96;
    const rectOffset = 0;
    
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

    const blockSize = 48;

    var groundPattern = [
        ['ground1', 'ground3'],
        ['ground2', 'ground4']
    ];

    for (let x = 0; x < (ctx.canvas.width/blockSize); x ++) {
        for (let y = 0; y < (ctx.canvas.height/blockSize); y ++) {
            let spriteName = groundPattern[x % 2][y % 2];
            drawSprite(ctx, spriteName, x * blockSize, y * blockSize);
        }
    }
}

function drawPlayerInventory(ctx, gs) {
    var me = getMe(gs);

    if(me.isSnatcher){
        drawSprite(ctx,'snatcherInventory', ctx.canvas.width - 140, 10);
        if (me.hasItem) 
            drawSprite(ctx, me.hasItem.type, ctx.canvas.width - 92, 42);
    }
    else{
        drawSprite(ctx,'playerInventory', ctx.canvas.width - 235, 10);

        if (me.hasItem) 
            drawSprite(ctx, me.hasItem.type, ctx.canvas.width - 92, 42);

        if (me.hasKeys.length == 1)
            drawSprite(ctx,'key', ctx.canvas.width - 200, 42);
        else if (me.hasKeys.length == 2){
            drawSprite(ctx,'key', ctx.canvas.width - 200, 42);
            drawSprite(ctx,'key', ctx.canvas.width - 150, 42);
        }
    }
    
}

function updatePlayerInterpolation(player) {
    if (!playerInterpolations[player.id]) {
        playerInterpolations[player.id] = {
            startPosition: { x: player.currPos.x, y: player.currPos.y },
            targetPosition: { x: player.currPos.x, y: player.currPos.y },
            currentLerpTime: 0,
            lastRoom: { x: player.currRoom.x, y: player.currRoom.y }
        };
    } else {
        const interpolation = playerInterpolations[player.id];
        interpolation.targetPosition = { x: player.currPos.x, y: player.currPos.y };

        // A check to prevent interpolation from smoothing if the player has changed rooms
        if (
            interpolation.lastRoom.x !== player.currRoom.x ||
            interpolation.lastRoom.y !== player.currRoom.y
        ) {
            interpolation.startPosition = { x: player.currPos.x, y: player.currPos.y };
        }

        interpolation.lastRoom = { x: player.currRoom.x, y: player.currRoom.y };
    }
}

function interpolatePosition(start, end, t) {
    return start * (1 - t) + end * t;
}

function drawPlayers(ctx, gs, currentRoomX, currentRoomY) {
    for (let i = 0, len = gs.players.length; i < len; i++) {
        const player = gs.players[i];
        if (player.currRoom.x === currentRoomX && player.currRoom.y === currentRoomY) {
            updatePlayerInterpolation(player);
            const interpolation = playerInterpolations[player.id];

            // Interpolate between start and target positions
            if (interpolation.currentLerpTime < lerpTime) {
                interpolation.currentLerpTime += 0.016; // Assuming 60 FPS
                const t = interpolation.currentLerpTime / lerpTime;
                const interpolatedX = interpolatePosition(
                    interpolation.startPosition.x,
                    interpolation.targetPosition.x,
                    t
                );
                const interpolatedY = interpolatePosition(
                    interpolation.startPosition.y,
                    interpolation.targetPosition.y,
                    t
                );
                drawPlayer(ctx, player, interpolatedX, interpolatedY);
            }
            // Reset interpolation when reaching the target
            else {
                interpolation.startPosition = { ...interpolation.targetPosition };
                interpolation.currentLerpTime = 0;
                drawPlayer(ctx, player, player.currPos.x, player.currPos.y);
            }
        }
    }
}

function drawPlayer(ctx, player, x, y) {
    const px = x-24;
    const py = y-30;
    const ts = 48;

    var pName = "";
    switch(player.name){
        case 'snatcher':
            pName = 'player1';
            break;
        case 'george':
            pName = 'player2';
            break;
        case 'vincent':
            pName = 'player3';
            break;
        case 'rose':
            pName = 'player4';
            break;
        case 'daniel':
            pName = 'player5';
            break;
        case 'taylor':
            pName = 'player6';
            break;
    }

    var aFrame;
    var lastDir = player.lastDirection;
    if(lastDir == "north")
        aFrame = ['n1','n2','n3'];
    else if(lastDir == "south")
        aFrame = ['s1','s2','s3'];
    else if(lastDir == "east")
        aFrame = ['e1','e2','e3'];
    else if(lastDir == "west")
        aFrame = ['w1','w2','w3'];

    const framesBeforeNextAnimate = 45;
    let frameIndex = Math.floor(currentFrame / framesBeforeNextAnimate) % aFrame.length;

    drawSprite(ctx, pName+ aFrame[frameIndex], px, py);
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
                drawSprite(ctx, 'key', item.currPos.x, item.currPos.y);
            }
            else if(item.type == 'exitdoor'){
                ctx.fillStyle = '#522a00';
                ctx.fillRect(item.currPos.x, item.currPos.y, item.width, item.height);
                ctx.fillStyle = colors.key
                ctx.font = '22px '+font2;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("( "+item.specialCount+" / "+item.specialCount2+" )", item.currPos.x + Math.ceil(item.width/2), item.currPos.y + Math.ceil(item.height/2));
            }
            else{
                if(item.inChest){
                    if(getMe(serverState).isSnatcher)
                        drawSprite(ctx, 'chest2', item.currPos.x - 5, item.currPos.y - 5);
                    else
                        drawSprite(ctx, 'chest1', item.currPos.x - 5, item.currPos.y - 5);
                }else{
                    switch(item.type){
                        case 'pf_flyers':
                            drawSprite(ctx, 'pf_flyers', item.currPos.x, item.currPos.y);
                            break;
                        case 'the_button':
                            drawSprite(ctx, 'the_button', item.currPos.x, item.currPos.y);
                            break;
                        case 'magic_monocle':
                            drawSprite(ctx, 'magic_monocle', item.currPos.x, item.currPos.y);
                            break;
                        case 'bbq_chili':
                            drawSprite(ctx, 'bbq_chili', item.currPos.x, item.currPos.y);
                            break;
                        case 'spare_eyeballs':
                            drawSprite(ctx, 'spare_eyeballs', item.currPos.x, item.currPos.y);
                            break;
                        case 'kill_the_power':
                            drawSprite(ctx, 'kill_the_power', item.currPos.x, item.currPos.y);
                            break;
                        default:
                            break;
                    }

                }
            }
        }
    }  
}

function drawSolidObjects(ctx,currentRoomX, currentRoomY) {
    const solidObjects = localState.solidObjects;
    if (solidObjects) {
        var roomObjects = solidObjects[currentRoomX+","+currentRoomY];
        for (let i = 0; i < roomObjects.length; i++) {
            const solidObject = roomObjects[i];

            if(solidObject.type == "block"){
                //var ranRock = 'rock' + seededRandom(serverState.seed + i,5,5).toString();
                drawSprite(ctx, 'block', solidObject.x, solidObject.y);
            }
            else if(solidObject.type == "gate"){
                drawSprite(ctx, 'gate', solidObject.x, solidObject.y);
            }

        }
    }
}

function drawPing(ctx){
    // var player = getMe(serverState);
    // ctx.fillStyle = 'white';
    // ctx.font = '15px Arial';
    // ctx.textAlign = 'left';
    // ctx.fillText(`X: ${player.currRoom.x}, Y: ${player.currRoom.y}`, 20, canvas.height-50);

    ctx.fillStyle = '#1cfc03';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'left';

    if(localState.ping > 1000000){
        ctx.fillText("Ping: ?", 20, canvas.height - 20);
        return;
    }
    ctx.fillText("Ping: "+Math.ceil(localState.ping), 20, canvas.height - 20);
}

function isPlayerSpotTaken(gs, id) {
    for (let i = 0; i < gs.players.length; i++) {
        if (gs.players[i].id == id)
            return true;
    }
    return false;
}

function alreadyConnected(gs, id) {
    for (let i = 0; i < gs.players.length; i++) {
        if (gs.players[i].id == id)
            return true;
    }
    return false;
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

function seededRandom(seed, x, z) {
    var m = 0x80000000;
    seed = seed % m;
    seed = (seed * 1103515245 + 12345) % m;
    var random = seed / m;
    return Math.floor(x + random * (z - x));
}

$(document).ready(function() {  

    // Add the event listener here
    canvas.addEventListener('click', function(event) {
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        //console.log('Clicked at ' + x + ', ' + y);

        //Check for join/leave button clicks
        for (const buttonId in joinButtons) {
            if (joinButtons.hasOwnProperty(buttonId)) {
                const button = joinButtons[buttonId];
                if (x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height) {
                    //console.log("Player join/leave request: " + buttonId);
                    if(localState.playerId == -1)
                        socket.send(JSON.stringify({
                            type:"playerJoin",
                            name:buttonId,
                            id: buttonId,
                            color: button.playerColor
                        }));
                    else{
                        localState.playerId = -1;
                        socket.send(JSON.stringify({
                            type:"playerLeave",
                            name:buttonId,
                            id: buttonId
                        }));
                    }
                }
            }
        }
        var button = startGameButton;
        if (x >= button.x && 
            x <= button.x + button.width && 
            y >= button.y && 
            y <= button.y + button.height &&
            isMe("snatcher") &&
            startGameButton && startGameButton.enabled) {
            socket.send(JSON.stringify({
                type:"startGame",
            }));
            isGameLoading = true;
        }
            
    });

});


