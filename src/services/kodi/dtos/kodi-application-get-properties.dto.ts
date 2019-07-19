export interface KodiApplicationGetPropertiesDto {
  muted: boolean;
  version: { major: number; minor: number; revision: string; tag: string };
  volume: 100;
}
