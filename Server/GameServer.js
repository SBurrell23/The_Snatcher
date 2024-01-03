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
    currPos:{x:-1000,y:-1000},
    hasKeys: [],
    hasItem: undefined,
    speed:400,
    radius:25,
    spotlight: 375,
    isSnatcher: false
};

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
const movementQueue = new Map();

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

        if(message.type == "mp"){
            movementQueue.set(message.id, message.dir);
        }

        if(message.type == "pickupItem"){
            new Movement().pickupItem(gs,message.id);
        }

        if(message.type == "dropItem"){
            new Movement().dropItem(gs,message.id,true);
        }

        if(message.type == "ping"){
            sendClient(message.id,{type: "pong"});
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
    resetPlayerStats();

    global.map = new MapBoard();
    sendAllClients({type: "map", map: global.map.generateNewMap()});

    global.map.spawnPlayers(gs.players);
    global.map.spawnItems(gs);

    global.solidObjects = new SolidObjects();
    global.solidObjects.createPerimeterWalls(gs, global.map.get());
    global.solidObjects.createMazeWalls(gs, global.map.get());
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
    var snatcherItems = [];
    var runnerItems = [];
    for (let item of global.items) {
        if(item.currRoom.x == roomX && item.currRoom.y == roomY){

            if(item.whoIsFor == 'snatcher')
                snatcherItems.push(item);
            else if(item.whoIsFor == 'runner')
                runnerItems.push(item);
            
            if(item.whoIsFor == 'all'){
                snatcherItems.push(item);
                runnerItems.push(item);
            }
        }
    }

    //Next find any players in the room and send them the list of appropriate items
    for (let player of gs.players) {
        if(player.currRoom.x == roomX && player.currRoom.y == roomY){
            if(player.isSnatcher)
                sendClient(player.id,{type: "items", items: snatcherItems});
            else
                sendClient(player.id,{type: "items", items: runnerItems});
        }
    }
            
}

function setSnatcher(){
    if(gs.players.length == 0)
        return;

    var snatcherSpeedMod = 1.12; // :)
    var snatcherSpotlight = 225; // :(

    var snatcher = gs.players[0]; //First player is the snatcher

    snatcher.isSnatcher = true;
    snatcher.speed = snatcher.speed * snatcherSpeedMod;
    snatcher.spotlight = snatcherSpotlight;
}

function resetPlayerStats(){
    for (let i = 0; i < gs.players.length; i++){
        gs.players[i].isAlive = true;
        gs.players[i].hasKeys = [];
        gs.players[i].hasItem = undefined;
    }
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

function sendClient(id,object){
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && clients.get(client) == id)
            client.send(JSON.stringify(object));
    });
}

function updateMovements(deltaTime){
    movementQueue.forEach((dir, id) => {
        new Movement().movePlayer(gs,global.map.get(),id, dir,global.solidObjects.get(),deltaTime);
    });
    movementQueue.clear();
}

let lastUpdateTime = Date.now();
function gameLoop() {
    let now = Date.now();
    let deltaTime = (now - lastUpdateTime) / 1000; // Time since last update in seconds

    updateMovements(deltaTime);
    sendAllClients(gs);

    lastUpdateTime = now;
    setTimeout(gameLoop, 1000 / 60); // Run the game loop 60 times per second
    //This ends up being 16.6ms per frame (not counting deltaTime)
}
gameLoop();