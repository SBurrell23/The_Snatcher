var socket = null;
var reConnectInterval = null;
var reConnectIntervalError = null;
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
    },
    eventText:"",
    exitDoors:[]
};

var joinButtons = {}; //Lobby screen join/leave button x,y,w,h
var startGameButton = {}; //Lobby screen start game button x,y,w,h
var isGameLoading = false;

const lerpTime = 0.165; // Time taken to interpolate - higher is smooother/less responsive
let playerInterpolations = {}; // Store interpolation data for each player

var colors = { //Map colors
    otherPlayer: '#32CD32',
    spotlight: 'rgba(0, 0, 0, .975)'
}

var eventTextInterval = null;

var sounds = {};
var sprites = {};
let currentFrame = 0;
var initRainFlag = true;

var sc = { //Skill Check Variables
    barMoveAmount : 0,
    barFillSpeed : 3,
    successAreaStart : 0,
    successWidth : 13,
    successAreaX : 0,
    lineX : 0,
    lineWidth: 2,
    barWidth : 140,
    barHeight : 25,
    successAreaColor: '#25c213'
};
const scReset = JSON.stringify(sc);

const loadingMessages = [
    "darkness comes...",
    "unleashing horrors...",
    "approaching the nightmare...",
    "awakening evil...",
    "into the abyss...",
    "summoning spirits...",
    "unleashing hell...",
    "entering the haunted realm...",
    "awakening the cursed one...",
    "sharpening blades...",
    "revving chainsaws..."
];

var randomLoadingMessage = null; //This chosen then the player loads

function connectWebSocket() {
    console.log("Attempting to connect to server...");
    
    clearInterval(reConnectInterval);
    clearInterval(reConnectIntervalError);
    clearInterval(pingInterval);

    //wss://the-snatcher.onrender.com
    //ws://localhost:8080
    socket = new WebSocket('ws://localhost:8080');  

    socket.addEventListener('open', function () {
        console.log('Server connection established!');
        //If the player has an id, we should reconnect them.
        if(localState.playerId != -1){
            socket.send(JSON.stringify({
                type:"playerJoin",
                name:localState.playerId,
                id: localState.playerId,
                color: getMe(serverState).color
            }));
        }
        $("#offlineMessage").css("display", "none");
        pingInterval = setInterval(function() {
            sendPing();
        }, 350);
        socket.addEventListener('message', function (event) {
            recievedServerMessage(event.data);
        });
        lastFrameTime = performance.now();
        requestAnimationFrame(gameLoop);
    });

    socket.addEventListener('close', function(event) {
        //localState.playerId = -1;
        console.log('WebSocket connection closed.');
        console.log(event);
        $("#offlineMessage").css("display", "flex");
        reConnectInterval = setInterval(function() { connectWebSocket();}, 150);
    });
    socket.addEventListener('error', function (event) {
        console.error('WebSocket connection error:', event);
        reConnectIntervalError = setInterval(function() { connectWebSocket();}, 150);
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
            sounds['scStarted'].play();
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
    }else if(m.type == "eventMessage"){

        if(m.data.text.includes("has been snatched"))
            sounds['playerSnatched'].play();
        else if(m.data.text.includes("has opened"))
            sounds['exitDoorOpened'].play();
        else if(m.data.text.includes("lacks skill"))
            sounds['lacksSkill'].play();
        else if (m.data.text.includes("seem lost") || m.data.text.includes("shuffled"))
            sounds['childLaugh'].play();
        else if(
            !m.data.text.includes("delicious") && 
            !m.data.text.includes("tells all") && 
            !m.data.text.includes("have gone dark"))
            sounds['badEvent'].play();

        setEventText(m.data.text);
    }else if(m.type == "exitDoorData"){
        localState.exitDoors.push(m.data);
    }else if(m.type == "pong"){
        localState.ping = Date.now() - localState.ping;
    }else if(m.type == "gs"){
        serverState = m;
    }else if(m.type == "loadingGame"){
        console.log("Loading game...");
        randomLoadingMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        localState.roomsIveBeenIn = [];
        isGameLoading = true;
    }else if(m.type == "sound"){
        console.log(m);
        sounds[m.data].play();
    }

}

function sendPing() {
    localState.ping = Date.now();
    socket.send(JSON.stringify({ type: 'ping', id: localState.playerId }));
}

var lastFrameTime = performance.now();
var deltaTime = 0;
function gameLoop() {

    if(socket.readyState == 0){ //On a dead socket, stop all sonds and stop the game loop
        stopAllSounds();
        return;
    }

    deltaTime = (performance.now() - lastFrameTime) / 1000; // Calculate delta time in seconds

    //Cap the game at ~144 FPS
    if (deltaTime < 1 / 144) {
        requestAnimationFrame(gameLoop);
        return;
    }

    currentFrame++;

    if (serverState) {
        drawGameState(serverState);
        handlePlayerMovement();
    }

    lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop); // schedule next game loop
}

