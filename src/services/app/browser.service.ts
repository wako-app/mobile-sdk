import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';

declare const SafariViewController: any;

@Injectable()
export class BrowserService {
  constructor(private platform: Platform) {}

  open(url: string, useSafariController = true) {
    if (this.platform.is('cordova') === false || !useSafariController) {
      window.open(url, '_system', 'location=yes');
      return;
    }

    SafariViewController.isAvailable(available => {
      if (available) {
        SafariViewController.show({
          url: url,
          hidden: false,
          animated: true,
          transition: 'curl',
          enterReaderModeIfAvailable: false,
          barColor: '#1f2d3f',
          tintColor: '#1f2d3f',
          controlTintColor: '#ffffff'
        });
      } else {
        window.open(url, '_system', 'location=yes');
      }
    });
  }
}
