import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, ClipPath, Defs, Path, Rect } from 'react-native-svg';
import { useReducedMotion } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { Button, Card, Field, Heading, Muted, Row, Screen, SectionHeading, spacing, typography, radii } from '../src/ui';
import { useTheme } from '../src/theme';
import { waterTotal, addWater, deleteWater, waterEntries, type WaterEntry } from '../src/repositories/water';
import { getSetting } from '../src/repositories/settings';

const GLASS_WIDTH = 168;
const GLASS_SCALE = GLASS_WIDTH / 132;
const GLASS_FRAME_HEIGHT = 194 * GLASS_SCALE;
const GLASS_HEIGHT = 172;
const WATER_BLUE = '#54B5E5';
const WAVE_HEIGHT = 18 * GLASS_SCALE;
const GLASS_INTERIOR = 'M12 12 H120 L114 168 Q113 184 102 184 H30 Q19 184 18 168 Z';
const AnimatedRect = Animated.createAnimatedComponent(Rect);

export default function Water() {
  const { colors } = useTheme();
  const [total, setTotal] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [custom, setCustom] = useState('');
  const [logs, setLogs] = useState<WaterEntry[]>([]);
  const fill = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(0)).current;
  const glassScale = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  const load = useCallback(async () => {
    const [amount, savedGoal, entries] = await Promise.all([waterTotal(), getSetting('waterGoal'), waterEntries()]);
    setTotal(amount);
    setGoal(Number(savedGoal) > 0 ? Number(savedGoal) : 2000);
    setLogs(entries);
  }, []);

  useFocusEffect(useCallback(() => {
    load().catch(error => Alert.alert('Water tracker unavailable', String(error)));
  }, [load]));

  const progress = Math.min(total / goal, 1);
  const waveSurfaceWidth = (72 + 36 * progress) * GLASS_SCALE;
  useEffect(() => {
    if (reducedMotion) {
      fill.setValue(progress * GLASS_HEIGHT);
      return;
    }
    const animation = Animated.timing(fill, { toValue: progress * GLASS_HEIGHT, duration: 520, useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [fill, progress, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      wave.setValue(0);
      return;
    }
    const animation = Animated.loop(Animated.timing(wave, { toValue: 1, duration: 1900, easing: Easing.linear, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [reducedMotion, wave]);

  const add = async (amount: number) => {
    try {
      await addWater(amount);
      await load();
      if (!reducedMotion) {
        Animated.sequence([
          Animated.spring(glassScale, { toValue: 1.035, useNativeDriver: true, speed: 24, bounciness: 5 }),
          Animated.spring(glassScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }),
        ]).start();
      }
      return true;
    } catch (error) {
      Alert.alert('Invalid amount', error instanceof Error ? error.message : 'Please try another amount.');
      return false;
    }
  };

  const remove = async (entryId: string) => {
    try {
      await deleteWater(entryId);
      await load();
    } catch (error) {
      Alert.alert('Could not delete water entry', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen>
      <Heading sub="A gentle way to keep track of your water.">Water tracker</Heading>

      <Card style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        <Animated.View accessibilityLabel="Glass filling with blue water" style={{ width: GLASS_WIDTH, height: GLASS_FRAME_HEIGHT, transform: [{ scale: glassScale }] }}>
          <Svg width={GLASS_WIDTH} height={GLASS_FRAME_HEIGHT} viewBox="0 0 132 194" style={{ position: 'absolute', left: 0, top: 0 }}>
            <Defs>
              <ClipPath id="glass-water-clip"><Path d={GLASS_INTERIOR}/></ClipPath>
            </Defs>
            <AnimatedRect
              x={0}
              y={fill.interpolate({ inputRange: [0, GLASS_HEIGHT], outputRange: [184, 12] })}
              width={132}
              height={fill}
              fill={WATER_BLUE}
              fillOpacity={0.82}
              clipPath="url(#glass-water-clip)"
            />
            {progress > 0.28 ? <Circle cx="43" cy="139" r="3.5" fill="#FFFFFF" fillOpacity={0.58}/> : null}
            {progress > 0.46 ? <Circle cx="92" cy="109" r="2.8" fill="#FFFFFF" fillOpacity={0.48}/> : null}
            {progress > 0.73 ? <Circle cx="71" cy="63" r="2.2" fill="#FFFFFF" fillOpacity={0.52}/> : null}
          </Svg>
          <Animated.View
            style={{
              position: 'absolute',
              top: fill.interpolate({
                inputRange: [0, GLASS_HEIGHT],
                outputRange: [175 * GLASS_SCALE, 3 * GLASS_SCALE],
              }),
              left: (132 - waveSurfaceWidth / GLASS_SCALE) * GLASS_SCALE / 2,
              width: waveSurfaceWidth,
              height: WAVE_HEIGHT,
              overflow: 'hidden',
              opacity: progress > 0 ? 1 : 0,
            }}
          >
            <Animated.View
              style={{
                width: waveSurfaceWidth * 2,
                height: WAVE_HEIGHT,
                transform: [{ translateX: wave.interpolate({ inputRange: [0, 1], outputRange: [0, -waveSurfaceWidth] }) }],
              }}
            >
              <Svg width={waveSurfaceWidth * 2} height={WAVE_HEIGHT} viewBox="0 0 216 18">
                <Path d="M0 9 C18 1 36 1 54 9 S90 17 108 9 S144 1 162 9 S198 17 216 9 L216 18 L0 18Z" fill={WATER_BLUE}/>
              </Svg>
            </Animated.View>
          </Animated.View>
          <Svg width={GLASS_WIDTH} height={GLASS_FRAME_HEIGHT} viewBox="0 0 132 194" style={{ position: 'absolute', left: 0, top: 0 }}>
            <Path d="M10 6 H122 L115 170 Q114 187 102 187 H30 Q18 187 17 170 Z" fill="#FFFFFF" fillOpacity={0.18}/>
            <Path d="M9 5 H123 L116 170 Q115 188 102 188 H30 Q17 188 16 170 Z" fill="none" stroke="#E8A6BD" strokeWidth={4} strokeLinejoin="round"/>
            <Path d="M10 7 Q66 3 122 7 M12 13 Q66 10 120 13" fill="none" stroke="#F4C9D8" strokeWidth={2.5} strokeLinecap="round"/>
            <Path d="M27 32 Q30 74 35 116 L39 159" fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.58}/>
            <Path d="M22 53 L29 53 M21 81 L31 81 M20 109 L29 109" fill="none" stroke="#F4C9D8" strokeWidth={2} strokeLinecap="round" opacity={0.8}/>
          </Svg>
          <View style={{ position: 'absolute', top: GLASS_FRAME_HEIGHT * 0.39, left: 20, right: 20, alignItems: 'center' }}>
            <Text style={{ color: progress > 0.48 ? '#FFFFFF' : colors.text, fontSize: 27, fontWeight: '800', textShadowColor: progress > 0.48 ? 'rgba(20,80,120,0.28)' : 'transparent', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>{total.toLocaleString()}</Text>
            <Text style={{ color: progress > 0.48 ? '#FFFFFF' : colors.muted, fontSize: 12, fontWeight: '600', textShadowColor: progress > 0.48 ? 'rgba(20,80,120,0.25)' : 'transparent', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>ml today</Text>
          </View>
        </Animated.View>

        <View style={{ width: '100%', marginTop: spacing.lg }}>
          <Row>
            <Text style={{ color: colors.text, fontSize: typography.body, fontWeight: '700' }}>Daily progress</Text>
            <Text style={{ color: colors.muted, fontSize: typography.secondary, fontWeight: '600', flexShrink: 1, textAlign: 'right' }}>{total.toLocaleString()} / {goal.toLocaleString()} ml</Text>
          </Row>
          <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: goal, now: Math.min(total, goal) }} style={{ height: 9, backgroundColor: colors.soft, borderRadius: 8, overflow: 'hidden', marginTop: spacing.sm }}>
            <View style={{ height: '100%', width: `${progress * 100}%`, borderRadius: 8, backgroundColor: WATER_BLUE }} />
          </View>
          <Muted>{total >= goal ? 'Daily goal reached — lovely work.' : `${(goal - total).toLocaleString()} ml to your daily goal`}</Muted>
          <Button style={{ alignSelf: 'flex-start' }} title="Adjust daily goal" secondary onPress={() => router.push({ pathname: '/(tabs)/settings', params: { section: 'waterGoal' } })} />
        </View>
      </Card>

      <Card>
        <SectionHeading>Add a glass</SectionHeading>
        <Muted>Choose an amount or enter your own.</Muted>
        <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, marginBottom: spacing.sm }}>
          {[{ amount: 150, label: 'Small' }, { amount: 250, label: 'Regular' }, { amount: 500, label: 'Large' }].map(({ amount, label }) => (
            <Pressable
              key={amount}
              accessibilityRole="button"
              accessibilityLabel={`Add ${amount} milliliters of water, ${label} glass`}
              onPress={() => { void add(amount); }}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                minHeight: 104,
                paddingHorizontal: spacing.xxs,
                borderRadius: radii.tile,
                backgroundColor: colors.soft,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
                <Ionicons name="add" size={27} color={colors.onAccent}/>
              </View>
              <Text style={{ color: colors.muted, fontSize: typography.caption, fontWeight: '600', marginTop: spacing.xxs }}>{label}</Text>
              <Text style={{ color: colors.accent, fontSize: typography.body, fontWeight: '800', marginTop: 2 }}>{amount} ml</Text>
            </Pressable>
          ))}
        </View>
        <Field value={custom} onChangeText={setCustom} keyboardType="number-pad" placeholder="Custom amount in ml" />
        <Button title="Add custom amount" onPress={async () => { if (await add(Number(custom))) setCustom(''); }} />
      </Card>

      <Card>
        <SectionHeading sub={`${logs.length} ${logs.length === 1 ? 'entry' : 'entries'}`}>Today's log</SectionHeading>
        {logs.length === 0
          ? <Muted>Your water entries will appear here.</Muted>
          : logs.map((entry, index) => (
            <View key={entry.id} style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, borderBottomWidth: index === logs.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft }}>
                <Ionicons name="water" size={18} color={WATER_BLUE} />
              </View>
              <Text style={{ flex: 1, minWidth: 0, color: colors.muted, fontSize: typography.body, marginLeft: spacing.sm }}>
                {new Date(entry.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </Text>
              <Text style={{ color: colors.text, fontSize: typography.body, fontWeight: '700', marginRight: spacing.sm }}>{entry.amount.toLocaleString()} ml</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${entry.amount} milliliter water entry`}
                onPress={() => Alert.alert('Delete water entry?', 'Remove this entry from today’s total?', [
                  { text: 'Keep entry', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => { void remove(entry.id); } },
                ])}
                style={({ pressed }) => ({ width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: colors.soft, opacity: pressed ? 0.72 : 1 })}
              >
                <Ionicons name="trash-outline" size={19} color={colors.text} />
              </Pressable>
            </View>
          ))}
      </Card>
    </Screen>
  );
}
