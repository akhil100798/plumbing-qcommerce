import { Platform } from 'react-native';

export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  pressScale: 0.96,
};

export const useNativeDriver = Platform.OS !== 'web';
