import { ActionSheetController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  cloudDownloadOutline,
  copyOutline,
  listOutline,
  openOutline,
  playCircleOutline,
  shareOutline,
} from 'ionicons/icons';
import { NEVER } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { getEpisodeCode } from '../../tools/utils.tool';
import { KodiAppService, KodiOpenParams, OpenMedia } from '../kodi/services/kodi-app.service';
import { WakoShare } from '../share/wako-share.service';
import { PlaylistVideo } from './../../entities/playlist-video';
import { PlaylistService } from './../playlist/playlist.service';
import { CAST_IMAGE, INFUSE_IMAGE, KODI_IMAGE, NPLAYER_IMAGE, OUTPLAYER_IMAGE, VLC_IMAGE } from './images-base64';
import { WakoSettingsService } from './wako-settings.service';
import { WakoToastService } from './wako-toast.service';

import { WakoPlayWithService } from '../play-with/wako-play-with.service';
import { WakoGlobal } from '../wako-global';
import { WakoVideoPlayerService } from '../wako-video-player.service';

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
  | 'add-to-playlist'
  | 'wako-video-player'
  | 'play-outplayer';

export const WakoFileActionIos: WakoFileAction[] = [
  'wako-video-player',
  'copy-url',
  'download-vlc',
  'play-nplayer',
  'play-infuse',
  'share-url',
  'play-vlc',
  'play-kodi',
  'cast',
  'add-to-playlist',
  'play-outplayer',
];

export const WakoFileActionAndroid: WakoFileAction[] = [
  'wako-video-player',
  'copy-url',
  'share-url',
  'open-with',
  'play-vlc',
  'play-kodi',
  'cast',
  'add-to-playlist',
];

export const WakoFileActionAndroidTv: WakoFileAction[] = [
  'wako-video-player',
  'play-vlc',
  'open-with',
  'add-to-playlist',
];

export const WakoDefaultFileActionIos: WakoFileAction[] = ['wako-video-player', 'share-url'];

export const WakoDefaultFileActionAndroid: WakoFileAction[] = ['wako-video-player', 'share-url', 'open-with'];

export const WakoFileActionAndroidTvDefault: WakoFileAction[] = ['wako-video-player'];

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
  private settingsStorageCategoryTv = 'wako_file_action_settings_tv';

  constructor(
    private platform: Platform,
    private translateService: TranslateService,
    private actionSheetController: ActionSheetController,
    private toastService: WakoToastService,
    private playlistService: PlaylistService,
  ) {
    if (WakoGlobal.isTvLayout) {
      this.settingsStorageCategory = this.settingsStorageCategoryTv;
    }
    addIcons({
      cloudDownloadOutline,
      copyOutline,
      listOutline,
      openOutline,
      shareOutline,
      closeOutline,
      playCircleOutline,
    });
  }

  getAllActions() {
    if (WakoGlobal.isTvLayout) {
      return WakoFileActionAndroidTv;
    }
    return this.platform.is('ios') ? WakoFileActionIos : WakoFileActionAndroid;
  }

  getDefaultActions() {
    if (WakoGlobal.isTvLayout) {
      return WakoFileActionAndroidTvDefault;
    }
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
          fileActionButton.handler = () =>
            WakoPlayWithService.openWith({
              url: link,
              title,
              seekTo,
            });
          break;

        case 'download-vlc':
          fileActionButton.icon = 'cloud-download-outline';
          fileActionButton.handler = () =>
            WakoPlayWithService.downloadWithVlc({
              isIos: this.platform.is('ios'),
              link,
            });
          break;

        case 'play-vlc':
          fileActionButton.handler = () =>
            WakoPlayWithService.playInVlc({
              isIos: this.platform.is('ios'),
              link,
              title,
              seekTo,
              openMedia,
              posterUrl,
            });
          break;

        case 'play-nplayer':
          fileActionButton.handler = () =>
            WakoPlayWithService.playInNplayer({
              isIos: this.platform.is('ios'),
              link,
            });
          break;

        case 'play-kodi':
          fileActionButton.handler = () => this.playInKodi(link, openMedia, true, kodiOpenParams);
          break;

        case 'play-infuse':
          fileActionButton.handler = () =>
            WakoPlayWithService.playInInfuse({
              isIos: this.platform.is('ios'),
              link,
            });
          break;

        case 'play-outplayer':
          fileActionButton.handler = () =>
            WakoPlayWithService.playInOutplayer({
              isIos: this.platform.is('ios'),
              link,
            });
          break;

        case 'cast':
          const firstLink = settings.useOriginUrlForChromecast ? link : streamLink;
          const fallBackLink = settings.useOriginUrlForChromecast ? streamLink : link;

          fileActionButton.handler = () =>
            WakoPlayWithService.cast({ link: firstLink, title, posterUrl, seekTo, openMedia, fallBackLink });
          break;

        case 'share-url':
          fileActionButton.icon = 'share-outline';
          fileActionButton.handler = () =>
            WakoShare.share({
              dialogTitle: title,
              text: title,
              url: link,
              title,
            });
          break;

        case 'add-to-playlist':
          fileActionButton.icon = 'list-outline';
          fileActionButton.handler = () => this.addToPlaylist(link, title, openMedia, posterUrl, playlistId);
          break;

        case 'wako-video-player':
          fileActionButton.icon = 'play-circle-outline';
          fileActionButton.handler = () =>
            WakoVideoPlayerService.openVideoUrl({
              videoUrl: link,
              startAt: seekTo,
              openMedia,
              title,
              poster: posterUrl,
            });
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
      case 'play-outplayer':
        return OUTPLAYER_IMAGE;
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
