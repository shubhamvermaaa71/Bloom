import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { router, useFocusEffect } from 'expo-router';
import { Button, Card, Field, Heading, Muted, Row, Screen, SectionHeading, spacing, typography, radii } from '../src/ui';
import { useTheme } from '../src/theme';
import { waterTotal, addWater, undoWater } from '../src/repositories/water';
import { getSetting } from '../src/repositories/settings';

const GLASS_HEIGHT = 172;
const WATER_BLUE = '#54B5E5';
const WAVE_PERIOD = 108;
const WAVE_WIDTH = WAVE_PERIOD * 2;

export default function Water() {
  const { colors } = useTheme();
  const [total, setTotal] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [custom, setCustom] = useState('');
  const fill = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    const [amount, savedGoal] = await Promise.all([waterTotal(), getSetting('waterGoal')]);
    setTotal(amount);
    setGoal(Number(savedGoal) > 0 ? Number(savedGoal) : 2000);
  }, []);

  useFocusEffect(useCallback(() => {
    load().catch(error => Alert.alert('Water tracker unavailable', String(error)));
  }, [load]));

  const progress = Math.min(total / goal, 1);
  useEffect(() => {
    const animation = Animated.timing(fill, { toValue: progress * GLASS_HEIGHT, duration: 850, useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [fill, progress]);

  useEffect(() => {
    const animation = Animated.loop(Animated.timing(wave, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [wave]);

  const add = async (amount: number) => {
    try {
      await addWater(amount);
      await load();
    } catch (error) {
      Alert.alert('Invalid amount', error instanceof Error ? error.message : 'Please try another amount.');
    }
  };

  return (
    <Screen safeAreaBottom>
      <Heading sub="A gentle way to keep track of your water.">Water tracker</Heading>

      <Card style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        <View accessibilityLabel="Glass filling with blue water" style={{ width: 132, height: 194 }}>
          <View style={{ position: 'absolute', top: 12, left: 13, right: 13, bottom: 10, overflow: 'hidden', borderBottomLeftRadius: 19, borderBottomRightRadius: 19 }}>
            <Animated.View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: fill, backgroundColor: WATER_BLUE, opacity: 0.78 }}>
              <Animated.View style={{ position: 'absolute', top: -8, left: 0, width: WAVE_WIDTH, height: 18, transform: [{ translateX: wave.interpolate({ inputRange: [0, 1], outputRange: [0, -WAVE_PERIOD] }) }] }}>
                <Svg width={WAVE_WIDTH} height={18} viewBox={`0 0 ${WAVE_WIDTH} 18`}>
                  <Path d="M0 9 C18 1 36 1 54 9 S90 17 108 9 S144 1 162 9 S198 17 216 9 L216 18 L0 18Z" fill={WATER_BLUE}/>
                </Svg>
              </Animated.View>
              <View style={{ position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF', opacity: 0.48, left: '28%', bottom: '29%' }} />
              <View style={{ position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFFFFF', opacity: 0.4, left: '68%', bottom: '52%' }} />
              <View style={{ position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF', opacity: 0.5, left: '44%', bottom: '70%' }} />
            </Animated.View>
          </View>
          <Svg width={132} height={194} viewBox="0 0 132 194" style={{ position: 'absolute', left: 0, top: 0 }}>
            <Path d="M9 5 H123 V170 Q123 188 105 188 H27 Q9 188 9 170 Z" fill="none" stroke={WATER_BLUE} strokeWidth={3.5} strokeLinejoin="round" opacity={0.72}/>
            <Path d="M12 12 H120" fill="none" stroke={WATER_BLUE} strokeWidth={3} strokeLinecap="round" opacity={0.6}/>
            <Path d="M15 52 H25 M15 80 H27 M15 108 H25" fill="none" stroke={WATER_BLUE} strokeWidth={2.5} strokeLinecap="round" opacity={0.55}/>
          </Svg>
          <View style={{ position: 'absolute', top: 66, left: 20, right: 20, alignItems: 'center' }}>
            <Text style={{ color: progress > 0.48 ? '#FFFFFF' : colors.text, fontSize: 24, fontWeight: '800', textShadowColor: progress > 0.48 ? 'rgba(20,80,120,0.28)' : 'transparent', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>{total.toLocaleString()}</Text>
            <Text style={{ color: progress > 0.48 ? '#FFFFFF' : colors.muted, fontSize: 12, fontWeight: '600', textShadowColor: progress > 0.48 ? 'rgba(20,80,120,0.25)' : 'transparent', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>ml today</Text>
          </View>
        </View>

        <View style={{ width: '100%', marginTop: spacing.lg }}>
          <Row>
            <Text style={{ color: colors.text, fontSize: typography.body, fontWeight: '700' }}>Daily progress</Text>
            <Text style={{ color: colors.muted, fontSize: typography.secondary, fontWeight: '600', flexShrink: 1, textAlign: 'right' }}>{total.toLocaleString()} / {goal.toLocaleString()} ml</Text>
          </Row>
          <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: goal, now: Math.min(total, goal) }} style={{ height: 9, backgroundColor: colors.soft, borderRadius: 8, overflow: 'hidden', marginTop: spacing.sm }}>
            <View style={{ height: '100%', width: `${progress * 100}%`, borderRadius: 8, backgroundColor: WATER_BLUE }} />
          </View>
          <Muted>{total >= goal ? 'Daily goal reached — lovely work.' : `${(goal - total).toLocaleString()} ml to your daily goal`}</Muted>
          <Text style={{ color: colors.muted, fontSize: typography.caption, marginTop: spacing.xxs }}>Change your daily goal in Settings.</Text>
        </View>
      </Card>

      <Card>
        <SectionHeading>Add a glass</SectionHeading>
        <Muted>Choose an amount or enter your own.</Muted>
        <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, marginBottom: spacing.sm }}>
          {[150, 250, 500].map(amount => (
            <Pressable
              key={amount}
              accessibilityRole="button"
              accessibilityLabel={`Add ${amount} milliliters of water`}
              onPress={() => add(amount)}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                minHeight: 76,
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
              <Ionicons name="add-circle-outline" size={19} color="#54B5E5"/>
              <Text style={{ color: colors.text, fontSize: typography.secondary, fontWeight: '700', marginTop: spacing.xxs }}>{amount} ml</Text>
            </Pressable>
          ))}
        </View>
        <Field value={custom} onChangeText={setCustom} keyboardType="number-pad" placeholder="Custom amount in ml" />
        <Button title="Add custom amount" onPress={() => { const amount = Number(custom); add(amount); setCustom(''); }} />
        <Button title="Undo last addition" secondary onPress={async () => { await undoWater(); await load(); }} />
      </Card>
      <Button title="Change daily water quantity" secondary onPress={() => router.push({ pathname: '/(tabs)/settings', params: { section: 'waterGoal' } })} />
    </Screen>
  );
}
