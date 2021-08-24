const BORDER_THICKNESS = 16;
const SECTION_COLOR = '#ff7a91';
const CIRCLE_COLOR = '#f3f3f3';

class LoadingSpinner extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.render();
    }
    render() {
        this.innerHTML = `
        <style>
            #spinner {
                width: 100%;
                height: 100%;
                border: ${BORDER_THICKNESS}px solid ${CIRCLE_COLOR};
                border-top: ${BORDER_THICKNESS}px solid ${SECTION_COLOR};
                border-radius: 50%;
                margin: 0 -${BORDER_THICKNESS}px;
                animation: spin 3s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
        <div id="spinner"></div>
        `
    }
}
if (!customElements.get('loading-spinner')) {
    customElements.define('loading-spinner', LoadingSpinner);
}