// metro.config.js
// Expo/Metro bundler configuration for PlumbCommerce Store App
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Web-specific module aliases
const webAliases = {
  'react-native-maps': path.resolve(__dirname, 'src/mocks/react-native-maps.web.tsx'),
};

// Only apply aliases when bundling for web
const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && webAliases[moduleName]) {
    return {
      filePath: webAliases[moduleName],
      type: 'sourceFile',
    };
  }
  // Fall back to default resolver
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
