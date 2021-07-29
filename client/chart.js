/**
 * Notes are in the format {keyCode: number, length: number} where char is the letter to push
 * and length is the number of notes it extends to. 
 * Each index in this length corresponds to 1/16 note.
 **/

const defaultKeys = [
    {keyCode: 37, color: 'purple'},
    {keyCode: 38, color: 'blue'},
    {keyCode: 39, color: 'green'},
    {keyCode: 40, color: 'red'}
];

const PIXELS_PER_NOTE = 45;
const DEFAULT_RADIUS = 25;
const KEYS_Y_POS = 75;

const pixelToNoteTimeMs = pixels => sixteenthNotePosToTimeMs(pixels/PIXELS_PER_NOTE)
const noteTimeToPixelLocation = (topTime, noteTime) => timeMsToSixteenthNotePos(noteTime-topTime)*PIXELS_PER_NOTE;

class Chart extends HTMLElement {
    // TODO: have to be attributes now
    constructor() {
        super();
        this.notes = [];
        this.keys = defaultKeys;
        this.lastMs = 0;
        this.startMs = 0;
        this.isPlaying = false;
    }
    get canvasHeight() {
        return this.offsetHeight - 50;
    }
    get canvasWidth() {
        return this.offsetWidth;
    }
    get columnSize() {
        return this.canvas.width/this.keys.length;
    }
    get musicLength() {
        return sixteenthNotePosToTimeMs(this.notes.length);
    }
    connectedCallback() {
        this.drawTemplate();
        this.run = (resolve) => (timeMs = 0) => {
            if(!this.startMs)
                this.startMs = timeMs;

            //const deltaTime = timeMs - this.lastMs;
            this.lastMs = timeMs;

            let ok = this.update(this.lastMs - this.startMs);
            if(ok) {
                requestAnimationFrame(this.run(resolve));
            }
            else {
                console.log(this.lastMs - this.startMs);
                resolve();
            }
        };
    }
    play(notes, isLocal, timeMs=0) {
        this.notes = notes;
        if(isLocal) {
            this.input = new Input(this.keys, this.notes, this);
        }
        this.isPlaying = true;
        return new Promise((resolve, _reject) => {
            this.run(resolve)(timeMs);
        });
    }
    update(currTime) {
        if(currTime >= this.musicLength) {
            return false;
        }
        this.draw(currTime);
        return true;
    }
    drawTemplate() {
        this.innerHTML = `
            <canvas width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>
            <div id='score'>0</div>
        `;
        this.canvas = this.querySelector('canvas');
        this.context = this.canvas.getContext('2d');
        this.drawKeys();
    }
    drawKeys() {
        let centerY = KEYS_Y_POS;
        this.keys.forEach((note, i) => this.drawCircle(i, centerY, true));
    }
    drawCircle(keyIndex, centerY, outline=false) {
        let circle = new Path2D();
        let centerX = this.columnSize*(keyIndex+0.5);
        circle.arc(centerX, centerY, DEFAULT_RADIUS, 0, 2*Math.PI, false);
        if (outline) {
            this.context.strokeStyle = this.keys[keyIndex].color;
            this.context.lineWidth = 3;
            this.context.stroke(circle);
        }
        else {
            this.context.fillStyle = this.keys[keyIndex].color;
            this.context.fill(circle);
        }
    }
    drawNote(note, noteIndex, currTimeMs) {
        // currTime is the very top of canvas
        let canvasTopTime = currTimeMs;
        let canvasBottomTime = currTimeMs+pixelToNoteTimeMs(this.canvas.height);
        let noteTime = sixteenthNotePosToTimeMs(noteIndex);
        let noteYPosition = noteTimeToPixelLocation(canvasTopTime, noteTime);
        if(noteTime > canvasTopTime && noteTime < canvasBottomTime) {
            this.drawCircle(this.keys.findIndex(key => key.keyCode === note.keyCode), 
                noteYPosition);
        }
        // if note is not visible, do not draw
    }
    draw(currTime) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawKeys();
        this.notes.forEach((notesAtTime, noteIndex) => 
            notesAtTime.forEach(note => this.drawNote(note, noteIndex, currTime))
        );
    }
    drawScore(score) {
        this.querySelector('#score').innerHTML = score;
    }
}
if (!customElements.get('app-chart')) {
    customElements.define('app-chart', Chart);
}