import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { AuthStackParamList } from '../../types/navigation';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { AuthRepository } from '../../services/auth/authRepository';
import { updateUser, logout } from '../../redux/slices/authSlice';

type Props = StackScreenProps<AuthStackParamList, 'CompleteProfile'>;

export function CompleteProfileScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const indPhoneRegex = /^[6789]\d{9}$/;
      if (!indPhoneRegex.test(cleanPhone)) {
        newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
      }
    }

    if (!addressLine1.trim()) {
      newErrors.addressLine1 = 'Address line 1 is required';
    }

    if (!city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(pincode.trim())) {
      newErrors.pincode = 'Pincode must be exactly 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        phone: phone.replace(/[^0-9]/g, ''),
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        landmark: landmark.trim() || undefined,
      };

      const updatedUser = await AuthRepository.completeProfile(payload);
      dispatch(updateUser(updatedUser));

      Alert.alert('Success', 'Profile completed successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Main' as any }],
              })
            );
          },
        },
      ]);
    } catch (err: any) {
      const serverMessage = err.response?.data?.error || err.message || 'Failed to complete profile';
      Alert.alert('Error', serverMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Profile</Text>
          <Text style={styles.subtitle}>
            Your email is verified. Please provide your mobile number and default delivery address.
          </Text>
        </View>

        <View style={styles.form}>
          {/* Email (Readonly) */}
          <Text style={styles.inputLabel}>Verified Email Address</Text>
          <TextInput
            style={[styles.textInput, styles.readonlyInput]}
            value={user?.email || 'N/A'}
            editable={false}
          />

          {/* Full Name */}
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={[styles.textInput, errors.fullName ? styles.errorInput : {}]}
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
            }}
          />
          {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

          {/* Mobile Number */}
          <Text style={styles.inputLabel}>Indian Mobile Number *</Text>
          <View style={styles.phoneInputRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <TextInput
              style={[
                styles.textInput,
                styles.flexInput,
                errors.phone ? styles.errorInput : {},
              ]}
              placeholder="10-digit number"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/[^0-9]/g, ''));
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
              }}
            />
          </View>
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

          {/* Address Line 1 */}
          <Text style={styles.inputLabel}>Address Line 1 *</Text>
          <TextInput
            style={[styles.textInput, errors.addressLine1 ? styles.errorInput : {}]}
            placeholder="Flat, House no., Building, Company, Apartment"
            value={addressLine1}
            onChangeText={(text) => {
              setAddressLine1(text);
              if (errors.addressLine1) setErrors((prev) => ({ ...prev, addressLine1: '' }));
            }}
          />
          {errors.addressLine1 ? <Text style={styles.errorText}>{errors.addressLine1}</Text> : null}

          {/* Landmark */}
          <Text style={styles.inputLabel}>Landmark (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="E.g. near main road, opposite park"
            value={landmark}
            onChangeText={setLandmark}
          />

          {/* Row for City & State */}
          <View style={styles.row}>
            <View style={styles.flexItem}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={[styles.textInput, errors.city ? styles.errorInput : {}]}
                placeholder="Hyderabad"
                value={city}
                onChangeText={(text) => {
                  setCity(text);
                  if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                }}
              />
              {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
            </View>
            <View style={[styles.flexItem, { marginLeft: spacing.md }]}>
              <Text style={styles.inputLabel}>State *</Text>
              <TextInput
                style={[styles.textInput, errors.state ? styles.errorInput : {}]}
                placeholder="Telangana"
                value={state}
                onChangeText={(text) => {
                  setState(text);
                  if (errors.state) setErrors((prev) => ({ ...prev, state: '' }));
                }}
              />
              {errors.state ? <Text style={styles.errorText}>{errors.state}</Text> : null}
            </View>
          </View>

          {/* Pincode */}
          <Text style={styles.inputLabel}>Pincode *</Text>
          <TextInput
            style={[styles.textInput, errors.pincode ? styles.errorInput : {}]}
            placeholder="6-digit pincode"
            keyboardType="number-pad"
            maxLength={6}
            value={pincode}
            onChangeText={(text) => {
              setPincode(text.replace(/[^0-9]/g, ''));
              if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' }));
            }}
          />
          {errors.pincode ? <Text style={styles.errorText}>{errors.pincode}</Text> : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading ? styles.disabledButton : {}]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save and Continue</Text>
            )}
          </TouchableOpacity>

          {/* Cancel/Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Cancel & Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FF',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: spacing.xs,
    lineHeight: typography.lineHeight.relaxed,
  },
  form: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  textInput: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
  },
  readonlyInput: {
    backgroundColor: colors.surfaceContainerLow || '#EFF4FF',
    color: colors.textMuted,
  },
  errorInput: {
    borderColor: colors.error || '#BA1A1A',
  },
  errorText: {
    color: colors.error || '#BA1A1A',
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    marginTop: spacing.xs,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRightWidth: 0,
    borderTopLeftRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerLow || '#EFF4FF',
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.fontWeight.bold,
  },
  flexInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexItem: {
    flex: 1,
  },
  saveButton: {
    height: 52,
    backgroundColor: colors.primaryContainer || colors.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  disabledButton: {
    backgroundColor: colors.borderDark || '#727785',
  },
  saveButtonText: {
    color: colors.onPrimary || '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
  },
  logoutButton: {
    marginTop: spacing.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.md,
  },
  logoutButtonText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.body,
  },
});
