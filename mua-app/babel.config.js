module.exports = function (api) {
  api.cache(true);

  const replaceImportMeta = function () {
    return {
      name: "replace-import-meta-for-metro-web",
      visitor: {
        MetaProperty(path) {
          if (path.node.meta.name === "import" && path.node.property.name === "meta") {
            path.replaceWithSourceString("process");
          }
        },
      },
    };
  };

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      ["inline-import", { "extensions": [".sql"] }],
      replaceImportMeta,
      "react-native-reanimated/plugin",
    ],
  };
};
