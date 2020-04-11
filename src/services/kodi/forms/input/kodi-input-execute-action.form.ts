import { KodiApiService } from "../../services/kodi-api.service";

export class KodiInputExecuteActionForm {
  static submit(action: string) {
    return KodiApiService.doHttpAction("Input.ExecuteAction", {
      action: action,
    });
  }
}
