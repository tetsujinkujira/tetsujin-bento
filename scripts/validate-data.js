import { readdirSync, readFileSync } from 'node:fs';

const directory = new URL('../public/data/', import.meta.url);
let invalid = false;
for (const filename of readdirSync(directory).filter(name => name.endsWith('.json'))) {
  try {
    JSON.parse(readFileSync(new URL(filename, directory), 'utf8'));
    console.log(`JSON OK: public/data/${filename}`);
  } catch (error) {
    invalid = true;
    console.error(`JSON ERROR: public/data/${filename}: ${error.message}`);
  }
}
if (invalid) process.exit(1);
