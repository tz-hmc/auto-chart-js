class Player {
    constructor(clientId='') {
        this.chart = [];
        this.input = [];
        this.clientId = clientId;
    }
    update({chart, input}) {
        this.chart = chart;
        this.input = input;
    }
    set(chartElement) {
        this.chartElement = chartElement;
    }
}

class PlayerManager
{
    constructor() {
        // {chart, playerInput, element}
        this.players = new Set();
    }
    add(player) {
        this.players.add(player);
    }
    start() {
        if (this.chartPage)
            this.players = this.players.map(instance => ({ ...instance, element: this.chartPage.start(instance) }));
        else
            console.error('start called before set page');
    }
    setPage(chartPage) {
        this.chartPage = chartPage;
    }
    remove(player) {
        this.players.remove(player);
        if (this.chartPage) {
            this.chartPage.remove(player);
        }
        else
            console.error('remove called before set page');
    }
}