const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const packageJson = require(path.join(rootDir, 'package.json'));

function run(command, args) {
  execFileSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit'
  });
}

function iconArgs() {
  const sourcePng = path.join(rootDir, 'assets', 'app-icon.png');
  const generatedIcns = path.join(rootDir, 'build', 'icon.icns');

  if (!fs.existsSync(sourcePng)) {
    console.warn('No assets/app-icon.png found. Building with the default Electron icon.');
    return [];
  }

  run(process.execPath, [path.join(rootDir, 'scripts', 'build-icon.js')]);
  return ['--config.mac.icon=' + generatedIcns];
}

function main() {
  const builderBin = path.join(rootDir, 'node_modules', '.bin', 'electron-builder');
  const baseArgs = ['--mac', 'dmg', '--publish', 'never'];
  const extraArgs = iconArgs();

  console.log(`Building ${packageJson.productName || packageJson.name} DMG...`);
  run(builderBin, [...baseArgs, ...extraArgs]);
}

main();