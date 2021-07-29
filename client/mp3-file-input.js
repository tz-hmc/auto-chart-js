class FileInput extends HTMLElement {
    constructor() {
        super();
        this.input = null;
    }
    connectedCallback() {
        this.render();
        this.input = document.querySelector('input');
        this.button = document.querySelector('button');
        this.button.hidden = true;
        this.registerEventListeners();
    }
    registerEventListeners() {
        this.input.onchange = (event) => {
            const reader = new FileReader();
            for (let file of this.input.files) {
                reader.readAsArrayBuffer(file);
            }
            reader.onload = (_e) => {
                this.buffer = reader.result;
                this.upload();
            }
        }
        this.button.onclick = () => {
            this.start();
        }
    }
    render() {
        this.innerHTML = `
        <style>
            input {
                padding: 3px;
                border: 1px solid white;
            }
        </style>
        <div>
            <p>select a mp3</p>
            <input id="file-input" type="file"></input>
            <button id="start">start playing</button>
        </div>`;
    }
    async upload() {
        this.button.hidden = true;
        let response = await fetch('http://localhost:3333/song', {
            method: 'PUT',
            headers: {
                'Content-Type': 'audio/mpeg',
            },
            body: this.buffer
        })
        this.chartNotes = await response.json();
        this.button.hidden = false;
    }
    async play() {
        let context = new AudioContext();
        const source = context.createBufferSource();
        source.buffer = await context.decodeAudioData(this.buffer);
        source.connect(context.destination);
        source.start();
    }
    start() {
        // hide when playing
        this.hidden = true;
        this.play().then(async () => {
            const playerChart = document.createElement('app-chart');
            document.body.appendChild(playerChart);
            let promise1 = playerChart.play(this.chartNotes, true);
            const playerChart2 = document.createElement('app-chart');
            document.body.appendChild(playerChart2);
            let promise2 = playerChart2.play(this.chartNotes, false);
            await Promise.all([promise1, promise2]);
            this.stop();
        });
    }
    stop() {
        this.hidden = false;
        //this.button.value = '';
    }
}
if (!customElements.get('file-input')) {
    customElements.define('file-input', FileInput);
}