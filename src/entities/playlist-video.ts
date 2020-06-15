import { OpenMedia } from '../services/kodi/services/kodi-app.service';
import { ExplorerFile } from './explorer/explorer-file';

export interface PlaylistVideo {
  url: string;
  label: string;
  currentSeconds: number;
  totalSeconds?: number;
  openMedia?: OpenMedia;
  pluginId?: string;
  customData?: any;
  file?: ExplorerFile;
}
