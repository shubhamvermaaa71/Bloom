import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Screen, Card, Heading, Button, Field, Muted, SectionHeading, spacing, typography, radii, surfaceShadow, fontFamilies } from '../../src/ui';
import { useTheme } from '../../src/theme';
import { entries, saveEntry, deleteEntry } from '../../src/repositories/journal';

export default function Journal() {
  const { colors, theme } = useTheme();
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [editing, setEditing] = useState<string | undefined>();
  const [openMenuId, setOpenMenuId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    entries().then(setItems).catch(error => Alert.alert('Journal error', String(error)));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveEntry(title, body, editing);
      setTitle('');
      setBody('');
      setEditing(undefined);
      load();
    } catch (error) {
      Alert.alert('Cannot save', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditing(undefined);
    setTitle('');
    setBody('');
  };

  const remove = async (entryId: string) => {
    try {
      await deleteEntry(entryId);
      setOpenMenuId(undefined);
      load();
    } catch (error) {
      Alert.alert('Cannot delete entry', error instanceof Error ? error.message : 'Please try again.');
    }
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
        <Button title={saving ? 'Saving…' : editing ? 'Update entry' : 'Save entry'} disabled={saving} onPress={save} />
        {editing ? <Button title="Cancel editing" secondary onPress={cancelEditing} /> : null}
      </Card>

      {items.map(entry => (
        <Card key={entry.id} style={openMenuId === entry.id ? { zIndex: 2 } : undefined}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: fontFamilies.heading, color: colors.text, fontSize: typography.section, lineHeight: 24, fontWeight: '700' }}>
                {entry.title}
              </Text>
              <Text style={{ color: colors.muted, fontSize: typography.caption, marginTop: spacing.xxs }}>
                {new Date(entry.updated_at).toLocaleString()}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`More options for ${entry.title}`}
              accessibilityState={{ expanded: openMenuId === entry.id }}
              onPress={() => setOpenMenuId(openMenuId === entry.id ? undefined : entry.id)}
              style={({ pressed }) => ({ width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radii.control, backgroundColor: colors.soft, opacity: pressed ? 0.72 : 1 })}
            >
              <Ionicons name="ellipsis-vertical" size={19} color={colors.accent} />
            </Pressable>
          </View>
          {openMenuId === entry.id ? (
            <View style={{ alignSelf: 'flex-end', minWidth: 152, marginTop: spacing.xs, marginBottom: spacing.xs, padding: spacing.xxs, borderRadius: radii.control, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, ...surfaceShadow(theme === 'Dark') }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => { setOpenMenuId(undefined); setEditing(entry.id); setTitle(entry.title); setBody(entry.body); }}
                style={({ pressed }) => ({ minHeight: spacing.touchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radii.control, backgroundColor: colors.soft, opacity: pressed ? 0.78 : 1 })}
              >
                <Ionicons name="pencil-outline" size={17} color={colors.accent} />
                <Text style={{ color: colors.text, fontSize: typography.label, fontWeight: '700' }}>Edit entry</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => Alert.alert('Delete entry?', 'This cannot be undone.', [
                  { text: 'Keep entry', style: 'cancel' },
                  { text: 'Delete entry', style: 'destructive', onPress: () => { void remove(entry.id); } },
                ])}
                style={({ pressed }) => ({ minHeight: spacing.touchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxs, paddingHorizontal: spacing.sm, borderRadius: radii.control, backgroundColor: '#FCEBED', opacity: pressed ? 0.78 : 1 })}
              >
                <Ionicons name="trash-outline" size={17} color="#A52C45" />
                <Text style={{ color: '#A52C45', fontSize: typography.label, fontWeight: '700' }}>Delete entry</Text>
              </Pressable>
            </View>
          ) : null}
          <Text style={{ color: colors.text, fontSize: typography.body, lineHeight: 22, marginTop: spacing.sm }}>
            {entry.body}
          </Text>
        </Card>
      ))}
      {items.length === 0 ? <Muted>Your entries will appear here. Entries are saved locally on this device.</Muted> : null}
    </Screen>
  );
}
