import { BrowserService } from '../app/browser.service';
import { ChromecastService } from '../chromecast/chromecast.service';
import { OpenMedia } from '../kodi/services/kodi-app.service';

export class WakoPlayWithService {
  static async playInVlc({
    isIos,
    link,
    title,
    seekTo,
    openMedia,
    posterUrl,
  }: {
    isIos: boolean;
    link: string;
    title?: string;
    seekTo?: number;
    openMedia?: OpenMedia;
    posterUrl?: string;
  }) {
    if (isIos) {
      const url = `vlc-x-callback://x-callback-url/stream?url=${link}&title=${title}&seekTo=${seekTo}`;
      await BrowserService.open(url, false);
    } else {
      const url = `vlc://${link}?title=${title}&seekTo=${seekTo}`;
      await BrowserService.open(url, false);
    }
  }

  static async downloadWithVlc({ isIos, link }: { isIos: boolean; link: string }) {
    if (isIos) {
      const url = `vlc-x-callback://x-callback-url/download?url=${link}`;
      await BrowserService.open(url, false);
    }
  }

  static async playInNplayer({ isIos, link }: { isIos: boolean; link: string }) {
    if (isIos) {
      const url = `nplayer-${link}`;
      await BrowserService.open(url, false);
    }
  }

  static async playInInfuse({ isIos, link }: { isIos: boolean; link: string }) {
    if (isIos) {
      const url = `infuse://x-callback-url/play?url=${link}`;
      await BrowserService.open(url, false);
    }
  }

  static async playInOutplayer({ isIos, link }: { isIos: boolean; link: string }) {
    if (isIos) {
      const url = `outplayer://${link}`;
      await BrowserService.open(url, false);
    }
  }

  static async openWith({ url, title, seekTo }: { url: string; title: string; seekTo?: number }) {
    if (window['plugins'] && window['plugins'].intentShim) {
      const intentShim: any = window['plugins'].intentShim;

      intentShim.startActivity(
        {
          action: window['plugins'].intentShim.ACTION_VIEW,
          type: 'video/*',
          url: url,
          extras: {
            title: title,
            position: seekTo,
          },
        },
        () => console.log('intentShim success'),
        (err) => console.log('intentShim err', err),
      );
    }
  }

  static async cast({
    link,
    title,
    posterUrl,
    seekTo,
    openMedia,
    fallBackLink,
  }: {
    link: string;
    title?: string;
    posterUrl?: string;
    seekTo?: number;
    openMedia?: OpenMedia;
    fallBackLink?: string;
  }) {
    ChromecastService.openUrl(title || '', link, posterUrl || null, openMedia).subscribe(
      () => {
        if (seekTo > 0 && ChromecastService.media) {
          ChromecastService.seek(seekTo);
        }
      },
      (err) => {
        if (fallBackLink) {
          ChromecastService.openUrl(title, fallBackLink, posterUrl || null, openMedia).subscribe(() => {
            if (seekTo > 0 && ChromecastService.media) {
              ChromecastService.seek(seekTo);
            }
          });
        }
      },
    );
  }
}
