import { Pressable, type PressableStateCallbackType, type StyleProp, type ViewStyle } from 'react-native';
import type { PressableProps } from 'react-native';
import Animated, { type AnimatedStyle, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { haptics } from '../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: PressableProps['style'] | AnimatedStyle<ViewStyle> | readonly (StyleProp<ViewStyle> | AnimatedStyle<ViewStyle>)[];
  hapticType?: keyof typeof haptics;
};

export function PressableScale({ hapticType = 'tap', onPressIn, onPressOut, style, ...props }: Props) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value < 1 ? 0.9 : 1,
  }));

  return (
    <AnimatedPressable
      {...props}
      onPressIn={event => {
        scale.value = reducedMotion ? 1 : withSpring(0.96, { damping: 16, stiffness: 260 });
        void haptics[hapticType]();
        onPressIn?.(event);
      }}
      onPressOut={event => {
        scale.value = reducedMotion ? 1 : withSpring(1, { damping: 14, stiffness: 220 });
        onPressOut?.(event);
      }}
      style={(state: PressableStateCallbackType) => [typeof style === 'function' ? style(state) : style, animatedStyle]}
    />
  );
}
