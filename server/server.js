// thanks to https://www.youtube.com/watch?v=Zdr6SJZC9ao
// https://stackoverflow.com/questions/34808925/express-and-websocket-listening-on-the-same-port/34838031#34838031
// https://stackoverflow.com/questions/18908426/increasing-client-max-body-size-in-nginx-conf-on-aws-elastic-beanstalk
// https://shuheikagawa.com/blog/2019/04/25/keep-alive-timeout/

import path from 'path';
import express from 'express';
import fs from 'fs';
import { Client } from './connection/client.js';
import { fullConversion } from './audio-util.js';
import { RoomManager } from './connection/room-manager.js';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const FILE_BYTES_SIZE_LIMIT = 20*1024*1024; 
// 320kbps @ 5min audio compressed mp3 ~= 12 MB size limit
// allowing up to 20MB for now

// AWS EB documentation:
// The default NGINX configuration forwards traffic to an
// upstream server that's named nodejs at 127.0.0.1:8080
const app = express();
var host = '127.0.0.1',
    port = 8080;

app.put("/song/:roomId", function(req, res, next) {
    let roomId = req.params?.roomId;
    console.log(`processing ${roomId} song upload request...`);

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
app.use('/charts', express.static('./server/charts'));
app.use('/songs', express.static('./server/songs'));
app.use('/', express.static('./client'));

let httpServer = createServer();
// httpServer.keepAliveTimeout = 2 * 60 * 1000;
// httpServer.headersTimeout = 2 * 65 * 1000;

httpServer.on('request', app);

let roomManager = new RoomManager();
const websocketServer = new WebSocketServer({
    server: httpServer
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

httpServer.listen(port,
    () => console.log(`Listening on http://${host}:${port}/`)
);