import {homeHabits} from './homeSorting';
describe('homeHabits',()=>{
 it('shows at most three and prioritises incomplete habits',()=>{
  const h=[{id:'a',completed:true},{id:'b',completed:false},{id:'c',completed:false},{id:'d',completed:false},{id:'e',completed:true}];
  expect(homeHabits(h).map(x=>x.id)).toEqual(['b','c','d']);
 });
 it('fills remaining positions with completed habits',()=>{
  const h=[{id:'a',completed:true},{id:'b',completed:false}];
  expect(homeHabits(h).map(x=>x.id)).toEqual(['b','a']);
 });
});
