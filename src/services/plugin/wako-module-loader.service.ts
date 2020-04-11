import { Injector, ɵcreateInjector as createInjector } from "@angular/core";
import { PLUGIN_EXTERNALS_MAP } from "./plugin-externals";
import { from } from "rxjs";
import { map } from "rxjs/operators";

const SystemJs = window.System;

let _source: string;

// Hack
SystemJs.instantiate = function (id) {
  const loader = this;

  if (this.registerRegistry[id]) {
    return this.registerRegistry[id];
  }
  return new Promise((resolve, reject) => {
    try {
      (0, eval)(_source + "\n//# sourceURL=" + "fakeUrl");
      resolve(loader.getRegister());
    } catch (e) {
      reject(e);
    }
  });
};

export class WakoModuleLoaderService {
  constructor(private injector: Injector) {
    this.provideExternals();
  }

  private provideExternals() {
    Object.keys(PLUGIN_EXTERNALS_MAP).forEach((externalKey) =>
      window.define(externalKey, [], () => PLUGIN_EXTERNALS_MAP[externalKey])
    );
  }

  load(source: string, id: string, isFirstLoad: boolean) {
    _source = source;

    return from(SystemJs.import(document.location.href + "/" + id)).pipe(
      map((module) => {
        return this.initialize(module.default.default, isFirstLoad);
      })
    );
  }

  private initialize(moduleType: any, isFirstLoad: boolean) {
    const injector = createInjector(moduleType, this.injector);

    const pluginService = injector.get(moduleType.pluginService);

    pluginService.initialize();

    if (isFirstLoad) {
      pluginService.afterInstall();
    }

    return { moduleType, injector };
  }

  getPluginService(moduleType, injector) {
    return injector.get(moduleType.pluginService);
  }
}
