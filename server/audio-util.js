/**
* implementation intended to follow FFT note detection in below:
* http://archive.gamedev.net/archive/reference/programming/features/notedetection/
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
import LAME from "node-lame";
import WavDecoder from 'wav-decoder';
import XlsxPopulate from "xlsx-populate";
import {NoteRowConverter, getFrequencyIncrement} from "./note-row-converter.js";

// fromComplexArray ignores the imaginary values see github: 
// https://github.com/indutny/fft.js/blob/4a18cf88fcdbd4ad5acca6eaea06a0b462047835/lib/fft.js
const fromComplexArray = (complex) => {
  var res = new Array(complex.length >>> 1);
  // for (var i = 0; i < complex.length; i += 2)
  //   res[i >>> 1] = complex[i];
  for (var i = 0; i<complex.length; i += 2)
    res[i/2] = Math.sqrt(complex[i]*complex[i] + complex[i+1]*complex[i+1])
  return res;
};

function runFFT(buffer) {
  let size = buffer.length;
  let fft = new FFT(size);
  let complexOutput = fft.createComplexArray();
  let realInput = [].slice.call(buffer).map((val) => val || 0);
  realInput = realInput.slice(0, size);
  fft.realTransform(complexOutput, realInput);
  let realOutput = fromComplexArray(complexOutput);
  //fft.fromComplexArray(complexOutput, realOutput);
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

function energyComparison(energy, energyMA) {
  let C = 7; //5; //250
  let notes = [];

  console.log('energy size | rows: ', energy.length, "columns: ",  energy[0].length);
  console.log('energyMA size | rows: ', energyMA.length, "columns: ",  energyMA[0].length);

  for (var i = 0; i < energy.length; i++) {
    let currNote = [];
    energy[i].forEach((energyAtFreq, j) => {
      let threshold = C * energyMA[i][j];
      if (energyAtFreq > threshold) {
        let noteLength = getNoteLength(energy, i, j, threshold);
        currNote.push(noteLength);
      }
      else {
        currNote.push(0);
      }
    });
    notes.push(currNote);
  }
  return notes;
}

function getNoteLength(energy, timeIndex, freqIndex, initThreshold) {
  let length = 1;
  let peak = energy[timeIndex][freqIndex];
  // TODO: replace with something that actually makes sense
  while (++timeIndex < energy.length &&
    energy[timeIndex][freqIndex] > 0.5*peak &&
    energy[timeIndex][freqIndex] > initThreshold) {
    length += 1;

    if(!energy[timeIndex]) {
      console.log('getNoteLength');
      console.log(energy);
      console.log(timeIndex);
      console.log(freqIndex);
      console.log(energy[timeIndex]);
    }

    if (timeIndex > 0 && energy[timeIndex][freqIndex] > peak) {
      peak = energy[timeIndex][freqIndex];
    }
  }
  return length;
}

// Generate the chart
function chartConversion(buffer, notes, periodSize, chartIncrement, samplingRatekHz) {
  let totalTimeSec = buffer.length/(samplingRatekHz*1000);

  // sanity checks
  let notesIncrement = totalTimeSec/notes.length;
  let expectedNotesIncrement = totalTimeSec/(buffer.length/periodSize);
  console.log(`notes increment is ${notesIncrement}, expected notes increment is ${expectedNotesIncrement}`);

  let numberNotes = Math.floor(totalTimeSec/chartIncrement);
  console.log(`total time is ${totalTimeSec} and number of notes is ${numberNotes}`);

  let chart = (new Array(numberNotes)).fill([]);
  for (let i=0; i < chart.length; i++) {
    let currentTimeBegin = i*chartIncrement;
    let currentTimeEnd = (i+1)*chartIncrement;
    let startNoteIndex = Math.floor(currentTimeBegin/notesIncrement);
    let endNoteIndex = Math.floor(currentTimeEnd/notesIncrement);
    let notesInChartPeriod = notes.slice(startNoteIndex, endNoteIndex).reduce((accum, noteLength) => {
      let flatNoteLength = noteLength.filter(freq => freq !== 0);
      return [...accum, ...flatNoteLength];
    }, []);
    chart[i] = notesInChartPeriod;
  }
  return chart;
}

// intending to make each consecutive note a different key
// due to subband not mapping accurately to different notes, likely inaccurate
function dirtyKeycodeGenerate(freqNoteIndex) {
  let keyNumber = Math.floor(freqNoteIndex % 4);
  return 37+keyNumber;
}

// generate the keycode chart
function keyCodeChartConversion(chart) {
  let keyCodeChart = [];
  let currentKeys = {37: 0, 38: 0, 39: 0, 40: 0};
  for (let i=0; i < chart.length; i++) {
    let row = chart[i];
    let keyObjs = [];
    row.forEach((noteLength, i) => {
      let keyCode = dirtyKeycodeGenerate(i);
      // keep notes from overlapping with previous note's length
      if (currentKeys[keyCode] === 0) {
        // max length is 32 for now
        let length = noteLength < 32 ? noteLength : 32;
        currentKeys[keyCode] = length;
        keyObjs.push({keyCode: keyCode, length: length});
      }
    })
    Object.keys(currentKeys).forEach(key => {
      let prevValue = currentKeys[key];
      currentKeys[key] = prevValue>0 ? prevValue-1 : prevValue;
    });
    // for now, limit number of keys at one step to 2
    while (keyObjs.length > 2) {
      let randomIndex = Math.floor(Math.random()*keyObjs.length);
      keyObjs.splice(randomIndex);
    }
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
async function fftNotePitchDetection(buffer, samplingRatekHz, debug) {

  let periodSize = 4096;
  let paddedBufferSize = Math.ceil(buffer.length/periodSize)*periodSize;

  buffer = [...buffer, ...(new Array(paddedBufferSize - buffer.length)).fill(0)];

  console.log(`padded buffer size = ${buffer.length}`)

  let energy = new Array(Math.ceil(buffer.length / periodSize));
  let periodIndex = 0;

  console.log(`fft ${periodSize} period size`);

  let freqIncrement = getFrequencyIncrement(samplingRatekHz, periodSize);

  console.log(`freq increment ${freqIncrement}`);

  let noteRowConverter = new NoteRowConverter(freqIncrement);

  while (periodIndex * periodSize < buffer.length) {
    let period = formatValues(buffer, periodIndex, periodSize);
    let fftOutput = runFFT(period);
    //energy[periodIndex] = chunkSum(fftOutput, periodSize / subbands);
    energy[periodIndex] = noteRowConverter.convertRow(fftOutput);
    //if (periodIndex == 30) plotFFT(energy[periodIndex], samplingRatekHz);
    periodIndex += 1;
  }

  console.log(`finished ffts`);

  let MASize = 43;
  console.log(`finding SMA of ${MASize}`);

  let energyMA = simpleMovingAverage(energy, MASize);

  console.log(`comparing current energies with SMA`);

  let notes = energyComparison(energy, energyMA);

  // using sixteenth note
  let chartIncrement = 1/16;
  let chart = chartConversion(buffer, notes, periodSize, chartIncrement, samplingRatekHz);

  let keyCodeChart = keyCodeChartConversion(chart);

  if (debug) {
    console.log(`writing to workbook`);

    let workbook = await XlsxPopulate.fromBlankAsync();
    workbook.addSheet("energy").cell("A1").value(energy);
    workbook.addSheet("energyMA").cell("A1").value(energyMA);
    workbook.addSheet("notes").cell("A1").value(notes);
    writeChartToWorkbook(workbook, chart);
    await workbook.toFileAsync('./notes.xlsx');

    fs.writeFileSync('./debug-chart.json', JSON.stringify(keyCodeChart, null, 2) , 'utf-8');
  }

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

export async function fullConversion(mp3filePath, debug=true) {
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

  let keyCodeChart = await fftNotePitchDetection(audioBuffer, samplingRatekHz, debug);
  return  keyCodeChart;
}