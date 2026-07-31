import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const registryUrl = new URL('../docs/product-registry.json', import.meta.url);
const registryPath = fileURLToPath(registryUrl);

const fail = (message) => {
  console.error(`Product registry validation failed: ${message}`);
  process.exitCode = 1;
};

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const hasDuplicates = (values) => new Set(values).size !== values.length;

let registry;

try {
  registry = JSON.parse(await readFile(registryPath, 'utf8'));
} catch (error) {
  fail(`cannot read or parse ${registryPath}: ${error.message}`);
  process.exit();
}

if (!isNonEmptyString(registry.name)) {
  fail('name must be a non-empty string');
}

if (!isNonEmptyString(registry.version)) {
  fail('version must be a non-empty string');
}

if (!Array.isArray(registry.products) || registry.products.length === 0) {
  fail('products must be a non-empty array');
} else {
  const ids = [];
  const paths = [];

  for (const [index, product] of registry.products.entries()) {
    const label = `products[${index}]`;

    for (const field of ['id', 'type', 'path', 'technology']) {
      if (!isNonEmptyString(product[field])) {
        fail(`${label}.${field} must be a non-empty string`);
      }
    }

    if (typeof product.required !== 'boolean') {
      fail(`${label}.required must be a boolean`);
    }

    if (isNonEmptyString(product.id)) ids.push(product.id);
    if (isNonEmptyString(product.path)) paths.push(product.path);
  }

  if (hasDuplicates(ids)) fail('product ids must be unique');
  if (hasDuplicates(paths)) fail('product paths must be unique');
}

for (const field of ['sharedPackages', 'infrastructure']) {
  if (!Array.isArray(registry[field])) {
    fail(`${field} must be an array`);
    continue;
  }

  if (!registry[field].every(isNonEmptyString)) {
    fail(`${field} must contain only non-empty strings`);
  }

  if (hasDuplicates(registry[field])) {
    fail(`${field} must not contain duplicates`);
  }
}

if (!registry.rules || typeof registry.rules !== 'object') {
  fail('rules must be an object');
} else {
  for (const [key, value] of Object.entries(registry.rules)) {
    if (!isNonEmptyString(key) || typeof value !== 'boolean') {
      fail('rules must map non-empty names to boolean values');
    }
  }
}

if (process.exitCode) process.exit();

console.log(
  `Product registry valid: ${registry.products.length} products, ${registry.sharedPackages.length} shared packages, ${registry.infrastructure.length} infrastructure entries.`,
);
