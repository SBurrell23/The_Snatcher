var socket = null;
var reConnectInterval = null;

function connectWebSocket() {
    console.log("Attempting to connect to server...");
    globalState = null;
    playerId = -1;
    
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

var globalState = null;
var playerId = -1;

function recievedServerMessage(message) {
    var message = JSON.parse(message);

    if(message.type == "playerId"){
        playerId = message.id
        localStorage.setItem("TSPID", playerId);
    }
    else if(message.type == "gs"){
        globalState = message;
        updateLobby(globalState);
        updateInput(globalState,playerId);
    }
}

function gameLoop(gs) {
    if (gs)
        drawGameState(gs);
    requestAnimationFrame(gameLoop); // schedule next game loop
}


function updateLobby(gs) {
    var playerQueue = $('#playerQueue tbody');
    playerQueue.empty(); // Clear the table

    for (var i = 0; i < gs.players.length; i++) {
        var player = gs.players[i];
        var row = $('<tr></tr>').appendTo(playerQueue);
        $('<td></td>').text(player.name).appendTo(row);
        $('<td></td>').text(player.sWins).appendTo(row);
        $('<td></td>').text(player.rWins).appendTo(row);
    }
}

function updateInput(gs,id){
}

function drawGameState(gs) {
    
    var ctx = document.getElementById('canvas').getContext('2d');

    drawBackground(ctx);

}   

function drawBackground(ctx) {
    const squareSize = 10;
    const numRows = Math.ceil(ctx.canvas.height / squareSize);
    const numCols = Math.ceil(ctx.canvas.width / squareSize);

    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            if ((row + col) % 2 === 0)
                ctx.fillStyle = '#B8BADC';
            else 
                ctx.fillStyle = '#B2B4D3';
            ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
        }
    }

    var lineWidth = 3;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, lineWidth);
    ctx.fillRect(0, 0, lineWidth, ctx.canvas.height);
    ctx.fillRect(ctx.canvas.width - lineWidth, 0, lineWidth, ctx.canvas.height);
    ctx.fillRect(0, ctx.canvas.height - lineWidth, ctx.canvas.width, lineWidth);
}


$(document).keydown(function(e) {

});

$(document).ready(function() {   

    var canvas = document.getElementById('canvas');
    var parentDiv = canvas.parentNode;
    canvas.width = parentDiv.offsetWidth - 100;

    $(window).resize(function() {
        canvas.width = parentDiv.offsetWidth - 100;
    });

    var TSPID = localStorage.getItem('TSPID');
    if (TSPID) {
        playerId = TSPID;
    }

    $('#joinGameButton').click(function() {
        var playerName = $('#playerNameInput').val();
        if(playerName == ""){
          playerName = "Player #"+ (Math.floor(Math.random() * 100) + 1);
          $('#playerNameInput').val(playerName);
        }
        socket.send(JSON.stringify({
            type:"playerJoin",
            name:playerName,
            id:playerId
        }));
    });

    $('#playerNameInput').keypress(function(e) {
        if (e.which === 13) {
            $('#joinGameButton').click();
        }
    });
});

