const sixteenthNotePosToTimeMs = index => (index*1/16)*1000;
const timeMsToSixteenthNotePos = time => (time/1000)/(1/16);
const defaultKeys = [
    {keyCode: 37, color: '#dbabff'},
    {keyCode: 40, color: '#9494ff'},
    {keyCode: 38, color: '#ff7a91'},
    {keyCode: 39, color: '#6effbb'},
];