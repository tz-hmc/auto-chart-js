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
    get spinner() {
        return this.shadow.querySelector('loading-spinner');
    }
    get showReady() {
        return this.finishedUpload;
    }
    get showSpinner() {
        return this.startedUpload && !this.finishedUpload;
    }
    get readyText() {
        return this.readyClicked ? "waiting for second player" : "ready";
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
        this.startedUpload = false;
        this.finishedUpload = false;
        this.readyClicked = false;
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
            loading-spinner {
                height: 60px;
                width: 60px;
            }
        </style>
        <div class='flex-container'>
            <p>select a mp3</p>
            <input id="file-input" type="file"></input>
            <button id="ready"></button>
            <loading-spinner></loading-spinner>
        </div>`;
    }
    rerender() {
        this.readyButton.hidden = !this.showReady;
        this.readyButton.textContent = this.readyText;
        this.spinner.hidden = !this.showSpinner;
    }
    registerEventListeners() {
        this.input.onchange = (_e1) => {
            this.startedUpload = true;
            this.rerender();
            const reader = new FileReader();
            for (let file of this.input.files) {
                reader.readAsArrayBuffer(file);
            }
            reader.onload = (_e2) => {
                this.buffer = reader.result;
                this.upload();
            }
        };
        this.readyButton.onclick = () => {
            this.readyClicked = true;
            this.rerender();
            this.dispatchEvent(new CustomEvent('input-page-ready-click', {
                bubbles: true,
                cancelable: false,
                composed: true
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