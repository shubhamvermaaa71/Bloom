import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setSetting, getSetting } from './repositories/settings';

const palettes = {
  'Soft Bloom': { bg:'#FBF5F3', card:'#FFFFFF', text:'#4D3D43', muted:'#927F86', accent:'#C97898', soft:'#F7E5EC', border:'#F0E2E6', green:'#8BA88C' },
  Lavender: { bg:'#F7F4FB', card:'#FFFFFF', text:'#443D55', muted:'#89819C', accent:'#9582C5', soft:'#ECE7F7', border:'#E8E1F2', green:'#8FAE9B' },
  Sage: { bg:'#F4F7F1', card:'#FFFFFF', text:'#3F5146', muted:'#7F9184', accent:'#769B82', soft:'#E5EFE5', border:'#DFE9DF', green:'#769B82' },
  Dark: { bg:'#19171D', card:'#26232C', text:'#F3EAF0', muted:'#B1A5B0', accent:'#D995B2', soft:'#3A303B', border:'#3B3540', green:'#8DAF98' }
};
type ThemeName = keyof typeof palettes;
const Ctx = createContext<{theme:ThemeName; colors:typeof palettes['Soft Bloom']; setTheme:(v:ThemeName)=>void}>({theme:'Soft Bloom',colors:palettes['Soft Bloom'],setTheme:()=>{}});
export function ThemeProvider({children}:{children:React.ReactNode}) {
  const [theme,setThemeState]=useState<ThemeName>('Soft Bloom');
  useEffect(()=>{getSetting('theme').then(v=>{if(v && v in palettes)setThemeState(v as ThemeName)}).catch(()=>{});},[]);
  const setTheme=(v:ThemeName)=>{setThemeState(v);setSetting('theme',v).catch(console.error)};
  const value=useMemo(()=>({theme,colors:palettes[theme],setTheme}),[theme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useTheme=()=>useContext(Ctx);
export const themeNames=Object.keys(palettes) as ThemeName[];
