import path from 'node:path'
import {mkdir,writeFile} from 'node:fs/promises'
import {Resvg} from '@resvg/resvg-js'
import sharp from 'sharp'
import {svgFont} from '../../src/lib/svg-font'
export type XY={x:number;y:number}
export type Truth={id:string;image:string;synthetic:true;widthPx:number;heightPx:number;units:'m'|'px';pixelsPerMeter:number|null;rotationDegrees:number;rooms:{id:string;label:string;polygon:XY[];dimensions:{width:number;height:number}}[];walls:{id:string;a:XY;b:XY}[];doors:{id:string;at:XY;width:number|null;wallId:string;direction:null;ambiguous:boolean}[];annotations:{roomId:string;axis:'width'|'height';value:number;unit:'m'}[];missing:string[];expectedReview:string[];expectedValidation:'valid'|'needs_review';coordinateContract:string;coordinateUnits:'source_pixels';doorWidthUnit:'px';roomDimensionUnit:'m'|'px';doorDirectionSupport:'not_supported_by_existing_schema'}
const directory=path.resolve(import.meta.dir,'../../../../tests/fixtures/geometry-benchmark')
const point=(x:number,y:number)=>({x,y})
export async function generateFixtures(only?:string){
 await mkdir(directory,{recursive:true});const output:Truth[]=[]
 for(let index=0;index<8;index++){
  const id=['01-clean','02-connected','03-l-shape','04-rotated','05-low-resolution','06-missing-dimension','07-ambiguous-door','08-unknown-scale'][index]!
  if(only&&id!==only)continue
  const multi=index===1,lshape=index===2,low=index===4,unknown=index===7,ambiguous=index===6
  const scale=low?.5:1,angle=index===3?15:0,cx=340,cy=260
  const transform=(p:XY)=>{const a=angle*Math.PI/180,dx=p.x-cx,dy=p.y-cy;return point(Math.round((cx+dx*Math.cos(a)-dy*Math.sin(a))*scale*1000)/1000,Math.round((cy+dx*Math.sin(a)+dy*Math.cos(a))*scale*1000)/1000)}
  const polygon=lshape?[point(100,100),point(500,100),point(500,260),point(340,260),point(340,420),point(100,420)]:[point(100,100),point(multi?580:500,100),point(multi?580:500,340),point(100,340)]
  let rooms=multi?[{id:'room-a',label:'ROOM A',polygon:[point(100,100),point(340,100),point(340,340),point(100,340)]},{id:'room-b',label:'ROOM B',polygon:[point(340,100),point(580,100),point(580,340),point(340,340)]}]:[{id:'room-a',label:'ROOM A',polygon}]
  const walls=polygon.map((a,i)=>({id:'wall-'+i,a,b:polygon[(i+1)%polygon.length]!}))
  if(multi)walls.push({id:'partition',a:point(340,100),b:point(340,340)})
  const bottomId=lshape?'wall-4':'wall-2',doorAt=point(multi?220:300,lshape?420:340)
  const doors=[{id:'entry',at:doorAt,width:ambiguous?null:80,wallId:bottomId,direction:null,ambiguous},...(multi?[{id:'connection',at:point(340,220),width:80,wallId:'partition',direction:null,ambiguous:false}]:[])]
  const annotations:Truth['annotations']=unknown?[]:[{roomId:'room-a',axis:'width',value:multi?3:5,unit:'m'},...(index===5?[]:[{roomId:'room-a',axis:'height',value:lshape?4:3,unit:'m'} as const]),...(multi?[{roomId:'room-b',axis:'width',value:3,unit:'m'} as const,{roomId:'room-b',axis:'height',value:3,unit:'m'} as const]:[])]
  let drawing=''
  for(const wall of walls)drawing+=`<line x1="${wall.a.x}" y1="${wall.a.y}" x2="${wall.b.x}" y2="${wall.b.y}" stroke="black" stroke-width="8"/>`
  for(const door of doors){const vertical=door.wallId==='partition',w=door.width??80,x=door.at.x,y=door.at.y;drawing+=vertical?`<path d="M${x} ${y-w/2}v${w}" stroke="white" stroke-width="10"/><path d="M${x} ${y-w/2}h${w}a${w} ${w} 0 0 1 -${w} ${w}" fill="none" stroke="black" stroke-width="2"/>`:`<path d="M${x-w/2} ${y}h${w}" stroke="white" stroke-width="10"/><path d="M${x-w/2} ${y}v-${w}a${w} ${w} 0 0 1 ${w} ${w}" fill="none" stroke="${ambiguous?'#bbb':'black'}" stroke-width="2" ${ambiguous?'stroke-dasharray="5 7"':''}/>`}
  for(const room of rooms){const labelAt=room.id==='room-b'?point(460,160):point(multi?220:280,190);drawing+=`<text x="${labelAt.x}" y="${labelAt.y}" text-anchor="middle" font-size="20">${room.label}</text>`}
  if(!unknown){drawing+=`<text x="300" y="65" text-anchor="middle" font-size="18">${multi?'3.00 m + 3.00 m':'5.00 m'}</text>`;if(index!==5)drawing+=`<text x="40" y="220" font-size="18">${lshape?'4.00':'3.00'} m</text>`;drawing+=`<text x="${doorAt.x}" y="${doorAt.y+40}" text-anchor="middle" font-size="16">${ambiguous?'DOOR ? VERIFY':'1.00 m DOOR'}</text>`}
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="680" height="540"><rect width="680" height="540" fill="white"/><g font-family="Liberation Sans" transform="rotate(${angle} ${cx} ${cy})">${drawing}</g><text x="340" y="510" text-anchor="middle" font-family="Liberation Sans" font-size="17">${unknown?'SCALE UNKNOWN':index===5?'Width annotated; height not annotated. 80 pixels = 1 m.':ambiguous?'Ambiguous entry: confirm position and width. 80 pixels = 1 m.':low?'REFERENCE: 40 pixels = 1 m':'REFERENCE: 80 pixels = 1 m'}</text></svg>`
  let png=new Resvg(svg,{font:svgFont}).render().asPng()
  if(low)png=await sharp(png).resize(340,270).blur(.35).png().toBuffer()
  const truth:Truth={id,image:id+'.png',synthetic:true,widthPx:680*scale,heightPx:540*scale,units:unknown?'px':'m',pixelsPerMeter:unknown?null:80*scale,rotationDegrees:angle,rooms:rooms.map(r=>({...r,polygon:r.polygon.map(transform),dimensions:{width:(Math.max(...r.polygon.map(p=>p.x))-Math.min(...r.polygon.map(p=>p.x)))/(unknown?1:80),height:(Math.max(...r.polygon.map(p=>p.y))-Math.min(...r.polygon.map(p=>p.y)))/(unknown?1:80)}})),walls:walls.map(w=>({...w,a:transform(w.a),b:transform(w.b)})),doors:doors.map(d=>({...d,at:transform(d.at),width:d.width===null?null:d.width*scale})),annotations,missing:unknown?['physical_scale','physical_dimensions']:index===5?['room-a.height_annotation']:ambiguous?['entry.clear_width','entry.unambiguous_position']:[],expectedReview:[...(unknown?['scale_unknown']:[]),...(ambiguous?['door_ambiguous']:[])],expectedValidation:unknown||ambiguous?'needs_review':'valid',coordinateUnits:'source_pixels',doorWidthUnit:'px',roomDimensionUnit:unknown?'px':'m',doorDirectionSupport:'not_supported_by_existing_schema',coordinateContract:'Original image pixels, origin top-left; identity alignment only. Known drawing rotation is retained, never fitted away.'}
  await writeFile(path.join(directory,id+'.svg'),svg);await writeFile(path.join(directory,id+'.png'),png);await writeFile(path.join(directory,id+'.truth.json'),JSON.stringify(truth,null,2)+'\n');output.push(truth)
 }
 return output
}
if(import.meta.main)console.log(JSON.stringify((await generateFixtures(process.argv.find(v=>v.startsWith('--only='))?.split('=')[1])).map(t=>({id:t.id,image:t.image}))))
