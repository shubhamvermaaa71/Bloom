import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Screen, Card, Heading, Button, Field, Label, Row, Muted, spacing, typography, radii } from '../../src/ui';
import { useTheme } from '../../src/theme';
import { listHabits, saveHabit, deleteHabit, toggleHabit } from '../../src/repositories/habits';

export default function Habits() {
  const { colors } = useTheme();
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Personal');
  const [editing, setEditing] = useState<string | undefined>();
  const load = useCallback(() => { listHabits().then(setItems).catch(error => Alert.alert('Habits unavailable', String(error))); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (id: string, completed: boolean) => {
    try {
      await toggleHabit(id, !completed);
      load();
    } catch (error) {
      Alert.alert('Could not update habit', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const add = async () => {
    try {
      await saveHabit(name, category, editing);
      setName('');
      setEditing(undefined);
      load();
    } catch (error) {
      Alert.alert('Check habit', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen>
      <Heading sub="Small, kind promises to yourself.">Your habits</Heading>
      <Card>
        <Label>{editing ? 'Edit habit' : 'Add a habit'}</Label>
        <Field value={name} onChangeText={setName} placeholder="e.g. Read for 10 minutes" returnKeyType="done" />
        <Field value={category} onChangeText={setCategory} placeholder="Category" returnKeyType="done" />
        <Button title={editing ? 'Save changes' : 'Add habit'} onPress={add} />
        {editing ? <Button title="Cancel" secondary onPress={() => { setEditing(undefined); setName(''); }} /> : null}
      </Card>

      {items.length === 0 ? <Card><Muted>No habits yet. Add your first small step above.</Muted></Card> : items.map(habit => (
        <Card key={habit.id} style={{ padding: spacing.sm }}>
          <Row>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: Boolean(habit.completed) }}
              accessibilityLabel={`${habit.completed ? 'Mark incomplete' : 'Complete'} ${habit.name}`}
              onPress={() => toggle(habit.id, habit.completed)}
              hitSlop={4}
              style={({ pressed }) => ({
                width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                backgroundColor: habit.completed ? colors.green : colors.soft,
                borderWidth: 1, borderColor: habit.completed ? colors.green : colors.border,
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <Ionicons name={habit.completed ? 'checkmark' : 'ellipse-outline'} size={24} color={habit.completed ? '#FFFFFF' : colors.muted} />
            </Pressable>
            <Pressable onPress={() => toggle(habit.id, habit.completed)} style={{ flex: 1, minWidth: 0, minHeight: spacing.touchTarget, justifyContent: 'center', paddingHorizontal: spacing.sm }}>
              <Text style={{ color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: '700' }}>{habit.name}</Text>
              <Text style={{ color: colors.muted, fontSize: typography.secondary, lineHeight: 17, marginTop: spacing.xxs }}>{habit.category}{habit.completed ? ' · Done for today' : ''}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${habit.name}`} onPress={() => { setEditing(habit.id); setName(habit.name); setCategory(habit.category); }} style={{ width: spacing.touchTarget, height: spacing.touchTarget, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="pencil-outline" size={18} color={colors.accent} />
            </Pressable>
          </Row>
          <Pressable
            accessibilityRole="button"
            onPress={() => Alert.alert('Delete habit?', `Delete "${habit.name}" and its history?`, [
              { text: 'Keep habit', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => { await deleteHabit(habit.id); load(); } },
            ])}
            style={({ pressed }) => ({ alignSelf: 'flex-start', minHeight: spacing.touchTarget, marginTop: spacing.control, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radii.control, backgroundColor: '#FCEBED', opacity: pressed ? 0.75 : 1 })}
          >
            <Ionicons name="trash-outline" size={16} color="#A52C45" />
            <Text style={{ color: '#A52C45', fontSize: 13, fontWeight: '800' }}>Delete</Text>
          </Pressable>
        </Card>
      ))}
    </Screen>
  );
}
