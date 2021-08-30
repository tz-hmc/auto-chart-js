// thanks to https://www.youtube.com/watch?v=Zdr6SJZC9ao
import path from 'path';
import express from 'express';
import fs from 'fs';
import { Client } from './connection/client.js';
import { fullConversion } from './audio-util.js';
import { RoomManager } from './connection/room-manager.js';
import { WebSocketServer } from 'ws';

const FILE_BYTES_SIZE_LIMIT = 12*1024*1024; 
// 320kbps @ 5min audio compressed mp3 ~= 12 MB size limit

var roomManager = new RoomManager();

const websocketServer = new WebSocketServer({
    port: 9000,
    //path: "/websockets",
});
websocketServer.on('connection', conn => {
    console.log('connecting... \n');
    const client = new Client(conn);
    conn.on('message', msg => {
        console.log(`receiving message... ${msg}`);
        let data = client.receive(msg);
        if (data.type === 'create-room') {
            roomManager.newRoom(client);
        }
        else if (data.type === 'join-room') {
            roomManager.joinRoom(data.roomCode, client);
        }
        else if (data.type === 'ready') {
            let room = roomManager.getRoom(client);
            room.clientReady(client);
        }
        else if (data.type === 'game-update') {
            let room = roomManager.getRoom(client);
            room.gameBroadcast(client, data);
        }
        else if (data.type === 'game-finish') {
            let room = roomManager.getRoom(client);
            room.reset();
        }
    });
    conn.on('close', () => {
        console.log('closing... \n');
        roomManager.cleanRoom(client);
    });
})

const server = express();
var host = '127.0.0.1',
    port = 3333;

server.put("/song/:roomId", function(req, res, next) {
    let roomId = req.params?.roomId;
    let mp3FilePath = `./server/songs/${roomId}.mp3`;
    let mp3File = fs.createWriteStream(mp3FilePath);
    let bufferCount = 0;
    mp3File.on('open', function(fd) {
        req.on('data', function(data) {
            bufferCount += Buffer.byteLength(data); 
            if (bufferCount > FILE_BYTES_SIZE_LIMIT) {
                console.error(`bufferCount ${bufferCount} > limit ${FILE_BYTES_SIZE_LIMIT}`);
                req.destroy();
                return next(new Error(`file size limit`));
            }
            else {
                console.log("writing mp3... \n");
                mp3File.write(data);
            }
        });
        req.on('end', async function() {
            console.log("finish writing mp3...\n");
            mp3File.end();
            let chart = [];
            let chartFilePath = `./server/charts/${roomId}.json`;
            try {
                chart = await fullConversion(mp3FilePath, false);
                let chartFile = fs.createWriteStream(chartFilePath);
                chartFile.on('open', function(fd) {
                    console.log("writing chart... \n");
                    chartFile.write(JSON.stringify(chart));
                    chartFile.end();
                });
                chartFile.on('close', function(fd) {
                    console.log('chart file ready...\n');
                    roomManager.songReady(roomId);
                    res.status(200).send();
                });
            }
            catch (err) {
                return next(err);
            }
        });
    });
});
server.use('/charts', express.static('./server/charts'));
server.use('/songs', express.static('./server/songs'));
server.use('/', express.static('./client'));
server.listen(port,
    () => console.log(`Listening on http://${host}:${port}/`)
);
