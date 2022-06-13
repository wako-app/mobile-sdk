Official SDK used by [wako](https://wako.app) and wako's add-ons

If you want to create your own add-on, take a look at the example of the [add-on starter kit](https://github.com/wako-app/addon-starter-kit)

## Migration to v7

Version v7 is now based on Angular v14 and will only work on wako v6+.

**Add-ons must upgrade to version v7 to be compatible with the latest version of wako v6+ or they'll be removed.**

To maintain compatibility with both old and new versions of wako, a new `entryPointV3` property
has been added to the add-on manifest.
Keep the old `entryPointV2` pointing to an old version of your add-on for the old version of wako (< 6) and
the new `entryPointV3` for the new version of wako.  
You don't need to change your add-on's version, wako 6+ will check if your add-on's manifest has an `entryPointV3` and will install this new version.

For recent Add-ons compatible only with wako 6+ you don't need to fill in the `entryPointV2` property.

**You have until the `2020-07-01` to do the migration, before wako 6 will be out.**
