export interface KodiHostStructure {
  name: string;
  host: string;
  port: number;
  wsPort?: number;
  login?: string;
  password?: string;
  uuid?: string;
}
