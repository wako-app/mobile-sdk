Official SDK used by [wako](https://wako.app) and its wako add-ons

If you want to create your own add-on, take a look at the example of the [add-on starter kit](https://github.com/wako-app/addon-starter-kit)

## Migration to v3

Version v3 is now based on Angular 9 and will only work on wako v4+.

Plugins must upgrade to version v3 to be compatible with the latest version of wako.

To maintain compatibility with both old and new versions of wako, a new `entryPointV2` property
has been added to the plugin manifest.
Keep the old entryPoint pointing to the old version of your plugin for the old version of wako (< 4) and
the new entryPointV2 for the new version of wako.

For recent plugins compatible only with wako 4+ you don't need to fill in the `entryPoint` property.

### Breaking changes

- The ToastService has been removed and you must set up your own service.
- The BrowserService.open is now a static method, it is no longer necessary to inject this service.
