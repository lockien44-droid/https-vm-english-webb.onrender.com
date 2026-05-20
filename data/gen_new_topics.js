const fs = require('fs');
const path = require('path');

const topicsDir = path.join(__dirname, 'topics');
const bundlePath = path.join(__dirname, 'topics_bundle.js');

const files = fs.readdirSync(topicsDir).filter(f => f.endsWith('.json'));
let bundleObj = {};

for (const file of files) {
  const filePath = path.join(topicsDir, file);
  const topicId = file.replace('.json', '');
  try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(rawData);
    bundleObj[topicId] = jsonData;
    console.log(`Loaded ${topicId} with ${jsonData.length} words`);
  } catch(e) {
    console.error(`Error reading ${file}:`, e);
  }
}

const bundleContent = `window.bundledTopics = ${JSON.stringify(bundleObj, null, 2)};`;
fs.writeFileSync(bundlePath, bundleContent, 'utf-8');
console.log(`Successfully bundled ${Object.keys(bundleObj).length} topics into topics_bundle.js`);
