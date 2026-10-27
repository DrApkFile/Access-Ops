/** Read/verify a real UI-created project; generate explicit operator corrections, never synthetic model responses. */
import path from 'node:path'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {allElements,floorModelSchema,geometryExportStatus,type EditOperation} from '@bumps/floor-model'
import {compareGeometry} from './compare'
import type {Truth} from './generate'
import {inspectBinaryStl} from '../../src/geometry/stl-validate'
import {hash} from '../../src/accessops/errors'
const directory=process.env.GEOMETRY_DEMO_DIR,projectId=process.argv.find(a=>a.startsWith('--project='))?.slice(10),prepare=process.argv.includes('--prepare')
if(!directory||!path.isAbsolute(directory)||!projectId)throw new Error('Absolute GEOMETRY_DEMO_DIR and --project=actual-local-project required')
const origin=process.env.API_URL??'http://127.0.0.1:3403';if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw new Error('Authorized local API only')
const credentials=JSON.parse(await Bun.stdin.text()),login=await fetch(origin+'/auth/login',{method:'POST',headers:{'content-type':'application/json','x-accessops-request':'1'},body:JSON.stringify(credentials)})
if(!login.ok)throw new Error('LOCAL_AUTH_FAILED');const cookie=login.headers.get('set-cookie')!.split(';')[0]!
async function get(route:string){const r=await fetch(origin+route,{headers:{cookie},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('API_'+r.status);return r}
const truth=await Bun.file(path.resolve(import.meta.dir,'../../../../tests/fixtures/geometry-benchmark/02-connected.truth.json')).json() as Truth
await mkdir(directory,{recursive:true,mode:0o700})
const project=await(await get('/projects/'+projectId)).json() as any,current=await(await get('/projects/'+projectId+'/model')).json() as any,model=floorModelSchema.parse(current.model)
if(project.name!=='02-connected.png')throw new Error('USE_EXACT_KNOWN_SYNTHETIC_FIXTURE')
if(prepare){
 const sourcePlan=await(await get('/projects/'+projectId+'/plan')).bytes()
 const reviewId=(id:string)=>'review-'+id
 const roomIds=new Map(truth.rooms.map(r=>[r.id,model.rooms.find(a=>a.label?.toUpperCase()===r.label)?.id??reviewId(r.id)]))
 const operations:EditOperation[]=[...allElements(model).map(e=>({op:'delete' as const,id:e.id})),...truth.walls.map(w=>({op:'add' as const,element:{...w,id:reviewId(w.id),kind:'wall' as const,thickness:8,confidence:1}})),...truth.rooms.map(r=>({op:'add' as const,element:{id:roomIds.get(r.id)!,kind:'room' as const,label:r.label,polygon:r.polygon,confidence:1}})),...truth.doors.map(d=>({op:'add' as const,element:{id:reviewId(d.id),kind:'door' as const,at:d.at,width:d.width!,wallId:reviewId(d.wallId),confidence:1}}))]
 await writeFile(path.join(directory,'reviewed-operations.json'),JSON.stringify(operations,null,2),{mode:0o600})
 const dimensions=model.geometryEvidence?.measurements.filter(m=>m.kind!=='scale'&&m.value!==null&&[...roomIds.values()].includes(m.targetId??'')).map(m=>({id:m.id,value:3}))??[]
 await writeFile(path.join(directory,'dimension-reviews.json'),JSON.stringify(dimensions,null,2),{mode:0o600})
 const evidence={at:new Date().toISOString(),projectId,fixture:'02-connected.png',truth:'tests/fixtures/geometry-benchmark/02-connected.truth.json',classification:'LIVE_END_TO_END_SOURCE_WITH_UNAPPLIED_OPERATOR_CORRECTIONS',rawVersion:current.version,rawModelSha256:hash(JSON.stringify(model)),sourcePlanSha256:hash(sourcePlan),rawComparison:compareGeometry(truth,model),inference:current.critique?.inference??[],operatorCorrectionsGenerated:true,operatorCorrectionsApplied:false,note:'Ground truth is the explicit human/operator reference. These operations are NOT a model response and are excluded from benchmark accuracy.'}
 await writeFile(path.join(directory,'raw-model.json'),JSON.stringify(current,null,2),{mode:0o600});await writeFile(path.join(directory,'preparation.json'),JSON.stringify(evidence,null,2),{mode:0o600});console.log(JSON.stringify({projectId,rawVersion:current.version,operatorCorrectionFile:path.join(directory,'reviewed-operations.json')}))
}else{
 const prepared=JSON.parse(await readFile(path.join(directory,'preparation.json'),'utf8')),comparison=compareGeometry(truth,model),raw=await(await get('/projects/'+projectId+'/model?version='+prepared.rawVersion)).json() as any,reviews=await(await get('/projects/'+projectId+'/model/review-details')).json() as any
 const audit=reviews.reviews.find((r:any)=>r.critique?.doorwayAudit)?.critique.doorwayAudit
 const critique=reviews.reviews.find((r:any)=>r.critique?.currentGeometryCritique)?.critique.currentGeometryCritique
 const checks={knownReferenceGeometry:comparison.status==='PASS',confirmedScale:model.plan.pixelsPerMeter===80,reviewGate:geometryExportStatus(model).allowed&&!geometryExportStatus(model).provisional,rawHistoryPreserved:hash(JSON.stringify(raw.model))===prepared.rawModelSha256,userCorrectionProvenance:model.geometryEvidence?.features.some(f=>f.origin==='user_corrected')??false,readOnlyAuditUsesCorrectedModel:audit?.sourceModelSha256===hash(JSON.stringify(model)),correctedCritiqueInput:critique?.sourceModelSha256===hash(JSON.stringify(model)),realCritiqueReceipt:critique?.executions?.some((r:any)=>r.execution==='live'&&r.provider==='openrouter')??false,realAuditReceipt:audit?.executions?.some((r:any)=>r.execution==='live'&&r.provider==='openrouter'&&r.model==='nvidia/nemotron-3.5-super-vl:free')??false}
 const files=[]
 for(const kind of ['map','legend']){try{const response=await get('/projects/'+projectId+'/export/'+kind+'.stl'),bytes=await response.bytes(),inspection=inspectBinaryStl(bytes);await writeFile(path.join(directory,kind+'.stl'),bytes);files.push({kind,status:'PASS',modelVersion:response.headers.get('x-floor-model-version'),geometryStatus:response.headers.get('x-geometry-status'),...inspection})}catch(e){files.push({kind,status:'FAIL',code:e instanceof Error?e.message:'STL_FAILED'})}}
 const status=Object.values(checks).every(Boolean)&&files.every(f=>f.status==='PASS')?'PASS':'FAIL'
 const result={at:new Date().toISOString(),classification:'LIVE_END_TO_END_WITH_EXPLICIT_OPERATOR_CORRECTIONS',status,projectId,version:current.version,checks,comparison,files,note:'This demonstrates correction and export, not uncorrected live-model accuracy. No recording was created.'}
 await writeFile(path.join(directory,'verification.json'),JSON.stringify(result,null,2),{mode:0o600});console.log(JSON.stringify({status,checks,files}));if(status!=='PASS')process.exitCode=1
}
