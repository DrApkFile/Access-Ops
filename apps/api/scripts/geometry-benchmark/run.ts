import path from 'node:path'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {floorModelSchema,convertToTactile,buildValidationContext,resolveMechanicalViolations,validateTactileDesign,geometryExportStatus} from '@bumps/floor-model'
import {generateFixtures,type Truth} from './generate'
import {compareGeometry,defaultTolerances,type Tolerances} from './compare'
import {parsePlanImage,PARSER_INSTRUCTION} from '../../src/agents/parser'
import {captureModelExecutions} from '../../src/providers/model-executions'
import {withProviderWorkspace} from '../../src/providers/workspace-scope'
import {selectVision,selectedVisionReadiness} from '../../src/providers/vision-selection'
import {hash,AppError} from '../../src/accessops/errors'
import {buildMapMesh,meshToBinaryStl} from '../../src/geometry/mesh'
import {inspectBinaryStl} from '../../src/geometry/stl-validate'
const args=process.argv.slice(2),live=args.includes('--live'),cached=args.includes('--cached'),directory=process.env.GEOMETRY_BENCHMARK_DIR
if(live===cached||!directory||!path.isAbsolute(directory))throw new Error('Choose --live OR --cached and absolute private GEOMETRY_BENCHMARK_DIR')
const workspace=live?JSON.parse(await Bun.stdin.text()).workspaceId:undefined,config=selectVision(),fixtures=await generateFixtures(),only=args.find(a=>a.startsWith('--only='))?.split('=')[1]
if(config.provider!=='openrouter'||config.model!=='nvidia/nemotron-3.5-super-vl:free')throw new Error('Existing configured free OpenRouter model required; no provider change permitted')
await mkdir(directory,{recursive:true,mode:0o700})
if(only&&!fixtures.some(f=>f.id===only))throw new Error('UNKNOWN_FIXTURE_ID')
const reportName=cached?'results.cached':'results'
const tolerances:Tolerances={...defaultTolerances,...(process.env.GEOMETRY_BENCHMARK_TOLERANCES?JSON.parse(process.env.GEOMETRY_BENCHMARK_TOLERANCES):{})}
if(Object.values(tolerances).some(v=>typeof v!=='number'||!Number.isFinite(v)||v<=0))throw new Error('Positive finite tolerances required')
const results:Record<string,any>[]=[]
for(const truth of fixtures.filter(f=>!only||f.id===only)){
 const started=Date.now(),file=path.resolve(import.meta.dir,'../../../../tests/fixtures/geometry-benchmark',truth.image),sourceHash=hash(await Bun.file(file).bytes()),fingerprint=hash(JSON.stringify({sourceHash,model:config.model,instruction:PARSER_INSTRUCTION,normalizerVersion:'geometry-evidence-v1',width:truth.widthPx,height:truth.heightPx})),cacheFile=path.join(directory,truth.id+'.extraction.json'),result:Record<string,any>={id:truth.id,fixture:truth.image,groundTruth:truth.id+'.truth.json',expectedValidation:truth.expectedValidation,sourceHash,fingerprint,classification:cached?'CACHED_LIVE':'LIVE_EXTERNAL',status:'FAIL',manualCorrectionsApplied:false,attempted:false}
 try{
  let extracted:any
  if(cached){extracted=JSON.parse(await readFile(cacheFile,'utf8'));if(extracted.fingerprint!==fingerprint||extracted.classification!=='LIVE_EXTERNAL')throw new Error('CACHE_FINGERPRINT_MISMATCH');result.originalInferenceAt=extracted.at}
  else{
   const ready=selectedVisionReadiness(workspace)
   if(!ready.configured||!('workspacePermitted'in ready)||!ready.workspacePermitted){result.status='BLOCKED';result.code='VISION_ACCESS_OR_CONSENT_REQUIRED';results.push(result);continue}
   result.attempted=true
   const captured=await captureModelExecutions(records=>{result.executions=records;return withProviderWorkspace(workspace,()=>parsePlanImage(file,{widthPx:truth.widthPx,heightPx:truth.heightPx}))})
   extracted={at:new Date().toISOString(),classification:'LIVE_EXTERNAL',fingerprint,sourceHash,model:captured.value,executions:captured.executions};await writeFile(cacheFile,JSON.stringify(extracted,null,2),{mode:0o600})
  }
  const model=floorModelSchema.parse(extracted.model);result.extractionSucceeded=true;result.executions=extracted.executions;result.originalInferenceAt=extracted.at;result.inferenceDurationMs=extracted.executions.reduce((n:number,e:any)=>n+e.durationMs,0);result.comparison=compareGeometry(truth,model,tolerances);result.status=result.comparison.status
  const review=geometryExportStatus(model)
  if(!review.allowed)result.export={status:'BLOCKED_REVIEW',issues:review.issues,reason:'No authoritative STL is generated from unresolved assumptions. Use actual review/correction or explicit provisional acknowledgment.'}
  else{
   try{const converted=convertToTactile(model),context=buildValidationContext(model),design=resolveMechanicalViolations(converted.design,context),violations=validateTactileDesign(design,context);if(violations.length)result.export={status:'BLOCKED_VALIDATION',violations};else{const mesh=buildMapMesh(design),bytes=meshToBinaryStl(mesh.getMesh());if(review.provisional)bytes.set(new TextEncoder().encode('PROVISIONAL RELATIVE-SCALE BENCHMARK'),0);const inspection=inspectBinaryStl(bytes);await writeFile(path.join(directory,truth.id+(review.provisional?'.provisional':'')+'.stl'),bytes);result.export={status:'PASS',provisional:review.provisional,inspection};mesh.delete()}}catch(e){result.export={status:'FAIL',code:e instanceof Error?e.message:'EXPORT_FAILED'}}
  }
 }catch(e){result.code=e instanceof AppError?e.code:e instanceof Error&&/^[A-Z_0-9]+$/.test(e.message)?e.message:'EXTRACTION_OR_VALIDATION_FAILED'}
 result.durationMs=Date.now()-started;results.push(result);await writeFile(path.join(directory,reportName+'.partial.json'),JSON.stringify(results,null,2),{mode:0o600})
 if(live)await Bun.sleep(500)
}
const report={at:new Date().toISOString(),model:config.model,provider:config.provider,mode:live?'LIVE_EXTERNAL':'CACHED_LIVE_REPLAY',tolerances,scope:'Actual Bumps parsePlanImage with whole image/detail pipeline. The separate demo exercises full API upload/critique/doorway audit. No ground truth is sent to inference.',attempted:results.filter(r=>r.attempted).length,extractions:results.filter(r=>r.extractionSucceeded).length,passed:results.filter(r=>r.status==='PASS').length,total:results.length,results}
await writeFile(path.join(directory,reportName+'.json'),JSON.stringify(report,null,2),{mode:0o600})
const rows=results.map(r=>{const c=r.comparison,room=c?.rooms.find((r:any)=>r.absoluteError),door=c?.doors.find((d:any)=>d.positionErrorPx!==undefined);return `| ${r.id} | ${r.status} | ${r.classification} | ${room?room.absoluteError.width.toFixed(3)+' / '+room.absoluteError.height.toFixed(3)+' '+room.absoluteError.unit:'—'} | ${c?.walls.p95Px?.toFixed(2)??'—'} | ${door?.positionErrorPx?.toFixed(2)??'—'} / ${door?.widthErrorPx?.toFixed(2)??'—'} | ${r.export?.status??'NOT_RUN'} | ${c?.failures.join('; ')||r.code||'within configured tolerances'} |`})
await writeFile(path.join(directory,reportName+'.md'),`# Synthetic geometry benchmark\n\n${report.mode}, ${report.at}. ${report.extractions}/${report.total} structured extractions; ${report.passed}/${report.total} geometry/uncertainty cases passed. No manual correction is included in accuracy scores.\n\nGround-truth reference scale is used only for scoring; it is never fed to inference. Source-image coordinates are compared without fitted alignment or rescaling. Pixel positions are estimates; these tolerances are demonstration thresholds, not accessibility certification.\n\n| Case | Result | Evidence | First room width/height absolute error | Wall p95 px | First door position / width error px | Export | Reason |\n|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n\nFull per-room/per-door errors, missing/extra counts, uncertainty, annotated versus derived dimensions and model receipts are in ${reportName}.json. Export blocks are recorded rather than bypassed. The full user-visible corrected-STL demo is reported separately.\n`)
console.log(JSON.stringify({directory,total:report.total,extractions:report.extractions,passed:report.passed,mode:report.mode}));if(results.some(r=>r.status==='FAIL'))process.exitCode=1;else if(results.some(r=>r.status==='BLOCKED'))process.exitCode=2
