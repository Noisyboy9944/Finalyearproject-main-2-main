const parser = require('@babel/parser');
const fs = require('fs');
const code = fs.readFileSync('src/pages/VideoPlayer.js', 'utf8');
try {
  parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log("SUCCESS");
} catch (e) {
  console.error("ERROR: " + e.message);
}
