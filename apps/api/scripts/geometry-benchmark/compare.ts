import {geometryReviewIssues,geometryExportStatus,allElements,type FloorModel,type Point} from '@bumps/floor-model'
import type {Truth} from './generate'
export type Tolerances={positionMeters:number;positionPixels:number;dimensionPercent:number;doorWidthMeters:number}
export const defaultTolerances:Tolerances={positionMeters:.15,positionPixels:12,dimensionPercent:8,doorWidthMeters:.15}
const norm=(s:string|null)=>s?.toUpperCase().replace(/[^A-Z0-9]/g,'')??''
function dist(p:Point,a:Point,b:Point){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}
const segments=(points:Point[])=>points.map((a,i)=>({a,b:points[(i+1)%points.length]!}))
const samples=(a:Point,b:Point)=>Array.from({length:17},(_,i)=>({x:a.x+(b.x-a.x)*i/16,y:a.y+(b.y-a.y)*i/16}))
function errors(expected:{a:Point;b:Point}[],actual:{a:Point;b:Point}[],includeExpected:(p:Point)=>boolean=()=>true){
 const ds=[...expected.flatMap(s=>samples(s.a,s.b).filter(includeExpected).map(p=>Math.min(...actual.map(a=>dist(p,a.a,a.b))))),...actual.flatMap(s=>samples(s.a,s.b).map(p=>Math.min(...expected.map(a=>dist(p,a.a,a.b)))))]
 if(!ds.length||ds.some(d=>!Number.isFinite(d)))return {meanPx:null,p95Px:null,maxPx:null}
 ds.sort((a,b)=>a-b);return {meanPx:ds.reduce((a,b)=>a+b,0)/ds.length,p95Px:ds[Math.floor((ds.length-1)*.95)]!,maxPx:ds.at(-1)!}
}
export function compareGeometry(truth:Truth,model:FloorModel,tolerance:Tolerances=defaultTolerances){
 const ppm=truth.pixelsPerMeter,positionLimit=ppm?tolerance.positionMeters*ppm:tolerance.positionPixels,unit=ppm?'reference m':'px'
 const failures:string[]=[],used=new Set<string>(),rooms=[]
 for(const expected of truth.rooms){
  const actual=model.rooms.find(r=>norm(r.label)===norm(expected.label)&&!used.has(r.id))
  if(!actual){rooms.push({id:expected.id,status:'MISSING'});failures.push('Missing room '+expected.label);continue}used.add(actual.id)
  const angle=truth.rotationDegrees*Math.PI/180,project=(p:Point)=>({x:p.x*Math.cos(angle)+p.y*Math.sin(angle),y:-p.x*Math.sin(angle)+p.y*Math.cos(angle)}),points=actual.polygon.map(project),width=(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)))/(ppm??1),height=(Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)))/(ppm??1),widthError=Math.abs(width-expected.dimensions.width),heightError=Math.abs(height-expected.dimensions.height),widthPercent=100*widthError/expected.dimensions.width,heightPercent=100*heightError/expected.dimensions.height,boundary=errors(segments(expected.polygon),segments(actual.polygon))
  const annotatedDimensions=truth.annotations.filter(a=>a.roomId===expected.id).map(a=>{const kind=a.axis==='width'?'room_width':'room_height',actualMeasurement=model.geometryEvidence?.measurements.find(m=>m.targetId===actual.id&&m.kind===kind);return {axis:a.axis,expectedMeters:a.value,actualProposalMeters:actualMeasurement?.value??null,origin:actualMeasurement?.origin??'not_recorded',absoluteErrorMeters:actualMeasurement?.value!=null?Math.abs(actualMeasurement.value-a.value):null}})
  const pass=widthPercent<=tolerance.dimensionPercent&&heightPercent<=tolerance.dimensionPercent&&boundary.p95Px!==null&&boundary.p95Px<=positionLimit
  rooms.push({id:expected.id,actualId:actual.id,expectedDimensions:expected.dimensions,annotatedDimensions,actualDimensions:{width,height},absoluteError:{width:widthError,height:heightError,unit},percentageError:{width:widthPercent,height:heightPercent},boundary:{...boundary,p95ReferenceMeters:ppm&&boundary.p95Px!==null?boundary.p95Px/ppm:null},status:pass?'PASS':'FAIL'})
  if(!pass)failures.push('Room dimensions/boundary outside tolerance: '+expected.label)
 }
 const actualDoors=model.openings.filter(o=>o.kind==='door'),usedDoors=new Set<string>(),doors=[]
 for(const expected of truth.doors){
  const actual=actualDoors.filter(d=>!usedDoors.has(d.id)).sort((a,b)=>Math.hypot(a.at.x-expected.at.x,a.at.y-expected.at.y)-Math.hypot(b.at.x-expected.at.x,b.at.y-expected.at.y))[0]
  if(!actual||Math.hypot(actual.at.x-expected.at.x,actual.at.y-expected.at.y)>Math.max(expected.width??0,positionLimit*3)){doors.push({id:expected.id,status:expected.ambiguous?'AMBIGUOUS_OMITTED':'MISSING'});if(!expected.ambiguous)failures.push('Missing door '+expected.id);continue}usedDoors.add(actual.id)
  const positionErrorPx=Math.hypot(actual.at.x-expected.at.x,actual.at.y-expected.at.y),widthErrorPx=expected.width===null?null:Math.abs(actual.width-expected.width),host=model.walls.find(w=>w.id===actual.wallId),expectedHost=truth.walls.find(w=>w.id===expected.wallId)!,hostWallErrorPx=host?Math.max(dist(host.a,expectedHost.a,expectedHost.b),dist(host.b,expectedHost.a,expectedHost.b)):null,pass=expected.ambiguous||positionErrorPx<=positionLimit&&(widthErrorPx===null||widthErrorPx<=(ppm?tolerance.doorWidthMeters*ppm:tolerance.positionPixels))&&hostWallErrorPx!==null&&hostWallErrorPx<=positionLimit
  doors.push({id:expected.id,actualId:actual.id,expected,actual:{at:actual.at,width:actual.width,wallId:actual.wallId},positionErrorPx,positionErrorReferenceMeters:ppm?positionErrorPx/ppm:null,widthErrorPx,widthErrorReferenceMeters:ppm&&widthErrorPx!==null?widthErrorPx/ppm:null,hostWallErrorPx,openingDirection:'NOT_SUPPORTED_BY_EXISTING_SCHEMA',status:expected.ambiguous?'REVIEW_REQUIRED':pass?'PASS':'FAIL'});if(!pass)failures.push('Door position/width/host outside tolerance: '+expected.id)
 }
 const outsideDoorGap=(p:Point)=>!truth.doors.some(d=>d.width!==null&&Math.hypot(p.x-d.at.x,p.y-d.at.y)<d.width/2)
 const wallError=errors(truth.walls,model.walls,outsideDoorGap),missedWalls=truth.walls.filter(w=>{const visible=samples(w.a,w.b).filter(outsideDoorGap);return visible.length>0&&visible.filter(p=>Math.min(...model.walls.map(a=>dist(p,a.a,a.b)))<=positionLimit).length/visible.length<.8}).length,extraWalls=model.walls.filter(w=>samples(w.a,w.b).filter(p=>Math.min(...truth.walls.map(a=>dist(p,a.a,a.b)))<=positionLimit).length/17<.8).length
 if(missedWalls||extraWalls||wallError.p95Px===null||wallError.p95Px>positionLimit)failures.push('Wall coverage/position outside tolerance')
 const extraRooms=model.rooms.filter(r=>!used.has(r.id)).length,extraDoors=actualDoors.filter(d=>!usedDoors.has(d.id)).length
 if(extraRooms||extraDoors)failures.push('Extra rooms or doors')
 if(ppm===null&&model.geometryEvidence?.measurements.some(m=>m.value!==null))failures.push('Unsupported physical numeric proposal on a source with unknown scale/dimensions')
 const issues=geometryReviewIssues(model),uncertainty=truth.expectedReview.map(reason=>({reason,detected:issues.some(i=>i.reason===reason)||(reason==='door_ambiguous'&&truth.doors.every(d=>d.ambiguous)&&actualDoors.length===0)}))
 if(uncertainty.some(u=>!u.detected))failures.push('Expected uncertainty was not detected')
 return {status:failures.length?'FAIL':'PASS',failures,tolerances:{...tolerance,effectivePositionPixels:positionLimit},alignment:'IDENTITY source pixels; known fixture rotation used only to measure dimensions; no fitted translation, rotation or scale',physicalMetricBasis:'Geometry errors are normalized using ground-truth scale solely for scoring, never supplied to extraction. Model physical scale and annotation readings are reported separately.',rooms,doors,walls:{...wallError,p95ReferenceMeters:ppm&&wallError.p95Px!==null?wallError.p95Px/ppm:null,missing:missedWalls,extra:extraWalls,rawExpectedSegments:truth.walls.length,rawActualSegments:model.walls.length,segmentationNote:'Coverage matching tolerates split/coalesced collinear segments; raw segment counts are not semantic wall counts.'},missingRooms:rooms.filter(r=>r.status==='MISSING').length,extraRooms,missingDoors:doors.filter(d=>d.status==='MISSING').length,extraDoors,physicalScale:{expected:ppm,actual:model.plan.pixelsPerMeter,annotationProposal:model.geometryEvidence?.measurements.find(m=>m.kind==='scale')?.value??null},uncertainty,reviewIssues:issues,geometryExport:geometryExportStatus(model),annotationReadings:model.geometryEvidence?.measurements??[],manualCorrectionRequired:failures.length>0||issues.length>0,elementCount:allElements(model).length}
}
