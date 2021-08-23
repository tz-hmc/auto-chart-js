class RemoteInput extends Input {
    get score() {
        return this.player.score || 0;
    }
    get currNoteIndices() {
        return this.player.currNoteIndices || {};
    }
    constructor(notes, appChart, player) {
        super(notes, appChart, player);
    }
    start() {
        console.log('remote start');
    }
    stop() {
        console.log('remote stop');
    }
    updateScore() {
        console.log('remote update score');
    }
}