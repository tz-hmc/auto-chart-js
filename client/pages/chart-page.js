class ChartPage extends HTMLElement {
    setValues({chartNotes}) {
        this.chartNotes = chartNotes;
    }
    get localChart() {
        return this.shadow.querySelector('app-chart#local');
    }
    get enemyChart() {
        return this.shadow.querySelector('app-chart#enemy');
    }
    constructor() {
        super();
        this.init();
        this.shadow = this.attachShadow({mode: 'open'});
    }
    connectedCallback() {
        this.render();
    }
    init() {
        this.chartNotes = this.chartNotes || [];
    }
    reset() {
        this.chartNotes = [];
    }
    render() {
        this.shadow.innerHTML = `
        <style>
            :host, .flex-container {
                top: 0;
                left: 0;
                height: 100%;
                width: 100%;
                position: absolute;
            }
            .flex-container {
                display: flex;
                align-items: center;
                flex-direction: row;
                justify-content: space-around;
            }
            app-chart {
                width: calc(50% - 150px);
                height: calc(100% - 50px);
                border: 1px solid grey;
            }
        </style>
        <div class='flex-container'>
            <app-chart id='local'></app-chart>
            <app-chart id='enemy'></app-chart>
        </div>`;
    }
    async start() {
        let promise1 = this.localChart.play(this.chartNotes, true);
        let promise2 = this.enemyChart.play(this.chartNotes, false);
        await Promise.all([promise1, promise2]);
        this.dispatchEvent(new CustomEvent('chart-page-play-stop', {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail: {
                localScore: this.localChart.score, 
                enemyScore: this.enemyChart.score
            }
        }));
    }
}
if (!customElements.get('chart-page')) {
    customElements.define('chart-page', ChartPage);
}