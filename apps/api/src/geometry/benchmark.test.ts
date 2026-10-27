import {test,expect} from 'bun:test'
import path from 'node:path'
import {imageSize} from 'image-size'
import {floorModelSchema,attachExtractionEvidence,geometryReviewIssues} from '@bumps/floor-model'
import {compareGeometry} from '../../scripts/geometry-benchmark/compare'
import type {Truth} from '../../scripts/geometry-benchmark/generate'
import {inspectBinaryStl} from './stl-validate'
const root=path.resolve(import.meta.dir,'../../../..'),fixtures=path.join(root,'tests/fixtures/geometry-benchmark')
async function truth(id='01-clean'){return await Bun.file(path.join(fixtures,id+'.truth.json')).json() as Truth}
function model(t:Truth){return floorModelSchema.parse({schemaVersion:1,plan:{widthPx:t.widthPx,heightPx:t.heightPx,pixelsPerMeter:t.pixelsPerMeter,north:null},walls:t.walls.map(w=>({...w,kind:'wall',confidence:1})),rooms:t.rooms.map(r=>({id:r.id,kind:'room',label:r.label,polygon:r.polygon,confidence:1})),openings:t.doors.filter(d=>!d.ambiguous).map(d=>({id:d.id,kind:'door',at:d.at,width:d.width,wallId:d.wallId,confidence:1})),features:[]})}
test('UNIT: eight real PNG fixtures agree with their explicit source-pixel ground truth',async()=>{
 for(const id of ['01-clean','02-connected','03-l-shape','04-rotated','05-low-resolution','06-missing-dimension','07-ambiguous-door','08-unknown-scale']){const t=await truth(id),size=imageSize(await Bun.file(path.join(fixtures,t.image)).bytes());expect(size.width).toBe(t.widthPx);expect(size.height).toBe(t.heightPx);expect(t.coordinateUnits).toBe('source_pixels');expect(()=>model(t)).not.toThrow();for(const d of t.doors)expect(t.walls.some(w=>w.id===d.wallId)).toBe(true)}
})
test('UNIT: perfect known geometry scores zero error without using inference or a fitted transform',async()=>{
 const t=await truth(),result=compareGeometry(t,model(t));expect(result.status).toBe('PASS');expect(result.walls.p95Px).toBe(0);expect(result.rooms[0]?.absoluteError?.width).toBe(0)
})
test('UNIT: scale, translation and doorway errors cannot be aligned away',async()=>{
 const t=await truth(),m=model(t);m.rooms[0]!.polygon=m.rooms[0]!.polygon.map(p=>({x:p.x*1.2,y:p.y*1.2}));m.openings[0]!.at.y-=60;const r=compareGeometry(t,m);expect(r.status).toBe('FAIL');expect(r.rooms[0]?.percentageError?.width).toBeCloseTo(20);expect(r.doors[0]?.positionErrorPx).toBe(60)
})
test('UNIT: known drawing rotation retains zero reference errors; no estimated alignment is fitted',async()=>{const t=await truth('04-rotated'),r=compareGeometry(t,model(t));expect(r.status).toBe('PASS');expect(r.rooms[0]?.absoluteError?.width).toBeLessThan(.001)})
test('UNIT: missing room/door and invented wall are counted rather than skipped',async()=>{const t=await truth(),m=model(t);m.rooms=[];m.openings=[];m.walls.push({id:'fake',kind:'wall',a:{x:200,y:200},b:{x:400,y:200},thickness:8,confidence:1});const r=compareGeometry(t,m);expect(r.missingRooms).toBe(1);expect(r.missingDoors).toBe(1);expect(r.walls.extra).toBeGreaterThan(0)})
test('UNIT: unknown scale never gains physical-error numbers from hidden ground truth',async()=>{const t=await truth('08-unknown-scale'),m=attachExtractionEvidence(model(t)),r=compareGeometry(t,m);expect(r.physicalScale.expected).toBeNull();expect(r.doors[0]?.positionErrorReferenceMeters).toBeNull();expect(geometryReviewIssues(m).some(i=>i.reason==='scale_unknown')).toBe(true)})
test('UNIT: truncated, nonfinite and open binary STL files fail actual structural parsing',()=>{
 expect(()=>inspectBinaryStl(new Uint8Array())).toThrow('STL_EMPTY_OR_TRUNCATED');const bytes=new Uint8Array(134),v=new DataView(bytes.buffer);v.setUint32(80,1,true);v.setFloat32(96,NaN,true);expect(()=>inspectBinaryStl(bytes)).toThrow('STL_NONFINITE_VERTEX');v.setFloat32(96,0,true);v.setFloat32(108,1,true);v.setFloat32(124,1,true);expect(()=>inspectBinaryStl(bytes)).toThrow()
})
