const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Do NOT add 'sql' to sourceExts, babel-plugin-inline-import will handle it.
// We can add it to assetExts if needed, but for now we just keep default.
config.resolver.sourceExts = [...config.resolver.sourceExts, "js", "jsx", "ts", "tsx"];

module.exports = withNativeWind(config, { input: "./global.css" });
