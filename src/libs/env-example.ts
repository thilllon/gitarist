import fs from 'fs';
import path from 'path';

export type CreateEnvExampleOptions = {
  filename: string;
  comments: boolean;
  merge: boolean;
};

export async function createEnvExample(options: CreateEnvExampleOptions) {
  const keySet = new Set<string>();
  const output = fs
    .readFileSync(path.join(process.cwd(), options.filename), 'utf8')
    .split('\r')
    .join('')
    .split('\n')
    .map((line) => line.trim())
    .map((line, index) => {
      if (line === '') {
        return '';
      }
      if (line.startsWith('#')) {
        return options.comments ? line : null;
      }
      if (line.indexOf('=') === -1) {
        throw new Error(`Line ${index} does not have a valid config (i.e. no equals sign).`);
      }
      const key = line.split('=')[0];
      if (options.merge && keySet.has(key)) {
        return null;
      } else {
        keySet.add(key);
        return key + '=';
      }
    })
    .filter((line) => line !== null)
    .join('\n');

  fs.writeFileSync(path.join(process.cwd(), '.env.example'), output, {
    encoding: 'utf-8',
    flag: 'w+',
  });
  console.log('✨ .env.example successfully generated.');
}
