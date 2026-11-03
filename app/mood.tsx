import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { Screen, Card, Heading, Field, Button, Muted, RadioOption, SectionHeading, spacing, typography } from '../src/ui';
import { useTheme } from '../src/theme';
import { getMood, saveMood, moodHistory } from '../src/repositories/mood';

const moods = ['Happy', 'Calm', 'Okay', 'Low', 'Stressed'];

export default function Mood() {
  const { colors } = useTheme();
  const [selected, setSelected] = useState('');
  const [reflection, setReflection] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  const load = async () => {
    const mood = await getMood();
    if (mood) {
      setSelected(mood.mood);
      setReflection(mood.reflection);
    }
    setHistory(await moodHistory());
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!selected) {
      Alert.alert('Choose a mood', 'Select one option first.');
      return;
    }
    await saveMood(selected, reflection);
    await load();
    Alert.alert('Saved', 'Your check-in is stored on this device.');
  };

  return (
    <Screen safeAreaBottom>
      <Heading sub="A personal reflection, not a medical assessment.">Mood check-in</Heading>

      <Card>
        <SectionHeading>How are you feeling?</SectionHeading>
        <Text style={{ color: colors.muted, fontSize: typography.secondary, lineHeight: 18, marginBottom: spacing.sm }}>
          Choose the option that feels closest today.
        </Text>
        {moods.map(mood => (
          <RadioOption
            key={mood}
            label={mood}
            selected={selected === mood}
            onPress={() => setSelected(mood)}
          />
        ))}
        <Field
          value={reflection}
          onChangeText={setReflection}
          placeholder="Anything you'd like to note? (optional)"
          multiline
          textAlignVertical="top"
          style={{ minHeight: 104, marginTop: spacing.xxs }}
        />
        <Button title="Save today's check-in" onPress={save} />
      </Card>

      <SectionHeading sub="Your previous check-ins">Mood history</SectionHeading>
      {history.map(item => (
        <Card key={item.day}>
          <Text style={{ color: colors.text, fontSize: typography.body, fontWeight: '700' }}>
            {item.mood} · {item.day}
          </Text>
          {item.reflection ? <Text style={{ marginTop: spacing.xs }}><Muted>{item.reflection}</Muted></Text> : null}
        </Card>
      ))}
      {history.length === 0 ? <Muted>No previous check-ins yet.</Muted> : null}
    </Screen>
  );
}
