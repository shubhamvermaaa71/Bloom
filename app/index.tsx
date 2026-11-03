import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { getSetting } from '../src/repositories/settings';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  useEffect(() => { getSetting('onboardingComplete').then(v => { setOnboarded(v === 'true'); setReady(true); }).catch(() => setReady(true)); }, []);
  if (!ready) return null;
  return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
}
