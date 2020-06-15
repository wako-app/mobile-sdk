import { Provider } from '@angular/core';
import { WakoToastService } from './services/app/wako-toast.service';
import { ActionSheetController, Platform, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { WakoFileActionService } from './services/app/wako-file-action.service';
import { PlaylistService } from './services/playlist/playlist.service';
import { Storage } from '@ionic/storage';

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
    useClass: WakoToastService,
    deps: [ToastController, TranslateService],
  },
  {
    provide: WakoFileActionService,
    useClass: WakoFileActionService,
    deps: [Platform, TranslateService, ActionSheetController, WakoToastService],
  },
];
