import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safeAreaStyle?: ViewStyle;
  backgroundColor?: string;
  barStyle?: 'default' | 'light-content' | 'dark-content';
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  safeAreaStyle,
  backgroundColor = colors.background,
  barStyle = 'dark-content',
}) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, safeAreaStyle]}>
      <StatusBar barStyle={barStyle} backgroundColor={backgroundColor} />
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
