const { notarize } = require('electron-notarize');

/**
 * Enter app-specific password below.
 * https://github.com/electron/electron-notarize
 * https://support.apple.com/en-us/HT204397
 */
exports.default = async function(context) {
  const { electronPlatformName, appOutDir } = context;
  const appFileName = context.packager.appInfo.productFilename;

  if (electronPlatformName === 'darwin') {
    const pkg = require('../package.json');
    return await notarize({
      appBundleId: pkg.build.appId,
      appPath: `${appOutDir}/${appFileName}.app`,
      appleId: 'Your Apple ID',
      appleIdPassword: '@keychain:Your Keychain Item',
      ascProvider: 'Your Apple Team ID shortcode',
    });
  }
  return null;
};
