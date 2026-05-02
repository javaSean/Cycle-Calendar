const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const sourcePng = path.join(rootDir, 'assets', 'app-icon.png');
const buildDir = path.join(rootDir, 'build');
const iconsetDir = path.join(buildDir, 'icon.iconset');
const outputIcns = path.join(buildDir, 'icon.icns');

const iconSizes = [
  16,
  32,
  64,
  128,
  256,
  512,
  1024
];

function ensureMacTools() {
  if (process.platform !== 'darwin') {
    throw new Error('Icon generation is only supported on macOS because it uses sips and iconutil.');
  }
}

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

function recreateDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeIconVariant(size) {
  const standardName = `icon_${size}x${size}.png`;
  const retinaName = `icon_${size / 2}x${size / 2}@2x.png`;

  run('sips', [
    '-z',
    String(size),
    String(size),
    sourcePng,
    '--out',
    path.join(iconsetDir, standardName)
  ]);

  if (size <= 512) {
    run('sips', [
      '-z',
      String(size),
      String(size),
      sourcePng,
      '--out',
      path.join(iconsetDir, retinaName)
    ]);
  }
}

function main() {
  ensureMacTools();

  if (!fs.existsSync(sourcePng)) {
    throw new Error(`Missing source icon: ${sourcePng}\nAdd your logo as assets/app-icon.png (ideally 1024x1024).`);
  }

  fs.mkdirSync(buildDir, { recursive: true });
  recreateDir(iconsetDir);

  for (const size of iconSizes) {
    writeIconVariant(size);
  }

  fs.rmSync(outputIcns, { force: true });
  run('iconutil', ['-c', 'icns', iconsetDir, '-o', outputIcns]);

  console.log(`Created ${path.relative(rootDir, outputIcns)}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}