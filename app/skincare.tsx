import { useCallback, useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  Screen, Card, Heading, Field, Button, Muted, Label, Row, SectionHeading,
  spacing, typography, radii,
} from '../src/ui';
import { useTheme } from '../src/theme';
import {
  addStep, listAllSteps, listRoutines, listSteps, removeStep, reorderSteps,
  routineProgress, setRoutineEnabled, setStepStatus, skincareConsistency,
  updateStep, type ConsistencySummary, type RoutineProgress, type SkincareRoutine,
  type SkincareStep, type SkincareStatus,
} from '../src/repositories/skincare';

const routineOptions: { key: SkincareRoutine; short: string; title: string }[] = [
  { key: 'Morning', short: 'AM', title: 'Morning Routine' },
  { key: 'Night', short: 'PM', title: 'Night Routine' },
];
const weekdays = [
  { value: 0, label: 'S' }, { value: 1, label: 'M' }, { value: 2, label: 'T' },
  { value: 3, label: 'W' }, { value: 4, label: 'T' }, { value: 5, label: 'F' },
  { value: 6, label: 'S' },
];
const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type StepDraft = { id?: string; label: string; description: string; optional: boolean; enabled: boolean; weekdays: number[] };
const emptyDraft = (): StepDraft => ({ label: '', description: '', optional: false, enabled: true, weekdays: [0, 1, 2, 3, 4, 5, 6] });

function SummaryLine({ title, summary }: { title: string; summary: ConsistencySummary }) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ color: colors.text, fontSize: typography.body, fontWeight: '700' }}>{title}</Text>
      <Text style={{ color: colors.muted, fontSize: typography.secondary, lineHeight: 19, marginTop: spacing.xxs }}>
        {summary.completedRoutines}/{summary.eligibleDays} complete · {summary.missedRoutines} missed · {summary.completedSteps} steps done · {summary.skippedSteps} skipped
      </Text>
    </View>
  );
}

