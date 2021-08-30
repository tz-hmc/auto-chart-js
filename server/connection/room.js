export class Room {
    constructor(roomCode) {
        this.code = roomCode;
        this.clients = new Set();
        this.songIsReady = false;
        this.songIsPlaying = false;
    }
    joinFirst(client) {
        if (client.room) {
            throw new Error('client already in room');
        }
        this.clients.add(client);
        client.newRoom(this);
    }
    join(client) {
        if (client.room) {
            throw new Error('client already in room');
        }
        this.clients.add(client);
        client.joinRoom(this);
        if (this.songIsReady) {
            client.songReady();
        }
    }
    leave(client) {
        if (client.room !== this) {
            throw new Error('client not in room');
        }
        this.clients.delete(client);
        client.room = null;
    }
    broadcast() {
        this.clients.forEach(client => {
            client.broadcast();
        });
    }
    songReady() {
        this.songIsReady = true;
        this.clients.forEach(client => {
            client.songReady();
        });
    }
    clientReady(client) {
        client.playerIsReady = true;
        let clients = Array.from(this.clients);
        let allReady = clients.filter(client => client.playerIsReady === true).length === clients.length &&
            clients.length >= 2;
        if (allReady) {
            clients.forEach(client => {
                client.clientReady();
            });
        }
    }
    gameBroadcast(updatedClient, data) {
        this.songIsPlaying = true;
        this.clients.forEach(client => {
            if (client.id !== updatedClient.id) {
                client.gameBroadcast(updatedClient.id, data)
            }
        })
    }
    reset() {
        if (this.songIsPlaying) {
            this.songIsReady = false;
            this.songIsPlaying = false;
            let clients = Array.from(this.clients);
            clients.forEach(client => {
                client.resetReady();
            });
        }
    }
}
export function roomCode() {
    let len = 4;
    let chars = 'abcdefghijklmnopqrstuvwxyz';
    let id = '';
    while (len--) {
        id += chars[Math.random() * chars.length | 0];
    }
    return id;
}