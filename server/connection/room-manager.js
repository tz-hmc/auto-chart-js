import {Room, roomCode} from './room.js';
export class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    newRoom(client, code=roomCode()) {
        if (this.rooms.has(code))
            throw new Error(`room code ${code} already exists`);
        const room = new Room(code);
        room.joinFirst(client);
        this.rooms.set(code, room);
        return room;
    }
    joinRoom(roomCode, client) {
        if (!roomCode) {
            console.error('did not send room code');
            return;
        }
        let room = this.rooms.get(roomCode);
        if (!room) {
            console.error('room did not exist');
            this.newRoom(client, roomCode);
        }
        else {
            room.join(client);
            room.broadcast();
        }
        return room;
    }
    cleanRoom(clientToRemove) {
        const room = clientToRemove.room;
        if (room) {
            room.leave(clientToRemove);
            if (room.clients.size > 0) {
                room.broadcast();
            }
            else {
                this.rooms.delete(room.code);
            }
        }
    }
    getRoom(client) {
        const room = client.room;
        if (room) {
            return room;
        }
        throw new Error('client room is not defined');
    }
    songReady(roomCode) {
        const room = this.rooms.get(roomCode);
        if (room) {
            room.songReady();
        }
    }
}