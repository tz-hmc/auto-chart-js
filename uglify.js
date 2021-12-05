import UglifyJS from 'uglify-js';
import fs from 'fs';

const files = [
    './client/utils/utils.js',
    './client/components/key.js',
    './client/components/loading-spinner.js',
    './client/components/input.js',
    './client/components/local-input.js',
    './client/components/remote-input.js',
    './client/components/app-chart.js',
    './client/pages/chart-page.js',
    './client/pages/input-page.js',
    './client/pages/score-page.js',
    './client/managers/file-manager.js',
    './client/managers/player-manager.js',
    './client/managers/connection-manager.js',
    './client/managers/page-manager.js',
];

const options = { toplevel: true };

fs.writeFileSync("./client/index.min.js", UglifyJS.minify(files.reduce((accum, file) => {
    accum[file] = fs.readFileSync(file, "utf8");
    return accum;
}, {}), options).code, "utf8");