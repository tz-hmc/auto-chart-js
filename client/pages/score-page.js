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
            .flex-child {
                width: 100px;
            }
            .winner {
                animation: blink 1s ease-in infinite;
            }
            @keyframes blink {
                0% {
                    border: 6px dashed yellow;
                }
                100% {
                    border: 1px solid white;
                }
            }
            .loser {
                border: 1px solid grey;
            }
            .score {
                border-radius: 40%;
                padding: 20px;
            }
        </style>
        <div class='flex-container'>
            <div class='flex-child'>
                <div class='${(this.localScore > this.enemyScore) ? 'winner' : 'loser'} score'>${this.localScore}</div>
            </div>
            <div class='flex-child'>
                <div class='${(this.enemyScore > this.localScore) ? 'winner' : 'loser'} score'>${this.enemyScore}</div>
            </div>
        </div>`;
    }
}
if (!customElements.get('score-page')) {
    customElements.define('score-page', ScorePage);
}