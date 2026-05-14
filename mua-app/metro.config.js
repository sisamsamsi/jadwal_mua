const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Do NOT add 'sql' to sourceExts, babel-plugin-inline-import will handle it.
config.resolver.sourceExts = [...config.resolver.sourceExts, "js", "jsx", "ts", "tsx"];

// Force Metro to resolve CJS files instead of ESM (.mjs) to avoid import.meta issues
// zustand and other packages ship both CJS (.js) and ESM (.mjs) — Metro picks .mjs by default
// which contains import.meta that browsers don't support in non-module scripts
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./global.css" });
