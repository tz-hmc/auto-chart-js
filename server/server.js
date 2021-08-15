// thanks to https://www.youtube.com/watch?v=Zdr6SJZC9ao
import path from 'path';
import express from 'express';
import fs from 'fs';
import { Client } from './connection/client.js';
import { fullConversion } from './audio-util.js';
import { RoomManager } from './connection/room-manager.js';
import { WebSocketServer } from 'ws';

// TODO: how does nodejs server handle simul requests? is this thread safe?
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
            roomManager.clientReady(client);
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

server.put("/song/:roomId", function(req, res) {
    // need to check inputs, there could be some vulnerability here
    let roomId = req.params?.roomId;
    let mp3FilePath = `./server/songs/${roomId}.mp3`;
    let mp3File = fs.createWriteStream(mp3FilePath);

    mp3File.on('open', function(fd) {
        req.on('data', function(data) {
            console.log("writing mp3... \n");
            mp3File.write(data);
        }); 
        req.on('end', async function() {
            console.log("finish writing mp3...\n");
            mp3File.end();
            let chart = await fullConversion(mp3FilePath, false);
            let chartFilePath = `./server/charts/${roomId}.json`;
            let chartFile = fs.createWriteStream(chartFilePath)
            chartFile.on('open', function(fd) {
                console.log("writing chart... \n");
                chartFile.write(JSON.stringify(chart));
                chartFile.end();
            });
            chartFile.on('close', function(fd) {
                res.status(200);
                res.send();
                roomManager.songReady(roomId);
            })
        });
    });
});
server.use('/charts', express.static('./server/charts'));
server.use('/songs', express.static('./server/songs'));
server.use('/', express.static('./client'));
server.listen(port, 
    () => console.log(`Listening on http://${host}:${port}/`)
);
