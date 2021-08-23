/**
 * Notes:
 * ConnectionManager uses PlayerManager to keep track of player data
 * passes PlayerManager to ChartPage for rendering
 */

class Player {
    constructor(clientId='', connectionManager) {
        this.clientId = clientId;
        this.connectionManager = connectionManager;
        this.score = 0;
    }
    update({score}) {
        this.score = score;
    }
}

// Sends local info to server on update
class LocalPlayer extends Player {
    // alt: connectionManager listen to event instance, which emits to subscribers here
    // seems overkill given there's just 1 listener
    update({score, currNoteIndices}) {
        super.update({score});
        this.connectionManager.sendUpdate({score, currNoteIndices});
    }
}

// Stores update from server by setting it as callback
class RemotePlayer extends Player {
    constructor(clientId, connectionManager) {
        super(clientId, connectionManager);
        this.connectionManager.setCallback({ 
            playerUpdate: this.update.bind(this) 
        });
    }
    update({score, currNoteIndices}) {
        super.update({score});
        this.currNoteIndices = currNoteIndices;
    }
}

class PlayerManager
{
    get LocalPlayer() {
        return this.localPlayer;
    }
    get RemotePlayers() {
        return Object.values(this.remotePlayers);
    }
    constructor() {
        this.remotePlayers = {};
        this.localPlayer = null;
    }
    addLocal(clientId, connectionManager) {
        this.localPlayer = new LocalPlayer(clientId, connectionManager);
    }
    addRemote(clientId, connectionManager) {
        this.remotePlayers[clientId] = new RemotePlayer(clientId, connectionManager);
    }
    updateRemote({clientId, ...data}) {
        if (clientId in this.remotePlayers) {
            this.remotePlayers[clientId].update(data);
        }
        else {
            console.error('client id is not recognized');
        }
    }
    removeRemote(clientId) {
        delete this.remotePlayers[clientId];
    }
}