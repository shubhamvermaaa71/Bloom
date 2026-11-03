import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { Screen, Card, Heading, Muted, Row, SectionHeading, spacing, typography } from '../src/ui';
import { useTheme } from '../src/theme';
import { gardenStats } from '../src/repositories/garden';
import { achievementList, evaluateAchievements } from '../src/services/achievements';

const stages = [
  { name: 'Seed', points: 0 },
  { name: 'Sprout', points: 10 },
  { name: 'Growing plant', points: 30 },
  { name: 'Flourishing plant', points: 60 },
  { name: 'Blooming flower', points: 100 },
];

function GardenFlower({ stage }: { stage: number }) {
  const { colors } = useTheme();
  const petals = stage >= 4 ? 8 : stage >= 3 ? 6 : 0;
  const flowerSize = stage >= 4 ? 19 : stage >= 3 ? 16 : 12;
  return (
    <Svg width={180} height={180} viewBox="0 0 180 180">
      <Ellipse cx="90" cy="157" rx="54" ry="9" fill={colors.border} opacity={0.75}/>
      {stage >= 1
        ? <Path d="M90 148 C88 124 94 105 91 82 C90 69 92 59 92 52" fill="none" stroke={colors.green} strokeWidth={6} strokeLinecap="round"/>
        : <Path d="M75 143 Q90 126 105 143Z" fill={colors.green} opacity={0.5}/>}
      {stage >= 2 ? <Path d="M91 125 C72 102 59 108 57 115 C68 128 79 131 91 125Z M92 112 C106 91 122 95 125 103 C116 116 105 119 92 112Z" fill={colors.green} opacity={0.95}/> : null}
      {stage >= 3 ? <Path d="M91 92 C74 72 65 76 63 83 C73 96 81 99 91 92Z" fill={colors.green}/> : null}
      {petals > 0 ? Array.from({ length: petals }, (_, index) => (
        <Ellipse key={index} cx="92" cy={52 - flowerSize * 0.62} rx={flowerSize * 0.48} ry={flowerSize * 0.78} fill={colors.accent} transform={`rotate(${index * (360 / petals)} 92 52)`}/>
      )) : null}
      {stage >= 3 ? <Circle cx="92" cy="52" r={stage >= 4 ? 8 : 6} fill="#F2C46D"/> : null}
      {stage === 0 ? <Ellipse cx="90" cy="138" rx="12" ry="18" fill={colors.green}/> : null}
      <Path d="M58 148 L122 148 L115 174 Q114 178 109 178 H71 Q66 178 65 174Z" fill={colors.soft} stroke={colors.border} strokeWidth={2}/>
      <Path d="M66 158 H114" stroke={colors.border} strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  );
}

