class InputPage extends HTMLElement {
    get input() {
        return this.shadow.querySelector('input');
    }
    get playButton() {
        return this.shadow.querySelector('button#start');
    }
    constructor() {
        super();
        this.reset();
        this.shadow = this.attachShadow({mode: 'open'});
    }
    connectedCallback() {
        this.render();
        this.rerender();
        this.registerEventListeners();
    }
    reset() {
        this.chartNotes = [];
        this.hidePlay = true;
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
                flex-direction: column;
                justify-content: center;
            }
            .flex-container > * {
                margin-bottom: 10px;
            }
            .flex-container > input {
                padding: 3px;
                border: 1px solid white;
            }
        </style>
        <div class='flex-container'>
            <p>select a mp3</p>
            <input id="file-input" type="file"></input>
            <button id="start">start playing</button>
        </div>`;
    }
    rerender() {
        this.playButton.hidden = this.hidePlay;
    }
    registerEventListeners() {
        this.input.onchange = (_e1) => {
            const reader = new FileReader();
            for (let file of this.input.files) {
                reader.readAsArrayBuffer(file);
            }
            reader.onload = (_e2) => {
                this.buffer = reader.result;
                this.upload();
            }
        }
        this.playButton.onclick = () => {
            this.onPlayClick();
        }
    }
    async upload() {
        this.hidePlay = true;
        this.rerender();
        let response = await fetch('http://localhost:3333/song', {
            method: 'PUT',
            headers: {
                'Content-Type': 'audio/mpeg',
            },
            body: this.buffer
        })
        this.chartNotes = await response.json();
        this.hidePlay = false;
        this.rerender();
        this.dispatchEvent(new CustomEvent('input-page-file-upload', {
            bubbles: true,
            cancelable: false,
            composed: true, // breaks out of shadow dom
            detail: {
                chartNotes: this.chartNotes
            }
        }));
    }
    async playMusicFile() {
        let context = new AudioContext();
        const source = context.createBufferSource();
        source.buffer = await context.decodeAudioData(this.buffer);
        source.connect(context.destination);
        source.start();
    }
    onPlayClick() {
        this.playMusicFile().then(() => {
            this.dispatchEvent(new CustomEvent('input-page-play-click', {
                bubbles: true,
                cancelable: false,
                composed: true,
            }));
        });
    }
}
if (!customElements.get('input-page')) {
    customElements.define('input-page', InputPage);
}