const fs = require('fs');
const path = require('path');

// Fix README
const readmePath = path.join(__dirname, 'README.md');
let readme = fs.readFileSync(readmePath, 'utf8');
readme = readme.replace('??', '🏆');
fs.writeFileSync(readmePath, readme);

// Fix Swap contract
const swapPath = path.join(__dirname, 'contracts', 'simple-swap.clar');
if (fs.existsSync(swapPath)) {
    let swap = fs.readFileSync(swapPath, 'utf8');
    const lines = swap.split('\n');
    const newLines = lines.slice(0, 173).join('\n');
    fs.writeFileSync(swapPath, newLines);
}

console.log('Fixed README.md and simple-swap.clar');
