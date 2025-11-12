import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alphahazestudios.taprush',
  appName: 'TapRush',
  webDir: 'dist/public',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#FFFFFF',
    icon: 'resources/icon.png'
  }
};

export default config;
