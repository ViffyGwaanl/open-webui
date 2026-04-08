const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

if (!config.resolver.assetExts.includes('sql')) {
  config.resolver.assetExts.push('sql')
}

module.exports = config
