import { Provider } from '@angular/core';
import { WakoToastService } from './services/app/wako-toast.service';
import { ActionSheetController, Platform, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { WakoFileActionService } from './services/app/wako-file-action.service';
import { PlaylistService } from './services/playlist/playlist.service';
import { Storage } from '@ionic/storage';

let wakoToastServiceInst: WakoToastService = null;
let wakoFileActionServiceInst: WakoFileActionService = null;

export const WakoProviders: Provider[] = [
  {
    provide: PlaylistService,
    useFactory: (storage: Storage) => {
      PlaylistService.initialize(storage);
      return PlaylistService.getInstance();
    },
    deps: [Storage],
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
