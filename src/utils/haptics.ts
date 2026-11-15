import * as Haptics from 'expo-haptics';

async function runHaptic(action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    console.warn('Haptic feedback is unavailable.', error);
  }
}

export const haptics = {
  tap: () => runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  selection: () => runHaptic(() => Haptics.selectionAsync()),
  success: () => runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: async () => {
    await runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    await runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },
};
