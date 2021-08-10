const appManagerPages = ['input-page', 'chart-page', 'score-page'];
class AppManager extends HTMLElement {
    pageIndex = 0;
    chartNotes = [];
    localScore = 0;
    enemyScore = 0;
    constructor() {
        super();
        this.reset();
        this.registerEventListeners();
    }
    connectedCallback() {
        this.render();
    }
    reset() {
        this.pageIndex = 0;
        this.chartNotes = [];
        this.localScore = 0;
        this.enemyScore = 0;
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
    setRefValues() {
        this.getRef('chart-page')?.setValues({chartNotes: this.chartNotes});
        this.getRef('chart-page')?.render();
        this.getRef('score-page')?.setValues({localScore: this.localScore, enemyScore: this.enemyScore});
        this.getRef('score-page')?.render();
    }
    registerEventListeners() {
        // input-page events
        this.addEventListener('input-page-file-upload', this.onFileUploaded.bind(this));
        this.addEventListener('input-page-play-click', this.onPlayClicked.bind(this));
        this.addEventListener('chart-page-play-stop', this.onPlayStopped.bind(this));
    }
    goNextPage() {
        this.pageIndex = this.pageIndex === appManagerPages.length-1 ? this.pageIndex : this.pageIndex+1;
        this.render();
        this.setRefValues();
    }
    onFileUploaded({detail: {chartNotes}}) {
        this.chartNotes = chartNotes;
    }
    onPlayClicked() {
        this.goNextPage();
        this.getRef('chart-page')?.start();
    }
    onPlayStopped({detail: {localScore, enemyScore}}) {
        this.localScore = localScore;
        this.enemyScore = enemyScore;
        this.goNextPage();
    }
}
if (!customElements.get('app-manager')) {
    customElements.define('app-manager', AppManager);
}