import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography, radii } from '../../src/ui';

export default function TabLayout() {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={({ route }) => ({
    headerShown: false,
    animation: 'fade',
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: {
      height: 68 + insets.bottom,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs + insets.bottom,
      paddingHorizontal: spacing.xs,
      backgroundColor: colors.card,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      shadowColor: theme === 'Dark' ? '#09070B' : '#30232A',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: theme === 'Dark' ? 0.16 : 0.07,
      shadowRadius: 12,
      elevation: 8,
    },
    tabBarLabelStyle: { fontSize: typography.caption, fontWeight: '600', marginTop: spacing.xxs },
    tabBarItemStyle: { borderRadius: radii.tile, marginHorizontal: spacing.xxs },
    tabBarIcon: ({ color, size, focused }) => {
      const icons: Record<string, { active: keyof typeof MaterialCommunityIcons.glyphMap; inactive: keyof typeof MaterialCommunityIcons.glyphMap }> = {
        index: { active: 'home', inactive: 'home-outline' },
        habits: { active: 'checkbox-marked-circle', inactive: 'checkbox-marked-circle-outline' },
        journal: { active: 'book-open-page-variant', inactive: 'book-open-page-variant-outline' },
        progress: { active: 'chart-box', inactive: 'chart-box-outline' },
        settings: { active: 'cog', inactive: 'cog-outline' },
      };
      const activeColor = typeof color === 'string' ? color : colors.accent;
      const icon = icons[route.name];
      return <View style={{ minWidth: 48, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: focused ? colors.soft : 'transparent' }}>
        <MaterialCommunityIcons name={icon ? (focused ? icon.active : icon.inactive) : 'circle-outline'} size={size} color={activeColor} />
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
