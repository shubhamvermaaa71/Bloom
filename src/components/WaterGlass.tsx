import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme';

const WATER_BLUE = '#54B5E5';
const GLASS_HEIGHT = 172;
const WAVE_PERIOD = 108;
const WAVE_WIDTH = WAVE_PERIOD * 2;

export function WaterGlass({ total, progress, size = 1 }: { total: number; progress: number; size?: number }) {
  const { colors } = useTheme();
  const fill = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    const animation = Animated.timing(fill, { toValue: clampedProgress * GLASS_HEIGHT, duration: 700, useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [clampedProgress, fill]);

  useEffect(() => {
    const animation = Animated.loop(Animated.timing(wave, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [wave]);

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${total.toLocaleString()} milliliters of water today`}
      style={{ width: 132 * size, height: 194 * size, transform: [{ scale: 1 }] }}
    >
      <View style={{ position: 'absolute', top: 12 * size, left: 13 * size, right: 13 * size, bottom: 10 * size, overflow: 'hidden', borderBottomLeftRadius: 19 * size, borderBottomRightRadius: 19 * size }}>
        <Animated.View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: fill.interpolate({ inputRange: [0, GLASS_HEIGHT], outputRange: [0, GLASS_HEIGHT * size] }), backgroundColor: WATER_BLUE, opacity: 0.78 }}>
          <Animated.View style={{ position: 'absolute', top: -8 * size, left: 0, width: WAVE_WIDTH * size, height: 18 * size, transform: [{ translateX: wave.interpolate({ inputRange: [0, 1], outputRange: [0, -WAVE_PERIOD * size] }) }] }}>
            <Svg width={WAVE_WIDTH * size} height={18 * size} viewBox={`0 0 ${WAVE_WIDTH} 18`}>
              <Path d="M0 9 C18 1 36 1 54 9 S90 17 108 9 S144 1 162 9 S198 17 216 9 L216 18 L0 18Z" fill={WATER_BLUE} />
            </Svg>
          </Animated.View>
          <View style={{ position: 'absolute', width: 7 * size, height: 7 * size, borderRadius: 4 * size, backgroundColor: '#FFFFFF', opacity: 0.48, left: '28%', bottom: '29%' }} />
          <View style={{ position: 'absolute', width: 5 * size, height: 5 * size, borderRadius: 3 * size, backgroundColor: '#FFFFFF', opacity: 0.4, left: '68%', bottom: '52%' }} />
        </Animated.View>
      </View>
      <Svg width={132 * size} height={194 * size} viewBox="0 0 132 194" style={{ position: 'absolute', left: 0, top: 0 }}>
        <Path d="M9 5 H123 V170 Q123 188 105 188 H27 Q9 188 9 170 Z" fill="none" stroke={WATER_BLUE} strokeWidth={3.5} strokeLinejoin="round" opacity={0.72} />
        <Path d="M12 12 H120 M15 52 H25 M15 80 H27 M15 108 H25" fill="none" stroke={WATER_BLUE} strokeWidth={2.5} strokeLinecap="round" opacity={0.55} />
      </Svg>
      <View style={{ position: 'absolute', top: 66 * size, left: 20 * size, right: 20 * size, alignItems: 'center' }}>
        <Text style={{ color: clampedProgress > 0.48 ? '#FFFFFF' : colors.text, fontSize: 24 * size, fontWeight: '800', textShadowColor: clampedProgress > 0.48 ? 'rgba(20,80,120,0.28)' : 'transparent', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
          {total.toLocaleString()}
        </Text>
        <Text style={{ color: clampedProgress > 0.48 ? '#FFFFFF' : colors.muted, fontSize: 12 * size, fontWeight: '600' }}>ml today</Text>
      </View>
    </View>
  );
}
