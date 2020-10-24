import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

export class WakoToastService {
  constructor(private toastCtrl: ToastController, private translateService: TranslateService) {}

  simpleMessage(translateKey: string, interpolateParams?: any, duration = 2000, position = 'top') {
    const message = this.translateService.instant(translateKey, interpolateParams);

    this.toastCtrl
      .create({
        message: message,
        mode: 'ios',
        position: position as any,
        duration: duration,
      })
      .then((alert) => {
        alert.present();
      });
  }
}
