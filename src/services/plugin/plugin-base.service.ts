export abstract class PluginBaseService {
  /**
   * when wako initialize the plugin when the app starts
   */
  abstract initialize();

  /**
   * Set the app translation
   *
   * @param lang
   * @param translations
   */
  abstract setTranslation(lang: string, translations: Object);

  /**
   * Called once, after the plugin has been installed
   */
  abstract afterInstall();

  /**
   * Custom action to be called from outside
   */
  abstract customAction(action: string, data: any);
}
