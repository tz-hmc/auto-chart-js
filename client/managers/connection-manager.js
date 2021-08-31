class ConnectionManager {
    constructor() {
        this.playerManager = new PlayerManager();

        this.conn = null;
        this.roomCode = '';

        this.callbacks = {};
    }
    isConnected() {
        return !!(this.conn) && this.roomCode.length > 0;
    }
    setCallback({create, join, broadcast, songReady, roomReady, gameBroadcast}) {
        this.callbacks = {create, join, broadcast, songReady, roomReady, gameBroadcast, ...this.callbacks};
    }
    // create room on server
    connect(address=WEB_SOCKET_URL) {
        this.conn = new WebSocket(address);
        this.conn.addEventListener('open', () => {
            this.initRoom();
        });
        this.conn.addEventListener('message', event => {
            console.log(`message: ${event.data}`);
            let data = this.receive(event.data);
            if (data.type === 'room-created') {
                this.setRoom(data.roomCode);
                if (this.callbacks?.create) this.callbacks.create(data);
            }
            else if (data.type === 'room-joined') {
                this.setRoom(data.roomCode);
                if (this.callbacks?.join) this.callbacks.join(data);
            }
            else if (data.type === 'room-broadcast') {
                this.setPlayers(data.peers);
                if (this.callbacks?.broadcast) this.callbacks.broadcast(data);
            }
            else if (data.type === 'song-ready') {
                if (this.callbacks?.songReady) this.callbacks.songReady(data);
            }
            else if (data.type === 'room-ready') {
                if (this.callbacks?.roomReady) this.callbacks.roomReady(data);
            }
            else if (data.type === 'game-broadcast') {
                this.playerManager.updateRemote(data);
                if (this.callbacks?.gameBroadcast) this.callbacks.gameBroadcast(data);
            }
        });
    }
    setPlayers(peers) {
        const localClientId = peers.you;
        const clients = peers.peers.filter(id => localClientId !== id);
        this.playerManager.addLocal(localClientId, this);
        clients.forEach((id) => {
            this.playerManager.addRemote(id, this)
        });
    }
    receive(msg) {
        let data = JSON.parse(msg);
        return data;
    }
    send(data) {
        const msg = JSON.stringify(data);
        console.log(`sending message ${msg}`);
        this.conn.send(msg);
    }
    sendCreate() {
        this.send({
            type: 'create-room'
        });
    }
    sendJoin() {
        this.send({
            type: 'join-room',
            roomCode: this.roomCode
        });
    }
    sendReady() {
        this.send({
            type: 'ready',
            roomCode: this.roomCode
        });
    }
    sendUpdate({score, currNoteIndices}) {
        this.send({
            type: 'game-update',
            score,
            currNoteIndices
        });
    }
    sendFinish() {
        this.send({
            type: 'game-finish'
        });
    }
    initRoom() {
        this.roomCode = window.location.hash.split('#')[1];
        if (this.roomCode) {
            this.sendJoin();
        }
        else {
            this.sendCreate();
        }
    }
    setRoom(roomCode) {
        this.roomCode = roomCode;
        window.location.hash = this.roomCode;
    }
}
