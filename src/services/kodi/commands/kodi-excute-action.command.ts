import { KodiInputExecuteActionForm } from '../forms/input/kodi-input-execute-action.form';

export class KodiExcuteActionCommand {
  static handle(action: string) {
    return KodiInputExecuteActionForm.submit(action);
  }
}
