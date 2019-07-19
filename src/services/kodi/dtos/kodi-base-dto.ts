export interface KodiBaseDto<T> {
  id: number;
  jsonrpc: string;
  result: T;
}
