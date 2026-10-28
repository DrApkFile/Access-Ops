"use client";
import {useEffect,useState} from 'react';
import {findElement,geometryReviewIssues,roomDimensions,editOperationSchema,type EditOperation,type FloorModel} from '@bumps/floor-model';
import {JsonEditor} from '@/components/operations/json-editor';
import {Button} from '@/components/ui/button';
import {API_URL,apiFetch} from '@/lib/api';
type Props={model:FloorModel;version:number;projectId:string;selectedId:string|null;onSelect:(id:string)=>void;onSaved:(model:FloorModel,version:number)=>void;onApply:(ops:EditOperation[],reason:string)=>void};
const originLabel=(value:string)=>value==='user_corrected'?'User-corrected':value==='extracted'?'Extracted':'Inferred';
const field='w-full rounded-sm border bg-background px-2 py-1 text-xs';
export function MeasurementReviewPanel({model,version,projectId,selectedId,onSelect,onSaved,onApply}:Props){
 const [reason,setReason]=useState(''),[pending,setPending]=useState(false),[error,setError]=useState(''),[reviews,setReviews]=useState<unknown[]>([]);
 const [operationText,setOperationText]=useState('[]');
 const [versions,setVersions]=useState<{version:number}[]>([]),[historical,setHistorical]=useState<{version:number;model:FloorModel}|null>(null);
 const evidence=model.geometryEvidence,issues=geometryReviewIssues(model),selected=selectedId?findElement(model,selectedId):undefined;
 const scale=evidence?.measurements.find(m=>m.kind==='scale'),meta=evidence?.features.find(m=>m.elementId===selectedId);
 useEffect(()=>{let active=true;void apiFetch(`${API_URL}/projects/${projectId}/model/review-details`,{cache:'no-store'}).then(r=>r.ok?r.json():{reviews:[]}).then(r=>{if(active)setReviews(r.reviews)}).catch(()=>{});return()=>{active=false}},[projectId,version]);
 useEffect(()=>{let active=true;void apiFetch(`${API_URL}/projects/${projectId}/model/versions`,{cache:'no-store'}).then(r=>r.json()).then(data=>{if(active)setVersions(data.versions??[])}).catch(()=>{});return()=>{active=false}},[projectId,version]);
 async function submit(correction:Record<string,unknown>){
  setPending(true);setError('');try{const r=await apiFetch(`${API_URL}/projects/${projectId}/model/measurement-review`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({expectedVersion:version,correction:{...correction,reason}})}),data=await r.json();if(!r.ok)throw new Error(data.error??'Correction rejected');onSaved(data.model,data.version)}catch(e){setError(e instanceof Error?e.message:'Correction failed')}finally{setPending(false)}
 }
 async function runAudit(stage:'doorway-audit'|'critique'='doorway-audit'){
  setPending(true);setError('');try{
   const r=await apiFetch(`${API_URL}/projects/${projectId}/model/${stage}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({expectedVersion:version})}),data=await r.json();if(!r.ok)throw new Error(data.error??'Geometry review failed')
   let done=false
   for(let i=0;i<240;i++){const response=await apiFetch(`${API_URL}/v1/jobs/${data.jobId}`),job=await response.json();if(!response.ok)throw new Error('Review job unavailable');if(job.status==='succeeded'){done=true;break}if(['failed','cancelled'].includes(job.status))throw new Error(job.error??'Review failed');await new Promise(resolve=>setTimeout(resolve,1000))}
   if(!done)throw new Error('Review remains pending; inspect job/history before retrying')
   const latest=await apiFetch(`${API_URL}/projects/${projectId}/model`).then(r=>r.json());onSaved(latest.model,latest.version)
  }catch(e){setError(e instanceof Error?e.message:'Geometry review unavailable')}finally{setPending(false)}
 }
 const disabled=pending||reason.trim().length<12;
 return <section className="space-y-3 border-b p-3 text-xs" aria-label="Measurement provenance and uncertainty">
  <h2 className="font-medium">Measurements and uncertainty</h2>
  {!evidence?<p>Legacy record: measurement provenance was not recorded. Existing editing remains available.</p>:<>
   <p>Image geometry is a proposal. Extracted means identified in the image; it does not mean surveyed or independently verified.</p>
   <p data-testid="scale-provenance">Scale: {scale?originLabel(scale.origin):'Unknown'} · {scale?.state??'not recorded'} · {model.plan.pixelsPerMeter??'unknown'} px/m</p>
   {evidence.provisionalReason&&<p role="status">Provisional relative-scale output: {evidence.provisionalReason}</p>}
   <ul className="max-h-28 space-y-1 overflow-auto" aria-label="Geometry review reasons">{issues.map((issue,i)=><li key={issue.targetId+issue.reason+i}><button type="button" className="text-left underline" onClick={()=>issue.targetId!=='plan'&&onSelect(issue.targetId)}>{issue.targetId} · {issue.reason}</button><p>{issue.message}</p></li>)}</ul>
   <label className="block">Review reason (required for confirmation/correction)<textarea aria-label="Measurement review reason" className={field} value={reason} onChange={e=>setReason(e.target.value)} minLength={12} maxLength={1000}/></label>
   <form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);void submit({kind:'scale',pixelsPerMeter:Number(data.get('scale'))})}}>
    <label>Confirmed scale (pixels per meter)<input key={'scale-'+version} aria-label="Confirmed pixels per meter" className={field} name="scale" type="number" min="0.000001" step="any" defaultValue={scale?.value??''} required/></label>
    <Button type="submit" size="sm" disabled={disabled}>Save scale correction</Button>
   </form>
   {issues.length>0&&issues.every(i=>['scale_unknown','scale_unreviewed','dimension_missing'].includes(i.reason))&&<Button type="button" size="sm" variant="outline" disabled={disabled} onClick={()=>void submit({kind:'provisional'})}>Keep scale unknown; acknowledge provisional export</Button>}
   <label className="block">Feature provenance<select aria-label="Review geometry feature" className={field} value={selectedId??''} onChange={e=>onSelect(e.target.value)}><option value="">Select a feature</option>{evidence.features.filter(m=>findElement(model,m.elementId)).map(m=><option key={m.elementId} value={m.elementId}>{m.elementId} · {originLabel(m.origin)} · {m.state}</option>)}</select></label>
   {selected&&meta&&<div data-testid="feature-provenance" className="space-y-2 rounded-sm border p-2">
    <p>{selected.id} · {originLabel(meta.origin)} · {meta.state}</p><p>{meta.note}</p>
    {meta.originalValue&&<details><summary>Original extracted value</summary><pre className="max-h-28 overflow-auto whitespace-pre-wrap">{meta.originalValue}</pre></details>}
    {selected.kind==='room'&&<><p>Inferred oriented bounding dimensions: {model.plan.pixelsPerMeter?`${roomDimensions(selected,model.plan.pixelsPerMeter).widthM?.toFixed(2)} × ${roomDimensions(selected,model.plan.pixelsPerMeter).heightM?.toFixed(2)} m`:'unavailable in meters; scale unknown'}. These are derived bounds, not direct measurements.</p>
     <form key={selected.id+'-'+version} onSubmit={e=>{e.preventDefault();try{const data=new FormData(e.currentTarget),points=JSON.parse(String(data.get('points')));onApply([{op:'reshape',id:selected.id,points},{op:'confirm',id:selected.id}],reason)}catch{setError('Enter a valid array of {x,y} source-pixel coordinates')}}}>
      <label>Room boundary (source pixels)<textarea aria-label="Room boundary coordinates" className={field} name="points" defaultValue={JSON.stringify(selected.polygon)}/></label><Button type="submit" size="sm" disabled={disabled}>Save room boundary correction</Button>
     </form>
    </>}
    {(selected.kind==='door'||selected.kind==='window')&&<form key={selected.id+'-'+version} onSubmit={e=>{e.preventDefault();const d=new FormData(e.currentTarget);void submit({kind:'opening',id:selected.id,at:{x:Number(d.get('x')),y:Number(d.get('y'))},width:Number(d.get('width')),wallId:d.get('wall')})}}>
     <p>Derived drawing width: {model.plan.pixelsPerMeter?(selected.width/model.plan.pixelsPerMeter).toFixed(2)+' m':'unknown in meters'}. This is not a measured clear width.</p>
     <label>X (pixels)<input aria-label="Door X pixels" className={field} name="x" type="number" step="any" defaultValue={selected.at.x} required/></label>
     <label>Y (pixels)<input aria-label="Door Y pixels" className={field} name="y" type="number" step="any" defaultValue={selected.at.y} required/></label>
     <label>Width (pixels)<input aria-label="Door width pixels" className={field} name="width" type="number" min="0.000001" step="any" defaultValue={selected.width} required/></label>
     <label>Host wall<select aria-label="Door host wall" className={field} name="wall" defaultValue={selected.wallId??''} required><option value="">Select host wall</option>{model.walls.map(w=><option key={w.id} value={w.id}>{w.id}</option>)}</select></label>
     <Button type="submit" size="sm" disabled={disabled}>Save doorway correction</Button>
    </form>}
    <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={()=>void submit({kind:'confirm',id:selected.id})}>Confirm feature against source</Button>
   </div>}
   {evidence.measurements.filter(m=>m.kind!=='scale'&&model.rooms.some(r=>r.id===m.targetId)).map(m=><form className="rounded-sm border p-2" key={m.id+'-'+version} onSubmit={e=>{e.preventDefault();const d=new FormData(e.currentTarget);void submit({kind:'dimension',id:m.id,value:Number(d.get('value'))})}}><p>{m.targetId} · {m.kind} · {originLabel(m.origin)} · {m.state}</p><p>{m.note}</p><label>Recorded dimension (m)<input aria-label={'Dimension '+m.id} name="value" className={field} type="number" min="0.000001" step="any" defaultValue={m.value??''} required/></label><Button type="submit" size="sm" disabled={disabled}>Save or confirm dimension</Button></form>)}
   <details><summary>Exact geometry corrections (existing edit operations)</summary><p>Use source-pixel coordinates. These are explicit user edits, never presented as model extraction.</p><JsonEditor label="Reviewed geometry operations JSON" value={operationText} onChange={setOperationText}/><Button type="button" size="sm" disabled={disabled} onClick={()=>{try{onApply(editOperationSchema.array().min(1).parse(JSON.parse(operationText)),reason)}catch{setError('Invalid geometry operations; nothing was saved')}}}>Save reviewed geometry operations</Button></details>
  </>}
  {error&&<p role="alert">{error}</p>}
  <Button type="button" variant="outline" size="sm" disabled={pending} onClick={()=>void runAudit()}>Run doorway audit on saved geometry</Button>
  <Button type="button" variant="outline" size="sm" disabled={pending} onClick={()=>void runAudit('critique')}>Run critique on saved geometry</Button>
  <details><summary>Critique and doorway-audit history</summary><p>Critiques belong to their saved version. An audit is model advice, not human verification; it does not overwrite your corrections.</p><pre className="max-h-60 overflow-auto whitespace-pre-wrap" data-testid="geometry-review-history">{JSON.stringify(reviews,null,2)}</pre></details>
  <details><summary>Saved geometry history</summary><form onSubmit={e=>{e.preventDefault();const v=new FormData(e.currentTarget).get('version');void apiFetch(`${API_URL}/projects/${projectId}/model?version=${v}`).then(r=>r.json()).then(data=>setHistorical(data)).catch(()=>setError('History unavailable'))}}><label>Version<select className={field} name="version" aria-label="Saved geometry version">{versions.map(v=><option key={v.version} value={v.version}>{v.version}</option>)}</select></label><Button type="submit" size="sm">Reopen saved version</Button></form>{historical&&<div data-testid="historical-geometry"><p>Historical snapshot version {historical.version} · read only; current editing is unchanged.</p><img alt="Historical saved floor model" className="w-full bg-white" src={`${API_URL}/projects/${projectId}/model/svg?version=${historical.version}`}/><pre className="max-h-60 overflow-auto whitespace-pre-wrap">{JSON.stringify(historical.model,null,2)}</pre></div>}</details>
 </section>
}
