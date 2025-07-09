const fs = require('fs');

// Read CSS content from file or paste your SCSS-like string here
const animateType = './src/style/_animate.scss';
const input = fs.readFileSync(animateType, 'utf-8');

function extractDescriptions(source) {
  const lines = source.split('\n');
  const result = {};
  let currentParent = '';
  let pendingDescription = '';
  let pendingStyle = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match parent class (like .animated)
    const parentMatch = line.match(/^\.(\w+)\s*{$/);
    if (parentMatch && !currentParent) {
      currentParent = parentMatch[1];
      result[currentParent] = {};
      continue;
    }

    // Match child description
    const descMatch = line.match(/^\/\/\/\s*description:\s*(.+)$/i);
    if (descMatch) {
      pendingDescription = descMatch[1].trim();
      continue;
    }

    // Match child class (like .shake or .zoom) under currentParent
    const childMatch = line.match(/^&\.(\w+)\s*{$/);
    if (childMatch && currentParent && pendingDescription) {
      const childClass = childMatch[1];
      result[currentParent][childClass] = {};
      result[currentParent][childClass]["description"] = pendingDescription;
      pendingDescription = '';
    }

    // Match style
    const styleMatch = line.match(/^\/\/\/\s*styles:\s*(.+)$/i);
    if (styleMatch) {
      pendingStyle = styleMatch[1].trim();
      continue;
    }

    const childStyleMatch = line.match(/^&\.(\w+)\s*{$/);
    if (childStyleMatch && currentParent && pendingStyle) {
      const childClass = childMatch[1];
      result[currentParent][childClass]["styles"] = pendingStyle.replace(" ", "").split(",");
      pendingStyle = '';
    }

    // If closing the block, reset parent context
    if (line === '}') {
      // Optional: check indentation level if needed
    }
  }

  return result;
}

// Generate and write JSON
const output = extractDescriptions(input);
const outputPath = process.argv[3] !== undefined ? process.argv[3] : 'animation-data.json';
//	fs.writeFileSync(outputPath, JSON.stringify(outputJSON, null, 4));
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
console.log('✅ animation-data.json created successfully.');