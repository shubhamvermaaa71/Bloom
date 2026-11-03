import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen, Card, Heading, Button, Field, Muted, SectionHeading, spacing, typography, radii } from '../../src/ui';
import { useTheme } from '../../src/theme';
import { entries, saveEntry, deleteEntry } from '../../src/repositories/journal';

export default function Journal() {
  const { colors } = useTheme();
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [editing, setEditing] = useState<string | undefined>();

  const load = useCallback(() => {
    entries().then(setItems).catch(error => Alert.alert('Journal error', String(error)));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    try {
      await saveEntry(title, body, editing);
      setTitle('');
      setBody('');
      setEditing(undefined);
      load();
    } catch (error) {
      Alert.alert('Cannot save', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const cancelEditing = () => {
    setEditing(undefined);
    setTitle('');
    setBody('');
  };

  return (
    <Screen>
      <Heading sub="Your private space for thoughts and reflection.">Journal</Heading>

      <Card>
        <SectionHeading>{editing ? 'Edit entry' : 'New entry'}</SectionHeading>
        <Field value={title} onChangeText={setTitle} placeholder="Entry title" returnKeyType="next" />
        <Field
          value={body}
          onChangeText={setBody}
          placeholder="What's on your mind?"
          multiline
          textAlignVertical="top"
          style={{ minHeight: 140 }}
        />
        <Button title={editing ? 'Update entry' : 'Save entry'} onPress={save} />
        {editing ? <Button title="Cancel editing" secondary onPress={cancelEditing} /> : null}
      </Card>

      {items.map(entry => (
        <Card key={entry.id}>
          <Text style={{ color: colors.text, fontSize: typography.section, lineHeight: 24, fontWeight: '700' }}>
            {entry.title}
          </Text>
          <Text style={{ color: colors.muted, fontSize: typography.caption, marginTop: spacing.xxs }}>
            {new Date(entry.updated_at).toLocaleString()}
          </Text>
          <Text style={{ color: colors.text, fontSize: typography.body, lineHeight: 22, marginTop: spacing.sm }}>
            {entry.body}
          </Text>
          <View style={{ marginTop: spacing.sm, gap: spacing.xs, alignSelf: 'flex-start', minWidth: 140 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => { setEditing(entry.id); setTitle(entry.title); setBody(entry.body); }}
              style={({ pressed }) => ({
                minHeight: spacing.touchTarget,
                justifyContent: 'center',
                paddingHorizontal: spacing.md,
                borderRadius: radii.control,
                backgroundColor: colors.soft,
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <Text style={{ color: colors.text, fontSize: typography.label, fontWeight: '700', textAlign: 'center' }}>Edit entry</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => Alert.alert('Delete entry?', 'This cannot be undone.', [
                { text: 'Keep entry', style: 'cancel' },
                { text: 'Delete entry', style: 'destructive', onPress: async () => { await deleteEntry(entry.id); load(); } },
              ])}
              style={({ pressed }) => ({
                minHeight: spacing.touchTarget,
                justifyContent: 'center',
                paddingHorizontal: spacing.md,
                borderRadius: radii.control,
                backgroundColor: '#FCEBED',
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <Text style={{ color: '#A52C45', fontSize: typography.label, fontWeight: '800', textAlign: 'center' }}>Delete entry</Text>
            </Pressable>
          </View>
        </Card>
      ))}
      {items.length === 0 ? <Muted>Your entries will appear here. Entries are saved locally on this device.</Muted> : null}
    </Screen>
  );
}
