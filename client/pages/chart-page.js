class ChartPage extends HTMLElement {
    playerManager = null;
    chart = [];
    songStartTimeMs = 0;
    get flexContainer() {
        return this.shadow.querySelector('div.flex-container');
    }
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: 'open'});
    }
    setValues({playerManager, chart, songStartTimeMs}) {
        this.playerManager = playerManager;
        this.chart = chart;
        this.songStartTimeMs = songStartTimeMs;
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
                width: calc(32%);
                height: calc(90%);
                border: 1px solid grey;
            }
            app-chart.local {
                border: 2px solid white;
            }
        </style>
        <div class='flex-container'>
        </div>`;
    }
    finishPlayCallback() {
        this.dispatchEvent(new CustomEvent('chart-page-play-stop', {
            bubbles: true,
            cancelable: false,
            composed: true
        }));
    }
    createLocalChart() {
        let appChart = document.createElement('app-chart');
        appChart.setValues({
            isLocal: true,
            input: new LocalInput(this.chart, appChart, this.playerManager.LocalPlayer),
        });
        this.flexContainer.appendChild(appChart);
        appChart.play(this.chart, this.songStartTimeMs).then(() => {
            this.finishPlayCallback();
        });
    }
    createRemoteCharts() {
        let player = this.playerManager.RemotePlayers[0];
        let appChart = document.createElement('app-chart');
        // when app chart is remote, player input & chart is supplied by
        // ConnectionManager modifying PlayerManager players
        this.flexContainer.appendChild(appChart);
        appChart.setValues({
            isLocal: false,
            input: new RemoteInput(this.chart, appChart, player),
        });
        appChart.play(this.chart, this.songStartTimeMs);
    }
    start() {
        this.createLocalChart();
        this.createRemoteCharts();
    }
    remove(appChart) {
        this.flexContainer.removeChild(appChart.element);
    }
}
if (!customElements.get('chart-page')) {
    customElements.define('chart-page', ChartPage);
}
