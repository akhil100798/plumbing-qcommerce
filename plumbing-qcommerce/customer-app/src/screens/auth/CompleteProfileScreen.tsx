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
    backgroundColor: '#F8FAFC',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text || '#0F172A',
    fontFamily: typography.bold,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary || '#64748B',
    marginTop: spacing.xs,
    lineHeight: 20,
    fontFamily: typography.regular,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text || '#1E293B',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontFamily: typography.semiBold,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FAFAFA',
    fontFamily: typography.regular,
  },
  readonlyInput: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },
  errorInput: {
    borderColor: colors.error || '#EF4444',
  },
  errorText: {
    color: colors.error || '#EF4444',
    fontSize: 12,
    marginTop: spacing.xs,
    fontFamily: typography.regular,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRightWidth: 0,
    borderTopLeftRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 15,
    color: '#475569',
    fontFamily: typography.semiBold,
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
    height: 48,
    backgroundColor: colors.primary || '#2563EB',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: typography.bold,
  },
  logoutButton: {
    marginTop: spacing.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: borderRadius.md,
  },
  logoutButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: typography.semiBold,
  },
});
