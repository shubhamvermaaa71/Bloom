import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, Pressable, ScrollView, TextInput, ViewStyle, Platform, useWindowDimensions, KeyboardAvoidingView, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { useSegments } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from './theme';

const fontFamily = Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'sans-serif' });
const headingFontFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
export const fontFamilies = { body: fontFamily, heading: headingFontFamily } as const;
export const spacing = {
 xxs: 4,
 xs: 8,
 sm: 12,
 md: 16,
 lg: 20,
 xl: 24,
 xxl: 32,
 screen: 20,
 card: 16,
 control: 12,
 touchTarget: 48,
 contentMaxWidth: 680,
} as const;

export const typography = {
 caption: 11,
 secondary: 12,
 body: 14,
 label: 13,
 section: 17,
 title: 28,
} as const;

export const radii = { control: 14, card: 22, tile: 18 } as const;

export function surfaceShadow(isDark: boolean): ViewStyle {
 return {
  shadowColor: isDark ? '#09070B' : '#30232A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: isDark ? 0.16 : 0.07,
  shadowRadius: 12,
  elevation: 3,
 };
}

export function TulipMark({size=31}:{size?:number}){
 const {colors}=useTheme();
 return <Svg width={size*27/31} height={size} viewBox="0 0 32 36" accessibilityLabel="Tulip">
  <Path d="M16 18C9 17 5 11 8 3c5 1 8 6 8 15Z" fill={colors.accent}/>
  <Path d="M16 18C12 10 13 3 17 1c5 5 5 11-1 17Z" fill={colors.accent}/>
  <Path d="M16 18c0-9 4-14 9-15 3 8-1 14-9 15Z" fill={colors.accent}/>
  <Path d="M16 18c-1 6 0 11 0 15m0-7c-5-4-8-4-10-3 2 5 6 6 10 5m0-2c4-5 7-6 10-5-1 5-5 8-10 8" fill="none" stroke={colors.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/>
 </Svg>;
}

export function AppHeader(){
 const {colors}=useTheme();
 const {width}=useWindowDimensions();
 const horizontalPadding=width<360?spacing.md:spacing.screen;
 return <View style={{height:66,paddingHorizontal:horizontalPadding,borderBottomWidth:1,borderBottomColor:colors.border,backgroundColor:colors.bg}}>
  <View style={{width:'100%',maxWidth:spacing.contentMaxWidth,alignSelf:'center',height:'100%',flexDirection:'row',alignItems:'center'}}>
   <View style={{width:42,height:42,borderRadius:15,backgroundColor:colors.soft,alignItems:'center',justifyContent:'center',marginRight:spacing.sm}}><TulipMark/></View>
  <View>
   <Text style={{fontFamily:headingFontFamily,fontSize:21,fontWeight:'700',letterSpacing:0.1,color:colors.text}}>Bloom</Text>
   <Text style={{fontFamily,fontSize:9,fontWeight:'700',letterSpacing:1.6,color:colors.muted,marginTop:1}}>WELLNESS</Text>
  </View>
  </View>
 </View>;
}

export function AppFooter(){
 const {colors}=useTheme();
 return <View style={{alignItems:'center',paddingTop:spacing.xl,paddingBottom:spacing.xs}}>
  <TulipMark/>
  <Text style={{fontFamily,fontSize:typography.secondary,fontWeight:'700',letterSpacing:0.5,color:colors.text,marginTop:spacing.xs}}>Bloom</Text>
  <Text style={{fontFamily,fontSize:typography.caption,lineHeight:16,color:colors.muted,marginTop:spacing.xxs,textAlign:'center'}}>Made with care, for your everyday wellbeing.</Text>
 </View>;
}

export function Screen({children,scroll=true,showHeader=true,showFooter=false,scrollRef}:{children:React.ReactNode;scroll?:boolean;showHeader?:boolean;showFooter?:boolean;scrollRef?:React.Ref<React.ComponentRef<typeof ScrollView>>}){
 const {colors}=useTheme();
 const {width}=useWindowDimensions();
 const segments=useSegments();
 const horizontalPadding=width<360?spacing.md:spacing.screen;
 const contentStyle={width:'100%' as const,maxWidth:spacing.contentMaxWidth,alignSelf:'center' as const,paddingHorizontal:horizontalPadding,paddingTop:spacing.md,paddingBottom:spacing.xxl,flexGrow:1 as const};
 const safeAreaEdges:('top'|'left'|'right'|'bottom')[]=segments[0]==='(tabs)'?['top','left','right']:['top','left','right','bottom'];
 return <SafeAreaView edges={safeAreaEdges} style={{flex:1,backgroundColor:colors.bg}}>
  {showHeader?<AppHeader/>:null}
  <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
   {scroll
    ? <ScrollView ref={scrollRef} contentContainerStyle={contentStyle} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS==='ios'?'interactive':'on-drag'}>{children}{showFooter?<AppFooter/>:null}</ScrollView>
    : <View style={[contentStyle,{paddingBottom:spacing.xl}]}>{children}{showFooter?<AppFooter/>:null}</View>}
  </KeyboardAvoidingView>
 </SafeAreaView>;
}
export function Card({children,style,onLayout}:{children:React.ReactNode;style?:ViewStyle;onLayout?:(event:LayoutChangeEvent)=>void}){
 const {colors,theme}=useTheme();
 const reducedMotion=useReducedMotion();
 const opacity=useRef(new Animated.Value(reducedMotion?1:0)).current;
 useEffect(()=>{
  if(reducedMotion){opacity.setValue(1);return}
  const animation=Animated.timing(opacity,{toValue:1,duration:160,useNativeDriver:true});
  animation.start();
  return ()=>animation.stop();
 },[opacity,reducedMotion]);
 const cardOpacity=Animated.multiply(opacity,style?.opacity??1);
 return <Animated.View onLayout={onLayout} style={[{backgroundColor:colors.card,borderRadius:radii.card,padding:spacing.md,marginBottom:spacing.md,borderWidth:1,borderColor:colors.border,...surfaceShadow(theme==='Dark')},style,{opacity:cardOpacity}]}>{children}</Animated.View>;
}
export function Heading({children,sub}:{children:React.ReactNode;sub?:string}){
 const {colors}=useTheme();return <View style={{marginBottom:spacing.xl}}><Text style={{fontFamily:headingFontFamily,fontSize:typography.title,lineHeight:37,fontWeight:'700',letterSpacing:-0.4,color:colors.text}}>{children}</Text>{sub?<Text style={{fontFamily,fontSize:typography.body,lineHeight:21,color:colors.muted,marginTop:spacing.xxs}}>{sub}</Text>:null}</View>;
}
export function SectionHeading({children,sub}:{children:React.ReactNode;sub?:string}){
 const {colors}=useTheme();return <View style={{marginTop:spacing.xs,marginBottom:spacing.sm}}><Text style={{fontFamily:headingFontFamily,fontSize:typography.section,lineHeight:24,fontWeight:'700',color:colors.text}}>{children}</Text>{sub?<Text style={{fontFamily,fontSize:typography.secondary,lineHeight:18,color:colors.muted,marginTop:spacing.xxs}}>{sub}</Text>:null}</View>;
}
export function Button({title,onPress,secondary=false,danger=false,disabled=false,style}:{title:string;onPress:()=>void;secondary?:boolean;danger?:boolean;disabled?:boolean;style?:ViewStyle}){
 const {colors}=useTheme();return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>({minHeight:spacing.touchTarget+4,backgroundColor:danger?'#FCEBED':secondary?colors.soft:colors.accent,paddingVertical:spacing.sm,paddingHorizontal:spacing.md,borderRadius:radii.control,alignItems:'center',justifyContent:'center',marginTop:spacing.xs,...style,opacity:disabled?0.5:pressed?0.82:1})}><Text style={{fontFamily,fontSize:typography.body,color:danger?'#A52C45':secondary?colors.text:colors.onAccent,fontWeight:'700',letterSpacing:0.1,textAlign:'center'}}>{title}</Text></Pressable>;
}
export function Row({children,style}:{children:React.ReactNode;style?:ViewStyle}){return <View style={[{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:spacing.sm},style]}>{children}</View>}
export function Label({children}:{children:string}){const {colors}=useTheme();return <Text style={{fontFamily,fontSize:typography.label,fontWeight:'700',letterSpacing:0.2,color:colors.text,marginBottom:spacing.xs}}>{children}</Text>}
export function Field(props:React.ComponentProps<typeof TextInput>){const {colors}=useTheme();return <TextInput placeholderTextColor={colors.muted} {...props} style={[{fontFamily,fontSize:15,backgroundColor:colors.soft,borderRadius:radii.control,paddingHorizontal:spacing.md,paddingVertical:spacing.sm,color:colors.text,marginBottom:spacing.xs,minHeight:spacing.touchTarget+4},props.style]}/>}
export function Muted({children}:{children:React.ReactNode}){const {colors}=useTheme();return <Text style={{fontFamily,color:colors.muted,fontSize:typography.label,lineHeight:20}}>{children}</Text>}

