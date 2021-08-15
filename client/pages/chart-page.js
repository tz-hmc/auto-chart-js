class ChartPage extends HTMLElement {
    // get localChart() {
    //     return this.shadow.querySelector('app-chart#local');
    // }
    // get enemyChart() {
    //     return this.shadow.querySelector('app-chart#enemy');
    // }
    get flexContainer() {
        return this.shadow.querySelector('div.flex-container');
    }
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: 'open'});
    }
    connectedCallback() {
        this.render();
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
        </div>`;
    }
    start({chart}, isLocal=false) {
        let appChart = document.createElement('app-chart');
        this.flexContainer.appendChild(appChart);
        appChart.play(chart, isLocal).then(() => {
            this.dispatchEvent(new CustomEvent('chart-page-play-stop', {
                bubbles: true,
                cancelable: false,
                composed: true,
                detail: {
                    localScore: 0, //this.localChart.score, 
                    enemyScore: 0  //this.enemyChart.score
                }
            }));
        });
        // let promise1 = this.localChart.play(this.chartNotes, true);
        // let promise2 = this.enemyChart.play(this.chartNotes, false);
        // await Promise.all([promise1, promise2]);
        return appChart;
    }
    remove(appChart) {
        this.flexContainer.removeChild(appChart.element);
    }
}
if (!customElements.get('chart-page')) {
    customElements.define('chart-page', ChartPage);
}