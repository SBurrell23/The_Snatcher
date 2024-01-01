const WebSocket = require('ws');
const MapBoard = require('./MapBoard.js');
const Movement = require('./Movement.js');
const SolidObjects = require('./SolidObjects.js');

const wss = new WebSocket.Server({ port: 8080 });

global.canvasWidth = 1050;
global.canvasHeight = 750;

var gs = {
    type: "gs",
    state: 'lobby',
    players:[],
    items:[]
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
    speed:3,
    radius:25,
    isSnatcher: false,
    snatcherStats: undefined
};

var snatcherStats = {
    speedMod: 1.5
};

var playTime = 0;
var timeouts = [];
var map = null;
var solidObjects = null;

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
            startGame();
        }

        if(message.type =="startGame"){
            startGame();
        }

        if(message.type == "movePlayer"){
            new Movement().movePlayer(gs,map.get(),message.id, message.direction,solidObjects.get());
        }

    });

    //A user has disconnected
    ws.on('close', function() {
        console.log('User id ' + users.get(ws) + ' disconnected');
        const disconnectedUserId = users.get(ws);
        users.delete(ws);

        // Remove the player from the gs.players array with the id of the disconnected user
        gs.players = gs.players.filter(player => player.id !== disconnectedUserId);
        
        //If nobody is left or the snatcher leaves, reset the game
        if(users.size === 0 || isSnatcher(disconnectedUserId)) {
            console.log('All clients disconnected...');
            clearAllTimeouts();
            resetGameState();
        }
    });

});

function startGame(){
    console.log("Starting game...");
    gs.state = 'playing';
    setSnatcher();

    map = new MapBoard();
    sendClients({type: "map", map: map.generateNewMap()});
    map.spawnPlayers(gs.players);
    map.spawnItems(gs);

    solidObjects = new SolidObjects();
    solidObjects.createPerimeterWalls(gs, map.get());
    solidObjects.createMazeWalls(gs, map.get());
    sendClients({type: "solidObjects", solidObjects: solidObjects.get()});

}

function setSnatcher(){
    if(gs.players.length == 0)
        return;
    gs.players[0].isSnatcher = true;
    gs.players[0].snatcherStats = snatcherStats;
}

function isSnatcher(id){
    for (let i = 0; i < gs.players.length; i++) 
        if (gs.players[i].id == id) 
            return gs.players[i].isSnatcher;
    return false;
}

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