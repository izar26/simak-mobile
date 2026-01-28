module.exports = {
  presets: [
    'module:@react-native/babel-preset',
    'nativewind/babel',
  ],
  env: {
    plugins: ['transform-remove-console'],
  },
  plugins: [
    [
      "module:react-native-dotenv",
      {
        "moduleName": "@env",
        "path": ".env",
      }
    ],
    'react-native-reanimated/plugin',
  ],
};