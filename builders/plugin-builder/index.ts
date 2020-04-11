import {
  BrowserBuilderOutput,
  executeBrowserBuilder,
  ExecutionTransformer,
} from "@angular-devkit/build-angular";
import { JsonObject } from "@angular-devkit/core";
import { BuilderContext, createBuilder } from "@angular-devkit/architect";
import * as fs from "fs";
import * as webpack from "webpack";
import { tap } from "rxjs/operators";
import { Observable } from "rxjs";

let entryPointPath;

function buildPlugin(
  options: JsonObject,
  context: BuilderContext,
  transforms: {
    webpackConfiguration?: ExecutionTransformer<webpack.Configuration>;
  } = {}
): Observable<BrowserBuilderOutput> {
  if (!context.getProjectMetadata) {
    context.getProjectMetadata = () => {
      return Promise.resolve({
        root: "projects/plugin/",
        sourceRoot: "projects/plugin/src",
        prefix: "app",
        projectType: "application",
        schematics: {},
      });
    };
  }

  options.deleteOutputPath = false;

  const originalWebpackConfigurationFn = transforms.webpackConfiguration;
  transforms.webpackConfiguration = (config: webpack.Configuration) => {
    patchWebpackConfig(config);

    return originalWebpackConfigurationFn
      ? originalWebpackConfigurationFn(config)
      : config;
  };

  const result = executeBrowserBuilder(options as any, context, transforms);

  return result.pipe(
    tap(() => {
      patchEntryPoint("");
    })
  );
}

function patchEntryPoint(contents: string) {
  fs.writeFileSync(entryPointPath, contents);
}

function patchWebpackConfig(config: webpack.Configuration) {
  const pluginName = "plugin";
  const moduleFullPath = "./plugin/plugin.module#PluginModule";

  // Make sure we are producing a single bundle
  delete config.entry.polyfills;
  delete config.entry["polyfills-es5"];
  delete config.optimization.runtimeChunk;
  delete config.optimization.splitChunks;
  delete config.entry.styles;

  config.externals = {
    rxjs: "rxjs",
    "@angular/core": "ng.core",
    "@angular/common": "ng.common",
    "@angular/forms": "ng.forms",
    "@angular/router": "ng.router",
    tslib: "tslib",
    // put here other common dependencies
    "@ionic/angular": "ionic.angular",
    "@ionic/storage": "ionic.storage",
    "@wako-app/mobile-sdk": "wako-app.mobile-sdk",
    "@ngx-translate/core": "ngx-translate.core",
  };

  const ngCompilerPluginInstance = config.plugins.find(
    (x) => x.constructor && x.constructor.name === "AngularCompilerPlugin"
  );
  if (ngCompilerPluginInstance) {
    ngCompilerPluginInstance._entryModule = moduleFullPath;
  }

  // preserve path to entry point
  // so that we can clear use it within `run` method to clear that file
  entryPointPath = config.entry.main[0];

  const [modulePath, moduleName] = moduleFullPath.split("#");

  // const factoryPath = `${
  //   modulePath.includes('.') ? modulePath : `${modulePath}/${modulePath}`
  // }.ngfactory`;
  const entryPointContents = `
       export * from '${modulePath}';
    import { ${moduleName} } from '${modulePath}';
    export default ${moduleName};
    `;
  patchEntryPoint(entryPointContents);

  config.output.filename = `${pluginName}.js`;
  config.output.library = pluginName;
  config.output.libraryTarget = "umd";
  // workaround to support bundle on nodejs
  config.output.globalObject = `(typeof self !== 'undefined' ? self : this)`;
}

export default createBuilder<JsonObject>(buildPlugin);
