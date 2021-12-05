const BASE_URL = location.origin;

const sixteenthNotePosToTimeMs = index => (index*1/16)*1000;
const timeMsToSixteenthNotePos = time => (time/1000)/(1/16);

const url = (path) => (new URL(path, BASE_URL));
let WEB_SOCKET_URL = url('');
    WEB_SOCKET_URL.protocol = 'ws:';
let SONG_UPLOAD_URL = (roomCode) => (url(`song/${roomCode}`));
let SONG_DOWNLOAD_URL = (roomCode) => (url(`songs/${roomCode}.mp3`));
let CHART_DOWNLOAD_URL = (roomCode) => (url(`charts/${roomCode}.json`));