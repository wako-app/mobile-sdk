export interface PluginBaseModuleInt {
  movieComponent?: any;

  episodeComponent?: any;

  episodeItemOptionComponent?: any;

  showComponent?: any;

  settingsComponent?: any;

  pluginDetailComponent?: any;

  pluginService?: any;
}

export abstract class PluginBaseModule implements PluginBaseModuleInt {
  static movieComponent?: any;

  static episodeComponent?: any;

  static episodeItemOptionComponent?: any;

  static showComponent?: any;

  static settingsComponent?: any;

  static pluginDetailComponent?: any;

  static pluginService?: any;
}
