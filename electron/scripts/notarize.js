exports.default = async function (context) {
  const { electronPlatformName, appOutDir } = context;
  const appFileName = context.packager.appInfo.productFilename;

  if (electronPlatformName === 'darwin') {
    const { notarize } = require('electron-notarize');
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
