const fs = require('fs');
const path = require('path');

const topicsDir = path.join(__dirname, 'data', 'topics');
const outputFile = path.join(__dirname, 'data', 'topics_bundle.js');

try {
    const files = fs.readdirSync(topicsDir).filter(f => f.endsWith('.json'));

    let bundleContent = 'window.bundledTopics = {\n';
    let first = true;

    for (const file of files) {
        const topicId = path.basename(file, '.json');
        
        // Ensure UTF-8 when reading
        const content = fs.readFileSync(path.join(topicsDir, file), 'utf8');
        const json = JSON.parse(content);
        
        if (!first) {
            bundleContent += ',\n';
        }
        first = false;
        
        // Pretty print into the JS file
        bundleContent += `"${topicId}": ${JSON.stringify(json, null, 2)}`;
    }

    bundleContent += '\n};\n';

    // Ensure UTF-8 when writing
    fs.writeFileSync(outputFile, bundleContent, 'utf8');
    console.log(`Successfully bundled ${files.length} topics into ${outputFile} with UTF-8 encoding.`);
} catch (error) {
    console.error('Error bundling topics:', error);
}
