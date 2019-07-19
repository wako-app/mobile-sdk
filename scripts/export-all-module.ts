import * as glob from 'glob';
import * as fs from 'fs';

const srcPath = __dirname.replace('scripts', 'src');

const indexTsPath = srcPath + '/public_api.ts';

if (fs.existsSync(indexTsPath)) {
  fs.unlinkSync(indexTsPath);
}

const tsFiles: string[] = glob.sync(__dirname + '/../src/**/*.ts');

const allExports: string[] = [];
tsFiles.forEach(file => {
  if (file.match(/\.d\.ts/)) {
    return;
  }
  allExports.push(
    `export * from '.${file.replace(srcPath, '').replace('.ts', '')}';`
  );
});

fs.writeFileSync(srcPath + '/public_api.ts', allExports.join('\n'), {
  encoding: 'utf8'
});
