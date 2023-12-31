var socket = null;
var reConnectInterval = null;

var serverState = null;
var localState = {
    playerId: -1,
    map: null,
    solidObjects: null
};
var keys = {};
var colors = {
    snatcher: '#000C66',
    me: 'yellow',
    otherPlayer: '#fc2eff'
}

function connectWebSocket() {
    console.log("Attempting to connect to server...");
    serverState = null;
    localState.playerId = -1;
    
    clearInterval(reConnectInterval);

    //wss://thesnatcher.onrender.com
    //ws://localhost:8080
    socket = new WebSocket('ws://localhost:8080');  
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

function gameLoop() {
    if (serverState){
        drawGameState(serverState);
        handlePlayerMovement();
    }
    requestAnimationFrame(gameLoop); // schedule next game loop
}


function updateLobby(gs) {
    var playerQueue = $('#playerQueue tbody');
    playerQueue.empty(); // Clear the table

    for (var i = 0; i < gs.players.length; i++) {
        var player = gs.players[i];
        var row = $('<tr></tr>').appendTo(playerQueue);
        $('<td></td>').text(player.name).appendTo(row);
        $('<td></td>').text(player.points).appendTo(row);
        $('<td></td>').text(player.sWins).appendTo(row);
        $('<td></td>').text(player.rWins).appendTo(row);
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

function drawGameState(gs) {
    
    var ctx = document.getElementById('canvas').getContext('2d');
    
    drawBackground(ctx);
    drawSolidObjects(ctx, gs);

    if(gs.state == "playing"){
        drawPlayers(ctx, gs);
        drawMap(ctx,gs,localState.map);
    }

}   

function drawBackground(ctx) {
    ctx.fillStyle = '#B8BADC';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    var lineWidth = 3;
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
        
        const blankSpace = 'rgba(255, 255, 255, .75)';
        const emptyRoom = 'red';
        const snatcherSpawn = '#7EC8E3';
        const exitDoor = 'green';

        for (let row = 0; row < map.length; row++) {
            for (let col = 0; col < map[row].length; col++) {
                const room = map[row][col];
                const roomX = ctx.canvas.width - (roomSize * (col + 1));
                const roomY = roomSize * row;

                var roomColor = 'gray';
                if(isAnyPlayerInThisRoom(gs,row,col)){
                    if(getSnatcher(gs).currRoom.x == col && getSnatcher(gs).currRoom.y == row)
                        roomColor = colors.snatcher;
                    else if(getMe(gs).currRoom.x == col && getMe(gs).currRoom.y == row)
                        roomColor = colors.me;
                    else
                        roomColor = colors.otherPlayer;
                }
                else if(room === 0)
                    roomColor = blankSpace;
                else if (room === 1) 
                    roomColor = emptyRoom;
                else if (room === 2) 
                    roomColor = snatcherSpawn;
                else if (room === 3) 
                    roomColor = exitDoor;

                ctx.fillStyle = roomColor;
                ctx.fillRect(roomX - walloffset, roomY + walloffset, roomSize, roomSize);
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

function isPlayerInMyRoom(gs, friendX,friendY) {
    if(gs.players.length > 0)
        for (let i = 0; i < gs.players.length; i++) {
            if (isMe(gs.players[i].id)) {
                if (gs.players[i].currRoom.x == friendX && gs.players[i].currRoom.y == friendY)
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

function drawPlayers(ctx, gs) {
    if (gs.players) {
        for (let i = 0, len = gs.players.length; i < len; i++) {
            var player = gs.players[i];
            if (isPlayerInMyRoom(gs, player.currRoom.x, player.currRoom.y)) {
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
}

function drawSolidObjects(ctx) {
    const solidObjects = localState.solidObjects;
    if (solidObjects && getMe(serverState)) {
        for (let i = 0; i < solidObjects.length; i++) {
            const solidObject = solidObjects[i];
            if(
                solidObject.roomXY[0] == getMe(serverState).currRoom.x && 
                solidObject.roomXY[1] == getMe(serverState).currRoom.y
                ){
                ctx.fillStyle = solidObject.color;
                ctx.fillRect(solidObject.x, solidObject.y, solidObject.width, solidObject.height);
            }
        }
    }
}

function handlePlayerMovement(){
    if(keys['a'] || keys['ArrowLeft']){
        movePlayer("left");
    }
    else if(keys['w'] || keys['ArrowUp']){
        movePlayer("up");
    }
    else if(keys['d'] || keys['ArrowRight']){
        movePlayer("right");
    }
    else if(keys['s'] || keys['ArrowDown']){
        movePlayer("down");
    }
}

function movePlayer(direction){
    socket.send(JSON.stringify({
        type:"movePlayer",
        id:localState.playerId,
        direction:direction
    }));
}

$(document).keydown(function(e) {
    keys[e.key] = true;
    if (e.which === 32) { // Space key
        e.preventDefault();
        socket.send(JSON.stringify({
            type: "generateMap"
        }));
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


