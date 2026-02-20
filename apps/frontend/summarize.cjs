const fs = require('fs');

const path = '/var/folders/7x/k93t0vgj6tz75gt2l1kmn0sm0000gn/T/react-doctor-b8c3842b-ccfc-44ea-bbdf-83366655970b/diagnostics.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const out = [];
data.forEach(item => {
    if (typeof item === 'object' && item !== null) {
        if (item.filePath) {
            out.push(`${item.filePath}:${item.line || 0}:${item.column || 0} - ${item.rule} - ${item.message}`);
        } else if (item.file) {
            out.push(`${item.file}:${item.line || 0}:${item.column || 0} - ${item.rule} - ${item.message}`);
        }
    }
});

fs.writeFileSync('summary.txt', out.join('\n'));
console.log('Saved summary.txt');
