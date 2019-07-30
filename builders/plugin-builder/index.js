'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const build_angular_1 = require('@angular-devkit/build-angular');
const architect_1 = require('@angular-devkit/architect');
const fs = require('fs');
const operators_1 = require('rxjs/operators');
let entryPointPath;
function buildPlugin(options, context, transforms = {}) {
  options.deleteOutputPath = false;
  const originalWebpackConfigurationFn = transforms.webpackConfiguration;
  transforms.webpackConfiguration = config => {
    patchWebpackConfig(config);
    return originalWebpackConfigurationFn
      ? originalWebpackConfigurationFn(config)
      : config;
  };
  const result = build_angular_1.executeBrowserBuilder(
    options,
    context,
    transforms
  );
  return result.pipe(
    operators_1.tap(() => {
      patchEntryPoint('');
    })
  );
}
function patchEntryPoint(contents) {
  fs.writeFileSync(entryPointPath, contents);
}
function patchWebpackConfig(config) {
  const pluginName = 'plugin';
  const moduleFullPath = './plugin/plugin.module#PluginModule';
  // Make sure we are producing a single bundle
  delete config.entry.polyfills;
  delete config.entry['polyfills-es5'];
  delete config.optimization.runtimeChunk;
  delete config.optimization.splitChunks;
  delete config.entry.styles;
  config.externals = {
    rxjs: 'rxjs',
    '@angular/core': 'ng.core',
    '@angular/common': 'ng.common',
    '@angular/forms': 'ng.forms',
    '@angular/router': 'ng.router',
    tslib: 'tslib',
    // put here other common dependencies
    '@ionic/angular': 'ionic.angular',
    '@ionic/storage': 'ionic.storage',
    '@wako-app/mobile-sdk': 'wako-app.mobile-sdk',
    '@ngx-translate/core': 'ngx-translate.core'
  };
  const ngCompilerPluginInstance = config.plugins.find(
    x => x.constructor && x.constructor.name === 'AngularCompilerPlugin'
  );
  if (ngCompilerPluginInstance) {
    ngCompilerPluginInstance._entryModule = moduleFullPath;
  }
  // preserve path to entry point
  // so that we can clear use it within `run` method to clear that file
  entryPointPath = config.entry.main[0];
  const [modulePath, moduleName] = moduleFullPath.split('#');
  const factoryPath = `${
    modulePath.includes('.') ? modulePath : `${modulePath}/${modulePath}`
  }.ngfactory`;
  const entryPointContents = `
       export * from '${modulePath}';
       export * from '${factoryPath}';
       import { ${moduleName}NgFactory } from '${factoryPath}';
       export default ${moduleName}NgFactory;
    `;
  patchEntryPoint(entryPointContents);
  config.output.filename = `${pluginName}.js`;
  config.output.library = pluginName;
  config.output.libraryTarget = 'umd';
  // workaround to support bundle on nodejs
  config.output.globalObject = `(typeof self !== 'undefined' ? self : this)`;
}
exports.default = architect_1.createBuilder(buildPlugin);
