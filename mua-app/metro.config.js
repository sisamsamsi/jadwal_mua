const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Support SQL files for Drizzle migrations
config.resolver.sourceExts.push("sql");

module.exports = withNativeWind(config, { input: "./global.css" });
