import React from 'react';
import {Text} from 'react-native';
import {Card, spacing, typography} from '../ui';
import {useTheme} from '../theme';
const quotes=[
  ['“No feeling is final.”','Rainer Maria Rilke'],
  ['“The secret of getting ahead is getting started.”','Mark Twain'],
  ['“Act as if what you do makes a difference. It does.”','William James'],
  ['“It always seems impossible until it is done.”','Nelson Mandela'],
  ['“Nothing diminishes anxiety faster than action.”','Walter Anderson'],
  ['“The journey of a thousand miles begins with one step.”','Lao Tzu'],
  ['“How we spend our days is, of course, how we spend our lives.”','Annie Dillard'],
  ['“Almost everything will work again if you unplug it for a few minutes, including you.”','Anne Lamott']
];
export function Quote(){
  const {colors}=useTheme(),d=new Date(),key=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
  const [quote,author]=quotes[key%quotes.length];
  return <Card style={{backgroundColor:colors.soft,borderWidth:0,padding:spacing.lg}}>
    <Text style={{fontSize:typography.section,lineHeight:25,fontWeight:'600',color:colors.text}}>{quote}</Text>
    <Text style={{marginTop:spacing.sm,color:colors.muted,fontSize:typography.secondary}}>— {author}</Text>
  </Card>;
}
