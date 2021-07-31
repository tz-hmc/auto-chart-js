const SCORE_INC_GREAT = 12;
const SCORE_INC_GOOD = 10;
const SCORE_DEC_MISSING = 2;
const SCORE_DEC_EXTRA = 1;

class Input {
    constructor(keys, notes, chart) {
        this.keyCodes = keys.map(key => key.keyCode);
        this.notes = notes;
        this.chart = chart;
        
        this.inputHistory = (new Array(this.notes.length)).fill(null).map(() => []);

        this.score = 0;

        this.good = 0;
        this.great = 0;
        this.missing = 0;
        this.extra = 0;

        this.lastUpdateScoreIndex = 0;
    }
    start() {
        console.log(this.notes);
        this.registerEventListeners();
    }
    stop() {
        console.log('great', this.great, 'good', this.good, 'extra', this.extra, 'missing', this.missing);
        console.log(this.inputHistory);
        this.removeEventListeners();
    }
    registerEventListeners() {
        this.keydownListener = event => {
            let noteIndex = Math.floor(timeMsToSixteenthNotePos(this.chart.lastMs - this.chart.startMs));
            if (noteIndex < this.inputHistory.length 
                && this.keyCodes.includes(event.keyCode)
                && !this.inputHistory[noteIndex].some((note) => note.keyCode === event.keyCode))
            {
                this.inputHistory[noteIndex].push({keyCode: event.keyCode, length: 1});
                //console.log(this.inputHistory);
            }
        };
        this.keyupListener = event => {
            let noteIndex = Math.floor(timeMsToSixteenthNotePos(this.chart.lastMs - this.chart.startMs));
            for (var i = noteIndex; i >= 0; i--) {
                let note = this.inputHistory[noteIndex].find((note) => note.keyCode === event.keyCode);
                //console.log(this.inputHistory);
                if (note) {
                    note.length = (noteIndex - i);
                    break;
                }
            }
        };
        document.addEventListener('keydown', this.keydownListener);
        document.addEventListener('keyup', this.keyupListener);
    }
    removeEventListeners() {
        document.removeEventListener('keydown', this.keydownListener);
        document.removeEventListener('keyup', this.keyupListener);
    }
    // still need to consider note length
    updateScore() {
        let noteIndex = Math.floor(timeMsToSixteenthNotePos(this.chart.lastMs - this.chart.startMs || 0));
        //console.log('enter');
        for (var i=this.lastUpdateScoreIndex; i<noteIndex && i<this.notes.length; i++) {
            //console.log(i, noteIndex);
            let noteSlice = this.notes[i].slice(0);
            let inputSlice = this.inputHistory[i].slice(0);
            let prevInputSlice = (i-1 >= 0) ? this.inputHistory[i-1].slice(0) : [];
            let prevPrevInputSlice = (i-2 >= 0) ? this.inputHistory[i-2].slice(0) : [];
            let taken = 0;
            while (noteSlice.length > 0) {
                let noteToHit = noteSlice.pop();
                // match all exact notes = great
                if (inputSlice.some(input => input.keyCode === noteToHit.keyCode)) {
                    this.great += 1;
                    taken += 1;
                }
                // match all early by 1 notes = good
                else if (prevInputSlice.some(note => note.keyCode === noteToHit.keyCode)
                    || prevPrevInputSlice.some(note => note.keyCode === noteToHit.keyCode)) {
                    this.good += 1;
                    taken += 1;
                }
                else
                    this.missing += 1;
            }
            this.extra += inputSlice.length - taken;
            // all extra notes
            this.score = this.great*SCORE_INC_GREAT+
                this.good*SCORE_INC_GOOD-
                this.missing*SCORE_DEC_MISSING-
                this.extra*SCORE_DEC_EXTRA;
        }
        //console.log('exit');
        this.lastUpdateScoreIndex = noteIndex;
    }
}