export default function Garden() {
  const { colors } = useTheme();
  const [garden, setGarden] = useState<any>({ points: 0, stage: 'Seed', events: 0 });
  const [achievements, setAchievements] = useState<any[]>([]);

  const load = useCallback(async () => {
    await evaluateAchievements();
    const [stats, items] = await Promise.all([gardenStats(), achievementList()]);
    setGarden(stats);
    setAchievements(items);
  }, []);
  useFocusEffect(useCallback(() => { load().catch(error => console.error('Unable to load Garden', error)); }, [load]));

  const stageIndex = stages.reduce((current, stage, index) => garden.points >= stage.points ? index : current, 0);
  const nextStage = stages[stageIndex + 1];
  const stageProgress = nextStage
    ? Math.max(0, Math.min(1, (garden.points - stages[stageIndex].points) / (nextStage.points - stages[stageIndex].points)))
    : 1;
  const unlocked = achievements.filter(item => item.unlocked).length;

  return (
    <Screen safeAreaBottom>
      <Heading sub="Every caring moment helps your garden grow.">Bloom Garden</Heading>

      <Card style={{ alignItems: 'center', paddingVertical: spacing.lg, backgroundColor: colors.soft, borderWidth: 0 }}>
        <GardenFlower stage={stageIndex}/>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginTop: spacing.xs }}>{garden.stage}</Text>
        <Text style={{ color: colors.accent, fontSize: typography.body, fontWeight: '700', marginTop: spacing.xxs }}>{garden.points.toLocaleString()} growth points</Text>
        <Text style={{ color: colors.muted, fontSize: typography.secondary, marginTop: spacing.xxs }}>{garden.events} caring moments planted</Text>
        <View style={{ width: '100%', marginTop: spacing.lg }}>
          <Row>
            <View style={{ flex: 1, minWidth: 0, paddingRight: spacing.xs }}><Muted>{nextStage ? `Growing toward ${nextStage.name}` : 'Your garden is in full bloom'}</Muted></View>
            {nextStage ? <Text style={{ color: colors.muted, fontSize: typography.caption, flexShrink: 1, textAlign: 'right' }}>{nextStage.points - garden.points} points to go</Text> : null}
          </Row>
          <View style={{ height: 8, backgroundColor: colors.card, borderRadius: 8, overflow: 'hidden', marginTop: spacing.xs }}>
            <View style={{ height: '100%', width: `${stageProgress * 100}%`, backgroundColor: colors.green, borderRadius: 8 }}/>
          </View>
        </View>
      </Card>

      <SectionHeading>Your growth journey</SectionHeading>
      <Card style={{ paddingVertical: spacing.xs }}>
        {stages.map((stage, index) => {
          const reached = stageIndex >= index;
          return (
            <View key={stage.name} style={{ flexDirection: 'row', alignItems: 'center', minHeight: spacing.touchTarget + spacing.xs, paddingVertical: spacing.xxs }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: reached ? colors.soft : colors.bg }}>
                <Ionicons name={index === 0 ? 'ellipse-outline' : index === 4 ? 'flower-outline' : 'leaf-outline'} size={18} color={reached ? colors.green : colors.muted}/>
              </View>
              <View style={{ flex: 1, minWidth: 0, marginHorizontal: spacing.sm }}>
                <Text style={{ color: colors.text, fontSize: typography.label, fontWeight: reached ? '700' : '500' }}>{stage.name}</Text>
                <Text style={{ color: colors.muted, fontSize: typography.caption, marginTop: spacing.xxs }}>{stage.points} growth points</Text>
              </View>
              {reached ? <Ionicons name="checkmark-circle" size={19} color={colors.green}/> : <Ionicons name="lock-closed-outline" size={16} color={colors.muted}/>}
            </View>
          );
        })}
      </Card>

      <Row>
        <SectionHeading>Achievements</SectionHeading>
        <Text style={{ color: colors.muted, fontSize: typography.secondary, marginBottom: spacing.sm }}>{unlocked} of {achievements.length} unlocked</Text>
      </Row>
      {achievements.map(item => (
        <Card key={item.key} style={{ padding: spacing.md, opacity: item.unlocked ? 1 : 0.88 }}>
          <Row>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: item.unlocked ? colors.soft : colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm }}>
                <Ionicons name={item.unlocked ? item.icon : 'lock-closed-outline'} size={21} color={item.unlocked ? colors.accent : colors.muted}/>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: typography.body, fontWeight: '700' }}>{item.title}</Text>
                <Muted>{item.description}</Muted>
              </View>
            </View>
            {item.unlocked ? <Ionicons name="checkmark-circle" size={20} color={colors.green}/> : null}
          </Row>
          <View style={{ height: 6, backgroundColor: colors.soft, borderRadius: 6, overflow: 'hidden', marginTop: spacing.sm }}>
            <View style={{ height: '100%', width: `${Math.min(100, item.current / item.target * 100)}%`, backgroundColor: colors.green, borderRadius: 6 }}/>
          </View>
          <Text style={{ color: colors.muted, fontSize: typography.caption, marginTop: spacing.xs }}>{item.unlocked ? 'Earned and yours to keep' : `${Math.min(item.current, item.target)} of ${item.target} complete`}</Text>
        </Card>
      ))}
    </Screen>
  );
}
