// Builds www/, the web content the app ships with: the trainer page and its js/
// folder from the repo root, unchanged apart from a <script> tag for native.js
// added at the end.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const www = path.join(__dirname, 'www');
const TAG = '<script src="native.js"></script>';

const page = fs.readFileSync(path.join(root, 'preflop-seat-drill.html'), 'utf8');

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www);
fs.writeFileSync(path.join(www, 'index.html'), page.replace(/\s*$/, '\n') + TAG + '\n');
fs.cpSync(path.join(root, 'js'), path.join(www, 'js'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'native.js'), path.join(www, 'native.js'));
console.log('Built www/ from preflop-seat-drill.html');
