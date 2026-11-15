import { useState } from 'react';
import { Alert, View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { setSetting } from '../src/repositories/settings';
import { Screen, Card, Button, Field, spacing, typography } from '../src/ui';
import { useTheme } from '../src/theme';

const pages = [
  ['A little space to bloom', 'Build gentle routines, reflect, and notice your progress. Bloom stores your information on this device and works offline.'],
  ['Small steps count', 'Track habits, water, skincare, and your mood without turning wellness into a competition.'],
  ['Your private garden', 'Your actions help a flower grow. There are no streak penalties and no pressure to be perfect.']
];

export default function Onboarding() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [page, setPage] = useState(-1);
  const [saving, setSaving] = useState(false);
  const finish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await setSetting('name', name.trim() || 'Friend');
      await setSetting('onboardingComplete', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Could not save your preferences', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };
  return <Screen showHeader={false} showFooter={false}>
    <View style={s.wrap}>
      <Text style={[s.logo, { color: colors.accent }]}>✿</Text><Text style={[s.title, { color: colors.text }]}>Bloom</Text>
      {page < 0 ? <Card>
        <Text style={[s.heading, { color: colors.text }]}>What should we call you?</Text>
        <Text style={[s.copy, { color: colors.muted }]}>A name makes your space feel a little more personal.</Text>
        <Field value={name} onChangeText={setName} placeholder="Your name" maxLength={32} />
        <Button title="Continue" onPress={() => setPage(0)} />
      </Card> : <Card>
        <Text style={[s.heading, { color: colors.text }]}>{pages[page][0]}</Text>
        <Text style={[s.copy, { color: colors.muted }]}>{pages[page][1]}</Text>
        <Button title={saving ? 'Saving…' : page === pages.length - 1 ? 'Start blooming' : 'Next'} disabled={saving} onPress={() => page === pages.length - 1 ? finish() : setPage(page + 1)} />
        <Pressable accessibilityRole="button" disabled={saving} onPress={finish} style={{ opacity: saving ? 0.5 : 1 }}><Text style={[s.skip, { color: colors.muted }]}>Skip tutorial</Text></Pressable>
      </Card>}
      <Text style={[s.foot, { color: colors.muted }]}>A gentle companion for everyday wellbeing</Text>
    </View>
  </Screen>;
}
const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  logo: { fontSize: 54, textAlign: 'center' },
  title: { fontSize: 36, fontWeight: '800', textAlign: 'center' },
  heading: { fontSize: 23, lineHeight: 30, fontWeight: '700', marginBottom: spacing.sm },
  copy: { fontSize: 15, lineHeight: 23, marginBottom: spacing.md },
  skip: { textAlign: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: spacing.touchTarget, color: '#927783' },
  foot: { textAlign: 'center', fontSize: typography.secondary, lineHeight: 18, marginTop: spacing.xs },
});
