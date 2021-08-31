import {fullConversion} from '../audio-util.js';
import plotlib from "nodeplotlib";

function plotFFT(fftOutput, samplingRatekHz) {
  console.log(fftOutput);
  let fftSize = fftOutput.length;
  let x = [];
  for (let i = 0; i < fftSize; i++)
    x.push(i * getFrequencyIncrement(samplingRatekHz, fftSize));
  plotlib.plot([
    {
      x: x,
      y: fftOutput,
      type: "line",
      name: "output",
    },
  ]);
}

// i.e. npm run create-chart server/test/senpai.mp3 
(async () => {
  let args = process.argv;
  let inputMp3File = args[2];
  console.log(`Received arguments ${args}. Beginning to process ${inputMp3File}`);
  await fullConversion(inputMp3File);
})();