var gameStartOnce = true;
function drawGameState(gs) {

    var ctx = document.getElementById('canvas').getContext('2d');

    if(initRainFlag)
        initRain();

    //Draw the lobby
    if(gs.state == "lobby"){
        stopSound('gameMusic');
        stopSound('forestNoise');
        if (isSoundPlaying('lobbyMusic') == false && hasUserInteracted) 
                sounds['lobbyMusic'].play();
        if (isSoundPlaying('rainfall') == false && hasUserInteracted) 
                sounds['rainfall'].play();     
        
        drawLobby(ctx,gs);
    }
    else if(gs.state == "loading"){
        gameStartOnce = true;
        drawLoading(ctx,gs);
    }
    //Draw the game
    else if(gs.state == "playing" && getMe(gs).isAlive){
        if(gameStartOnce){
            stopSound('thunder');
            sounds['thunder'].play();
            stopSound('gameMusic');
            stopSound('forestNoise');
            stopSound('rainfall');
        }
        stopSound('lobbyMusic');

        if (isSoundPlaying('gameMusic') == false && hasUserInteracted) 
            sounds['gameMusic'].play();
        if (isSoundPlaying('forestNoise') == false && hasUserInteracted) 
            sounds['forestNoise'].play();
        if (isSoundPlaying('rainfall') == false && hasUserInteracted) 
            sounds['rainfall'].play();

        gameStartOnce = false;
        isGameLoading = false;

        var currentRoomX = getMe(gs).currRoom.x;
        var currentRoomY = getMe(gs).currRoom.y;
        
        drawBackground(ctx);
        
        drawSolidObjects(ctx, currentRoomX, currentRoomY);  
        drawItems(ctx,currentRoomX, currentRoomY);
        if(getMe(gs).isSnatcher)
            drawSnatcherDoorInfo(ctx,gs,localState.doorInfo);

        drawRain(ctx,'rgba(86, 122, 179, .85)');
        drawPlayers(ctx, gs, currentRoomX, currentRoomY);
        
        //This needs to come after objects that are under the spotlight and before things over it
        drawSpotlights(ctx, gs, currentRoomX, currentRoomY);

        drawEventText(ctx,localState.eventText);

        drawSkillCheck(ctx,getMe(gs));
        
        drawMap(ctx,gs,localState.map);
        drawInventory(ctx, gs);

        drawPing(ctx);
    }else{
        if(gs.state == "playing")
            drawGameInProgress(ctx,gs);
        else if(gs.state == "gameover")
            drawGameOver(ctx,gs);
    }

}   

var raindrops = [];
function drawRain(ctx,color) {

    // Set the color of the raindrops
    ctx.fillStyle = color;

    // Draw each raindrop
    for (let i = 0; i < raindrops.length; i++) {
        let raindrop = raindrops[i];

        // Calculate the teardrop coordinates
        let x = raindrop.x;
        let y = raindrop.y;
        ctx.lineWidth = 5;

        // Draw the teardrop shape
        ctx.beginPath();
        ctx.moveTo(x, y - raindrop.length / 2); // Top point
        ctx.bezierCurveTo(
        x + raindrop.length / 2,
        y + raindrop.length / 2,
        x - raindrop.length / 2,
        y + raindrop.length / 2,
        x,
        y - raindrop.length / 2
        );
        ctx.closePath();
        ctx.fill();

        // Update the raindrop's position
        raindrop.y += raindrop.speed;

        // If the raindrop is off the bottom of the canvas, move it back to the top
        if (raindrop.y > canvas.height) {
            raindrop.y = 0 - raindrop.length;
            raindrop.x = Math.random() * canvas.width;
            raindrop.speed = Math.random() * 1.6 + 1.55;
            raindrop.length = Math.random() * 12 + 5;
        }
    }
}

