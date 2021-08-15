const DEVELOPMENT_ADDR = 'ws://localhost:9000';
class ConnectionManager {
    constructor(playerManager) {
        this.playerManager = playerManager;

        this.conn = null;
        this.roomCode = '';

        this.peers = new Map();
        this.callbacks = {};
    }
    isConnected() {
        return !!(this.conn) && this.roomCode.length > 0;
    }
    setCallback({create, join, broadcast, songReady, roomReady}) {
        this.callbacks = {...this.callbacks, create, join, broadcast, songReady, roomReady};
    }
    // create room on server
    connect(address=DEVELOPMENT_ADDR) {
        this.conn = new WebSocket(address);
        this.conn.addEventListener('open', () => {
            this.initRoom();
        })
        this.conn.addEventListener('message', event => {
            console.log(`message: ${event.data}`);
            let data = this.receive(event.data);
            if (data.type === 'room-created') {
                this.setRoom(data.roomCode);
                if (this.callbacks?.create) this.callbacks.create();
            }
            else if (data.type === 'room-joined') {
                this.setRoom(data.roomCode);
                if (this.callbacks?.join) this.callbacks.join();
            }
            else if (data.type === 'room-broadcast') {
                this.setPlayers(data.peers);
                if (this.callbacks?.broadcast) this.callbacks.broadcast();
            }
            else if (data.type === 'song-ready') {
                if (this.callbacks?.songReady) this.callbacks.songReady();
            }
            else if (data.type === 'room-ready') {
                if (this.callbacks?.roomReady) this.callbacks.roomReady();
            }
        })
    }
    setPlayers(peers) {
        const me = peers.you;
        const clients = peers.peers.filter(id => me !== id);
        this.playerManager.add(new Player(me));
        clients.forEach((id) => {
            this.playerManager.add(new Player(id))
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