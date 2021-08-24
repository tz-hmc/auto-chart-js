const pageManagerPages = ['input-page', 'chart-page', 'score-page'];
class PageManager extends HTMLElement {
    pageIndex = 0;
    connectionManager = new ConnectionManager();
    fileManager = new FileManager();
    constructor() {
        super();
        this.reset();
        this.registerEventListeners();
    }
    connectedCallback() {
        this.render();
        // create the room for this chart, ask connection for a room code
        this.connectionManager.setCallback({
            broadcast: this.broadcastCallback.bind(this),
            songReady: this.songReadyCallback.bind(this),
            roomReady: this.roomReadyCallback.bind(this),
        });
        this.connectionManager.connect();
    }
    reset() {
        this.pageIndex = 0;
        this.localChart = [];
    }
    render() {
        this.innerHTML = `
            <div>
                ${(this.pageIndex === 0) ? '<input-page></input-page>' : ''}
                ${(this.pageIndex === 1) ? '<chart-page></chart-page>' : ''}
                ${(this.pageIndex === 2) ? '<score-page></score-page>' : ''}
            </div>
        `;
    }
    getRef(pageName) {
        return this.querySelector(pageName);
    }
    broadcastCallback({}) {
        this.getRef('input-page')?.setValues({finishedBroadcast: true});
    }
    async songReadyCallback({}) {
        let promises = Promise.all([
            this.fileManager.downloadChart(this.connectionManager.roomCode),
            this.fileManager.downloadMp3(this.connectionManager.roomCode)
        ]);
        await promises;
        this.getRef('input-page')?.setValues({finishedUpload: true});
    }
    async roomReadyCallback({}) {
        await this.fileManager.playMp3();
        let songStartTimeMs = Date.now();
        this.goNextPage();
        this.getRef('chart-page')?.setValues({
            playerManager: this.connectionManager.playerManager,
            chart: this.fileManager.chart,
            songStartTimeMs
        });
        this.getRef('chart-page')?.render();
        this.getRef('chart-page')?.start();
    }
    registerEventListeners() {
        this.addEventListener('input-page-file-upload', this.onFileUploadClicked.bind(this));
        this.addEventListener('input-page-ready-click', this.onReadyClicked.bind(this));
        this.addEventListener('chart-page-play-stop', this.onPlayStopped.bind(this));
    }
    goNextPage() {
        this.pageIndex = this.pageIndex === pageManagerPages.length-1 ? this.pageIndex : this.pageIndex+1;
        this.render();
    }
    onFileUploadClicked({detail: {buffer}}) {
        this.fileManager.uploadMp3(this.connectionManager.roomCode, buffer);
    }
    onReadyClicked({detail}) {
        this.connectionManager.sendReady();
    }
    onPlayStopped({detail}) {
        let localScore = this.connectionManager.playerManager.LocalPlayer.score;
        let enemyScores = this.connectionManager.playerManager.RemotePlayers.map(player => player.score);
        this.goNextPage();
        this.getRef('score-page')?.setValues({localScore: localScore, enemyScore: enemyScores[0]});
        this.getRef('score-page')?.render();
        this.connectionManager.sendFinish();
    }
}
if (!customElements.get('page-manager')) {
    customElements.define('page-manager', PageManager);
}
