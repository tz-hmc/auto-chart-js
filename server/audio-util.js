/**
 * implementation intended to follow FFT beat detection in below:
 * http://archive.gamedev.net/archive/reference/programming/features/beatdetection/
 *
 * INCOMPLETE
 * 
 * TODO:
 * - ignore the DC offset (zeroth bin)
 * - apply window function (?)
 * - stop ignoring imaginary part of realTransform.. fromComplexArray may be tossing them. use to find actual magnitude
 */

 import * as fs from "fs";

 import FFT from "fft.js";
 import plotlib from "nodeplotlib";
 import LAME from "node-lame";
 import XlsxPopulate from "xlsx-populate";
 import WavDecoder from 'wav-decoder';
 
 function runFFT(buffer) {
   let size = buffer.length;
   let fft = new FFT(size);
   let realOutput = new Array(size);
   let complexOutput = fft.createComplexArray();
   let realInput = [].slice.call(buffer).map((val) => val || 0);
   realInput = realInput.slice(0, size);
   fft.realTransform(complexOutput, realInput);
   fft.fromComplexArray(complexOutput, realOutput);
   return realOutput;
 }
 
 function chunkSum(list, chunkSize) {
   return [...Array(Math.ceil(list.length / chunkSize))].map((_, i) => {
     return list
       .slice(i * chunkSize, i * chunkSize + chunkSize)
       .reduce((a, b) => a + Math.abs(b), 0); // (b*b) ?
   });
 }
 
 function formatValues(buffer, periodIndex, periodSize) {
   let startIndex = periodIndex * periodSize;
   let desiredIndex = (periodIndex + 1) * periodSize;
   if (desiredIndex > buffer.length) {
     throw new Error(`padding to periodSize did not work. attempting to read ${desiredIndex}`)
   }
   return buffer.slice(startIndex, desiredIndex);
 }
 
 // similar to SMA implementation here: but doing it columnwise
 // https://blog.oliverjumpertz.dev/the-moving-average-simple-and-exponential-theory-math-and-implementation-in-javascript
 function simpleMovingAverage(arr, windowSize) {
   if (!arr || arr.length < windowSize) {
     return [];
   }
   let index = windowSize - 1;
   const length = arr.length + 1;
   const simpleMovingAverages = [];
   while (++index < length) {
     const windowSlice = arr.slice(index - windowSize, index);
     const sums = windowSlice.reduce((prevRow, currRow) => {
       return prevRow.map((prevCol, i) => prevCol + currRow[i] / windowSize);
     }, new Array(windowSlice[0].length).fill(0));
     simpleMovingAverages.push(sums);
   }
   console.log('size of array: ', arr.length);
   console.log('size of SMA array: ', simpleMovingAverages.length);
   let paddedArray = [
     ...(new Array(arr.length - simpleMovingAverages.length).fill(
       new Array(simpleMovingAverages[0].length).fill(0)
     )),
     ...simpleMovingAverages
   ];
   console.log('attempting to pad. padded size is: ', paddedArray.length);
   return paddedArray;
 }
 
 function energyComparison(energy, energyMA, freqIncrement) {
   let C = 5; //250
   let beats = [];
   
   console.log('energy size | rows: ', energy.length, "columns: ",  energy[0].length);
   console.log('energyMA size | rows: ', energyMA.length, "columns: ",  energyMA[0].length);
   console.log('freqIncrement for subband is ', freqIncrement);
 
   for (var i = 0; i < energy.length; i++) {
     let currBeat = [];
     energy[i].forEach((energyAtFreq, j) => {
       if (energyAtFreq > C * energyMA[i][j]) {
         currBeat.push(j * freqIncrement);
         //console.log('beep boop');
       }
       else {
         currBeat.push(0);
       }
     });
     beats.push(currBeat);
   }
   return beats;
 }
 
 function getFrequencyIncrement(samplingRatekHz, fftSize) {
   return (samplingRatekHz / (2 * fftSize)) * 1000;
 }
 
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
 
 // Generate the chart
 function chartConversion(buffer, beats, periodSize, chartIncrement, samplingRatekHz) {
   let totalTimeSec = buffer.length/(samplingRatekHz*1000);
   
   // sanity checks
   let beatsIncrement = totalTimeSec/beats.length;
   let expectedBeatsIncrement = totalTimeSec/(buffer.length/periodSize);
   console.log(`beats increment is ${beatsIncrement}, expected beats increment is ${expectedBeatsIncrement}`);
 
   let numberNotes = Math.floor(totalTimeSec/chartIncrement);
   console.log(`total time is ${totalTimeSec} and number of notes is ${numberNotes}`);
 
   let chart = (new Array(numberNotes)).fill([]);
   for (let i=0; i < chart.length; i++) {
     let currentTimeBegin = i*chartIncrement;
     let currentTimeEnd = (i+1)*chartIncrement;
     let startBeatIndex = Math.floor(currentTimeBegin/beatsIncrement);
     let endBeatIndex = Math.floor(currentTimeEnd/beatsIncrement);
     let beatsInChartPeriod = beats.slice(startBeatIndex, endBeatIndex).reduce((accum, freqsAtT) => {
       let flatFreq = freqsAtT.filter(freq => freq !== 0);
       return [...accum, ...flatFreq];
     }, []);
     chart[i] = beatsInChartPeriod;
   }
   return chart;
 }
 
 // intending to make each consecutive frequency subband a different key
 // due to subband not mapping accurately to different notes, likely inaccurate
 function dirtyKeycodeGenerate(noteFreq, freqIncrementForSubband) {
   let keyNumber = Math.floor((noteFreq/freqIncrementForSubband) % 4);
   return 37+keyNumber;
 }
 
 // generate the keycode chart
 function keyCodeChartConversion(chart, freqIncrementForSubband) {
   let keyCodeChart = [];
   for (let i=0; i < chart.length; i++) {
     let row = chart[i];
     let keyObjs = [];
     let keySet = new Set();
     row.forEach(note => {
       let keyCode = dirtyKeycodeGenerate(note, freqIncrementForSubband);
       if (!keySet.has(keyCode)) {
         keySet.add(keyCode);
         keyObjs.push({keyCode: keyCode, length: 1});
       }
     })
     keyCodeChart.push(keyObjs);
   }
   return keyCodeChart;
 }
 
 function writeChartToWorkbook(workbook, chart) {
   let sheet = workbook.addSheet("chart");
   for(let i=0; i<chart.length; i++) {
     let row = chart[i];
     let sheetRow = sheet.row(i+1);
     for(let j=0; j<row.length; j++) {
       sheetRow.cell(j+1).value(row[j]);
     }
   }
 }
 
 // sampling rate: 44100
 // period size: 1024
 // minimum chart increment: 1/16 note (in 60bpm)
 async function fftBeatPitchDetection(buffer, samplingRatekHz) {
 
   let periodSize = 1024;
   let paddedBufferSize = Math.ceil(buffer.length/periodSize)*periodSize;
 
   buffer = [...buffer, ...(new Array(paddedBufferSize - buffer.length)).fill(0)];
 
   console.log(`padded buffer size = ${buffer.length}`)
 
   let energy = new Array(Math.ceil(buffer.length / periodSize));
   let subbands = 248; // number of possible distinct pitches
   let periodIndex = 0;
 
   console.log(
     `starting fft on ${periodSize} period size with ${subbands} subbands`
   );
   debugger;
 
   while (periodIndex * periodSize < buffer.length) {
     let period = formatValues(buffer, periodIndex, periodSize);
     let fftOutput = runFFT(period);
     energy[periodIndex] = chunkSum(fftOutput, periodSize / subbands);
     //if (periodIndex == 30) plotFFT(energy[periodIndex], samplingRatekHz);
     periodIndex += 1;
   }
 
   console.log(`finished ffts`);
   debugger;
 
   let MASize = 43;
   console.log(`finding SMA of ${MASize}`);
 
   let energyMA = simpleMovingAverage(energy, MASize);
 
   console.log(`comparing current energies with SMA`);
 
   let freqIncrementForSubband = getFrequencyIncrement(samplingRatekHz, periodSize)*periodSize/subbands;
 
   let beats = energyComparison(energy, energyMA, freqIncrementForSubband);
 
   // using sixteenth note
   let chartIncrement = 1/16;
   let chart = chartConversion(buffer, beats, periodSize, chartIncrement, samplingRatekHz);
 
   console.log(`writing to workbook`);
 
   let workbook = await XlsxPopulate.fromBlankAsync();
   workbook.addSheet("energy").cell("A1").value(energy);
   workbook.addSheet("energyMA").cell("A1").value(energyMA);
   workbook.addSheet("beats").cell("A1").value(beats);
   writeChartToWorkbook(workbook, chart);
   await workbook.toFileAsync('./beats.xlsx');
 
   let keyCodeChart = keyCodeChartConversion(chart, freqIncrementForSubband);
   fs.writeFileSync('./chart.json', JSON.stringify(keyCodeChart, null, 2) , 'utf-8');
 
   return keyCodeChart;
 }
 
 // core fs doesn't return Promise, has to be wrapped
 const readFile = (filepath) => {
   return new Promise((resolve, reject) => {
     fs.readFile(filepath, (err, buffer) => {
       if (err) {
         return reject(err);
       }
       return resolve(buffer);
     });
   });
 };
 
 export async function fullConversion(mp3filePath) {
   console.log("decoding mp3 to wav");
 
   const decoder = new LAME.Lame({
     output: "./out.wav",
   }).setFile(mp3filePath);
   await decoder.decode();
   
   let fileBuffer = await readFile("./out.wav");
   let audioData = await WavDecoder.decode(fileBuffer);
   let samplingRatekHz = audioData.sampleRate/1000;
   let audioBuffer = audioData.channelData[0];
 
   // sanity check
   console.log(audioData.sampleRate);
   console.log(`length of audio: ${audioBuffer.length/audioData.sampleRate}`);
   //console.log(audioData.channelData[0]); // Float32Array
   //console.log(audioData.channelData[1]); // Float32Array
 
   let keyCodeChart = await fftBeatPitchDetection(audioBuffer, samplingRatekHz);
   return  keyCodeChart;
 }