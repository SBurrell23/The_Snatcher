const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

var gs = {
    type: "gs",
    state: '',
    players:[],
    map:[],
    theSnatcher:undefined
};

var playerObject ={
    id: -1,
    name: "",
    isConnected: false,
    points:0,
    sWins:0,
    rWins:0
};

var theSnatcherObject ={
    id: -1,
    name: "",
    isConnected: false,
    points: 0,
    sWins:0,
    rWins:0
};
}

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

setInterval(function() {
    updatePlayTime();

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN)
            client.send(JSON.stringify(gs));
    });
}, 32);