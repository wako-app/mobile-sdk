import { WakoBaseHttpService } from './wako-base-http.service';
import { throwError } from 'rxjs';

export class WakoHttpRequestService extends WakoBaseHttpService {
  static unHandleError(err) {
    return throwError(err);
  }
}
