Place your app logo here as:

- assets/app-icon.png

Use a square PNG, ideally 1024x1024.

Build the DMG with:

- npm run build

The build script will:

- turn assets/app-icon.png into build/icon.icns for macOS packaging
- use that icon for the installed app and Dock icon
- fall back to the default Electron icon if no PNG is present