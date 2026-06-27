import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../theme';

interface OTPInputProps {
  length?: number;
  onCodeChanged: (code: string) => void;
}

export function OTPInput({
  length = 6,
  onCodeChanged,
}: OTPInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<TextInput[]>([]);

  const handleChangeText = (text: string, index: number) => {
    const numericText = text.replace(/[^0-9]/g, '');
    const newCode = [...code];
    newCode[index] = numericText;
    setCode(newCode);
    onCodeChanged(newCode.join(''));

    // Move to next input if text entered
    if (numericText && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Move to previous input on backspace if current is empty
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputsRef.current[index] = ref;
            }}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={1}
            value={code[index]}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            selectTextOnFocus
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    width: '100%',
    paddingHorizontal: spacing.sm,
    marginVertical: spacing.lg,
  },
  input: {
    width: 48,
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
});
