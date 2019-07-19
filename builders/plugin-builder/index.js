'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const build_angular_1 = require('@angular-devkit/build-angular');
const fs = require('fs');
const operators_1 = require('rxjs/operators');
class PluginBuilder extends build_angular_1.BrowserBuilder {
  patchEntryPoint(contents) {
    fs.writeFileSync(this.entryPointPath, contents);
  }
  buildWebpackConfig(root, projectRoot, host, options) {
    const pluginName = 'plugin';
    const moduleFullPath = './plugin/plugin.module#PluginModule';
    if (!pluginName) {
      throw Error('Please provide pluginName!');
    }
    const config = super.buildWebpackConfig(root, projectRoot, host, options);
    // Make sure we are producing a single bundle
    delete config.entry.polyfills;
    delete config.optimization.runtimeChunk;
    delete config.optimization.splitChunks;
    delete config.entry.styles;
    config.externals = {
      rxjs: 'rxjs',
      'rxjs/operators': 'rxjs.operators',
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
    this.entryPointPath = config.entry.main[0];
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
    this.patchEntryPoint(entryPointContents);
    config.output.filename = `${pluginName}.js`;
    config.output.library = pluginName;
    config.output.libraryTarget = 'umd';
    // workaround to support bundle on nodejs
    config.output.globalObject = `(typeof self !== 'undefined' ? self : this)`;
    return config;
  }
  run(builderConfig) {
    // this.options = builderConfig.options;
    // I don't want to write it in my scripts every time so I keep it here
    builderConfig.options.deleteOutputPath = false;
    return super.run(builderConfig).pipe(
      operators_1.tap(() => {
        // clear entry point so our main.ts is always empty
        this.patchEntryPoint('');
      })
    );
  }
}
exports.default = PluginBuilder;
// Angular 8
/*
import { BrowserBuilderOutput, executeBrowserBuilder, ExecutionTransformer } from '@angular-devkit/build-angular';
import { JsonObject } from '@angular-devkit/core';
import { createBuilder, BuilderContext } from '@angular-devkit/architect';
import * as fs from 'fs';
import * as webpack from 'webpack';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

const manifest = require('../../projects/plugin/src/manifest.json');

let entryPointPath;

function buildPlugin(options: JsonObject,
                     context: BuilderContext,
                     transforms: {
                       webpackConfiguration?: ExecutionTransformer<webpack.Configuration>,
                     } = {}): Observable<BrowserBuilderOutput> {
  options.deleteOutputPath = false;

  const originalWebpackConfigurationFn = transforms.webpackConfiguration;
  transforms.webpackConfiguration = (config: webpack.Configuration) => {
    patchWebpackConfig(config, options);

    return originalWebpackConfigurationFn ? originalWebpackConfigurationFn(config) : config;
  };

  const result = executeBrowserBuilder(options as any, context, transforms);

  return result.pipe(tap(() => {
    patchEntryPoint('');
  }));
}

function patchEntryPoint(contents: string) {
  fs.writeFileSync(entryPointPath, contents);
}

function patchWebpackConfig(config: webpack.Configuration, options: JsonObject) {

  const pluginName = manifest.id;

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
    '@wako-app/mobile-sdk': 'wako.mobile-sdk'
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

export default createBuilder<JsonObject>(buildPlugin);
 */
