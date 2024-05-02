
const path = require('path');
const fs = require('fs');
const logging = require('./logging');
const fse = require('fs-extra');
const readline = require('readline');
const process = require('process');
const util = require('util');
const exec = util.promisify(require('child_process').exec)

const mainScss = '../src/_main.scss';
const mainScssBackup = '../src/_main-backup.txt';
const tempScss = '../src/_main-temp.scss';

function createBackupForMainScss() {
  fse.copySync(path.resolve(__dirname, mainScss), mainScssBackup);
}

async function commentOutEachLineInNewMainScss() {
  let importFilesArray = 0;
  let outputFileContent = "";
  const fileStream = fs.createReadStream(mainScss);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    // console.log(`Line from file: ${line}`);
    if (line && line.toString().trim() !== "") {
      outputFileContent += "// " + line + "\r\n";
      importFilesArray++;
    }
  }

  // The contents of the file are now in the 'data' variable
  // console.log(data.toString());

  // const content = 'Some content!';
  try {
    fs.writeFileSync(mainScss, outputFileContent);
    // console.log("FILE WRITTEN");
    // file written successfully
  } catch (err) {
    console.error(err);
  }
  return importFilesArray;
}

async function makeDevBuild() {
  process.chdir('../');
  // console.log("process", process.cwd());
  const { stdout, stderr } = await exec("npm run build:dev");
  // console.log('stdout:', stdout);
  // console.error('stderr:', stderr);
}

function saveFileSize() {
  const stats = fs.statSync("./output/themes/css/ch5-theme.css");
  const fileSizeInBytes = stats["size"];
  // dataArray.push({ size: fileSizeInBytes });
  console.log(fileSizeInBytes);
  // console.log("File size: " + fileSizeInBytes);
  process.chdir('helpers');
}

(async () => {
  createBackupForMainScss();
  const importFilesArray = await commentOutEachLineInNewMainScss();

  for (let i = 0; i < importFilesArray; i++) {
    let outputFileContent = "";
    const fileStream = fs.readFileSync(mainScss);
    outputFileContent = fileStream.toString().replace("//", "");
    try {
      fs.writeFileSync(mainScss, outputFileContent);
    } catch (err) {
      console.error(err);
    }
    await makeDevBuild();
    saveFileSize();
  }

  // fs.renameSync(path.resolve(__dirname, mainScss), path.resolve(__dirname, tempScss));
  fse.removeSync(path.resolve(__dirname, mainScss));
  fs.renameSync(path.resolve(__dirname, mainScssBackup), path.resolve(__dirname, mainScss));
})();

