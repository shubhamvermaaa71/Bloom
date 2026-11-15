import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, { interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme';

export function HabitCheckbox({ completed, size = 36 }: { completed: boolean; size?: number }) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const fill = useSharedValue(completed ? 1 : 0);
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(fill.value, [0, 1], [colors.soft, colors.accent]),
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    fill.value = reducedMotion ? (completed ? 1 : 0) : withTiming(completed ? 1 : 0, { duration: 180 });
    if (completed && !reducedMotion) {
      scale.value = withSequence(
        withSpring(0.8, { damping: 12 }),
        withSpring(1.15, { damping: 8 }),
        withSpring(1, { damping: 12 }),
      );
    }
  }, [completed, fill, reducedMotion, scale]);

  return (
    <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Ionicons name={completed ? 'checkmark' : 'ellipse-outline'} size={size * 0.58} color={completed ? colors.onAccent : colors.muted} />
    </Animated.View>
  );
}
