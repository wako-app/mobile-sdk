declare const SafariViewController: any;
declare const cordova: any;

export class BrowserService {
  static open(url: string, useSafariController = true) {
    if (!useSafariController || typeof SafariViewController === 'undefined') {
      cordova.InAppBrowser.open(url, '_system', 'location=yes');
      return;
    }

    const isDarkMode = document.body.classList.contains('dark');

    SafariViewController.isAvailable((available) => {
      if (available) {
        SafariViewController.show({
          url: url,
          hidden: false,
          animated: true,
          transition: 'curl',
          enterReaderModeIfAvailable: false,
          barColor: isDarkMode ? '#000000' : '#1f2d3f',
          tintColor: isDarkMode ? '#000000' : '#1f2d3f',
          controlTintColor: '#ffffff',
        });
      } else {
        cordova.InAppBrowser.open(url, '_system', 'location=yes');
      }
    });
  }
}
