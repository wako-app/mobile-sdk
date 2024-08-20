import { ActionSheetController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  cloudDownloadOutline,
  copyOutline,
  listOutline,
  openOutline,
  shareOutline,
} from 'ionicons/icons';
import { NEVER } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { getEpisodeCode } from '../../tools/utils.tool';
import { ChromecastService } from '../chromecast/chromecast.service';
import { KodiAppService, KodiOpenParams, OpenMedia } from '../kodi/services/kodi-app.service';
import { WakoShare } from '../share/wako-share.service';
import { PlaylistVideo } from './../../entities/playlist-video';
import { PlaylistService } from './../playlist/playlist.service';
import { BrowserService } from './browser.service';
import { CAST_IMAGE, INFUSE_IMAGE, KODI_IMAGE, NPLAYER_IMAGE, VLC_IMAGE } from './images-base64';
import { WakoSettingsService } from './wako-settings.service';
import { WakoToastService } from './wako-toast.service';

export declare type WakoFileAction =
  | 'play-kodi'
  | 'copy-url'
  | 'play-vlc'
  | 'download-vlc'
  | 'share-url'
  | 'open-with'
  | 'play-nplayer'
  | 'play-infuse'
  | 'cast'
  | 'add-to-playlist';

export const WakoFileActionIos: WakoFileAction[] = [
  'copy-url',
  'download-vlc',
  'play-nplayer',
  'play-infuse',
  'share-url',
  'play-vlc',
  'play-kodi',
  'cast',
  'add-to-playlist',
];

export const WakoFileActionAndroid: WakoFileAction[] = [
  'copy-url',
  'share-url',
  'open-with',
  'play-vlc',
  'play-kodi',
  'cast',
  'add-to-playlist',
];

export const WakoDefaultFileActionIos: WakoFileAction[] = ['share-url', 'play-vlc', 'play-kodi', 'cast'];

export const WakoDefaultFileActionAndroid: WakoFileAction[] = [
  'share-url',
  'open-with',
  'play-vlc',
  'play-kodi',
  'cast',
  'add-to-playlist',
];

export interface WakoFileActionButton {
  action?: WakoFileAction;
  text: string;
  cssClass?: WakoFileAction;
  handler?: () => void;
  icon?: string;
  role?: string;
}

export class WakoFileActionSettings {
  useOriginalUrl = true;
  useOriginUrlForChromecast = false;
  actions: WakoFileAction[] = [];
}

export class WakoFileActionService {
  private settingsStorageCategory = 'wako_file_action_settings';

  constructor(
    private platform: Platform,
    private translateService: TranslateService,
    private actionSheetController: ActionSheetController,
    private toastService: WakoToastService,
    private playlistService: PlaylistService,
  ) {
    addIcons({ cloudDownloadOutline, copyOutline, listOutline, openOutline, shareOutline, closeOutline });
  }

  getAllActions() {
    return this.platform.is('ios') ? WakoFileActionIos : WakoFileActionAndroid;
  }

  getDefaultActions() {
    return this.platform.is('ios') ? WakoDefaultFileActionIos : WakoDefaultFileActionAndroid;
  }

  async getSettings() {
    let settings = await WakoSettingsService.getByCategory<WakoFileActionSettings>(this.settingsStorageCategory);

    if (!settings) {
      settings = new WakoFileActionSettings();
      settings.actions = this.getDefaultActions();
    }
    return settings;
  }

  async setSettings(settings: WakoFileActionSettings) {
    await WakoSettingsService.setByCategory(this.settingsStorageCategory, settings);
  }

  async openWithDefaultActions(
    link: string,
    streamLink?: string,
    title?: string,
    posterUrl?: string,
    seekTo?: number,
    openMedia?: OpenMedia,
    kodiOpenParams?: KodiOpenParams,
    excludeActions?: WakoFileAction[],
    playlistId?: string,
  ) {
    const buttons = await this.getFileActionButtons(
      link,
      streamLink,
      title,
      posterUrl,
      seekTo,
      openMedia,
      kodiOpenParams,
      null,
      excludeActions,
      playlistId,
    );

    return await this.showActionSheetActions(buttons);
  }

