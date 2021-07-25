import ytdl from "ytdl-core";

// TODO: ytdl returns a empty mp3

async function youtubeDownload() {
  let url = "https://www.youtube.com/watch?v=EJiXO3vwNFo";
  let info = await ytdl.getInfo(url);
  let format = ytdl.chooseFormat(info.formats, {
    audioSampleRate: "44100",
    //audioBitrate: 320,
    hasVideo: false,
  });
  ytdl(url, { format }).pipe(fs.createWriteStream("./out.mp3"));
  // return filename;
}