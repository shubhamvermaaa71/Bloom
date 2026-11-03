import {Stack} from 'expo-router';
import {useEffect} from 'react';
import {initializeDatabase} from '../src/services/database';
import {ThemeProvider,useTheme} from '../src/theme';
import {evaluateAchievements} from '../src/services/achievements';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';

function AppShell(){
 const {theme}=useTheme();
 return <>
  <StatusBar style={theme==='Dark'?'light':'dark'}/>
  <Stack screenOptions={{headerShown:false,animation:'fade'}}/>
 </>;
}

export default function RootLayout(){
 useEffect(()=>{
  initializeDatabase().then(()=>evaluateAchievements()).catch(console.error);
 },[]);
 return <SafeAreaProvider><ThemeProvider><AppShell/></ThemeProvider></SafeAreaProvider>;
}
