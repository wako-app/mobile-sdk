import { EnvironmentProviders, inject, makeEnvironmentProviders, Provider } from '@angular/core';
import { ActionSheetController, Platform, ToastController } from '@ionic/angular';
import { StorageConfig, StorageConfigToken } from '@ionic/storage-angular';
import { TranslateService } from '@ngx-translate/core';
import { WakoFileActionService } from './services/app/wako-file-action.service';
import { WakoToastService } from './services/app/wako-toast.service';
import { PlaylistService } from './services/playlist/playlist.service';
import { WakoStorage } from './services/storage/wako-storage.service';

// Configuration interface
export interface WakoSdkConfig {
  isTvLayout: boolean;
}

// Create a token for the config
import { InjectionToken } from '@angular/core';
import { WakoGlobal } from './services/wako-global';
export const WAKO_SDK_CONFIG = new InjectionToken<WakoSdkConfig>('WAKO_SDK_CONFIG');

// Singleton instances
let wakoToastServiceInst: WakoToastService | null = null;
let wakoFileActionServiceInst: WakoFileActionService | null = null;

function provideStorage(storageConfig: StorageConfig) {
  return new WakoStorage(storageConfig);
}

export const WakoProviders: Provider[] = [
  {
    provide: WakoStorage,
    useFactory: provideStorage,
    deps: [StorageConfigToken],
  },
  {
    provide: PlaylistService,
    useFactory: (storage: WakoStorage) => {
      PlaylistService.initialize(storage);
      return PlaylistService.getInstance();
    },
    deps: [WakoStorage],
  },
  {
    provide: WakoToastService,
    useFactory: (toastCtrl: ToastController, translateService: TranslateService) => {
      if (!wakoToastServiceInst) {
        wakoToastServiceInst = new WakoToastService(toastCtrl, translateService);
      }
      return wakoToastServiceInst;
    },
    deps: [ToastController, TranslateService],
  },
  {
    provide: WakoFileActionService,
    useFactory: (
      platform: Platform,
      translateService: TranslateService,
      actionSheetController: ActionSheetController,
      toastService: WakoToastService,
      playlistService: PlaylistService,
    ) => {
      if (!wakoFileActionServiceInst) {
        wakoFileActionServiceInst = new WakoFileActionService(
          platform,
          translateService,
          actionSheetController,
          toastService,
          playlistService,
        );
      }
      return wakoFileActionServiceInst;
    },
    deps: [Platform, TranslateService, ActionSheetController, WakoToastService, PlaylistService],
  },
];

export function provideWakoSdk(config?: WakoSdkConfig): EnvironmentProviders {
  const providers: Provider[] = [...WakoProviders];

  if (config) {
    WakoGlobal.isTvLayout = config.isTvLayout;
  }

  return makeEnvironmentProviders(providers);
}