  async showActionSheetActions(buttons: WakoFileActionButton[]) {
    if (buttons.length === 1) {
      buttons[0].handler();
      return;
    }

    buttons.push({
      text: this.translateService.instant('shared.cancel'),
      icon: 'close-outline',
      role: 'cancel',
    });

    const actionSheet = await this.actionSheetController.create({
      header: this.translateService.instant('actionSheets.file-action.openTitle'),
      buttons: buttons,
    });

    buttons.forEach((button) => {
      if (button.action) {
        const imgUrl = this.getImageByAction(button.action);
        const node = document.querySelector('.' + button.cssClass + ' .action-sheet-button-inner');
        if (node) {
          node.innerHTML =
            `<img style="width: 24px; height: 24px;  margin-inline-end: 32px;" src="${imgUrl}"> ` + node.innerHTML;

          const icon = document.querySelector('.' + button.cssClass + ' ion-icon');
          icon.remove();
        }
      }
    });

    await actionSheet.present();
  }

  async getFileActionButtons(
    link: string,
    streamLink?: string,
    title?: string,
    posterUrl?: string,
    seekTo?: number,
    openMedia?: OpenMedia,
    kodiOpenParams?: KodiOpenParams,
    actions?: WakoFileAction[],
    excludeActions?: WakoFileAction[],
    playlistId?: string,
  ) {
    const settings = await this.getSettings();

    actions = actions ?? settings.actions;

    if (!streamLink) {
      streamLink = link;
    }

    if (!settings.useOriginalUrl) {
      const tempUrl = link;
      streamLink = link;
      link = tempUrl;
    }

    const buttons: WakoFileActionButton[] = [];

    actions.forEach((action) => {
      if (excludeActions && excludeActions.includes(action)) {
        return;
      }

      const fileActionButton: WakoFileActionButton = {
        action: action,
        text: this.translateService.instant('actionSheets.file-action.actions.' + action),
      };

      switch (action) {
        case 'copy-url':
          fileActionButton.role = 'copy-url';
          fileActionButton.icon = 'copy-outline';
          fileActionButton.handler = () => {
            const copyEl = document.querySelector('.action-sheet-copy-url');
            if (!copyEl) {
              return;
            }

            const ta = document.createElement('input');
            // Prevent zooming on iOS
            ta.style.fontSize = '12pt';
            // Reset box model
            ta.style.border = '0';
            ta.style.padding = '0';
            ta.style.margin = '0';
            // Move element out of screen horizontally
            ta.style.position = 'absolute';
            // Move element to the same position vertically
            const yPosition = window.pageYOffset || document.documentElement.scrollTop;
            ta.style.top = yPosition + 'px';
            ta.setAttribute('readonly', '');

            ta.value = link;

            copyEl.appendChild(ta);

            ta.select();

            document.execCommand('copy');

            ta.style.visibility = 'hidden';
          };
          break;

        case 'open-with':
          fileActionButton.icon = 'open-outline';
          fileActionButton.handler = () => this.openWith(link, title);
          break;

        case 'download-vlc':
          fileActionButton.icon = 'cloud-download-outline';
          fileActionButton.handler = () => this.downloadWithVlc(link);
          break;

        case 'play-vlc':
          fileActionButton.handler = () => this.playInVlc(link);
          break;

        case 'play-nplayer':
          fileActionButton.handler = () => this.playInNplayer(link);
          break;

        case 'play-kodi':
          fileActionButton.handler = () => this.playInKodi(link, openMedia, true, kodiOpenParams);
          break;

        case 'play-infuse':
          fileActionButton.handler = () => this.playInInfuse(link);
          break;

        case 'cast':
          const firstLink = settings.useOriginUrlForChromecast ? link : streamLink;
          const fallBackLink = settings.useOriginUrlForChromecast ? streamLink : link;

          fileActionButton.handler = () => this.cast(firstLink, title, posterUrl, seekTo, openMedia, fallBackLink);
          break;

        case 'share-url':
          fileActionButton.icon = 'share-outline';
          fileActionButton.handler = () => this.share(link, title);
          break;

        case 'add-to-playlist':
          fileActionButton.icon = 'list-outline';
          fileActionButton.handler = () => this.addToPlaylist(link, title, openMedia, posterUrl, playlistId);
          break;
      }

      buttons.push(fileActionButton);
    });

    buttons.forEach((button) => {
      if (!button.icon) {
        button.icon = 'arrow-dropright';
        button.cssClass = button.action;
      }
    });

    return buttons;
  }