function initRain(){
    for (let i = 0; i < 175; i++) {
        raindrops.push({
            x: Math.random() * canvas.width,  // Random x position
            y: Math.random() * canvas.height, // Random y position
            speed: Math.random() * 1.6 + 1.55,     // Random speed
            length: Math.random() * 12 + 5   // Random length
        });
    }
    initRainFlag = false;
}

function drawGameInProgress(ctx,gs) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.font = '45px '+font;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('Game is currently in progress...', ctx.canvas.width / 2, ctx.canvas.height / 2);

    if(currentFrame % 600 == 0)
        console.log(gs.players);
}

function drawLoading(ctx,gs) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.font = '75px '+font;
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';

    drawRain(ctx,'red');

    ctx.fillText(randomLoadingMessage, ctx.canvas.width / 2, (ctx.canvas.height / 2) - 100);

    ctx.font = '35px '+ font;
    ctx.fillStyle = 'white';
    ctx.fillText(gs.lm, ctx.canvas.width / 2, (ctx.canvas.height / 2) + 50);
}

function drawGameOver(ctx, gs) {
    localState.playerId = -1;
    var gameOverMessage = 'Game Over!';
    var reason = gs.er.split(":")[0];
    var timeBeforeReset = gs.er.split(":")[1];
    var subText = "Returning to lobby in " + timeBeforeReset + "..."

    if (reason == "snatched") {
        gameOverMessage = 'The Snatcher has snatched all runners!';
    } else if (reason == "escaped") {
        gameOverMessage = 'all runners have escaped and won!';
    } else if (reason == "ragequit") {
        gameOverMessage = 'The Snatcher has rage quit!';
    } else if (reason == "runnerdc") {
        gameOverMessage = 'the last runner has disconnected!';
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

function setEventText(text){
    localState.eventText = text;
    clearInterval(eventTextInterval);
    eventTextInterval = setTimeout(function() {
        localState.eventText = "";
    }, 3600);
}

function drawEventText(ctx, text) {
    var centerX = ctx.canvas.width / 2;
    ctx.font = '45px ' + font; // Add 'bold' for font weight
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'black'; // set stroke color to black
    ctx.lineWidth = 2; // set stroke width
    ctx.lineJoin = 'round'; // set line join to round
    ctx.miterLimit = 2; // set miter limit
    ctx.strokeText(text.toLowerCase(), centerX, 210);
    ctx.fillText(text.toLowerCase(), centerX, 210);
}

const roomSize = 12;
const walloffset = 16;
function drawMap(ctx, gs, map) {

    if (map) {

        const noPowerRoom = 'rgba(0, 0, 0, 0)';
        const noRoom = 'rgba(255, 255, 255, .65)';
        const emptyRoom = 'rgba(58, 100, 158, .60)';
        const exitDoor = 'rgba(128, 88, 15, .75)';
        const myRoom = getMe(gs).color;
        const snatcherInRoom = getSnatcher(gs).color;

        const mapWidth = map[0].length * roomSize;
        const mapHeight = map.length * roomSize;

        // Draw black border around the map
        if(!localState.events['kill_the_power']){
            ctx.strokeStyle = 'rgba(10, 10, 10,.7)';
            ctx.lineWidth = 4;
            ctx.strokeRect(walloffset-1, walloffset-2, mapWidth+ 4, mapHeight + 4);
        }

        for (let row = 0; row < map.length; row++) {
            for (let col = map[row].length - 1; col >= 0; col--) { // Reverse the loop for horizontal flipping
                const room = map[row][col];
                const roomX = walloffset + 5 + (roomSize * (map[row].length - col));
                const roomY = roomSize * row;

                if (getMe(gs).isSnatcher){ //If we are the snatcher
                    //Snatcher default map vision (with failed skill check check)(me, rooms & doors)
                    if(getMe(gs).currRoom.x == col && getMe(gs).currRoom.y == row){ //Am I in room
                        drawRoomTile(ctx, roomX, roomY, myRoom);
                    }
                    else if(localState.events['bbq_chili'] && isRunnerInThisRoom(gs,row,col) != -1){ //If a runner is in this room, show them
                        drawRoomTile(ctx, roomX, roomY, isRunnerInThisRoom(gs,row,col).color); //Show that players color
                    }
                    //If a skill check has failed and the player is in the room, show them
                    else if(localState.events['failedSkillCheck'].length > 0 && localState.events['failedSkillCheck'].includes(isRunnerInThisRoom(gs,row,col).id)){
                        drawRoomTile(ctx, roomX, roomY, isRunnerInThisRoom(gs,row,col).color); //Show that player to the killer
                    }
                    //need to draw which door is open
                    else if(room == 3)//&& isExitDoorInRoomOpen(row,col) // if this door is opened, the snatcher can see it on their map
                        drawRoomTile(ctx, roomX, roomY, exitDoor);
                    else if (room == 1 || room == 3) //Draw empty rooms and also hide the door if it hasn't been opened
                        drawRoomTile(ctx, roomX, roomY, emptyRoom);
                    else if (room == 0) // Draw no room
                        drawRoomTile(ctx, roomX, roomY, noRoom);
                    
                }
                else{ //Else if we are a runner
                    //Firstly check if this room has been visited so we can add it to our visited rooms list
                    //This can probably be done somwhere else but oh well
                    if(getMe(gs).currRoom.x == col && getMe(gs).currRoom.y == row && haveIBeenInThisRoom(row,col) == false)
                        if(!localState.roomsIveBeenIn.some(room => room[0] == row && room[1] == col))
                            localState.roomsIveBeenIn.push([row,col]);

                    if(localState.events['kill_the_power']){ //Turn all rooms white
                        drawRoomTile(ctx, roomX, roomY, noPowerRoom);
                    }
                    else if(localState.events['magic_monocle']){ //Show everything to the runner
                        if(getSnatcher(gs).currRoom.x == col && getSnatcher(gs).currRoom.y == row) //Is snatcher in room
                            drawRoomTile(ctx, roomX, roomY, snatcherInRoom);
                        else if (getMe(gs).currRoom.x == col && getMe(gs).currRoom.y == row) //Am I in room
                            drawRoomTile(ctx, roomX, roomY, myRoom);
                        else if (isRunnerInThisRoom(gs,row,col) != -1) // Other player is in room
                            drawRoomTile(ctx, roomX, roomY, isRunnerInThisRoom(gs,row,col).color); //Show that players color
                        else if(room == 3) // Is it a door room
                            drawRoomTile(ctx, roomX, roomY, exitDoor);
                        else if (room == 1) //Draw empty room
                            drawRoomTile(ctx, roomX, roomY, emptyRoom);
                        else if (room == 0) // Draw no room
                            drawRoomTile(ctx, roomX, roomY, noRoom);
                    }
                    else{ //Player default map vision
                        if(getSnatcher(gs).currRoom.x == col && getSnatcher(gs).currRoom.y == row) //Is snatcher in room
                            drawRoomTile(ctx, roomX, roomY, snatcherInRoom);
                        else if (getMe(gs).currRoom.x == col && getMe(gs).currRoom.y == row) //Am I in room
                            drawRoomTile(ctx, roomX, roomY, myRoom);
                        else if (haveIBeenInThisRoom(row,col)){
                            if(room == 1)
                                drawRoomTile(ctx, roomX, roomY, emptyRoom);
                            else if (room == 3)
                                drawRoomTile(ctx, roomX, roomY, exitDoor); //Runners can see doors once found
                        }
                        else{
                            drawRoomTile(ctx, roomX, roomY, noRoom);
                        }
                    }
                }

            }
        }
    }
} 

function drawRoomTile(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x - walloffset, y + walloffset, roomSize, roomSize);
}

function drawSkillCheck(ctx,player){
    if(localState.skillCheck == false)
        return;

    var skillCheckY = player.currPos.y - sc.barHeight - player.radius - 10;

    ctx.clearRect(player.currPos.x - sc.barWidth / 2, skillCheckY, sc.barWidth, sc.barHeight);

    // Draw the bar outline with border radius (the border radius is why this is not 1 line...)
    ctx.fillStyle = '#141414';
    ctx.fillRect(player.currPos.x - sc.barWidth / 2 , skillCheckY, sc.barWidth, sc.barHeight);

    // Draw the success area
    ctx.fillStyle = sc.successAreaColor;
    sc.successAreaX = player.currPos.x + sc.successAreaStart;
    ctx.fillRect(sc.successAreaX , skillCheckY, sc.successWidth, sc.barHeight);

    // Draw the moving line
    ctx.fillStyle = 'white';
    sc.lineX = (player.currPos.x - (sc.barWidth / 2)) + sc.barMoveAmount;
    ctx.fillRect(sc.lineX, skillCheckY, sc.lineWidth, sc.barHeight);
    

    sc.barMoveAmount += sc.barFillSpeed * (deltaTime * 100);
    
    if (sc.barMoveAmount >= sc.barWidth) {
        sc.barMoveAmount = sc.barWidth;
        sc.barFillSpeed = sc.barFillSpeed * -1;
        stopSound('tick');
        sounds['tick'].play();
    } else if (sc.barMoveAmount <= 0) {
        sc.barMoveAmount = 0;
        sc.barFillSpeed = sc.barFillSpeed * -1;
        stopSound('tick');
        sounds['tick'].play();
    }   

}

function drawLobby(ctx, gs) {
    
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    drawRain(ctx,'red');

    // Draw the red THE SNATCHER Title
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 90px ' + font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('THE SNATCHER', ctx.canvas.width / 2, (ctx.canvas.height / 2) - 255);

    // Draw Players
    var spacing = 156;
    var colors = ['#d90f0f','#0866c4', 'orange', '#cf3fd1', '#43d925','#fce021'];
    var names = ['snatcher','george', 'vincent', 'rose', 'daniel', 'taylor'];

    for (var i = 0; i < 6; i++) {

        var x =  (ctx.canvas.width / 2) + (i - 3) * spacing;
        var y = (ctx.canvas.height / 2) + 120;
        ctx.font = 'bold 20px '+ font;
        ctx.textAlign = 'center';
        var sOffset = 0;

        if(names[i] == "snatcher"){
            // Draw Snatcher
            sOffset = 80;
            x = (ctx.canvas.width / 2);
            y = (ctx.canvas.height / 2);

            const framesBeforeNextAnimate = 50;
            aFrame = ['s1','s2','s3','s2'];
            let frameIndex = Math.floor(currentFrame / framesBeforeNextAnimate) % aFrame.length;
            drawSprite(ctx, 'player1'+ aFrame[frameIndex], x - 24, y - 108);

            // Draw snatcher's name
            ctx.fillStyle = '#d90f0f';
            ctx.fillText("Snatcher", x, y - 80 - 44);
        }else{
            const framesBeforeNextAnimate = seededRandom(i,45, 58);
            aFrame = ['s1','s2','s3'];
            let frameIndex = Math.floor(currentFrame / framesBeforeNextAnimate) % aFrame.length;
            drawSprite(ctx,'player' + (i + 1) + aFrame[frameIndex], x - 24, y - 28);
            // Draw player's name
            ctx.fillStyle = colors[i];
            ctx.fillText(names[i].charAt(0).toUpperCase() + names[i].slice(1), x, y - 44);
        }

        if(!isPlayerSpotTaken(gs, names[i]) && localState.playerId == -1)
            drawJoinLeaveButton(ctx, x, y + 45 - sOffset, "JOIN",'#0f6228', names[i], colors[i]);
        else if(isMe(names[i]))
            drawJoinLeaveButton(ctx, x, y + 45 - sOffset, "LEAVE",'#cf4f3b', names[i], colors[i]);
        else{
            if(isPlayerSpotTaken(gs, names[i]))
                drawJoinLeaveButton(ctx, x, y + 45 - sOffset, "connected",colors[i], names[i], colors[i]);
            joinButtons[names[i]] = {};
        }
    }

    // Draw Start Game Button
    if (gs.players.length >= 1 && gs.players.length <= 6 && isMe("snatcher") && !isGameLoading) {
        drawStartGameButton(ctx, (ctx.canvas.width / 2), (ctx.canvas.height / 2) + 280, "START GAME", '#0f6228', 230,80);
    } else {
        startGameButton = {};
    }

}

function drawStartGameButton(ctx, x, y, text, color, width, height) {
    ctx.fillStyle = color;
    ctx.fillRect(x - (width / 2), y - (height / 2), width, height);
    
    ctx.fillStyle = 'white';
    ctx.font = '38px '+ font;
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

    var width = 104;
    var height = 34;
    var x = x - 52;
    var y = y - 10;

    if (text.includes("connected")) {
        ctx.fillStyle = playerColor;
        ctx.font = '28px '+ font;
    } else {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = 'white';
        ctx.font = '22px '+ font;
    }

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

    for (let i = 0, len = gs.players.length; i < len; i++) {
        var player = gs.players[i];
        
        if (player.currRoom.x == currentRoomX && player.currRoom.y == currentRoomY) {
            if (isMe(player.id)){

                // Create black radial gradient
                const gradSize = player.spotlight + 1; //some padding to prevent a thin line
                let grdBlack = ctx.createRadialGradient(player.currPos.x, player.currPos.y, 0, player.currPos.x, player.currPos.y, gradSize);
                grdBlack.addColorStop(0, 'rgba(0, 0, 0, 0)'); // inner color (fully transparent)
                grdBlack.addColorStop(1, 'rgba(0, 0, 0, .987)'); // outer color (fully opaque black)
                // Draw the black gradient
                ctx.fillStyle = grdBlack;
                ctx.beginPath();
                ctx.arc(player.currPos.x, player.currPos.y, gradSize, 0, Math.PI * 2, false);
                ctx.fill();
                ctx.closePath();

                //Create the spotlight
                ctx.beginPath();
                ctx.arc(player.currPos.x, player.currPos.y, player.spotlight, 0, Math.PI * 2, true);
                ctx.rect(0, 0, canvas.width, canvas.height);
                ctx.fill('evenodd');
                ctx.closePath();

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
    const rectWidth = 48;
    const rectHeight = 96;
    const rectOffset = 0;
    
    // Draw red rectangle on the north side
    if(doorInfo.north){
        ctx.fillStyle ='rgba(255, 0, 0, '+valueToAlpha(doorInfo.north)+')';
        ctx.fillRect((canvasWidth - rectHeight) / 2, rectOffset, rectHeight, rectWidth);
    }
    
    // Draw red rectangle on the south side
    if(doorInfo.south){
        ctx.fillStyle ='rgba(255, 0, 0, '+valueToAlpha(doorInfo.south)+')';
        ctx.fillRect((canvasWidth - rectHeight) / 2, canvasHeight - rectWidth - rectOffset, rectHeight, rectWidth);
    }
    
    // Draw red rectangle on the east side
    if(doorInfo.east){
        ctx.fillStyle ='rgba(255, 0, 0, '+valueToAlpha(doorInfo.east)+')';
        ctx.fillRect(canvasWidth - rectWidth - rectOffset, (canvasHeight - rectHeight) / 2, rectWidth, rectHeight);
    }
    
    // Draw red rectangle on the west side
    if(doorInfo.west){
        ctx.fillStyle ='rgba(255, 0, 0, '+valueToAlpha(doorInfo.west)+')';
        ctx.fillRect(rectOffset, (canvasHeight - rectHeight) / 2, rectWidth, rectHeight);
    }
    
    //console.log(doorInfo);
}

function valueToAlpha(value) {
    if (value >= 10)
        return 0;
    return (10 - value) / 10;
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

            const randGrassNum = seededRandom(y * x + y + x, 1, 12);
            const spawnGrass = seededRandom(x+ y * x + y * x, 1, 3); //1 in 3 chance to spawn some kind of grass
            if(spawnGrass == 1){
                var aFrames = ['1', '2', '3', '4'];
                let frameIndex = Math.floor((currentFrame + (x + y) * 10) / 40) % aFrames.length;
                drawSprite(ctx, 'grass'+ randGrassNum + "_" + aFrames[frameIndex], x * blockSize, y * blockSize);
            }
        }
    }
}

function drawInventory(ctx, gs) {
    var me = getMe(gs);

    if(me.isSnatcher){
        drawSprite(ctx,'snatcherInventory', ctx.canvas.width - 140, 10);
        if (me.hasItem) 
            drawSprite(ctx, me.hasItem.type, ctx.canvas.width - 93, 41);
        else{
            ctx.fillStyle = 'rgba(28, 28, 28, .60)';
            ctx.font = 'bold 46px ' + font;
            ctx.fillText('E', ctx.canvas.width - 70, 69);
        }
    }
    else{
        drawSprite(ctx,'playerInventory', ctx.canvas.width - 235, 10);

        if (me.hasItem) 
            drawSprite(ctx, me.hasItem.type, ctx.canvas.width - 92, 42);
        else{
            ctx.fillStyle = 'rgba(28, 28, 28, .60)';
            ctx.font = 'bold 46px ' + font;
            ctx.fillText('E', ctx.canvas.width - 67, 69);
        }

        if (me.hasKeys.length == 1)
            drawSprite(ctx,'key', ctx.canvas.width - 197, 42);
        else if (me.hasKeys.length == 2){
            drawSprite(ctx,'key', ctx.canvas.width - 197, 42);
            drawSprite(ctx,'key', ctx.canvas.width - 144, 42);
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
    var lastDir = player.ld; //last direction
    if(lastDir == "n")
        aFrame = ['n1','n2','n3'];
    else if(lastDir == "s")
        aFrame = ['s1','s2','s3'];
    else if(lastDir == "e")
        aFrame = ['e1','e2','e3'];
    else if(lastDir == "w")
        aFrame = ['w1','w2','w3'];



    if(!player.isSnatcher){
        if(player.hasKeys.length > 0 && player.hasKeys[0] > 0){
            // Draw black bar above player's head
            ctx.fillStyle = '#050505';
            ctx.fillRect(px - 25, py - 15, 101, 18);
            // Calculate the fill percentage based on player.hasKeys[0] value
            const fillPercentage = player.hasKeys[0] / 900; //This has to match the server value...
            // Calculate the width of the green fill based on the fill percentage
            const fillWidth = fillPercentage * 101;
            // Draw green fill on the black bar
            ctx.fillStyle = '#ffbe0a';
            ctx.fillRect(px - 25, py - 15, fillWidth, 18);
            //console.log(player.hasKeys[0]);
        }
        const framesBeforeNextAnimate = 42;
        let frameIndex = Math.floor(currentFrame / framesBeforeNextAnimate) % aFrame.length;
        drawSprite(ctx, pName+ aFrame[frameIndex], px, py);
    }
    else{
        if(player.isSnatcher){ //&& isPlayerMoving()
            const framesBeforeNextAnimate = 25;
            let frameIndex = Math.floor(currentFrame / framesBeforeNextAnimate) % aFrame.length;
            drawSprite(ctx, pName+ aFrame[frameIndex], px, py);
        }
    }

    if(currentFrame % 18 == 0 && isPlayerMoving() && isMe(player.name) && player.isSnatcher == false){
        sounds['footStep1'].play();
    }
    if(currentFrame % 30 == 0 && isPlayerMoving() && isMe(player.name) && player.isSnatcher == true){
        sounds['footStep2'].play();
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
                drawSprite(ctx, 'key', item.currPos.x, item.currPos.y);
            }
            else if(item.type == 'exitdoor'){
                if(item.specialCount >= item.specialCount2)
                    drawSprite(ctx, 'exitdoorOpen', item.currPos.x - 7, item.currPos.y - 7);
                else{
                    drawSprite(ctx, 'exitdoorClosed', item.currPos.x - 7, item.currPos.y - 7);
                    ctx.fillStyle = '#fcba03';
                    ctx.font = '22px '+font2;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(item.specialCount+" / "+item.specialCount2, item.currPos.x + 1 + Math.ceil(item.width/2), item.currPos.y - 10 + Math.ceil(item.height/2));
                }
            }
            else{
                if(item.inChest){
                    if(getMe(serverState).isSnatcher)
                        drawSprite(ctx, 'chest2', item.currPos.x + 2, item.currPos.y + 2);
                    else
                        drawSprite(ctx, 'chest1', item.currPos.x + 2, item.currPos.y + 2);
                }else{
                    switch(item.type){
                        //This can probably be simplified at this point down to one line...
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
                        case 'book_of_the_dead':
                                drawSprite(ctx, 'book_of_the_dead', item.currPos.x, item.currPos.y);
                            break;
                        default:
                            break;
                    }

                }
            }
        }
    }  
}

function drawSolidObjects(ctx, currentRoomX, currentRoomY) {
    const solidObjects = localState.solidObjects;
    if (solidObjects) {
        var roomObjects = solidObjects[currentRoomX + "," + currentRoomY];
        if(roomObjects)
            for (let i = roomObjects.length - 1; i >= 0; i--) {
                const solidObject = roomObjects[i];

                ctx.fillStyle = 'red';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'left';

                if (solidObject.type.startsWith("g")) {
                    drawSprite(ctx, solidObject.type, solidObject.x, solidObject.y);
                    continue;
                }

                const oneOrTwo = seededRandom(solidObject.randSeed, 1, 2);
                const oneToFour = seededRandom(solidObject.randSeed, 1, 4);
                const oneToEight = seededRandom(solidObject.randSeed, 1, 8);

                if(solidObject.type == "b"){//Draw flaming pylon
                    var aFrames = ['1', '2', '3', '4'];
                    let frameIndex = Math.floor((currentFrame + i * 10) / 55) % aFrames.length;
                    drawSprite(ctx, 'fireBlock'+ oneOrTwo + "_" + aFrames[frameIndex], solidObject.x, solidObject.y);
                    continue;
                }

                if (solidObject.type == "bs" && solidObject.y != canvas.height - 96){
                    if(oneToEight <= 4)
                        drawSprite(ctx, 'twoHigh'+oneToEight, solidObject.x, solidObject.y);
                    else{
                        let frameIndex = Math.floor((currentFrame + i * 10) / 25) % ['1', '2', '3', '4'].length;
                        drawSprite(ctx, 'twoHigh'+ oneToEight + "_" + ['1', '2', '3', '4'][frameIndex], solidObject.x, solidObject.y);
                    }
                }
                else if (solidObject.type == "be" && !spriteExistsAt(solidObject.x + 48, solidObject.y - 48, roomObjects) && solidObject.x != canvas.width - 96){
                    drawSprite(ctx, 'twoWide'+oneToFour, solidObject.x, solidObject.y);
                }
                else if(solidObject.type == 'bne' || solidObject.type == 'bsw'){
                    drawSprite(ctx, 'corner'+oneToEight, solidObject.x, solidObject.y);
                }
                else {
                    drawSprite(ctx, 'block' + oneOrTwo, solidObject.x, solidObject.y);
                    //ctx.fillText(`${solidObject.type}`, solidObject.x + 15, solidObject.y + 24);
                }


            }
    }



}

function spriteExistsAt(x, y, roomObjects) {
    for (let i = 0; i < roomObjects.length; i++) {
        const solidObject = roomObjects[i];
        if (solidObject.x === x && solidObject.y === y) {
            return true;
        }
    }
    return false;
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
        ctx.fillText("Ping: ", 10, canvas.height - 20);
        return;
    }
    ctx.fillText("Ping: "+Math.ceil(localState.ping), 10, canvas.height - 20);
}

function isPlayerSpotTaken(gs, id) {
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

function isRunnerInThisRoom(gs, row, col) {
    if (gs.players) {
        for (let i = 0; i < gs.players.length; i++) {
            const player = gs.players[i];
            if (player.currRoom.x == col && player.currRoom.y == row && !player.isSnatcher)
                return player;
        }
    }
    return -1;
}

function isExitDoorInRoomOpen(row, col){
    //localState.exitDoors is populated once a door is opened from the server side
    for (let i = 0; i < localState.exitDoors.length; i++) {
        const exitdoor = localState.exitDoors[i];
        if (exitdoor.currRoom.x == col && exitdoor.currRoom.y == row) {
            if(exitdoor.specialCount >= exitdoor.specialCount2)
                return true;
            else
                return false;
        }
    }
    return false;
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

function seededRandom(seed, low, high) {
    let x = Math.sin(seed++) * 10000;
    return Math.floor((x - Math.floor(x)) * (high - low + 1)) + low;
}


$(document).ready(function() {  

    // Add the event listener here
    canvas.addEventListener('click', function(event) {

        if(!serverState || serverState.state != "lobby" || !socket || socket.readyState != 1)
            return;

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
                    if(localState.playerId == -1){
                        stopSound('lobbyJoin');
                        sounds['lobbyJoin'].play();
                        socket.send(JSON.stringify({
                            type:"playerJoin",
                            name:buttonId,
                            id: buttonId,
                            color: button.playerColor
                        }));
                    }
                    else{
                        stopSound('lobbyLeave');
                        sounds['lobbyLeave'].play();
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
            stopSound('lobbyJoin');
            sounds['lobbyJoin'].play();
            socket.send(JSON.stringify({
                type:"startGame",
            }));
            isGameLoading = true;
        }
            
    });

});

var hasUserInteracted = false;
function playFirstInteractionSounds() {
    if(!serverState)
        return;
    hasUserInteracted = true;
    stopSound('thunder');
    sounds['thunder'].play();
    document.removeEventListener('click', playFirstInteractionSounds);
    document.removeEventListener('keydown', playFirstInteractionSounds);
}

document.addEventListener('click', playFirstInteractionSounds);
document.addEventListener('keydown', playFirstInteractionSounds);


