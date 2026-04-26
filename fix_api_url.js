const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./frontend/src').filter(f => f.endsWith('.js'));
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('const API_URL = process.env.REACT_APP_BACKEND_URL;')) {
        content = content.replace(/const API_URL = process\.env\.REACT_APP_BACKEND_URL;/g, "const API_URL = process.env.REACT_APP_BACKEND_URL || '';");
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
