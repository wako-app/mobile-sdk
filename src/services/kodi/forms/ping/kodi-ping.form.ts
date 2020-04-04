import { KodiApiService } from "../../services/kodi-api.service";

export class KodiPingForm {
  static submit() {
    return KodiApiService.doHttpAction<string>("JSONRPC.Ping", null, 1000);
  }
}
