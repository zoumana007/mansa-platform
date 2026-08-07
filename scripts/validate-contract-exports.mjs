import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageDir = resolve(root, 'packages/contracts');
const packageJsonPath = resolve(packageDir, 'package.json');

const failures = [];

const fail = (message) => failures.push(message);

const exists = async (path) => {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

let manifest;

try {
  manifest = JSON.parse(await readFile(packageJsonPath, 'utf8'));
} catch (error) {
  console.error(`Contract export validation failed: cannot read ${packageJsonPath}: ${error.message}`);
  process.exit(1);
}

if (!manifest.exports || typeof manifest.exports !== 'object') {
  fail('packages/contracts/package.json must define an exports map');
} else {
  for (const [subpath, target] of Object.entries(manifest.exports)) {
    if (!target || typeof target !== 'object') {
      fail(`${subpath}: export target must be an object`);
      continue;
    }

    const expectedStem = subpath === '.' ? 'index' : subpath.replace(/^\.\//, '');
    const sourcePath = resolve(packageDir, 'src', `${expectedStem}.ts`);
    const expectedTypes = `./dist/${expectedStem}.d.ts`;
    const expectedImport = `./dist/${expectedStem}.js`;

    if (target.types !== expectedTypes) {
      fail(`${subpath}: types must target ${expectedTypes}`);
    }

    if (target.import !== expectedImport) {
      fail(`${subpath}: import must target ${expectedImport}`);
    }

    if (!(await exists(sourcePath))) {
      fail(`${subpath}: missing source file src/${expectedStem}.ts`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`Contract export validation failed: ${failure}`);
  process.exit(1);
}

console.log(`Contract exports valid: ${Object.keys(manifest.exports).length} public entry points checked.`);
