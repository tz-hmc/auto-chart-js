import {fullConversion} from '../audio-util.js';

// i.e. npm run create-chart server/test/senpai.mp3 
(async () => {
  let args = process.argv;
  let inputMp3File = args[2];
  console.log(`Received arguments ${args}. Beginning to process ${inputMp3File}`);
  await fullConversion(inputMp3File);
})();