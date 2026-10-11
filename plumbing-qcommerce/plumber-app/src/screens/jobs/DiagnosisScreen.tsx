import { StackScreenProps } from '@react-navigation/stack';
import type * as ImagePickerTypes from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { AppStackParamList } from '../../types/navigation';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Phase2JobRepository, configuredLaborCatalogId, createMutationKey } from '../../services/jobs/phase2JobRepository';
import { DiagnosisDraftRequest, PlumberDiagnosisDTO, PlumberQuoteDTO } from '../../services/jobs/phase2Types';

type Props = StackScreenProps<AppStackParamList, 'Diagnosis'>;

const EMPTY_DRAFT: DiagnosisDraftRequest = {
  affectedComponent: '', observedCondition: '', diagnosisNarrative: '', recommendedRemedy: '',
  estimatedLaborUnits: 1, knownMaterialCandidates: '', safetyNotes: '', safetyBlocked: false,
};

export function DiagnosisScreen({ route, navigation }: Props) {
  const orderId = Number(String(route.params.jobId).match(/\d+/)?.[0]);
  const [diagnosis, setDiagnosis] = useState<PlumberDiagnosisDTO | null>(null);
  const [quote, setQuote] = useState<PlumberQuoteDTO | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [photo, setPhoto] = useState<ImagePickerTypes.ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const catalogId = configuredLaborCatalogId();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const current = await Phase2JobRepository.getDiagnosis(orderId);
      setDiagnosis(current);
      setDraft({
        affectedComponent: current.affectedComponent,
        observedCondition: current.observedCondition,
        diagnosisNarrative: current.diagnosisNarrative,
        recommendedRemedy: current.recommendedRemedy,
        estimatedLaborUnits: current.estimatedLaborUnits,
        knownMaterialCandidates: current.knownMaterialCandidates || '',
        safetyNotes: current.safetyNotes || '',
        safetyBlocked: current.safetyBlocked,
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not load diagnosis.';
      if (!/404|not found/i.test(message)) setError(message);
      setDiagnosis(null);
    }
    try {
      const currentQuote = await Phase2JobRepository.getCurrentQuote(orderId);
      setQuote(currentQuote);
    } catch (cause) {
      if (!/404|not found/i.test(cause instanceof Error ? cause.message : '')) {
        setError(cause instanceof Error ? cause.message : 'Could not load quote status.');
      }
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void refresh();
    const unsubscribe = navigation.addListener('focus', () => { void refresh(); });
    return unsubscribe;
  }, [navigation, refresh]);

  const update = (field: keyof DiagnosisDraftRequest, value: string | boolean) => {
    setDraft((current) => ({ ...current, [field]: field === 'estimatedLaborUnits' ? Number(value) : value }));
  };

  const choosePhoto = async () => {
    const ImagePicker = await import('expo-image-picker');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library access is needed to attach diagnosis evidence.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const saveAndSubmit = async () => {
    if (!Number.isSafeInteger(orderId) || orderId <= 0) { setError('This service order ID is invalid.'); return; }
    if (!draft.affectedComponent.trim() || !draft.observedCondition.trim() || !draft.diagnosisNarrative.trim() ||
        !draft.recommendedRemedy.trim() || !Number.isFinite(draft.estimatedLaborUnits) || draft.estimatedLaborUnits <= 0) {
      setError('Complete each required diagnosis field with a valid labor estimate.'); return;
    }
    setBusy(true); setError(null);
    try {
      let current = diagnosis;
      if (!current) {
        current = await Phase2JobRepository.createDiagnosis(orderId, draft,
          createMutationKey('plumber', orderId, `diagnosis-create-${JSON.stringify(draft)}`));
        setDiagnosis(current);
      } else if (current.state === 'DRAFT') {
        current = await Phase2JobRepository.updateDiagnosis(orderId, current.id, draft, current.version,
          createMutationKey('plumber', orderId, `diagnosis-update-${current.id}-v${current.version}-${JSON.stringify(draft)}`));
        setDiagnosis(current);
      } else {
        setError('This diagnosis has already been submitted. Refresh before creating a revision.');
        return;
      }
      if (draft.safetyBlocked) {
        setDiagnosis(current);
        setError('Safety-blocked diagnosis draft saved. Repair quoting and completion remain blocked. Follow the applicable escalation process.');
        return;
      }
      if (photo && !current.evidence.some((item) => item.phase === 'DIAGNOSIS')) {
        await Phase2JobRepository.uploadDiagnosisEvidence(orderId, current.id,
          { uri: photo.uri, fileName: photo.fileName, mimeType: photo.mimeType },
          createMutationKey('plumber', orderId, `diagnosis-evidence-${current.id}`));
        current = await Phase2JobRepository.getDiagnosis(orderId);
        setDiagnosis(current);
      }
      if (!current.evidence.some((item) => item.phase === 'DIAGNOSIS') && !photo) {
        setError('Add at least one real diagnosis photo before submitting. Your draft is saved.');
        return;
      }
      const submitted = await Phase2JobRepository.submitDiagnosis(orderId, current.id,
        createMutationKey('plumber', orderId, `diagnosis-submit-${current.id}`));
      setDiagnosis(submitted);
      const currentQuote = await Phase2JobRepository.getCurrentQuote(orderId);
      setQuote(currentQuote);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Diagnosis was not confirmed. Refresh before retrying.');
    } finally {
      setBusy(false);
    }
  };

  const publishQuote = async () => {
    if (!catalogId) { setError('Quote publishing is blocked: configure a verified active INR labor catalog ID for this environment.'); return; }
    if (diagnosis?.safetyBlocked) { setError('A safety-blocked diagnosis cannot be quoted. Follow the applicable safety escalation process.'); return; }
    if (!quote || quote.state !== 'DRAFT') { setError('The current quote is not a draft. Refresh before taking action.'); return; }
    setBusy(true); setError(null);
    try {
      setQuote(await Phase2JobRepository.publishQuote(orderId, quote.id, catalogId,
        createMutationKey('plumber', orderId, `quote-publish-${quote.id}`)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Quote publication was not confirmed. Refresh before retrying.');
    } finally { setBusy(false); }
  };

  const reviseQuote = async () => {
    if (!quote || quote.kind !== 'INITIAL' || (quote.state !== 'PUBLISHED' && quote.state !== 'REJECTED')) {
      setError('Only a current published or rejected initial quote can be revised. Refresh the job state.'); return;
    }
    setBusy(true); setError(null);
    try {
      const revision = await Phase2JobRepository.reviseQuote(orderId, quote.id, 'Customer requested a quote revision',
        createMutationKey('plumber', orderId, `quote-revise-${quote.id}-v${quote.version}`));
      setQuote(revision);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Quote revision was not confirmed. Refresh before retrying.');
    } finally { setBusy(false); }
  };

  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator color={colors.primary} /><Text style={styles.help}>Loading service state…</Text></SafeAreaView>;

  return <SafeAreaView style={styles.container}>
    <AppHeader title="Diagnosis & labor quote" onBackPress={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Service order #{orderId}. Submit a diagnosis and evidence before quoting.</Text>
      {error ? <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View> : null}
      {diagnosis?.state === 'SUBMITTED' ? <View style={styles.card}>
        <Text style={styles.heading}>Diagnosis submitted</Text>
        <Text style={styles.body}>{diagnosis.diagnosisNarrative}</Text>
        {quote ? <Text style={styles.body}>Current quote: {quote.kind} · {quote.state}{quote.total > 0 ? ` · ${quote.currency} ${quote.total.toFixed(2)}` : ''}</Text> : null}
        {quote?.state === 'DRAFT' && !diagnosis?.safetyBlocked ? <PrimaryButton title={catalogId ? 'Publish backend-priced labor quote' : 'Configure labor catalog to publish'} onPress={() => void publishQuote()} loading={busy} disabled={!catalogId} /> : null}
        {(quote?.state === 'PUBLISHED' || quote?.state === 'REJECTED') && quote.kind === 'INITIAL' ? <PrimaryButton title="Create supported quote revision" onPress={() => void reviseQuote()} loading={busy} /> : null}
        {quote?.state === 'APPROVED' ? <Text style={styles.successText}>Customer approved this quote. Repair may proceed under backend authorization.</Text> : null}
        {quote?.state === 'APPROVED' && diagnosis?.state === 'SUBMITTED' ? <PrimaryButton title="Continue to repair completion" onPress={() => navigation.navigate('CompleteService', { jobId: String(orderId) })} loading={busy} /> : null}
        <PrimaryButton title="Refresh server state" onPress={() => void refresh()} />
      </View> : <View style={styles.card}>
        <Text style={styles.heading}>On-site diagnosis</Text>
        <Text style={styles.label}>Affected component *</Text><TextInput value={draft.affectedComponent} onChangeText={(v) => update('affectedComponent', v)} style={styles.input} />
        <Text style={styles.label}>What did you observe? *</Text><TextInput value={draft.observedCondition} onChangeText={(v) => update('observedCondition', v)} multiline style={styles.input} />
        <Text style={styles.label}>Diagnosis *</Text><TextInput value={draft.diagnosisNarrative} onChangeText={(v) => update('diagnosisNarrative', v)} multiline style={styles.input} />
        <Text style={styles.label}>Recommended labor repair *</Text><TextInput value={draft.recommendedRemedy} onChangeText={(v) => update('recommendedRemedy', v)} multiline style={styles.input} />
        <Text style={styles.label}>Estimated labor units *</Text><TextInput value={String(draft.estimatedLaborUnits)} onChangeText={(v) => update('estimatedLaborUnits', v)} keyboardType="decimal-pad" style={styles.input} />
        <Text style={styles.label}>Known material candidates (informational only)</Text><TextInput value={draft.knownMaterialCandidates} onChangeText={(v) => update('knownMaterialCandidates', v)} multiline style={styles.input} />
        <Text style={styles.label}>Safety notes</Text><TextInput value={draft.safetyNotes} onChangeText={(v) => update('safetyNotes', v)} multiline style={styles.input} />
        <View style={styles.safetyRow}>
          <View style={styles.safetyCopy}><Text style={styles.label}>Safety block</Text><Text style={styles.body}>Turn this on if the repair is unsafe to proceed. A blocked diagnosis cannot be quoted or completed.</Text></View>
          <Switch value={draft.safetyBlocked} onValueChange={(value) => update('safetyBlocked', value)} accessibilityLabel="Block repair for safety reasons" />
        </View>
        {draft.safetyBlocked ? <Text style={styles.errorText}>Stop work and follow the applicable safety escalation process. Do not submit a labor quote.</Text> : null}
        <PrimaryButton title={photo ? 'Replace diagnosis photo' : 'Choose real diagnosis photo'} onPress={() => void choosePhoto()} />
        {photo ? <Image source={{ uri: photo.uri }} style={styles.photo} /> : null}
        {diagnosis?.evidence.length ? <Text style={styles.body}>{diagnosis.evidence.length} evidence photo(s) are already attached.</Text> : null}
        <PrimaryButton title={draft.safetyBlocked ? 'Save safety-blocked diagnosis' : 'Save diagnosis & submit'} onPress={() => void saveAndSubmit()} loading={busy} />
      </View>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.layout, gap: spacing.md },
  subtitle: { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  heading: { color: colors.textPrimary, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
  label: { color: colors.textSecondary, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, marginTop: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, padding: spacing.sm, color: colors.textPrimary, minHeight: 44 },
  body: { color: colors.textPrimary, fontSize: typography.fontSize.sm },
  photo: { height: 220, borderRadius: borderRadius.md, backgroundColor: colors.border },
  errorCard: { padding: spacing.md, borderWidth: 1, borderColor: colors.error, borderRadius: borderRadius.md, backgroundColor: colors.surface },
  errorText: { color: colors.error, fontSize: typography.fontSize.sm },
  successText: { color: colors.success, fontWeight: typography.fontWeight.bold },
  safetyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  safetyCopy: { flex: 1 },
  help: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});
