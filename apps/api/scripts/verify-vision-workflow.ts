/** Explicit live acceptance: synthetic upload -> durable parse/critique -> persisted model/history. */
import path from 'node:path'
import {mkdir} from 'node:fs/promises'
import {floorModelSchema} from '@bumps/floor-model'
import {createEvaluationFixtures} from './vision-evaluation-fixtures'
import {selectVision} from '../src/providers/vision-selection'
import {hash,AppError} from '../src/accessops/errors'
const directory=process.env.INTEGRATION_EVIDENCE_DIR
if(!directory || !path.isAbsolute(directory))throw new Error('Absolute private evidence directory required')
if(!process.argv.includes('--live'))throw new Error('Explicit --live required')
const origin=process.env.API_URL ?? 'http://127.0.0.1:3403'
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw new Error('Authorized local API only')
const fixture=process.argv.find(v=>v.startsWith('--fixture='))?.split('=')[1] ?? 'small'
if(!['small','full','pdf'].includes(fixture))throw new Error('Synthetic fixture required')
const config=selectVision(),credentials=JSON.parse(await Bun.stdin.text())
if(config.provider!=='openrouter')throw new Error('Select the verified free vision provider explicitly')
await mkdir(directory,{recursive:true,mode:0o700})
await createEvaluationFixtures(path.join(directory,'fixtures'))
let cookie=''
const requests:{route:string;status:number}[]=[]
async function api(route:string,method='GET',body?:RequestInit['body'],type?:string):Promise<any>{
 const response=await fetch(origin+route,{method,body,headers:{cookie,'x-accessops-request':'1',...(type?{'content-type':type}:{})},signal:AbortSignal.timeout(30000)})
 requests.push({route,status:response.status})
 if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie')!.split(';')[0]!
 if(!response.ok)throw new AppError('LOCAL_API_'+response.status,502)
 return response.json()
}
const started=Date.now(),evidence:Record<string,unknown>={at:new Date().toISOString(),fixture,synthetic:true,provider:config.provider,model:config.model,status:'FAIL',classification:'LOCAL_INTEGRATION',geometryReviewed:false}
try{
 await api('/auth/login','POST',JSON.stringify(credentials),'application/json')
 const filename=fixture==='pdf'?'synthetic-plan.pdf':fixture+'.png',mime=fixture==='pdf'?'application/pdf':'image/png'
 const bytes=await Bun.file(path.join(directory,'fixtures',filename)).bytes(),form=new FormData()
 form.set('file',new File([bytes],'Approved synthetic '+filename,{type:mime}))
 const project=await api('/projects','POST',form)
 evidence.projectId=project.id;evidence.sourceSha256=hash(bytes)
 await api('/projects/'+project.id+'/parse','POST','{}','application/json')
 let state:any
 const deadline=Date.now()+600000
 while(Date.now()<deadline){
  state=await api('/projects/'+project.id)
  if(['parsed','failed'].includes(state.status))break
  await Bun.sleep(1500)
 }
 evidence.projectStatus=state?.status;evidence.parseError=state?.parseError
 if(state?.status!=='parsed')throw new AppError('LIVE_PARSE_NOT_COMPLETED',502)
 const stored=await api('/projects/'+project.id+'/model'),model=floorModelSchema.parse(stored.model)
 const history=await api('/projects/'+project.id+'/model/versions')
 const historical=await api('/projects/'+project.id+'/model?version='+stored.version)
 const receipts=stored.critique?.inference ?? []
 const w=model.plan.widthPx,h=model.plan.heightPx
 const checks={
  schema:true,roomLabelsAndSides:['RECEPTION','CLINIC'].every((label,i)=>model.rooms.some(r=>r.label?.toUpperCase()===label && (r.polygon.reduce((n,p)=>n+p.x,0)/r.polygon.length<w/2)===(i===0))),
  partitionDoor:model.openings.some(o=>o.kind==='door'&&Math.abs(o.at.x-w/2)<w*.06&&Math.abs(o.at.y-h/2)<h*.08),
  stairs:model.features.some(f=>f.kind==='stairs'),noInventedElevator:!model.features.some(f=>f.kind==='elevator'),
  unknownPhysicalScale:model.plan.pixelsPerMeter===null,
  realParserAndCritiqueReceipts:receipts.length>=2&&receipts.every((r:any)=>r.provider==='openrouter'&&r.model===config.model&&r.execution==='live'&&r.httpStatus===200&&r.reportedCost===0),
  persistedUnreviewed:stored.critique?.geometryReview==='unreviewed_ai_extraction',
  versionHistory:history.versions.some((v:any)=>v.version===stored.version),
  historicalModelIntact:hash(JSON.stringify(historical.model))===hash(JSON.stringify(stored.model)),
 }
 Object.assign(evidence,{checks,version:stored.version,executions:receipts,classification:'LIVE_END_TO_END',modelSha256:hash(JSON.stringify(model))})
 await Bun.write(path.join(directory,'persisted-model.json'),JSON.stringify(stored,null,2))
 if(Object.values(checks).some(v=>!v))throw new AppError('LIVE_WORKFLOW_CONTENT_CHECK_FAILED',502)
 evidence.status='PASS'
}catch(error){evidence.code=error instanceof AppError?error.code:'LIVE_WORKFLOW_FAILED';process.exitCode=1}
Object.assign(evidence,{durationMs:Date.now()-started,requests})
await Bun.write(path.join(directory,'workflow.json'),JSON.stringify(evidence,null,2))
console.log(JSON.stringify(evidence))
