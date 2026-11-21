import { cpSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const outputDirEnv = process.env.MAKEFUN_OUTPUT_DIR;
const outputDir = outputDirEnv ? resolve(process.cwd(), outputDirEnv) : resolve(__dirname, 'out');
const gameSrcDir = resolve(__dirname, 'game');
const gameDestDir = resolve(outputDir, 'game');
const screenshotsSrcDir = resolve(__dirname, 'screenshots');
const screenshotsDestDir = resolve(outputDir, 'screenshots');

// Refuse with a clear error if the resolved output directory is the same as the game/ directory or inside it.
const relGame = relative(gameSrcDir, outputDir);
if (outputDir === gameSrcDir || (relGame && !relGame.startsWith('..') && !pathIsOutside(gameSrcDir, outputDir))) {
  // Let's make the check robust: outputDir is inside gameSrcDir if relative path from gameSrcDir to outputDir does not start with '..' and is not absolute with different root.
  // Actually, node's relative function: relative(from, to) returns the relative path from 'from' to 'to'.
  // If outputDir is equal to gameSrcDir, or if relative(gameSrcDir, outputDir) doesn't start with '..' (and is not empty if equal), it's inside or equal.
}

// Let's write a precise check:
const absOutput = resolve(outputDir);
const absGame = resolve(gameSrcDir);
if (absOutput === absGame || (absOutput.startsWith(absGame + '/'))) {
  console.error(`Error: Output directory (${absOutput}) cannot be the same as or inside the game directory (${absGame}).`);
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });
mkdirSync(screenshotsDestDir, { recursive: true });

// Copy game/ and screenshots/ from beside itself to the output directory
cpSync(gameSrcDir, gameDestDir, { recursive: true, force: true });

if (existsSync(screenshotsSrcDir)) {
  cpSync(screenshotsSrcDir, screenshotsDestDir, { recursive: true, force: true });
}

const dossierBytes = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

const dossierPath = resolve(outputDir, 'dossier.json');
writeFileSync(dossierPath, dossierBytes);
console.log(`Successfully built dossier at ${dossierPath}`);

function pathIsOutside(base: string, target: string): boolean {
  const rel = relative(base, target);
  return rel === '' || rel.startsWith('..') || rel.startsWith('/');
}
