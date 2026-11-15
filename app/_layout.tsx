import {Stack} from 'expo-router';
import {useCallback, useEffect, useState} from 'react';
import {View} from 'react-native';
import {initializeDatabase} from '../src/services/database';
import {ThemeProvider,useTheme} from '../src/theme';
import {evaluateAchievements} from '../src/services/achievements';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AnimatedSplash} from '../src/components/AnimatedSplash';

function AppShell(){
 const {theme}=useTheme();
 const [showSplash,setShowSplash]=useState(true);
 const finishSplash=useCallback(()=>setShowSplash(false),[]);
 return <>
  <StatusBar style={theme==='Dark'?'light':'dark'}/>
  <View style={{flex:1}}>
   <Stack screenOptions={{headerShown:false,animation:'fade',animationDuration:180}}/>
   {showSplash?<AnimatedSplash onComplete={finishSplash}/>:null}
  </View>
 </>;
}

export default function RootLayout(){
 useEffect(()=>{
  initializeDatabase().then(()=>evaluateAchievements()).catch(console.error);
 },[]);
 return <SafeAreaProvider><ThemeProvider><AppShell/></ThemeProvider></SafeAreaProvider>;
}
