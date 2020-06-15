import { ExplorerFile } from './explorer-file';
import { Observable } from 'rxjs';

export interface ExplorerItem {
  id: string;
  pluginId: string;
  label: string;
  type: 'file' | 'folder';
  createdAt?: string;
  poster?: string;
  file?: ExplorerFile;
  fetchChildren?: Observable<ExplorerFolderItem>;
  deleteAction?: Observable<boolean>;
}

export interface ExplorerFolderItem {
  isRoot: boolean;
  label: string;
  parentId: string;
  folderId: string;
  items: ExplorerItem[];
  goToParentAction?: Observable<ExplorerFolderItem>;
}
