import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { TulipMark } from '../ui';

export function AnimatedSplash({ onComplete }: { onComplete: () => void }) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const logoScale = useSharedValue(reducedMotion ? 1 : 0.6);
  const logoOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const titleOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const titleOffset = useSharedValue(reducedMotion ? 0 : 10);
  const opacity = useSharedValue(1);
  const logoStyle = useAnimatedStyle(() => ({ opacity: logoOpacity.value, transform: [{ scale: logoScale.value }] }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value, transform: [{ translateY: titleOffset.value }] }));
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    if (!reducedMotion) {
      logoScale.value = withSpring(1, { damping: 18, stiffness: 220 });
      logoOpacity.value = withTiming(1, { duration: 180 });
      titleOpacity.value = withDelay(70, withTiming(1, { duration: 180 }));
      titleOffset.value = withDelay(70, withTiming(0, { duration: 180 }));
      opacity.value = withDelay(360, withTiming(0, { duration: 180 }));
    } else {
      opacity.value = withTiming(0, { duration: 100 });
    }

    const timer = setTimeout(onComplete, reducedMotion ? 120 : 560);
    return () => clearTimeout(timer);
  }, [logoOpacity, logoScale, onComplete, opacity, reducedMotion, titleOffset, titleOpacity]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }, fadeStyle]}>
      <Animated.View style={logoStyle}>
        <TulipMark size={96} />
      </Animated.View>
      <Animated.View style={[{ alignItems: 'center', marginTop: 16 }, titleStyle]}>
        <Text style={{ color: colors.text, fontSize: 36, fontWeight: '800' }}>Bloom</Text>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 2 }}>WELLNESS</Text>
      </Animated.View>
    </Animated.View>
  );
}
