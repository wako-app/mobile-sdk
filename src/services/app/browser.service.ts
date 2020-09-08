import { Plugins } from '@capacitor/core';

const { Browser, App } = Plugins;

export class BrowserService {
  static async open(url: string, useInAppBrowser = true) {
    if (!useInAppBrowser) {
      App.openUrl({
        url: url,
      });
      return;
    }

    const isDarkMode = document.body.classList.contains('dark');

    await Browser.open({ url: url, toolbarColor: isDarkMode ? '#000000' : '#1f2d3f' });
  }
}
