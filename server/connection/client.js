import { v4 as uuid } from 'uuid';
export class Client {
    constructor(conn, id = uuid()) {
        this.conn = conn;
        this.room = null;
        this.id = id;
        this.playerIsReady = false;
    }
    receive(msg) {
        let data = JSON.parse(msg);
        return data;
    }
    send(data) {
        let msg = JSON.stringify(data);
        console.log(`sending message... ${msg}`);
        this.conn.send(msg, err => {
            if(err) console.error(err);
        });
    }
    newRoom(room) {
        this.room = room;
        this.send({
            type: 'room-created',
            roomCode: this.room.code
        });
    }
    joinRoom(room) {
        this.room = room;
        this.send({
            type: 'room-joined',
            roomCode: this.room.code
        })
    }
    broadcast() {
        let otherClients = [...this.room.clients];
        this.send({
            type: 'room-broadcast',
            peers: {
                you: this.id,
                peers: otherClients.map(cl => cl.id)
            }
        });
    }
    songReady() {
        // after this, clients should get staticly served files themselves
        this.send({
            type: 'song-ready'
        });
    }
    clientReady() {
        this.send({
            type: 'room-ready',
            //charts: [],
        });
    }
    resetReady() {
        this.playerIsReady = false;
    }
    gameBroadcast(otherClientId, data) {
        this.send({
            type: 'game-broadcast',
            clientId: otherClientId,
            score: data.score,
            currNoteIndices: data.currNoteIndices
        });
    }
}