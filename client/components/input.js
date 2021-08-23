class Input {
    keyCodes = defaultKeys.map(key => key.keyCode);

    notes = [];
    appChart = null;
    player = null;

    get score() {}
    // currently pressed note, starting note index ex. {[keyCode]: noteIndex}
    get currNoteIndices() {}

    get CurrentNoteIndex() {
        return Math.floor(timeMsToSixteenthNotePos(this.appChart?.songTimeMs || 0));
    }
    CurrentKeyDown(keyCode) {
        if (keyCode in this.currNoteIndices) {
            return true;
        }
        return false;
    }
    constructor(notes, appChart, player) {
        this.notes = notes;
        this.appChart = appChart;
        this.player = player;
    }
    start() {}
    stop() {}
    updateScore() {}
}