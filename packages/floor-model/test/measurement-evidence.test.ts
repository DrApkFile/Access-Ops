import {test,expect} from 'bun:test'
import {floorModelSchema,type FloorModel} from '../src/schema'
import {attachExtractionEvidence,applyMeasurementCorrection,geometryReviewIssues,geometryExportStatus,recordGeometryEdits,roomDimensions} from '../src/measurement-evidence'
import {applyOperations} from '../src/operations'
import {convertToTactile} from '../src/tactile-convert'
const reason='User checked the source annotation and saved this correction.'
function base():FloorModel{return floorModelSchema.parse({schemaVersion:1,title:'Test only',plan:{widthPx:600,heightPx:500,pixelsPerMeter:null,north:null},walls:[{id:'w',kind:'wall',a:{x:100,y:300},b:{x:500,y:300},thickness:8,confidence:.9}],openings:[{id:'d',kind:'door',at:{x:300,y:300},width:80,wallId:'w',confidence:.9}],rooms:[{id:'r',kind:'room',polygon:[{x:100,y:100},{x:500,y:100},{x:500,y:300},{x:100,y:300}],label:'Room',confidence:.9}],features:[]})}
test('UNIT explicit annotated dimensions remain extracted, unverified proposals',()=>{
 const m=attachExtractionEvidence(base(),[{targetId:'r',kind:'room_width',value:5,sourceText:'5.00 m',basis:'annotation'}]);expect(m.geometryEvidence?.measurements.find(m=>m.kind==='room_width')).toMatchObject({origin:'extracted',state:'needs_review',value:5});expect(geometryReviewIssues(m).some(i=>i.reason==='annotation_unreviewed')).toBe(true)
})
test('UNIT derived scale is inferred and never silently promoted to physical truth',()=>{
 const m=attachExtractionEvidence(base(),[{targetId:null,kind:'scale',value:80,sourceText:'400 pixels / 5 printed meters',basis:'derived'}]);expect(m.geometryEvidence?.measurements[0]?.origin).toBe('inferred');expect(m.plan.pixelsPerMeter).toBeNull();expect(geometryExportStatus(m).allowed).toBe(false)
})
test('UNIT missing scale/dimensions identify targets without invented values',()=>{
 const m=attachExtractionEvidence(base());expect(geometryReviewIssues(m)).toContainEqual(expect.objectContaining({targetId:'plan',reason:'scale_unknown'}));expect(geometryReviewIssues(m)).toContainEqual(expect.objectContaining({targetId:'r',reason:'dimension_missing'}));expect(m.geometryEvidence?.measurements.every(m=>m.value===null)).toBe(true)
})
test('UNIT reviewed scale permits derived dimensions without penalizing a missing annotation',()=>{
 const m=applyMeasurementCorrection(attachExtractionEvidence(base()),{kind:'scale',pixelsPerMeter:80,reason});expect(roomDimensions(m.rooms[0]!,m.plan.pixelsPerMeter)).toMatchObject({widthM:5,heightM:2.5,basis:'oriented_bounding_box'});expect(geometryReviewIssues(m)).toEqual([]);expect(geometryExportStatus(m).allowed).toBe(true)
})
test('UNIT ambiguous doorway has a specific reason and cannot be provisionally waved through',()=>{
 const b=base();b.openings[0]!.wallId=null;b.openings[0]!.confidence=.4;const m=attachExtractionEvidence(b);expect(geometryReviewIssues(m)).toContainEqual(expect.objectContaining({targetId:'d',reason:'door_ambiguous'}));expect(()=>applyMeasurementCorrection(m,{kind:'provisional',reason})).toThrow()
})
test('UNIT saved correction changes geometry and provenance and retains original after serialization',()=>{
 const m=attachExtractionEvidence(base()),next=applyMeasurementCorrection(m,{kind:'opening',id:'d',at:{x:320,y:300},width:72,wallId:'w',reason}),saved=floorModelSchema.parse(JSON.parse(JSON.stringify(next))),meta=saved.geometryEvidence!.features.find(m=>m.elementId==='d')!;expect(saved.openings[0]).toMatchObject({at:{x:320,y:300},width:72});expect(meta.origin).toBe('user_corrected');expect(JSON.parse(meta.originalValue!).at).toEqual({x:300,y:300});const design=convertToTactile(saved).design,lines=design.elements.filter(e=>e.kind==='line'&&e.sourceId==='w').sort((a,b)=>a.kind==='line'&&b.kind==='line'?a.points[0]!.x-b.points[0]!.x:0);expect(lines).toHaveLength(2);if(lines[0]?.kind==='line'&&lines[1]?.kind==='line'){expect(lines[1].points[0]!.x-lines[0].points[1]!.x).toBeCloseTo(72*design.mmPerPx);expect((lines[1].points[0]!.x+lines[0].points[1]!.x)/2).toBeCloseTo(lines[0].points[0]!.x+220*design.mmPerPx)}
})
test('UNIT invalid correction is rejected and a confirmation alone keeps extracted origin',()=>{
 const m=attachExtractionEvidence(base());expect(()=>applyMeasurementCorrection(m,{kind:'opening',id:'d',at:{x:900,y:300},width:80,wallId:'w',reason})).toThrow();expect(()=>applyMeasurementCorrection(m,{kind:'scale',pixelsPerMeter:0,reason})).toThrow();expect(()=>applyMeasurementCorrection(m,{kind:'opening',id:'d',at:{x:300,y:300},width:999,wallId:'w',reason})).toThrow();expect(applyMeasurementCorrection(m,{kind:'confirm',id:'d',reason}).geometryEvidence!.features.find(f=>f.elementId==='d')?.origin).toBe('extracted')
})
test('UNIT canvas operations become user-corrected at save boundary; model operations remain inferred',()=>{
 const before=attachExtractionEvidence(base()),next=applyOperations(before,[{op:'resize-opening',id:'d',at:{x:310,y:300},width:60}]);expect(next.geometryEvidence!.features.find(f=>f.elementId==='d')?.origin).toBe('extracted');expect(recordGeometryEdits(before,next,'human').geometryEvidence!.features.find(f=>f.elementId==='d')?.origin).toBe('user_corrected');expect(recordGeometryEdits(before,next,'model').geometryEvidence!.features.find(f=>f.elementId==='d')?.origin).toBe('inferred')
})
test('UNIT provisional output retains unknowns and cannot hide an invalid boundary',()=>{
 const m=applyMeasurementCorrection(attachExtractionEvidence(base()),{kind:'provisional',reason});expect(m.plan.pixelsPerMeter).toBeNull();expect(geometryExportStatus(m)).toMatchObject({allowed:true,provisional:true});m.rooms[0]!.polygon=[{x:100,y:100},{x:300,y:300},{x:100,y:300},{x:300,y:100}];expect(geometryExportStatus(m).allowed).toBe(false)
})
test('UNIT legacy v1 records remain usable without fabricated provenance',()=>{
 const saved=floorModelSchema.parse(JSON.parse(JSON.stringify(base())));expect(saved.geometryEvidence).toBeUndefined();expect(geometryReviewIssues(saved)).toEqual([]);expect(geometryExportStatus(saved).allowed).toBe(true)
})
test('UNIT annotation confirmation keeps origin; an actual dimension change retains its original',()=>{
 let m=attachExtractionEvidence(base(),[{targetId:'r',kind:'room_width',value:5,sourceText:'5 m',basis:'annotation'}]);const id=m.geometryEvidence!.measurements.find(m=>m.kind==='room_width')!.id;m=applyMeasurementCorrection(m,{kind:'dimension',id,value:5,reason});expect(m.geometryEvidence!.measurements.find(m=>m.id===id)?.origin).toBe('extracted');m=applyMeasurementCorrection(m,{kind:'dimension',id,value:6,reason});expect(m.geometryEvidence!.measurements.find(m=>m.id===id)).toMatchObject({origin:'user_corrected',originalValue:'5'})
})
test('UNIT oriented room bounds account for rotation without fitting away scale error',()=>{
 const b=base(),a=Math.PI/12;b.rooms[0]!.polygon=b.rooms[0]!.polygon.map(p=>({x:p.x*Math.cos(a)-p.y*Math.sin(a),y:p.x*Math.sin(a)+p.y*Math.cos(a)}));const dims=roomDimensions(b.rooms[0]!,80);expect(dims.widthM).toBeCloseTo(5);expect(dims.heightM).toBeCloseTo(2.5)
})

test('UNIT: direct saved calibration edits retain provenance and stale calibration cannot be silently trusted',()=>{
 const before=applyMeasurementCorrection(attachExtractionEvidence(base()),{kind:'scale',pixelsPerMeter:80,reason}),next=structuredClone(before);next.plan.pixelsPerMeter=40;expect(geometryExportStatus(next).allowed).toBe(false);const saved=recordGeometryEdits(before,next,'human');expect(saved.geometryEvidence!.measurements.find(m=>m.kind==='scale')).toMatchObject({value:40,origin:'user_corrected',state:'reviewed'});expect(roomDimensions(saved.rooms[0]!,40).widthM).toBe(10)
})
test('UNIT: calibrated but unreviewed model geometry stays provisional until explicit feature review',()=>{
 let m=applyMeasurementCorrection(attachExtractionEvidence(base()),{kind:'scale',pixelsPerMeter:80,reason});expect(geometryExportStatus(m)).toMatchObject({allowed:true,provisional:true});for(const id of ['w','d','r'])m=applyMeasurementCorrection(m,{kind:'confirm',id,reason});expect(geometryExportStatus(m)).toMatchObject({allowed:true,provisional:false})
})
