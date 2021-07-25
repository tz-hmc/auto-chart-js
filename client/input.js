const SCORE_INC = 10;
const SCORE_DEC = 5;

class Input {
    constructor(keys, notes, chart) {
        this.keys = keys;
        this.notes = notes;
        this.chart = chart;
        this.score = 0;
        this.registerEventListeners();
    }
    registerEventListeners() {
        document.addEventListener('keydown', event => {
            //let keyIndex = this.keys.findIndex((key) => key.code == event.key);
            let time = this.chart.lastMs;
            let noteIndex = Math.floor(timeMsToSixteenthNotePos(time));
            if(noteIndex < this.notes.length) {
                let noteSubIndex = this.notes[noteIndex].findIndex(note => note.keyCode == event.keyCode);
                if (noteSubIndex !== -1) {
                    //keep history by making props on notes?
                    //this.notes[noteIndex][noteSubIndex].hit = 1;
                    this.score += SCORE_INC;
                }
                else {
                    this.score -= SCORE_DEC;
                }
            }
            console.log(this.score);
            this.chart.drawScore(this.score);
        })
    }
}