  getImageByAction(action: WakoFileAction) {
    switch (action) {
      case 'play-vlc':
        return VLC_IMAGE;
      case 'play-kodi':
        return KODI_IMAGE;
      case 'play-nplayer':
        return NPLAYER_IMAGE;
      case 'play-infuse':
        return INFUSE_IMAGE;
      case 'cast':
        return CAST_IMAGE;
    }
  }

  playInKodi(url: string, openMedia?: OpenMedia, openKodiRemote = true, params?: KodiOpenParams) {
    return KodiAppService.checkAndConnectToCurrentHost()
      .pipe(
        catchError((err) => {
          if (err === 'hostUnreachable') {
            this.toastService.simpleMessage(
              'toasts.kodi.hostUnreachable',
              { hostName: KodiAppService.currentHost.name },
              2000,
            );
          } else {
            this.toastService.simpleMessage('toasts.kodi.noHost');
          }
          return NEVER;
        }),
        switchMap(() => {
          return KodiAppService.openUrl(url, openMedia, openKodiRemote, params);
        }),
      )
      .subscribe();
  }

  async playInVlc(link: string) {
    if (this.platform.is('ios')) {
      const url = `vlc-x-callback://x-callback-url/stream?url=${link}`;
      await BrowserService.open(url, false);
    } else {
      const url = `vlc://${link}`;
      await BrowserService.open(url, false);
    }
  }

  async downloadWithVlc(link: string) {
    if (this.platform.is('ios')) {
      const url = `vlc-x-callback://x-callback-url/download?url=${link}`;
      await BrowserService.open(url, false);
    }
  }

  async playInNplayer(link: string) {
    if (!this.platform.is('ios')) {
      return;
    }
    const url = `nplayer-${link}`;
    await BrowserService.open(url, false);
  }

  async playInInfuse(link: string) {
    if (!this.platform.is('ios')) {
      return;
    }
    const url = `infuse://x-callback-url/play?url=${encodeURIComponent(link)}`;
    await BrowserService.open(url, false);
  }

  async cast(
    link: string,
    title?: string,
    posterUrl?: string,
    seekTo?: number,
    openMedia?: OpenMedia,
    fallBackLink?: string,
  ) {
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

  share(link: string, title: string) {
    WakoShare.share({
      dialogTitle: title,
      text: title,
      url: link,
      title,
    });
  }

  openWith(url: string, title: string) {
    if (window['plugins'] && window['plugins'].intentShim) {
      const intentShim: any = window['plugins'].intentShim;

      intentShim.startActivity(
        {
          action: window['plugins'].intentShim.ACTION_VIEW,
          type: 'video/*',
          url: url,
          extras: {
            title: title,
          },
        },
        () => console.log('intentShim success'),
        (err) => console.log('intentShim err', err),
      );
    }
  }

  async addToPlaylist(url: string, title: string, openMedia?: OpenMedia, poster?: string, playlistId?: string) {
    if (!playlistId) {
      playlistId = openMedia ? this.playlistService.getPlaylistIdFromOpenMedia(openMedia) : title;
    }

    let playlist = await this.playlistService.get(playlistId);

    let playlistLabel = title;
    if (openMedia && openMedia.seasonNumber) {
      const episodeCode = getEpisodeCode(openMedia.seasonNumber, openMedia.episodeNumber);
      if (playlistLabel.match(episodeCode) !== null) {
        playlistLabel = playlistLabel.replace(getEpisodeCode(openMedia.seasonNumber, openMedia.episodeNumber), '');
        playlistLabel += ' ' + getEpisodeCode(openMedia.seasonNumber);
      }
    }
    const playlistVideo: PlaylistVideo = {
      url: url,
      label: title,
      currentSeconds: 0,
      openMedia: openMedia,
    };

    if (playlist) {
      this.playlistService.addPlaylistItems(playlistId, [playlistVideo], true);
    } else {
      playlist = {
        id: playlistId,
        label: playlistLabel,
        currentItem: 0,
        poster: poster,
        updatedAt: new Date().toISOString(),
        items: [playlistVideo],
      };
      this.playlistService.addOrUpdate(playlist, true);
    }

    this.toastService.simpleMessage('toasts.playlist-add');
  }
}
