const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

var gs = {
    type: "gs",
    state: 'lobby',
    players:[],
    map:undefined,
    theSnatcher:undefined
};

var playerObject ={
    id: -1,
    name: "",
    isConnected: false,
    points:0,
    sWins:0,
    rWins:0,
    currRoom:{x:-1,y:-1},
    hasKey: false,
    foundDoor1: false,
    foundDoor2: false,
    speed:1
};

var theSnatcherObject ={
    id: -1,
    name: "",
    isConnected: false,
    points: 0,
    sWins:0,
    rWins:0,
    currRoom:{x:-1,y:-1},
    speed:2
};

var playTime = 0;

var timeouts = [];

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
    });

    generateMap();

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

function generateMap() {
    const map = [];
    const rows = 20;
    const cols = 20;

    // Initialize the map with default values of 0
    for (let i = 0; i < rows; i++) {
        map[i] = [];
        for (let j = 0; j < cols; j++) {
            map[i][j] = 0;
        }
    }

    // Procedurally add rooms to the map
    const numRooms = 200;
    let roomCount = 0;

    while (roomCount < numRooms) {
        const x = Math.floor(Math.random() * rows);
        const y = Math.floor(Math.random() * cols);

        // Check if the spot is already occupied by a room
        if (map[x][y] === 0) {
            map[x][y] = 1; // Mark the spot as a room
            roomCount++;
        }
    }

    console.log(map);

    gs.map = map;
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

setInterval(function() {
    updatePlayTime();

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN)
            client.send(JSON.stringify(gs));
    });
}, 32);