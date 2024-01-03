var socket = null;
var reConnectInterval = null;

var serverState = null;
var localState = {
    playerId: -1,
    map: null,
    solidObjects: null,
    items: [],
    roomsIveBeenIn: []
};
var keys = {};
var colors = {
    snatcher: '#3d67ff',
    me: '#FF8300',
    otherPlayer: '#81B622',
    key: '#f7d707'
}

function connectWebSocket() {
    console.log("Attempting to connect to server...");
    serverState = null;
    localState.playerId = -1;
    
    clearInterval(reConnectInterval);

    //wss://the-snatcher.onrender.com
    //ws://localhost:8080
    socket = new WebSocket('wss://the-snatcher.onrender.com');  
    socket.addEventListener('open', function () {
        console.log('Server connection established!');
        $("#offlineMessage").css("display", "none");
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
        }, 1000) //On disconnect, try to reconnect every second
    });
}
connectWebSocket();

function recievedServerMessage(message) {
    var message = JSON.parse(message);

    if(message.type == "playerId"){
        localState.playerId = message.id
    }
    else if(message.type == "map"){
        localState.map = message.map;
        roomsIveBeenIn = [];
    }
    else if(message.type == "items"){
        localState.items = message.items;
    }
    else if(message.type == "solidObjects"){
        localState.solidObjects = message.solidObjects;
        console.log(localState.solidObjects);
    }
    else if(message.type == "gs"){
        serverState = message;
        updateLobby(serverState);
        updateInput(serverState,localState.playerId);
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

function gameLoop() {
    if (serverState){
        drawGameState(serverState);
        handlePlayerMovement();
    }
    requestAnimationFrame(gameLoop); // schedule next game loop
}

function drawGameState(gs) {
    
    var ctx = document.getElementById('canvas').getContext('2d');
    
    drawBackground(ctx);


    if(gs.state == "playing" && getMe(gs).currRoom != undefined){
        var currentRoomX = getMe(gs).currRoom.x;
        var currentRoomY = getMe(gs).currRoom.y;
    
        drawSolidObjects(ctx, currentRoomX, currentRoomY);  
        drawItems(ctx,currentRoomX, currentRoomY);
        drawPlayers(ctx, gs, currentRoomX, currentRoomY);
        
        drawMap(ctx,gs,localState.map);
        drawPlayerInventory(ctx, gs);
    }

}   

function drawBackground(ctx) {
    ctx.fillStyle = '#B8BADC';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    var lineWidth = 2;
    ctx.fillStyle = 'black';
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

function drawMap(ctx, gs, map) {
    const roomSize = 9;
    const walloffset = 20;
    if (map) {
        
        ctx.fillStyle = 'rgba(0, 0, 0, .65)';
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

                if (!getMe(gs).isSnatcher && (haveIBeenInThisRoom(row,col) || (roomColor == colors.snatcher))){
                    ctx.fillRect(roomX - walloffset, roomY + walloffset, roomSize, roomSize);
                }
                else if(getMe(gs).isSnatcher){
                    //If the snatcher, override me,players, and door rooms as empty
                    if(roomColor != colors.snatcher)
                        ctx.fillStyle = emptyRoom;
                    ctx.fillRect(roomX - walloffset, roomY + walloffset, roomSize, roomSize);
                }
            }
        }
    }
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

    ctx.fillStyle = 'rgba(0, 0, 0, .65)';
    ctx.fillRect(20, 20, 140, 170);

    // Draw INVENTORY text
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText("INVENTORY", 90, 50);

    if (me.hasKeys.length > 0) {
        for (let i = 1; i <= me.hasKeys.length; i++) {
            ctx.font = '18px Arial';
            ctx.fillStyle = colors.key;
            ctx.textAlign = 'center';
            ctx.fillText("KEY#" + i, 90, 55 + (i * 30));
        }
    }
    if (me.hasItem) {
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'magenta';
        ctx.fillText(me.hasItem.type.toUpperCase(), 90, 155);
    }
}

function drawPlayers(ctx, gs, currentRoomX, currentRoomY) {
    for (let i = 0, len = gs.players.length; i < len; i++) {
        var player = gs.players[i];
        if (player.currRoom.x == currentRoomX && player.currRoom.y == currentRoomY) {
            var color = colors.otherPlayer;
            
            if (isSnatcher(gs, player.id))
                color = colors.snatcher;
            else if (isMe(player.id))
                color = colors.me;

            if(isMe(player.id)){
                // Draw currRoom.x and currRoom.y in the middle of the screen
                ctx.fillStyle = color;
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`X: ${player.currRoom.x}, Y: ${player.currRoom.y}`, (canvas.width / 2)-300, (canvas.height / 2)-100);
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
                ctx.fillText("("+item.specialCount+")", item.currPos.x + Math.ceil(item.width/2), item.currPos.y + Math.ceil(item.height/2));
            }
            else{
                ctx.fillStyle = 'magenta';
                ctx.fillRect(item.currPos.x, item.currPos.y, item.width, item.height);
                ctx.fillStyle = 'black';
                ctx.font = '18px Arial';
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(item.type.toUpperCase(), item.currPos.x + item.width / 2, item.currPos.y + item.height / 2);
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

function getSnatcher(gs) {
    return gs.players.find(player => player.isSnatcher) || false;
}

function isSnatcher(gs,id){
    return id == getSnatcher(gs).id;
}

function getMe(gs) {
    return gs.players.find(player => isMe(player.id)) || false;
}

function isMe(id){
    return id == localState.playerId;
}

function handlePlayerMovement(){
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

$(document).keydown(function(e) {
    
    if (e.which === 13) { // Enter key
        e.preventDefault();
        socket.send(JSON.stringify({
            type: "generateMap"
        }));
    }else if (e.which === 32) { // Space to pickup or drop an item
        e.preventDefault();
        if(serverState && serverState.state == "playing" && getMe(serverState).isAlive){
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
    }else{
        keys[e.key] = true;
    }
});

window.onkeyup = function(e) {
    keys[e.key] = false;
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


