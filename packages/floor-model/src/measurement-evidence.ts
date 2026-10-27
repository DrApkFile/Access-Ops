import {z} from 'zod'
import {allElements,findElement,floorModelSchema, type FloorModel,type FloorElement,type Point} from './schema'
export type Annotation = {targetId:string|null;kind:'scale'|'room_width'|'room_height';value:number;sourceText:string;basis:'annotation'|'derived'}
export type GeometryReviewIssue={targetId:string;reason:string;message:string}
type Evidence=NonNullable<FloorModel['geometryEvidence']>
const valueOf=(element:FloorElement)=>{const {confidence,...value}=element;void confidence;return JSON.stringify(value)}
const pointsOf=(e:FloorElement):Point[]=>'polygon' in e?e.polygon:'points' in e?e.points:'a' in e?[e.a,e.b]:[e.at]
export function roomDimensions(room:FloorModel['rooms'][number],pixelsPerMeter:number|null){
 let best={widthPx:Infinity,heightPx:Infinity,angleDegrees:0,area:Infinity}
 for(let i=0;i<room.polygon.length;i++){
  const a=room.polygon[i]!,b=room.polygon[(i+1)%room.polygon.length]!
  let angle=Math.atan2(b.y-a.y,b.x-a.x);while(angle>Math.PI/4)angle-=Math.PI/2;while(angle<=-Math.PI/4)angle+=Math.PI/2
  const xs=room.polygon.map(p=>p.x*Math.cos(angle)+p.y*Math.sin(angle)),ys=room.polygon.map(p=>-p.x*Math.sin(angle)+p.y*Math.cos(angle))
  const widthPx=Math.max(...xs)-Math.min(...xs),heightPx=Math.max(...ys)-Math.min(...ys),area=widthPx*heightPx
  if(area<best.area-1e-6)best={widthPx,heightPx,angleDegrees:angle*180/Math.PI,area}
 }
 const {widthPx,heightPx,angleDegrees}=best
 return {widthPx,heightPx,widthM:pixelsPerMeter?widthPx/pixelsPerMeter:null,heightM:pixelsPerMeter?heightPx/pixelsPerMeter:null,angleDegrees,basis:'oriented_bounding_box' as const}
}
function distance(p:Point,a:Point,b:Point){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}
function invalidBoundary(e:FloorElement,model:FloorModel){
 const points=pointsOf(e)
 if(points.some(p=>p.x<0||p.y<0||p.x>model.plan.widthPx||p.y>model.plan.heightPx))return true
 if(!('polygon' in e))return false
 let area=0;for(let i=0;i<points.length;i++){const a=points[i]!,b=points[(i+1)%points.length]!;area+=a.x*b.y-b.x*a.y}
 if(Math.abs(area)<2)return true
 const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)
 for(let i=0;i<points.length;i++)for(let j=i+2;j<points.length;j++){
  if(i===0&&j===points.length-1)continue
  const a=points[i]!,b=points[(i+1)%points.length]!,c=points[j]!,d=points[(j+1)%points.length]!
  if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)return true
 }
 return false
}
function featureReasons(e:FloorElement,model:FloorModel):Evidence['features'][number]['reasons']{
 const reasons:Evidence['features'][number]['reasons']=[]
 if(e.confidence<.7)reasons.push('low_confidence')
 if(invalidBoundary(e,model))reasons.push('boundary_invalid')
 if(e.kind==='door'||e.kind==='window'){
  const wall=model.walls.find(w=>w.id===e.wallId)
  if(!wall||e.width>Math.hypot(wall.b.x-wall.a.x,wall.b.y-wall.a.y)+4||distance(e.at,wall.a,wall.b)>Math.max(4,e.width*.55)||e.confidence<.7)reasons.push('door_ambiguous')
 }
 return reasons
}
export function attachExtractionEvidence(model:FloorModel,annotations:Annotation[]=[]):FloorModel{
 const evidence:Evidence={version:1,features:allElements(model).map(e=>{
  const reasons=featureReasons(e,model)
  return {elementId:e.id,origin:'extracted',state:reasons.length?'needs_review':'unreviewed',reasons,
   note:'Identified by vision; coordinates are unreviewed pixel estimates, not surveyed measurements.'}
 }),measurements:[]}
 const scale=annotations.find(a=>a.kind==='scale'&&a.targetId===null)
 evidence.measurements.push({id:'plan-scale',targetId:null,kind:'scale',value:scale?.value??null,unit:'px/m',origin:scale?.basis==='annotation'?'extracted':'inferred',state:'needs_review',reasons:[scale?'scale_unreviewed':'scale_unknown'],note:scale?`Model read/derived: ${scale.sourceText}; confirm calibration before using physical dimensions.`:'No reliable physical scale is established. Relative pixel geometry remains available.'})
 for(const room of model.rooms)for(const kind of ['room_width','room_height'] as const){
  const annotation=annotations.find(a=>a.kind===kind&&a.targetId===room.id)
  evidence.measurements.push({id:(room.id+'-'+kind).slice(0,80),targetId:room.id,kind,value:annotation?.value??null,unit:'m',origin:annotation?.basis==='annotation'?'extracted':'inferred',state:'needs_review',reasons:annotation?[]:['dimension_missing'],note:annotation?`Unverified model annotation: ${annotation.sourceText}`:'No direct annotation captured. A dimension can be derived after scale is reviewed; no exact measurement has been invented.'})
 }
 return {...model,geometryEvidence:evidence}
}
export function geometryReviewIssues(model:FloorModel):GeometryReviewIssue[]{
 if(!model.geometryEvidence)return [] // Legacy records remain compatible, with provenance explicitly unknown in UI.
 const issues:GeometryReviewIssue[]=[],scale=model.geometryEvidence.measurements.find(m=>m.kind==='scale')
 if(!model.plan.pixelsPerMeter||!scale||scale.state!=='reviewed'||scale.value!==model.plan.pixelsPerMeter)issues.push({targetId:'plan',reason:model.plan.pixelsPerMeter?'scale_unreviewed':'scale_unknown',message:'Physical scale is not confirmed. Calibrate from a known measurement or explicitly choose provisional relative-scale output.'})
 for(const e of allElements(model)){
  const meta=model.geometryEvidence.features.find(m=>m.elementId===e.id),reasons=new Set([...featureReasons(e,model),...(meta?.state==='needs_review'?meta.reasons:[])])
  for(const reason of reasons)issues.push({targetId:e.id,reason,message:reason==='door_ambiguous'?'Door position, width or host wall needs source review.':reason==='boundary_invalid'?'Boundary is degenerate, self-crossing or outside the source image.':reason==='model_modified'?'Model-proposed change requires human review.':'Model score is low; inspect the source. This score is not calibrated probability.'})
 }
 for(const m of model.geometryEvidence.measurements){
  if(m.kind==='scale'||!findElement(model,m.targetId??''))continue
  const room=model.rooms.find(r=>r.id===m.targetId)
  if(!room)continue
  if(m.value===null&&!model.plan.pixelsPerMeter)issues.push({targetId:room.id,reason:'dimension_missing',message:'Physical dimension unavailable without reliable scale. Pixel geometry is retained.'})
  if(m.value!==null&&m.state!=='reviewed')issues.push({targetId:room.id,reason:'annotation_unreviewed',message:`${m.kind}: confirm the model-read annotation against the source before using it.`})
  if(m.value!==null&&model.plan.pixelsPerMeter){
   const dims=roomDimensions(room,model.plan.pixelsPerMeter),derived=m.kind==='room_width'?dims.widthM!:dims.heightM!
   if(Math.abs(derived-m.value)/m.value>.1)issues.push({targetId:room.id,reason:'annotation_conflict',message:'Oriented bounding geometry differs from the recorded dimension by more than 10%; review annotation and boundary.'})
  }
 }
 return issues
}
export function geometryExportStatus(model:FloorModel){
 const issues=geometryReviewIssues(model),acknowledged=Boolean(model.geometryEvidence?.provisionalReason&&issues.length),relativeOnly=issues.every(i=>['scale_unknown','scale_unreviewed','dimension_missing'].includes(i.reason))
 const allowed=issues.length===0||(acknowledged&&relativeOnly)
 const unreviewed=Boolean(model.geometryEvidence&&allElements(model).some(e=>model.geometryEvidence!.features.find(f=>f.elementId===e.id)?.state!=='reviewed'))
 return {allowed,provisional:allowed&&(acknowledged||unreviewed),issues}
}
export function recordGeometryEdits(before:FloorModel,next:FloorModel,actor:'human'|'model'):FloorModel{
 if(!before.geometryEvidence&&!next.geometryEvidence)return next
 const result=structuredClone(next),evidence=before.geometryEvidence?structuredClone(before.geometryEvidence):attachExtractionEvidence(next).geometryEvidence!
 result.geometryEvidence=evidence
 if(before.plan.pixelsPerMeter!==result.plan.pixelsPerMeter){
  const scale=evidence.measurements.find(m=>m.kind==='scale')
  if(scale){scale.originalValue??=JSON.stringify({value:scale.value,pixelsPerMeter:before.plan.pixelsPerMeter});scale.value=result.plan.pixelsPerMeter;scale.origin=actor==='human'?'user_corrected':'inferred';scale.state=actor==='human'&&scale.value!==null?'reviewed':'needs_review';scale.reasons=scale.value===null?['scale_unknown']:scale.state==='needs_review'?['scale_unreviewed']:[];scale.note=actor==='human'?'User explicitly changed and saved physical calibration.':'Model-proposed calibration requires human review.'}
  delete evidence.provisionalReason
 }
 for(const element of allElements(result)){
  const old=findElement(before,element.id),changed=!old||valueOf(old)!==valueOf(element),prior=before.geometryEvidence?.features.find(f=>f.elementId===element.id)
  let meta=evidence.features.find(f=>f.elementId===element.id)
  if(!meta){meta={elementId:element.id,origin:'inferred',state:'needs_review',reasons:[],note:'Provenance not previously captured.'};evidence.features.push(meta)}
  if(changed){Object.assign(meta,{origin:actor==='human'?'user_corrected':'inferred',state:actor==='human'?'reviewed':'needs_review',reasons:actor==='human'?[]:['model_modified'],note:actor==='human'?'Explicitly changed and saved by the user.':'Model changed geometry; human review required.',originalValue:prior?.originalValue??(old?valueOf(old):'null')})}
  else if(old&&element.confidence===1&&old.confidence!==1&&actor==='human'){meta.state='reviewed';meta.reasons=[];meta.note='User confirmed the feature without changing its geometric value.'}
 }
 for(const room of result.rooms)for(const kind of ['room_width','room_height'] as const)
  if(!evidence.measurements.some(m=>m.targetId===room.id&&m.kind===kind))evidence.measurements.push({id:(room.id+'-'+kind).slice(0,80),targetId:room.id,kind,value:null,unit:'m',origin:'inferred',state:'needs_review',reasons:['dimension_missing'],note:'No direct measurement is recorded; dimensions can be derived from reviewed scale.'})
 return floorModelSchema.parse(result)
}
const reason=z.string().trim().min(12).max(1000)
export const measurementCorrectionSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('scale'),pixelsPerMeter:z.number().positive().max(1e6),reason}).strict(),
 z.object({kind:z.literal('opening'),id:z.string(),at:z.object({x:z.number(),y:z.number()}).strict(),width:z.number().positive(),wallId:z.string(),reason}).strict(),
 z.object({kind:z.literal('confirm'),id:z.string(),reason}).strict(),
 z.object({kind:z.literal('dimension'),id:z.string(),value:z.number().positive(),reason}).strict(),
 z.object({kind:z.literal('provisional'),reason}).strict(),
])
export function applyMeasurementCorrection(model:FloorModel,raw:unknown):FloorModel{
 const correction=measurementCorrectionSchema.parse(raw),next=structuredClone(model)
 if(!next.geometryEvidence)throw new Error('Legacy record has no new measurement review; use existing editor operations.')
 if(correction.kind==='scale'){
  const scale=next.geometryEvidence.measurements.find(m=>m.kind==='scale')!
  scale.originalValue??=JSON.stringify({value:scale.value,pixelsPerMeter:model.plan.pixelsPerMeter})
  scale.value=correction.pixelsPerMeter;scale.origin='user_corrected';scale.state='reviewed';scale.reasons=[];scale.note=correction.reason;next.plan.pixelsPerMeter=correction.pixelsPerMeter
  delete next.geometryEvidence.provisionalReason
 }else if(correction.kind==='dimension'){
  const measurement=next.geometryEvidence.measurements.find(m=>m.id===correction.id&&m.kind!=='scale')
  if(!measurement)throw new Error('Unknown dimension')
  if(measurement.value!==correction.value){measurement.originalValue??=JSON.stringify(measurement.value);measurement.origin='user_corrected'}
  measurement.value=correction.value;measurement.state='reviewed';measurement.reasons=[];measurement.note=correction.reason
 }else if(correction.kind==='opening'){
  const opening=next.openings.find(o=>o.id===correction.id),wall=next.walls.find(w=>w.id===correction.wallId)
  if(!opening||!wall)throw new Error('Opening and host wall must exist')
  Object.assign(opening,{at:correction.at,width:correction.width,wallId:correction.wallId,confidence:1})
  if(featureReasons(opening,next).length)throw new Error('Correction is inconsistent with the image bounds or host wall')
  const recorded=recordGeometryEdits(model,next,'human'),meta=recorded.geometryEvidence!.features.find(f=>f.elementId===opening.id)!
  meta.note=correction.reason
  return recorded
 }else if(correction.kind==='confirm'){
  const element=findElement(next,correction.id),meta=next.geometryEvidence.features.find(f=>f.elementId===correction.id)
  if(!element||!meta)throw new Error('Unknown feature')
  element.confidence=1
  if(featureReasons(element,next).length)throw new Error('Fix invalid or ambiguous geometry before confirming')
  meta.state='reviewed';meta.reasons=[];meta.note=correction.reason
 }else{
  if(geometryReviewIssues(next).some(i=>!['scale_unknown','scale_unreviewed','dimension_missing'].includes(i.reason)))throw new Error('Resolve ambiguous or invalid geometry before provisional export')
  next.geometryEvidence.provisionalReason=correction.reason
 }
 return floorModelSchema.parse(next)
}
