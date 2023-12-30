const WebSocket = require('ws');
const MapBoard = require('./MapBoard.js');
const Movement = require('./Movement.js');

const wss = new WebSocket.Server({ port: 8080 });

global.canvasWidth = 1200;
global.canvasHeight = 700;

var gs = {
    type: "gs",
    state: 'lobby',
    players:[],
    theSnatcher:undefined
    //Room Types: 0 = empty, 1 = room, 2 = starting room, 3 = door
};

var playerObject ={
    id: -1,
    name: "",
    isConnected: false,
    points:0,
    sWins:0,
    rWins:0,
    currRoom:{x:-1,y:-1},
    currPos:{x:-100,y:-100},
    hasKey: false,
    foundDoor1: false,
    foundDoor2: false,
    speed:5,
    isSnatcher: false,
    snatcherStats: undefined
};

var playTime = 0;
var timeouts = [];
var map = null;

var defaultGameState = JSON.parse(JSON.stringify(gs));

const users = new Map();

wss.on('connection', (ws) => {
    
    // Send the current game state to the client
    ws.on('message', (message) => {
        message = JSON.parse(message);

        if(message.type == "playerJoin"){
            console.log("Player join request: " + message.id);
            if(playerConnected(message.id) == false){
                var newPlayer = JSON.parse(JSON.stringify(playerObject));
                newPlayer.isConnected = true;
                newPlayer.name = message.name;
                newPlayer.id = String(Date.now());
                gs.players.push(newPlayer);
                users.set(ws, newPlayer.id);

                console.log("Player joined: " + JSON.stringify(newPlayer));
                // Send the player's ID back to the client
                ws.send(JSON.stringify({ type: "playerId", id: newPlayer.id }));

            }else{
                //Player is already connected
                console.log("Player already connected: " + message.id);
            }
        }

        if(message.type == "generateMap"){
            map = new MapBoard();
            sendClients({type: "map", map: map.generateNewMap()})
            map.spawnPlayers(gs.players);
        }

        if(message.type =="startGame"){
            console.log("Starting game...");
            gs.state = 'playing';
            map = new MapBoard();
            sendClients({type: "map", map: map.generateNewMap()})
            map.spawnPlayers(gs.players);
        }

        if(message.type == "movePlayer"){
            new Movement().movePlayer(gs,map.get(),message.id, message.direction);
        }

    });

    //A user has disconnected
    ws.on('close', function() {
        console.log('User id ' + users.get(ws) + ' disconnected');
        const disconnectedUserId = users.get(ws);
        users.delete(ws);

        // Remove the player from the gs.players array with the id of the disconnected user
        gs.players = gs.players.filter(player => player.id !== disconnectedUserId);
        
        if(users.size === 0) {
            console.log('All clients disconnected...');
            clearAllTimeouts();
            resetGameState();
        }
    });

});


function playerConnected(id){
    for (let i = 0; i < gs.players.length; i++) 
        if (gs.players[i].id == id) 
            return true;
    return false;
}

function resetGameState(){
    gs = JSON.parse(JSON.stringify(defaultGameState));
}

function updatePlayTime(){
    playTime += 1;
}

function createTimeout(fn, delay) {
    let timeoutId = setTimeout(fn, delay);
    timeouts.push(timeoutId);
}

function clearAllTimeouts() {
    for (let timeoutId of timeouts) {
        clearTimeout(timeoutId);
    }
    timeouts = [];
}

function sendClients(object){
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN)
            client.send(JSON.stringify(object));
    });

}
setInterval(function() {
    updatePlayTime();

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN)
            client.send(JSON.stringify(gs));
    });
}, 32);