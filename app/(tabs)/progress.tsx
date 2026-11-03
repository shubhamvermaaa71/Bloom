import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Screen, Card, Heading, Muted, Row, SectionHeading, spacing, typography } from '../../src/ui';
import { useTheme } from '../../src/theme';
import { listHabits } from '../../src/repositories/habits';
import { waterTotal } from '../../src/repositories/water';
import { listSteps } from '../../src/repositories/skincare';
import { gardenStats } from '../../src/repositories/garden';
import { weeklyHabitProgress } from '../../src/repositories/progress';

const CHART_HEIGHT = 124;

export default function Progress() {
  const { colors } = useTheme();
  const [habits, setHabits] = useState<any[]>([]);
  const [water, setWater] = useState(0);
  const [steps, setSteps] = useState<any[]>([]);
  const [garden, setGarden] = useState<any>({ points: 0, stage: 'Seed' });
  const [week, setWeek] = useState<any[]>([]);
  const load = useCallback(async () => {
    const [habitItems, waterAmount, skinSteps, gardenProgress, weekly] = await Promise.all([
      listHabits(), waterTotal(), listSteps(), gardenStats(), weeklyHabitProgress(),
    ]);
    setHabits(habitItems);
    setWater(waterAmount);
    setSteps(skinSteps);
    setGarden(gardenProgress);
    setWeek(weekly);
  }, []);
  useFocusEffect(useCallback(() => { load().catch(error => console.error('Unable to load progress', error)); }, [load]));

  const done = habits.filter(item => item.completed).length;
  const skinDone = steps.filter(item => item.completed).length;
  const today = new Date();

  return (
    <Screen>
      <Heading sub="A calm look at the little things you’ve done.">Your progress</Heading>

      <SectionHeading>Your week</SectionHeading>
      <Card style={{ padding: spacing.md }}>
        <Row>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: typography.body, fontWeight: '700' }}>Daily habits</Text>
            <Muted>Starting today. Future days unlock as they arrive.</Muted>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xxs }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green }}/>
            <Text style={{ color: colors.muted, fontSize: typography.caption }}>Done</Text>
          </View>
        </Row>
        <View accessibilityRole="image" accessibilityLabel="Bar chart showing daily habit completions starting today, with future days unlocking as they arrive" style={{ height: CHART_HEIGHT + 35, marginTop: spacing.md }}>
          {[0.25, 0.5, 0.75, 1].map(level => (
            <View key={level} style={{ position: 'absolute', top: CHART_HEIGHT * (1 - level), left: 0, right: 0, height: 1, backgroundColor: colors.border }}/>
          ))}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
            {week.map(day => {
              const isToday = day.day === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              const barHeight = day.total > 0 && day.completed > 0 ? Math.max(9, CHART_HEIGHT * day.completed / day.total) : 4;
              return (
                <View key={day.day} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                  {!day.locked ? <Text style={{ color: isToday ? colors.accent : colors.muted, fontSize: typography.caption, fontWeight: '700', marginBottom: spacing.xxs }}>{day.completed > 0 ? day.completed : ''}</Text> : <View style={{ height: spacing.md }}/>}
                  <View style={{ height: CHART_HEIGHT, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <View accessibilityLabel={day.locked ? 'Upcoming day' : `${day.completed} of ${day.total} habits completed`} style={{ width: 22, height: day.locked ? 4 : barHeight, borderRadius: 8, backgroundColor: day.locked ? colors.muted : day.completed ? (isToday ? colors.accent : colors.green) : colors.soft, opacity: day.locked ? 0.55 : 1 }}/>
                  </View>
                  <Text style={{ color: isToday ? colors.text : colors.muted, fontSize: typography.caption, fontWeight: isToday ? '700' : '500', marginTop: spacing.xs }}>
                    {isToday ? 'Today' : new Date(`${day.day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        {!habits.length ? <Muted>Add a habit to start seeing your weekly chart.</Muted> : null}
      </Card>

      <SectionHeading>Today at a glance</SectionHeading>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <Card style={{ flex: 1, minWidth: 0, padding: spacing.sm }}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.green}/>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginTop: spacing.sm }}>{done}<Text style={{ color: colors.muted, fontSize: typography.body, fontWeight: '500' }}> / {habits.length}</Text></Text>
          <Text style={{ color: colors.muted, fontSize: typography.secondary, marginTop: spacing.xxs }}>Habits</Text>
        </Card>
        <Card style={{ flex: 1, minWidth: 0, padding: spacing.sm }}>
          <Ionicons name="water-outline" size={20} color="#54B5E5"/>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginTop: spacing.sm }}>{water.toLocaleString()}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.secondary, marginTop: spacing.xxs }}>ml of water</Text>
        </Card>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <Card style={{ flex: 1, minWidth: 0, padding: spacing.sm }}>
          <Ionicons name="sparkles-outline" size={20} color={colors.accent}/>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginTop: spacing.sm }}>{skinDone}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.secondary, marginTop: spacing.xxs }}>Skincare steps</Text>
        </Card>
        <Card style={{ flex: 1, minWidth: 0, padding: spacing.sm }}>
          <Ionicons name="leaf-outline" size={20} color={colors.green}/>
          <Text style={{ color: colors.text, fontSize: typography.body, fontWeight: '800', marginTop: spacing.sm }}>{garden.stage}</Text>
          <Text style={{ color: colors.muted, fontSize: typography.secondary, marginTop: spacing.xxs }}>{garden.points} growth points</Text>
        </Card>
      </View>
    </Screen>
  );
}
