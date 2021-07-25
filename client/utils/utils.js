const sixteenthNotePosToTimeMs = index => (index*1/16)*1000;
const timeMsToSixteenthNotePos = time => (time/1000)/(1/16);