export default function Skincare() {
  const { colors } = useTheme();
  const [routine, setRoutine] = useState<SkincareRoutine>('Morning');
  const [routineEnabled, setRoutineEnabledState] = useState(true);
  const [todaySteps, setTodaySteps] = useState<SkincareStep[]>([]);
  const [allSteps, setAllSteps] = useState<SkincareStep[]>([]);
  const [progress, setProgress] = useState<RoutineProgress | null>(null);
  const [history, setHistory] = useState<{ weekly: ConsistencySummary[]; monthly: ConsistencySummary[] } | null>(null);
  const [draft, setDraft] = useState<StepDraft | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [routines, scheduled, managed, dailyProgress, consistency] = await Promise.all([
        listRoutines(),
        listSteps(routine),
        listAllSteps(routine),
        routineProgress(routine),
        skincareConsistency(),
      ]);
      setRoutineEnabledState(routines.find(item => item.routine === routine)?.enabled ?? true);
      setTodaySteps(scheduled);
      setAllSteps(managed);
      setProgress(dailyProgress);
      setHistory(consistency);
    } catch (error) {
      Alert.alert('Skincare routines unavailable', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [routine]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const selectRoutine = (next: SkincareRoutine) => {
    setDraft(null);
    setRoutine(next);
  };

  const toggleRoutine = async (enabled: boolean) => {
    try {
      await setRoutineEnabled(routine, enabled);
      await load();
    } catch (error) {
      Alert.alert('Could not update routine', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const beginAdd = () => setDraft(emptyDraft());
  const beginEdit = (step: SkincareStep) => setDraft({
    id: step.id,
    label: step.label,
    description: step.description ?? '',
    optional: Boolean(step.is_optional),
    enabled: Boolean(step.enabled),
    weekdays: step.weekdays.split(',').filter(Boolean).map(Number),
  });

  const saveDraft = async () => {
    if (!draft) return;
    try {
      if (draft.id) {
        await updateStep(draft.id, draft);
      } else {
        await addStep(routine, draft.label, { description: draft.description, optional: draft.optional, weekdays: draft.weekdays });
      }
      setDraft(null);
      await load();
    } catch (error) {
      Alert.alert('Could not save step', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const setStatus = async (step: SkincareStep, status: SkincareStatus) => {
    try {
      await setStepStatus(step.id, status);
      await load();
    } catch (error) {
      Alert.alert('Could not update step', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const deleteStep = (step: SkincareStep) => Alert.alert('Delete this step?', `Remove "${step.label}" from this routine? Its history will be kept.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try {
        await removeStep(step.id);
        if (draft?.id === step.id) setDraft(null);
        await load();
      } catch (error) {
        Alert.alert('Could not delete step', error instanceof Error ? error.message : 'Please try again.');
      }
    } },
  ]);

  const moveStep = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= allSteps.length) return;
    const next = [...allSteps];
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await reorderSteps(routine, next.map(step => step.id));
      await load();
    } catch (error) {
      Alert.alert('Could not reorder steps', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const selectedRoutine = routineOptions.find(item => item.key === routine)!;
  const weekly = history?.weekly.find(item => item.routine === routine);
  const monthly = history?.monthly.find(item => item.routine === routine);

  return (
    <Screen safeAreaBottom>
      <Heading sub="Simple steps, in the order that works for you.">Skin care</Heading>

      <View style={{ flexDirection: 'row', gap: spacing.xs, padding: spacing.xxs, borderRadius: radii.card, backgroundColor: colors.soft, marginBottom: spacing.md }}>
        {routineOptions.map(option => {
          const selected = option.key === routine;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => selectRoutine(option.key)}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: spacing.touchTarget + spacing.xxs,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: spacing.xs,
                borderRadius: radii.control,
                backgroundColor: selected ? colors.card : 'transparent',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: selected ? colors.text : colors.muted, fontSize: typography.body, fontWeight: selected ? '800' : '600' }}>
                {option.short} · {option.key}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={{ backgroundColor: routine === 'Morning' ? colors.soft : colors.card }}>
        <Row>
          <View style={{ flex: 1, minWidth: 0, paddingRight: spacing.xs }}>
            <Text style={{ color: colors.text, fontSize: typography.section, fontWeight: '800' }}>{selectedRoutine.title}</Text>
            <Muted>{routine === 'Morning' ? 'A fresh start for the day.' : 'A gentle end-of-day routine.'}</Muted>
          </View>
          <Switch
            accessibilityLabel={`Enable ${selectedRoutine.title}`}
            value={routineEnabled}
            onValueChange={toggleRoutine}
            trackColor={{ false: colors.border, true: colors.green }}
            thumbColor={colors.card}
          />
        </Row>
        <View style={{ marginTop: spacing.md }}>
          <Row>
            <Text style={{ color: colors.text, fontSize: typography.label, fontWeight: '700' }}>Today's progress</Text>
            <Text style={{ color: colors.muted, fontSize: typography.secondary }}>
              {progress?.completed ?? 0} / {progress?.required ?? 0} required
            </Text>
          </Row>
          <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: progress?.required ?? 0, now: progress?.completed ?? 0 }} style={{ height: 8, backgroundColor: colors.card, borderRadius: 8, overflow: 'hidden', marginTop: spacing.xs }}>
            <View style={{ width: `${progress?.required ? (progress.completed / progress.required) * 100 : 0}%`, height: '100%', backgroundColor: colors.green, borderRadius: 8 }} />
          </View>
          <Text style={{ color: colors.muted, fontSize: typography.secondary, marginTop: spacing.xs }}>
            {progress?.isComplete ? 'Routine complete for today.' : `${progress?.remaining ?? 0} required ${progress?.remaining === 1 ? 'step' : 'steps'} remaining. Optional steps are just for you.`}
          </Text>
        </View>
      </Card>

      {!routineEnabled ? (
        <Card><Muted>This routine is paused. Turn it on to see today's scheduled steps and track progress.</Muted></Card>
      ) : (
        <>
          <SectionHeading>Today's steps</SectionHeading>
          {loading ? <Card><Muted>Loading today's routine…</Muted></Card> : todaySteps.length === 0 ? (
            <Card><Muted>No steps are scheduled for today. Add a step or adjust its days in Manage steps.</Muted></Card>
          ) : todaySteps.map(step => {
            const status = step.completed ? 'completed' : step.skipped ? 'skipped' : 'pending';
            return (
              <Card key={step.id} style={{ borderColor: status === 'completed' ? colors.green : colors.border }}>
                <Row>
                  <View style={{ flex: 1, minWidth: 0, paddingRight: spacing.xs }}>
                    <Text style={{ color: colors.text, fontSize: typography.body, lineHeight: 21, fontWeight: '700' }}>{step.label}</Text>
                    {step.description ? <Text style={{ color: colors.muted, fontSize: typography.secondary, lineHeight: 18, marginTop: spacing.xxs }}>{step.description}</Text> : null}
                    <Text style={{ color: status === 'completed' ? colors.green : status === 'skipped' ? colors.muted : colors.accent, fontSize: typography.caption, fontWeight: '700', marginTop: spacing.xs }}>
                      {step.is_optional ? 'Optional · ' : ''}{status === 'completed' ? 'Completed' : status === 'skipped' ? 'Skipped' : 'Not completed'}
                    </Text>
                  </View>
                  <Pressable accessibilityRole="button" onPress={() => beginEdit(step)} style={{ minWidth: spacing.touchTarget, minHeight: spacing.touchTarget, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: colors.accent, fontSize: typography.label, fontWeight: '700' }}>Edit</Text>
                  </Pressable>
                </Row>
                <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm }}>
                  {status === 'pending' ? (
                    <>
                      <Button title="Complete" onPress={() => setStatus(step, 'completed')} />
                      <Button title="Skip today" secondary onPress={() => setStatus(step, 'skipped')} />
                    </>
                  ) : (
                    <Button title={status === 'completed' ? 'Undo completion' : 'Undo skip'} secondary onPress={() => setStatus(step, 'pending')} />
                  )}
                </View>
              </Card>
            );
          })}
        </>
      )}

      {draft ? (
        <Card>
          <SectionHeading>{draft.id ? 'Edit step' : 'Add a step'}</SectionHeading>
          <Label>Step name</Label>
          <Field value={draft.label} onChangeText={label => setDraft(current => current ? { ...current, label } : current)} placeholder="e.g. Cleanser" maxLength={80} returnKeyType="next" />
          <Label>Description (optional)</Label>
          <Field
            value={draft.description}
            onChangeText={description => setDraft(current => current ? { ...current, description } : current)}
            placeholder="A short note about this step"
            multiline
            textAlignVertical="top"
            maxLength={160}
            style={{ minHeight: 78 }}
          />
          <View style={{ gap: spacing.sm, marginVertical: spacing.xs }}>
            <Row>
              <View style={{ flex: 1, minWidth: 0, paddingRight: spacing.sm }}>
                <Text style={{ color: colors.text, fontSize: typography.body, fontWeight: '700' }}>Optional step</Text>
                <Muted>Doesn't hold up routine completion.</Muted>
              </View>
              <Switch value={draft.optional} onValueChange={optional => setDraft(current => current ? { ...current, optional } : current)} trackColor={{ false: colors.border, true: colors.green }} thumbColor={colors.card} />
            </Row>
            <Row>
              <View style={{ flex: 1, minWidth: 0, paddingRight: spacing.sm }}>
                <Text style={{ color: colors.text, fontSize: typography.body, fontWeight: '700' }}>Step enabled</Text>
                <Muted>Disabled steps stay saved, but aren't counted.</Muted>
              </View>
              <Switch value={draft.enabled} onValueChange={enabled => setDraft(current => current ? { ...current, enabled } : current)} trackColor={{ false: colors.border, true: colors.green }} thumbColor={colors.card} />
            </Row>
          </View>
          <Label>Scheduled days</Label>
          <View style={{ flexDirection: 'row', gap: spacing.xxs, marginBottom: spacing.sm }}>
            {weekdays.map(day => {
              const selected = draft.weekdays.includes(day.value);
              return (
                <Pressable
                  key={day.value}
                  accessibilityRole="checkbox"
                  accessibilityLabel={weekdayNames[day.value]}
                  accessibilityState={{ checked: selected }}
                  onPress={() => setDraft(current => current ? {
                    ...current,
                    weekdays: selected ? current.weekdays.filter(value => value !== day.value) : [...current.weekdays, day.value].sort((a, b) => a - b),
                  } : current)}
                  style={({ pressed }) => ({
                    flex: 1,
                    minWidth: 0,
                    minHeight: spacing.touchTarget,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radii.control,
                    backgroundColor: selected ? colors.soft : colors.card,
                    borderWidth: 1,
                    borderColor: selected ? colors.accent : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ color: selected ? colors.text : colors.muted, fontSize: typography.secondary, fontWeight: selected ? '800' : '500' }}>{day.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Button title={draft.id ? 'Save changes' : 'Add step'} onPress={saveDraft} />
          <Button title="Cancel" secondary onPress={() => setDraft(null)} />
        </Card>
      ) : (
        <Button title="Add Step" onPress={beginAdd} />
      )}

      <SectionHeading>Manage steps</SectionHeading>
      <Muted>Steps not scheduled today can still be edited here.</Muted>
      {allSteps.length === 0 ? <Card><Muted>No steps in this routine yet.</Muted></Card> : allSteps.map((step, index) => {
        const scheduledToday = step.weekdays.split(',').includes(String(new Date().getDay()));
        return (
          <Card key={step.id} style={{ padding: spacing.sm, opacity: step.enabled ? 1 : 0.68 }}>
            <Row>
              <View style={{ flex: 1, minWidth: 0, paddingRight: spacing.xs }}>
                <Text style={{ color: colors.text, fontSize: typography.body, fontWeight: '700' }}>{step.label}</Text>
                <Text style={{ color: colors.muted, fontSize: typography.secondary, lineHeight: 18, marginTop: spacing.xxs }}>
                  {step.enabled ? (scheduledToday ? 'Scheduled today' : 'Not scheduled today') : 'Disabled'}
                  {step.is_optional ? ' · Optional' : ' · Required'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Move ${step.label} up`} disabled={index === 0} onPress={() => moveStep(index, -1)} style={{ minWidth: spacing.touchTarget, minHeight: spacing.touchTarget, alignItems: 'center', justifyContent: 'center', opacity: index === 0 ? 0.35 : 1 }}>
                  <Text style={{ color: colors.accent, fontSize: 20 }}>↑</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Move ${step.label} down`} disabled={index === allSteps.length - 1} onPress={() => moveStep(index, 1)} style={{ minWidth: spacing.touchTarget, minHeight: spacing.touchTarget, alignItems: 'center', justifyContent: 'center', opacity: index === allSteps.length - 1 ? 0.35 : 1 }}>
                  <Text style={{ color: colors.accent, fontSize: 20 }}>↓</Text>
                </Pressable>
              </View>
            </Row>
            <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs }}>
              <Pressable accessibilityRole="button" onPress={() => beginEdit(step)} style={{ minHeight: spacing.touchTarget, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radii.control, backgroundColor: colors.soft }}>
                <Text style={{ color: colors.text, fontSize: typography.label, fontWeight: '700' }}>Edit</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => deleteStep(step)} style={{ minHeight: spacing.touchTarget, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radii.control, backgroundColor: '#FCEBED' }}>
                <Text style={{ color: '#A52C45', fontSize: typography.label, fontWeight: '800' }}>Delete</Text>
              </Pressable>
            </View>
          </Card>
        );
      })}

      <SectionHeading sub="Consistency is about showing up, not skin results.">Consistency history</SectionHeading>
      <Card>
        <Text style={{ color: colors.text, fontSize: typography.label, fontWeight: '700' }}>Last 7 days</Text>
        {weekly ? <SummaryLine title={selectedRoutine.title} summary={weekly} /> : null}
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />
        <Text style={{ color: colors.text, fontSize: typography.label, fontWeight: '700' }}>Last 30 days</Text>
        {monthly ? <SummaryLine title={selectedRoutine.title} summary={monthly} /> : null}
      </Card>
    </Screen>
  );
}
