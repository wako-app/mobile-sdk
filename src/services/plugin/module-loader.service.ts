import { Injectable, Injector, NgModuleFactory } from '@angular/core';
import { PLUGIN_EXTERNALS_MAP } from './plugin-externals';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { PluginBaseService } from './plugin-base.service';

const SystemJs = window.System;

let _source: string;

// Hack
SystemJs.instantiate = function(id) {
  const loader = this;

  if (this.registerRegistry[id]) {
    return this.registerRegistry[id];
  }
  return new Promise((resolve, reject) => {
    try {
      (0, eval)(_source + '\n//# sourceURL=' + 'fakeUrl');
      resolve(loader.getRegister());
    } catch (e) {
      reject(e);
    }
  });
};

@Injectable()
export class ModuleLoaderService {
  constructor(private injector: Injector) {
    this.provideExternals();
  }

  private provideExternals() {
    Object.keys(PLUGIN_EXTERNALS_MAP).forEach(externalKey =>
      window.define(externalKey, [], () => PLUGIN_EXTERNALS_MAP[externalKey])
    );
  }

  load(source: string, id: string, isFirstLoad: boolean) {
    _source = source;

    return from(SystemJs.import(document.location.href + '/' + id)).pipe(
      map(module => {
        return this.initialize(module.default.default, isFirstLoad);
      })
    );
  }

  private initialize(
    moduleFactory: NgModuleFactory<any>,
    isFirstLoad: boolean
  ) {
    const moduleType = moduleFactory.moduleType as any;

    const moduleRef = moduleFactory.create(this.injector);

    const pluginService = moduleRef.injector.get(
      moduleType.pluginService
    ) as PluginBaseService;

    pluginService.initialize();

    if (isFirstLoad) {
      pluginService.afterInstall();
    }

    return { moduleFactory, moduleRef };
  }
}
