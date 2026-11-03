import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen, Card, Heading, Field, Button, Muted, RadioOption, SectionHeading, spacing, typography } from '../../src/ui';
import { useTheme, themeNames } from '../../src/theme';
import { getSetting, setSetting } from '../../src/repositories/settings';
import { database, migrateSkincareRoutines } from '../../src/services/database';

const goalOptions = [
  { value: '1500', label: '1,500 ml', description: 'A gentle daily target' },
  { value: '2000', label: '2,000 ml', description: 'A balanced daily target' },
  { value: '2500', label: '2,500 ml', description: 'A little more hydration' },
  { value: 'custom', label: 'Choose my own', description: 'Set a personal amount' },
];

export default function Settings() {
  const { colors, theme, setTheme } = useTheme();
  const params = useLocalSearchParams<{ section?: string }>();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [name, setName] = useState('Friend');
  const [goalOption, setGoalOption] = useState('2000');
  const [customGoal, setCustomGoal] = useState('');
  const [waterGoalOffset, setWaterGoalOffset] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [savedName, savedGoal] = await Promise.all([getSetting('name'), getSetting('waterGoal')]);
      setName(savedName || 'Friend');
      const amount = Number(savedGoal);
      if (savedGoal && amount > 0) {
        setGoalOption(['1500', '2000', '2500'].includes(savedGoal) ? savedGoal : 'custom');
        setCustomGoal(savedGoal);
      } else {
        setGoalOption('2000');
      }
    })().catch(error => Alert.alert('Settings unavailable', error instanceof Error ? error.message : 'Please try again.'));
  }, []);

  useFocusEffect(useCallback(() => {
    if (params.section !== 'waterGoal' || waterGoalOffset === null) return;
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, waterGoalOffset - spacing.md), animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [params.section, waterGoalOffset]));

  const save = async () => {
    const goal = goalOption === 'custom' ? Number(customGoal) : Number(goalOption);
    if (!Number.isInteger(goal) || goal < 250 || goal > 10000) {
      Alert.alert('Check your water goal', 'Choose a goal between 250 and 10,000 ml.');
      return;
    }

    await setSetting('name', name.trim() || 'Friend');
    await setSetting('waterGoal', String(goal));
    Alert.alert('Saved', 'Your Bloom preferences are up to date.');
  };

  const reset = () => Alert.alert('Reset Bloom?', 'This permanently deletes your local habits, journal, mood, skincare, water history, settings and garden progress.', [
    { text: 'Cancel' },
    { text: 'Reset everything', style: 'destructive', onPress: async () => {
      const db = await database();
      await db.execAsync('DELETE FROM habits;DELETE FROM habit_logs;DELETE FROM water_logs;DELETE FROM skincare_steps;DELETE FROM skincare_logs;DELETE FROM journal;DELETE FROM moods;DELETE FROM garden_events;DELETE FROM achievements;DELETE FROM settings;');
      await db.execAsync('DELETE FROM skincare_routines;');
      await migrateSkincareRoutines(db);
      router.replace('/onboarding');
    } },
  ]);

  return (
    <Screen showFooter scrollRef={scrollRef}>
      <Heading sub="A few simple choices to make Bloom yours.">Settings</Heading>

      <Card>
        <SectionHeading>Your space</SectionHeading>
        <Text style={{ color: colors.text, fontSize: typography.label, fontWeight: '700', marginBottom: spacing.xs }}>Your name</Text>
        <Field value={name} onChangeText={setName} placeholder="What should we call you?" maxLength={32} />
        <Text style={{ color: colors.text, fontSize: typography.label, fontWeight: '700', marginTop: spacing.xxs, marginBottom: spacing.sm }}>Look and feel</Text>
        {themeNames.map(option => (
          <RadioOption key={option} label={option} selected={theme === option} onPress={() => setTheme(option)} />
        ))}
      </Card>

      <Card onLayout={event => setWaterGoalOffset(event.nativeEvent.layout.y)}>
        <SectionHeading>Daily water quantity</SectionHeading>
        <Muted>Pick a daily goal that feels right for you. You can change it anytime.</Muted>
        <View style={{ marginTop: spacing.sm }}>
          {goalOptions.map(option => (
            <RadioOption key={option.value} label={option.label} description={option.description} selected={goalOption === option.value} onPress={() => setGoalOption(option.value)} />
          ))}
        </View>
        {goalOption === 'custom' ? <Field value={customGoal} onChangeText={setCustomGoal} keyboardType="number-pad" placeholder="Daily goal in ml" /> : null}
      </Card>

      <Button title="Save preferences" onPress={save} />
      <Button title="Replay tutorial" secondary onPress={() => router.push('/onboarding?replay=1')} />
      <Button title="Reset all Bloom data" danger onPress={reset} />

      <Card style={{ marginTop: spacing.xs }}>
        <SectionHeading>About Bloom</SectionHeading>
        <Text style={{ color: colors.text, fontSize: typography.label, fontWeight: '600', marginBottom: spacing.xs }}>A little space to grow, at your own pace.</Text>
        <Muted>Bloom is a gentle, private wellness companion for habits, hydration, skincare, journaling, and reflection. We believe small moments of care matter, without streak pressure or perfection.</Muted>
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />
        <Text style={{ color: colors.text, fontSize: typography.label, fontWeight: '700', marginBottom: spacing.xs }}>Privacy</Text>
        <Muted>Your information stays on this device. Bloom has no account or cloud backend. Local storage is not encrypted, so avoid saving highly sensitive information.</Muted>
        <Text style={{ color: colors.muted, fontSize: typography.caption, marginTop: spacing.sm }}>Bloom Wellness · Made with care</Text>
      </Card>
    </Screen>
  );
}
