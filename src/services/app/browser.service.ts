import { AppLauncher } from '@capacitor/app-launcher';
import { Browser } from '@capacitor/browser';

export class BrowserService {
  static async open(url: string, useInAppBrowser = true) {
    if (!useInAppBrowser) {
      await AppLauncher.openUrl({
        url: url,
      });
      return;
    }

    const isDarkMode = document.body.classList.contains('dark');

    await Browser.open({ url: url, toolbarColor: isDarkMode ? '#000000' : '#1f2d3f' });
  }
}
