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
    players:[]
};

var playerObject ={
    id: -1,
    name: "",
    isConnected: false,
    isAlive: false,
    points:0,
    sWins:0,
    rWins:0,
    currRoom:{x:-1,y:-1},
    currPos:{x:-100,y:-100},
    hasKeys: [],
    speed:3,
    radius:25,
    isSnatcher: false,
    snatcherStats: undefined
};

var snatcherStats = {speedMod: 1.5};

var playTime = 0;
var timeouts = [];

//POINTS
global.pointsForKeyAddedToDoor = 1;
global.pointsForEscape = 2;

global.pointsForSnatching = 2;
global.pointsForSnatchingAllRunners = 3;

//GAME CONFIGS
global.keysNeededToOpenDoor = 3;

global.map = null // This is sent only at the start of the game since it's HUGE
global.solidObjects = null; // This is sent only at the start of the game since it's HUGE
global.items = []; //This is sent on demand dependent on game actions since it's HUGE

var defaultGameState = JSON.parse(JSON.stringify(gs));

const clients = new Map();

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
                clients.set(ws, newPlayer.id);

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
            new Movement().movePlayer(gs,global.map.get(),message.id, message.direction,global.solidObjects.get());
        }

    });

    //A user has disconnected
    ws.on('close', function() {
        console.log('User id ' + clients.get(ws) + ' disconnected');
        const disconnectedUserId = clients.get(ws);
        clients.delete(ws);

        // Remove the player from the gs.players array with the id of the disconnected user
        gs.players = gs.players.filter(player => player.id !== disconnectedUserId);
        
        //If nobody is left or the snatcher leaves, reset the game
        if(clients.size === 0 || isSnatcher(disconnectedUserId)) {
            console.log('All clients disconnected...');
            clearAllTimeouts();
            resetGameState();
        }
    });

});

function startGame(){
    console.log("Starting game...");
    
    setSnatcher();
    setAllPlyersToAlive();

    global.map = new MapBoard();
    sendAllClients({type: "map", map: global.map.generateNewMap()});
    global.map.spawnPlayers(gs.players);
    global.map.spawnItems(gs);

    global.solidObjects = new SolidObjects();
    global.solidObjects.createPerimeterWalls(gs, global.map.get());
    //global.solidObjects.createMazeWalls(gs, global.map.get());
    sendAllClients({type: "solidObjects", solidObjects: global.solidObjects.get()});

    gs.state = 'playing';
}

//Last action can be 'escaped' or 'snatched
global.checkForGameOver = function(lastAction){
    var alivePlayers = gs.players.filter(player => !player.isSnatcher && player.isAlive);
    if (alivePlayers.length == 0 && lastAction == 'snatched') {
        console.log("All players have been snatched! GAME OVER!");
    }
    else if (alivePlayers.length == 0 && lastAction == 'escaped') {
        console.log("All still alive players have escaped! GAME OVER!");
    }
}

global.sendItemsToClientsInRoom = function(roomX, roomY){
    
    //First compile a list of any items currently in the room
    var itemsInRoom = [];
    for (let item of global.items) {
        if(item.currRoom.x == roomX && item.currRoom.y == roomY){
            itemsInRoom.push(item);
        }
    }

    //Next find any players in the room and send them the list of items
    for (let player of gs.players) 
        if(player.currRoom.x == roomX && player.currRoom.y == roomY)
            sendClient(player,{type: "items", items: itemsInRoom});
}

function setSnatcher(){
    if(gs.players.length == 0)
        return;
    gs.players[0].isSnatcher = true;
    gs.players[0].snatcherStats = snatcherStats;
}

function setAllPlyersToAlive(){
    for (let i = 0; i < gs.players.length; i++)
        gs.players[i].isAlive = true;
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

function sendAllClients(object){
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN)
            client.send(JSON.stringify(object));
    });

}

function sendClient(player,object){
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && clients.get(client) == player.id)
            client.send(JSON.stringify(object));
    });
}

setInterval(function() {
    updatePlayTime();
    
    sendAllClients(gs);
}, 32);