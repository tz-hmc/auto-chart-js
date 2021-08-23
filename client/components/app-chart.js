/**
 * Notes are in the format {keyCode: number, length: number} where char is the letter to push
 * and length is the number of notes it extends to.
 * Each index in this length corresponds to 1/16 note.
 **/
const FILL_COLOR_LIGHT ='#fefefe';
const FILL_COLOR_DARK = '#f1f1f1';

const PIXELS_PER_NOTE = 45;
const DEFAULT_RADIUS = 25;
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
        return this.canvas.offsetWidth/this.keys.length;
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
            this.drawKeyCircle(i, centerY, lightUp);
        });
    }
    drawNoteCircle(keyIndex, centerY) {
        let circle = new Path2D();
        let centerX = this.columnSize*(keyIndex+0.5);
        circle.arc(centerX, centerY, DEFAULT_RADIUS, 0, 2*Math.PI, false);
        this.context.fillStyle = this.keys[keyIndex].color;
        this.context.fill(circle);
    }
    drawKeyCircle(keyIndex, centerY, fillLight=false) {
        let circle = new Path2D();
        let centerX = this.columnSize*(keyIndex+0.5);
        circle.arc(centerX, centerY, DEFAULT_RADIUS, 0, 2*Math.PI, false);
        if (fillLight) {
            this.context.fillStyle = FILL_COLOR_LIGHT;
            this.context.fill(circle);
        } else {
            this.context.fillStyle = FILL_COLOR_DARK;
            this.context.fill(circle);
        }
        this.context.strokeStyle = this.keys[keyIndex].color;
        this.context.lineWidth = 1;
        this.context.stroke(circle);
    }
    drawRoundRect(keyIndex, centerY, noteLength) {
        let roundRect = new Path2D();
        let centerX = this.columnSize*(keyIndex+0.5);
        let height = PIXELS_PER_NOTE*noteLength-(2*DEFAULT_RADIUS);
        let left = centerX-DEFAULT_RADIUS,
            right = centerX+DEFAULT_RADIUS,
            top = centerY-DEFAULT_RADIUS,
            bottom = centerY+DEFAULT_RADIUS+height;
        roundRect.moveTo(right, bottom);
        roundRect.arcTo(left, bottom, left, top, DEFAULT_RADIUS);
        roundRect.arcTo(left, top, right, top, DEFAULT_RADIUS);
        roundRect.arcTo(right, top, right, bottom, DEFAULT_RADIUS);
        roundRect.arcTo(right, bottom, left, bottom, DEFAULT_RADIUS);
        this.context.fillStyle = this.keys[keyIndex].color;
        this.context.fill(roundRect);
    }
    drawNote(note, noteIndex, currTimeMs) {
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
                this.drawNoteCircle(keyIndex, noteYPosition);
            }
            else {
                this.drawRoundRect(keyIndex, noteYPosition, note.length)
            }
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
    drawScore() {
        this.querySelector('#score').innerHTML = this.score;
    }
}
if (!customElements.get('app-chart')) {
    customElements.define('app-chart', AppChart);
}
