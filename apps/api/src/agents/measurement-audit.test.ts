import {test,expect} from 'bun:test'
import {Resvg} from '@resvg/resvg-js'
import {attachExtractionEvidence,applyMeasurementCorrection,floorModelSchema} from '@bumps/floor-model'
import {svgFont} from '../lib/svg-font'
import {buildAuditParts} from './openings-audit'
test('UNIT: doorway audit crops/annotations consume saved corrected positions and width',()=>{
 const model=attachExtractionEvidence(floorModelSchema.parse({schemaVersion:1,plan:{widthPx:600,heightPx:400,pixelsPerMeter:null,north:null},walls:[{id:'w',kind:'wall',a:{x:50,y:300},b:{x:550,y:300},confidence:1}],openings:[{id:'d',kind:'door',at:{x:300,y:300},width:80,wallId:'w',confidence:1}],rooms:[],features:[]})),corrected=applyMeasurementCorrection(model,{kind:'opening',id:'d',at:{x:320,y:300},width:72,wallId:'w',reason:'User checked the original drawing and saved the correction.'}),png=new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="white"/></svg>',{font:svgFont}).render().asPng(),parts=buildAuditParts(png,'image/png',corrected),text=parts.filter(p=>'text'in p).map(p=>'text'in p?p.text:'').join('\n')
 expect(text).toContain('(320, 300)');expect(text).toContain('width 72');expect(text).not.toContain('width 80')
})
