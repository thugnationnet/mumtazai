import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.mumtaz.canvasbuild',
  appName: 'AI Canvas Pro',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://build.mumtaz.ai',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0A0A0A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A0A0A',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    scheme: 'AI Canvas Pro',
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#0A0A0A',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
