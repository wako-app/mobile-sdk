import { StorageConfig, StorageConfigToken } from '@ionic/storage';

import { Provider } from '@angular/core';
import { ActionSheetController, Platform, ToastController } from '@ionic/angular';

import { TranslateService } from '@ngx-translate/core';
import { WakoFileActionService } from './services/app/wako-file-action.service';
import { WakoToastService } from './services/app/wako-toast.service';
import { PlaylistService } from './services/playlist/playlist.service';
import { WakoStorage } from './services/storage/wako-storage.service';

let wakoToastServiceInst: WakoToastService = null;
let wakoFileActionServiceInst: WakoFileActionService = null;

export const provideStorage = (storageConfig: StorageConfig) => {
  return new WakoStorage(storageConfig);
};

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
      playlistService: PlaylistService
    ) => {
      if (!wakoFileActionServiceInst) {
        wakoFileActionServiceInst = new WakoFileActionService(
          platform,
          translateService,
          actionSheetController,
          toastService,
          playlistService
        );
      }
      return wakoFileActionServiceInst;
    },
    deps: [Platform, TranslateService, ActionSheetController, WakoToastService, PlaylistService],
  },
];
