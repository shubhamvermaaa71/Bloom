import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography, radii } from '../../src/ui';

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { height: 68 + insets.bottom, paddingTop: spacing.xs, paddingBottom: spacing.xs + insets.bottom, paddingHorizontal: spacing.xs, backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1, elevation: 10 },
    tabBarLabelStyle: { fontSize: typography.caption, fontWeight: '600', marginTop: spacing.xxs },
    tabBarItemStyle: { borderRadius: radii.tile, marginHorizontal: spacing.xxs },
    tabBarIcon: ({ color, size }) => {
      const icons: Record<string, keyof typeof Ionicons.glyphMap> = { index:'home-outline', habits:'checkmark-circle-outline', journal:'book-outline', progress:'stats-chart-outline', settings:'settings-outline' };
      const activeColor = typeof color === 'string' ? color : colors.accent;
      const active = activeColor === colors.accent;
      return <View style={{ minWidth: 48, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: active ? colors.soft : 'transparent' }}>
        <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={activeColor} />
      </View>;
    }
  })}>
    <Tabs.Screen name="index" options={{ title: 'Home' }} />
    <Tabs.Screen name="habits" options={{ title: 'Habits' }} />
    <Tabs.Screen name="journal" options={{ title: 'Journal' }} />
    <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
    <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
  </Tabs>;
}
