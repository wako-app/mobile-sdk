const fs = require('fs');

const file = 'dist/services/plugin/plugin-externals.js';

console.log('Patch ' + file);
let file1 = fs.readFileSync(file, { encoding: 'utf-8' });
file1 = file1.replace(
  `'ionic.angular': ionic,`,
  `'ionic.angular': ionic,\n\t'wako-app.mobile-sdk': wakoAppMobileSdk,`
);
file1 = file1.replace(
  `var ionic = require("@ionic/angular");`,
  `var ionic = require('@ionic/angular');\nvar wakoAppMobileSdk = require('@wako-app/mobile-sdk');`
);

fs.writeFileSync(file, file1);

console.log('Patch ' + file + ' DONE');

//--
//
// console.log('Patch dist/public_api.esm.js');
//
// let file2 = fs.readFileSync('dist/public_api.esm.js',{encoding: 'utf-8'});
// file2 = file2.replace(`'ionic.angular': ionic,`,`'ionic.angular': ionic,\n\t'wako-app.mobile-sdk': wakoAppMobileSdk,`);
// file2 = file2.replace(`import * as ionic from '@ionic/angular';`,`import * as ionic from '@ionic/angular';\nimport * as wakoAppMobileSdk from '@wako-app/mobile-sdk';`);
//
// fs.writeFileSync('dist/public_api.esm.js', file2);
//
// console.log('Patch dist/public_api.esm.js DONE');
