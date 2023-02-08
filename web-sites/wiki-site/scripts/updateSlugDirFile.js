const path = require('path');
const fs = require('fs');

// const nameInfo = require('./name.json');
const nameEnLs = require('./filePath-en.json');

const DOCS_PATH = path.join(__dirname, '../docs');

const fileNamePath = [];
const handleDoc = (root) => {
  const fsState = fs.statSync(root);
  if (fsState.isDirectory()) {
    let files = fs.readdirSync(root);
    files.forEach((fileName) => handleDoc(path.join(root, fileName)));
  } else {
    const rePath = path.relative(DOCS_PATH, root);
    if (rePath.endsWith('.md')) {
      fileNamePath.push(rePath);
    }
  }
};

handleDoc(DOCS_PATH);

// console.log(fileNamePath);
// fs.writeFileSync('./filePath.json', JSON.stringify(fileNamePath), { encoding: 'utf8' });

fileNamePath.forEach((file, index) => {
  const completePath = path.join(DOCS_PATH, file);
  const data = fs.readFileSync(completePath).toString();
  if (data.startsWith('---')) {
    console.log('file:', file, 'has header meta, 请手动修改');
  } else {
    const text = `---\nslug: /${nameEnLs[index]}\n---\n` + data;
    fs.writeFile(completePath, text, function (err) {
      if (err) return console.log(err);
    });
  }
});
