class FileManager {
    constructor() {
        this.fileBuffer = null;
        this.chart = [];
    }
    async uploadMp3(roomCode, buffer) {
        try {
            await fetch(SONG_UPLOAD_URL(roomCode), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'audio/mpeg',
                },
                body: buffer
            });
        }
        catch (err) {
            alert('Please check file format (should be mp3) and size (20MB limit).');
        }
    }
    async downloadMp3(roomCode) {
        let res = await fetch(SONG_DOWNLOAD_URL(roomCode), {
            method: 'GET'
        });
        this.fileBuffer = await res.arrayBuffer();
    }
    async downloadChart(roomCode) {
        let res = await fetch(CHART_DOWNLOAD_URL(roomCode), {
            method: 'GET'
        });
        this.chart = await res.json();
        return this.chart;
    }
    async playMp3() {
        let context = new AudioContext();
        const source = context.createBufferSource();
        source.buffer = await context.decodeAudioData(this.fileBuffer);
        source.connect(context.destination);
        source.start();
        return;
    }
}