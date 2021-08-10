class ScorePage extends HTMLElement {
    localScore = 0;
    enemyScore = 0;
    setValues({localScore, enemyScore}) {
        this.localScore = localScore;
        this.enemyScore = enemyScore;
    }
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: 'open'});
    }
    connectedCallback() {
        this.render();
    }
    reset() {
        this.localScore = 0;
        this.enemyScore = 0;
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
                justify-content: center;
            }
            .flex-container > * {
                margin: 50px;
            }
        </style>
        <div class='flex-container'>
            <div>${this.localScore}</div>
            <div>${this.enemyScore}</div>
        </div>`;
    }
}
if (!customElements.get('score-page')) {
    customElements.define('score-page', ScorePage);
}