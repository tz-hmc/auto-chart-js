/**
 * Notes are in the format {keyCode: number, length: number} where char is the letter to push
 * and length is the number of notes it extends to.
 * Each index in this length corresponds to 1/16 note.
 **/
// this is in keys.js (need webpack & imports..)
//const PIXELS_PER_NOTE = 45;
const KEYS_Y_POS = 75;

const pixelToNoteTimeMs = pixels => sixteenthNotePosToTimeMs(pixels/PIXELS_PER_NOTE)
const noteTimeToPixelLocation = (topTime, noteTime) => timeMsToSixteenthNotePos(noteTime-topTime)*PIXELS_PER_NOTE;

class AppChart extends HTMLElement {
    get canvasHeight() {
        return this.offsetHeight - 50;
    }
    get canvasWidth() {
        return this.offsetWidth;
    }
    get columnSize() {
        return this.offsetWidth/this.keys.length;
    }
    get musicLength() {
        return sixteenthNotePosToTimeMs(this.notes.length);
    }
    get score() {
        return this.input?.score || 0;
    }
    get animationCallback() {
        return (resolve) => (timeMs) => this.run(resolve, timeMs);
    }
    get canvas() {
        return this.querySelector('canvas');
    }
    get context() {
        return this.canvas.getContext('2d');
    }
    get songTimeMs() {
        return (this.animationStartDateNowMs - this.songStartDateNowMs) + (this.lastAnimationMs - this.startAnimationMs);
    }
    constructor() {
        super();
        this.reset();
    }
    setValues({isLocal, input}) {
        this.isLocal = isLocal;
        this.input = input;
    }
    connectedCallback() {
        this.render();
        this.rerender();
        this.drawKeys();
    }
    reset() {
        this.notes = [];
        this.keys = defaultKeys;
        // this is ms since request animation setup
        this.lastAnimationMs = 0;
        this.startAnimationMs = 0;

        // this is ms since 1970, use to compute offset between song start & animation start
        this.songStartDateNowMs = 0;
        this.animationStartDateNowMs = 0;

        this.isPlaying = false;
        this.isLocal = false;
        this.connectionManager = null;
        this.animationRequest = null;
    }
    render() {
        this.innerHTML = `
            <canvas width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>
            <div id='score'>0</div>
        `;
    }
    rerender() {
        if (this.isLocal) {
            this.setAttribute('class', 'local');
        }
    }
    run(resolve, timeMs = 0) {
        if(!this.startAnimationMs) {
            this.startAnimationMs = timeMs;
            this.animationStartDateNowMs = Date.now();
        }
        this.lastAnimationMs = timeMs;
        let ok = this.update(this.songTimeMs);
        if (ok) {
            this.animationRequest = requestAnimationFrame(this.animationCallback(resolve));
        }
        else {
            console.log(this.lastAnimationMs - this.startAnimationMs);
            cancelAnimationFrame(this.animationRequest);
            this.input.stop();
            resolve();
        }
    }
    play(notes, songStartTimeMs=0) {
        this.songStartDateNowMs = songStartTimeMs;
        this.notes = notes;
        this.input.start();
        this.isPlaying = true;
        return new Promise((resolve, _reject) => {
            //this.run(resolve);
            this.animationRequest = requestAnimationFrame(this.animationCallback(resolve));
        });
    }
    update(currTime) {
        if(currTime >= this.musicLength) {
            return false;
        }
        this.input.updateScore();
        this.drawScore();
        this.draw(currTime);
        return true;
    }
    drawKeys() {
        let centerY = KEYS_Y_POS;
        this.keys.forEach((note, i) => {
            let lightUp = this.input.CurrentKeyDown(note.keyCode);
            this.drawKey(i, centerY, lightUp);
        });
    }
    drawNote(keyIndex, centerY) {
        let centerX = this.columnSize*(keyIndex+0.5);
        this.keys[keyIndex].drawNote(this.context, centerX, centerY);
    }
    drawKey(keyIndex, centerY, fillLight=false) {
        let centerX = this.columnSize*(keyIndex+0.5);
        this.keys[keyIndex].drawKey(this.context, centerX, centerY, fillLight);
    }
    drawLongNote(keyIndex, centerY, noteLength) {
        let centerX = this.columnSize*(keyIndex+0.5);
        this.keys[keyIndex].drawLongNote(this.context, centerX, centerY, noteLength);
    }
    drawNoteAt(note, noteIndex, currTimeMs) {
        // currTime is the very top of canvas
        let canvasTopTime = currTimeMs;
        let canvasBottomTime = currTimeMs+pixelToNoteTimeMs(this.canvas.height);
        let beginNoteTime = sixteenthNotePosToTimeMs(noteIndex);
        let endNoteTime = sixteenthNotePosToTimeMs(noteIndex+note.length);
        let noteYPosition = noteTimeToPixelLocation(canvasTopTime, beginNoteTime);
        // if outside the window, do not render
        if(!(beginNoteTime > canvasBottomTime || endNoteTime < canvasTopTime)) {
            let keyIndex = this.keys.findIndex(key => key.keyCode === note.keyCode);
            if (note.length == 1) {
                this.drawNote(keyIndex, noteYPosition);
            }
            else {
                this.drawLongNote(keyIndex, noteYPosition, note.length);
            }
        }
        // if note is not visible, do not draw
    }
    draw(currTime) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawKeys();
        this.notes.forEach((notesAtTime, noteIndex) =>
            notesAtTime.forEach(note => this.drawNoteAt(note, noteIndex, currTime))
        );
    }
    drawScore() {
        this.querySelector('#score').innerHTML = this.score;
    }
}
if (!customElements.get('app-chart')) {
    customElements.define('app-chart', AppChart);
}
