import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Button, Card, Muted, Row, Screen, SectionHeading, spacing, typography, radii, surfaceShadow, fontFamilies } from '../../src/ui';
import { Quote } from '../../src/components/Quote';
import { HabitCheckbox } from '../../src/components/HabitCheckbox';
import { listHabits, toggleHabit } from '../../src/repositories/habits';
import { getSetting } from '../../src/repositories/settings';
import { waterTotal } from '../../src/repositories/water';

type FeatureCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  onPress: () => void;
};

function FeatureCard({ icon, title, detail, onPress }: FeatureCardProps) {
  const { colors, theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 76,
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        marginBottom: spacing.sm,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        ...surfaceShadow(theme === 'Dark'),
        opacity: pressed ? 0.84 : 1,
      })}
    >
      <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm }}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: colors.text, fontSize: typography.body, fontWeight: '700', letterSpacing: 0.1 }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: typography.secondary, lineHeight: 18, marginTop: spacing.xxs }}>{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function ExploreLink({ icon, title, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; onPress: () => void }) {
  const { colors, theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: spacing.touchTarget + spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.xs,
        borderRadius: radii.tile,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        ...surfaceShadow(theme === 'Dark'),
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <Ionicons name={icon} size={19} color={colors.accent} />
      <Text style={{ color: colors.text, fontSize: typography.secondary, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}

export default function Home() {
  const { colors } = useTheme();
  const [name, setName] = useState('Friend');
  const [habits, setHabits] = useState<any[]>([]);
  const [allHabits, setAllHabits] = useState<any[]>([]);
  const [water, setWater] = useState(0);

  const load = useCallback(async () => {
    setName((await getSetting('name')) || 'Friend');
    const items = await listHabits();
    setAllHabits(items);
    setHabits([...items.filter(item => !item.completed), ...items.filter(item => item.completed)].slice(0, 3));
    setWater(await waterTotal());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const completed = allHabits.filter(habit => habit.completed).length;
  const progress = allHabits.length ? Math.round(completed / allHabits.length * 100) : 0;

  return (
    <Screen>
      <Row>
        <View style={{ flex: 1, marginBottom: spacing.md }}>
          <Text style={{ color: colors.muted, fontSize: typography.secondary, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>
            {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={{ fontFamily: fontFamilies.heading, color: colors.text, fontSize: typography.title, lineHeight: 37, fontWeight: '700', letterSpacing: -0.4, marginTop: spacing.xs }}>
            {greeting},{'\n'}{name} <Text style={{ color: colors.accent }}>✿</Text>
          </Text>
        </View>
      </Row>

      <Card style={{ backgroundColor: colors.soft, borderWidth: 0, padding: spacing.lg }}>
        <Row>
          <View style={{ flex: 1, paddingRight: spacing.xs }}>
            <Text style={{ color: colors.text, fontSize: typography.section, fontWeight: '700', letterSpacing: -0.2 }}>Today’s progress</Text>
            <Text style={{ color: colors.muted, fontSize: typography.label, lineHeight: 19, marginTop: spacing.xxs }}>A little progress adds up.</Text>
          </View>
          <Text style={{ color: colors.text, fontSize: typography.label, fontWeight: '700' }}>{completed} / {allHabits.length}</Text>
        </Row>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: allHabits.length, now: completed }} style={{ height: 8, borderRadius: 8, backgroundColor: colors.card, overflow: 'hidden', marginTop: spacing.md }}>
          <View style={{ height: '100%', width: `${progress}%`, borderRadius: 8, backgroundColor: colors.green }} />
        </View>
        <Text style={{ color: colors.muted, fontSize: typography.secondary, marginTop: spacing.xs }}>{allHabits.length ? `${allHabits.length - completed} left today` : 'Start with one small habit'}</Text>
      </Card>

      <Quote />

      <SectionHeading sub="Choose a small way to care for yourself.">Your daily care</SectionHeading>
      <FeatureCard icon="water-outline" title="Water" detail={`${water.toLocaleString()} ml today`} onPress={() => router.push('/water')} />
      <FeatureCard icon="sparkles-outline" title="Skincare" detail="Make time for your daily routine." onPress={() => router.push('/skincare')} />
      <FeatureCard icon="sunny-outline" title="Mood" detail="Check in with how you're feeling." onPress={() => router.push('/mood')} />

      <Card>
        <Row>
          <View>
            <Text style={{ color: colors.text, fontSize: typography.section, fontWeight: '700', letterSpacing: -0.2 }}>Today’s habits</Text>
            <Muted>{allHabits.length ? `${completed} completed so far` : 'Small steps make a lovely routine.'}</Muted>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/habits')} style={{ minWidth: spacing.touchTarget, minHeight: spacing.touchTarget, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.accent, fontWeight: '700', fontSize: typography.label }}>See all</Text>
          </Pressable>
        </Row>
        {habits.length === 0
          ? <Text style={{ color: colors.muted, fontSize: typography.label, lineHeight: 20, marginTop: spacing.md }}>No habits yet. Add a small habit to begin.</Text>
          : habits.map((habit, index) => (
            <Pressable
              key={habit.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: Boolean(habit.completed) }}
              accessibilityLabel={`${habit.completed ? 'Mark incomplete' : 'Complete'} ${habit.name}`}
              onPress={async () => {
                try { await toggleHabit(habit.id, !habit.completed); await load(); }
                catch (error) { Alert.alert('Could not update habit', error instanceof Error ? error.message : 'Please try again.'); }
              }}
              style={({ pressed }) => ({ minHeight: spacing.touchTarget + spacing.xs, paddingVertical: spacing.xs, borderBottomWidth: index === habits.length - 1 ? 0 : 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.75 : 1 })}
            >
              <HabitCheckbox completed={Boolean(habit.completed)} size={36} />
              <View style={{ flex: 1, minWidth: 0, marginLeft: spacing.sm, marginRight: spacing.xs }}>
                <Text style={{ color: colors.text, fontSize: typography.body, fontWeight: '600' }}>{habit.name}</Text>
                <Text style={{ color: colors.muted, fontSize: typography.secondary, marginTop: spacing.xxs }}>{habit.category}</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={colors.muted} />
            </Pressable>
          ))}
        <Button title="Open habit tracker" secondary onPress={() => router.push('/(tabs)/habits')} />
      </Card>

      <SectionHeading>Explore more</SectionHeading>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <ExploreLink icon="leaf-outline" title="Bloom Garden" onPress={() => router.push('/garden')} />
        <ExploreLink icon="book-outline" title="Journal" onPress={() => router.push('/(tabs)/journal')} />
      </View>
    </Screen>
  );
}
