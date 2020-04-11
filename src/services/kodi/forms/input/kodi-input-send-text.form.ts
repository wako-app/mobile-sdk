import { KodiApiService } from "../../services/kodi-api.service";

export class KodiInputSendTextForm {
  static submit(text: string) {
    return KodiApiService.doHttpAction("Input.SendText", {
      text: text,
    });
  }
}