export function RadioOption({label,description,selected,onPress}:{label:string;description?:string;selected:boolean;onPress:()=>void}){
 const {colors}=useTheme();
 const dotScale=useRef(new Animated.Value(selected?1:0)).current;
 useEffect(()=>{Animated.spring(dotScale,{toValue:selected?1:0,useNativeDriver:true,speed:22,bounciness:7}).start()},[dotScale,selected]);
 return <Pressable accessibilityRole="radio" accessibilityState={{checked:selected}} onPress={onPress} style={({pressed})=>({minHeight:58,flexDirection:'row',alignItems:'center',padding:spacing.sm,marginBottom:spacing.sm,borderRadius:17,borderWidth:1,borderColor:selected?colors.accent:colors.border,backgroundColor:selected?colors.soft:colors.card,opacity:pressed?0.82:1})}>
  <View style={{width:22,height:22,borderRadius:11,borderWidth:1.7,borderColor:selected?colors.accent:colors.muted,alignItems:'center',justifyContent:'center',marginRight:spacing.sm}}>
   <Animated.View style={{width:11,height:11,borderRadius:6,backgroundColor:colors.accent,transform:[{scale:dotScale}]}}/>
  </View>
  <View style={{flex:1}}>
   <Text style={{fontFamily,fontSize:typography.body,fontWeight:'700',color:colors.text}}>{label}</Text>
   {description?<Text style={{fontFamily,fontSize:typography.secondary,lineHeight:18,color:colors.muted,marginTop:spacing.xxs}}>{description}</Text>:null}
  </View>
 </Pressable>;
}
