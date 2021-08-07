import path from 'path';
import express from 'express';
import fs from 'fs';
import { fullConversion } from './audio-util.js';

var server = express();
var host = '127.0.0.1',
    port = 3333;

server.put("/song", (req, res) => {
    var mp3SongName = 'song.mp3';
    var mp3File = fs.createWriteStream(mp3SongName);

    mp3File.on('open', function(fd) {
        req.on('data', function(data) {
            console.log("loading... \n");
            mp3File.write(data);
        }); 

        req.on('end', async function() {
            console.log("finalizing...\n");
            mp3File.end();
            let chart = await fullConversion(mp3SongName);
            res.json(chart);
            res.status(200);
            res.send();
        });
    });
});
server.use(express.static('client'));
server.listen(port, 
    () => console.log(`Listening on http://${host}:${port}/`)
);
