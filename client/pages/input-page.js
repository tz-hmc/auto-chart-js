class InputPage extends HTMLElement {
    setValues({numberPlayerBroadcast, finishedUpload}) {
        this.numberPlayerBroadcast |= numberPlayerBroadcast;
        this.finishedUpload |= finishedUpload;
        this.rerender();
    }
    get input() {
        return this.shadow.querySelector('input');
    }
    get readyButton() {
        return this.shadow.querySelector('button#ready');
    }
    get showReady() {
        return this.finishedUpload;
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
        this.numberPlayerBroadcast = 0;
        this.finishedUpload = false;
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
            <button id="ready">ready</button>
        </div>`;
    }
    rerender() {
        this.readyButton.hidden = !this.showReady;
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
        this.readyButton.onclick = () => {
            this.dispatchEvent(new CustomEvent('input-page-ready-click', {
                bubbles: true,
                cancelable: false,
                composed: true,
                detail: {
                    callback: this.playersReadyCallback
                }
            }));
        };
    }
    upload() {
        // should probably disable other buttons during upload
        this.dispatchEvent(new CustomEvent('input-page-file-upload', {
            bubbles: true,
            cancelable: false,
            composed: true, // breaks out of shadow dom
            detail: {
                buffer: this.buffer
            }
        }));
    }
}
if (!customElements.get('input-page')) {
    customElements.define('input-page', InputPage);
}