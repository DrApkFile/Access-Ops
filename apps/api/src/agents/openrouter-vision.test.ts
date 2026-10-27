import {test,expect,afterEach} from 'bun:test'
import {Resvg} from '@resvg/resvg-js'
import {runVisionTurn} from './vision'
import {selectVision,selectedVisionReadiness,OPENROUTER_VISION_MODEL as model} from '../providers/vision-selection'
import {withProviderWorkspace} from '../providers/workspace-scope'
import {captureModelExecutions} from '../providers/model-executions'
import {redact,hash} from '../accessops/errors'
import type {Transport} from '../providers/http'
const keys=['VISION_PROVIDER','OPENROUTER_API_KEY','OPENROUTER_VISION_MODEL',
 'ACCESSOPS_OPENROUTER_VISION_WORKSPACES','ACCESSOPS_PROVIDER_WORKSPACES',
 'OPENROUTER_VISION_MAX_OUTPUT_TOKENS','MODEL_PROVIDER','NVIDIA_MODEL'] as const
const original=Object.fromEntries(keys.map(k=>[k,process.env[k]]))
afterEach(()=>{for(const k of keys)if(original[k]===undefined)delete process.env[k];else process.env[k]=original[k]})
const png=new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="white"/></svg>').render().asPng()
const input=()=>({agentName:'Synthetic vision',instruction:'Return JSON only',parts:[{text:'FULL PLAN 64x64'},{inlineData:{mimeType:'image/png',data:Buffer.from(png).toString('base64')}}]})
function setup(){process.env.VISION_PROVIDER='openrouter';process.env.OPENROUTER_API_KEY='unit-router-secret';process.env.OPENROUTER_VISION_MODEL=model;process.env.ACCESSOPS_PROVIDER_WORKSPACES='unit';process.env.ACCESSOPS_OPENROUTER_VISION_WORKSPACES='unit';delete process.env.OPENROUTER_VISION_MAX_OUTPUT_TOKENS}
const catalog=(price='0',modalities=['image','text'])=>({data:[{id:model,pricing:{prompt:price,completion:'0'},architecture:{input_modalities:modalities},supported_parameters:['response_format','reasoning']}]})
const completion=(content='{"labels":["CLINIC"]}',identity=model,finish='stop',cost=0)=>({id:'unit-request',provider:'Nvidia',model:identity,choices:[{finish_reason:finish,message:{content}}],usage:{cost}})
function transport(response:()=>Response=()=>Response.json(completion()),account:unknown={data:{is_free_tier:true}},models:unknown=catalog()){
 const calls:{url:string;init?:RequestInit}[]=[]
 const send:Transport=async(url,init)=>{calls.push({url:String(url),init});return String(url).endsWith('/key')?Response.json(account):String(url).endsWith('/models')?Response.json(models):response()}
 return {send,calls}
}
const call=(send:Transport,options=input())=>withProviderWorkspace('unit',()=>runVisionTurn(options,send))
test('MOCKED_INTEGRATION: exact free image request retains all source parts, actual provider and provenance; NVIDIA text selection remains independent',async()=>{
 setup();process.env.MODEL_PROVIDER='nvidia';process.env.NVIDIA_MODEL='nvidia/nemotron-3.5-lightning-30b-a3b'
 const t=transport(),captured=await captureModelExecutions(()=>call(t.send))
 expect(t.calls.map(c=>c.url)).toEqual(['https://openrouter.ai/api/v1/key','https://openrouter.ai/api/v1/models','https://openrouter.ai/api/v1/chat/completions'])
 const req=t.calls[2]!,body=JSON.parse(String(req.init?.body))
 expect(body.model).toBe(model);expect(body).not.toHaveProperty('models');expect(body.reasoning).toEqual({enabled:false})
 expect(body.provider).toEqual({require_parameters:true,allow_fallbacks:false,max_price:{prompt:0,completion:0,request:0,image:0}})
 expect(body.response_format).toEqual({type:'json_object'});expect(body.messages[1].content[0].text).toBe('FULL PLAN 64x64')
 expect(body.messages[1].content[1].image_url.url).toStartWith('data:image/png;base64,')
 expect(new Headers(req.init?.headers).get('authorization')).toBe('Bearer unit-router-secret')
 expect(captured.executions[0]).toMatchObject({provider:'openrouter',servingProvider:'Nvidia',model,execution:'mocked',capability:'vision',geometryReviewed:false,httpStatus:200,reportedCost:0})
 expect(captured.executions[0]?.inputImages[0]?.sourceSha256).toBe(hash(png));expect(JSON.stringify(captured.executions)).not.toContain('unit-router-secret')
 expect(process.env.NVIDIA_MODEL).toBe('nvidia/nemotron-3.5-lightning-30b-a3b')
})
for(const k of ['OPENROUTER_API_KEY','ACCESSOPS_OPENROUTER_VISION_WORKSPACES','ACCESSOPS_PROVIDER_WORKSPACES'] as const)
 test('UNIT: absent '+k+' prevents any external request',async()=>{setup();process.env[k]='';const t=transport();await expect(call(t.send)).rejects.toThrow();expect(t.calls).toHaveLength(0)})
test('UNIT: only the verified exact free model can be selected, and readiness does not claim live health',()=>{
 setup();expect(()=>selectVision({VISION_PROVIDER:'openrouter',OPENROUTER_VISION_MODEL:'nvidia/nemotron-3.5-super-vl'})).toThrow('OPENROUTER_FREE_VISION_MODEL_NOT_SUPPORTED')
 expect(selectedVisionReadiness('unit')).toMatchObject({provider:'openrouter',configured:true,workspacePermitted:true,state:'configured_not_live_verified',automaticFallback:false})
 expect(selectedVisionReadiness('other')).toMatchObject({workspacePermitted:false,state:'consent_required'})
})
test('MOCKED_INTEGRATION: paid or unknown account never reaches inference',async()=>{
 setup();for(const account of [{data:{is_free_tier:false}},{data:{}}]){const t=transport(undefined,account);await expect(call(t.send)).rejects.toThrow('FREE_VISION_ACCOUNT_NOT_ELIGIBLE');expect(t.calls).toHaveLength(1)}
})
for(const [name,models] of [['paid price',catalog('0.1')],['no image support',catalog('0',['text'])],['missing model',{data:[]}],['unrelated malformed model ignored',{data:[null,...catalog().data]}]] as const)
 test('MOCKED_INTEGRATION: catalog '+name,async()=>{
 setup();const t=transport(undefined,undefined,models)
 if(name==='unrelated malformed model ignored')await expect(call(t.send)).resolves.toContain('CLINIC')
 else {await expect(call(t.send)).rejects.toThrow('FREE_VISION_MODEL_NOT_AVAILABLE');expect(t.calls).toHaveLength(2)}
})
for(const [status,code,attempts] of [[401,'FREE_VISION_ACCESS_DENIED',1],[403,'FREE_VISION_ACCESS_DENIED',1],[400,'FREE_VISION_INPUT_REJECTED',1],[404,'FREE_VISION_MODEL_NOT_AVAILABLE',1],[429,'FREE_VISION_THROTTLED',2],[500,'FREE_VISION_BUSY',1],[503,'FREE_VISION_BUSY',2],[504,'FREE_VISION_BUSY',2]] as const)
 test('MOCKED_INTEGRATION: HTTP'+status+' classified accurately with bounded attempts and no provider switch',async()=>{
 setup();const t=transport(()=>Response.json({error:'not returned to user'},{status}))
 const receipts:unknown[]=[];await expect(captureModelExecutions(async records=>{receipts.push(records);return call(t.send)})).rejects.toThrow(code)
 expect(t.calls.filter(c=>c.url.endsWith('/chat/completions'))).toHaveLength(attempts);expect(receipts).toEqual([[]])
})
test('MOCKED_INTEGRATION: one transient failure then success records only completed inference',async()=>{
 setup();let n=0;const t=transport(()=>++n===1?Response.json({}, {status:503}):Response.json(completion()))
 const captured=await captureModelExecutions(()=>call(t.send));expect(n).toBe(2);expect(captured.executions).toHaveLength(1)
})
test('MOCKED_INTEGRATION: timeout/offline fails after two attempts without fabricated output',async()=>{
 setup();let n=0;const t=transport();const send:Transport=async(url,init)=>{if(String(url).endsWith('/chat/completions')){n++;throw new DOMException('aborted','TimeoutError')}return t.send(url,init)}
 await expect(call(send)).rejects.toThrow('FREE_VISION_TIMEOUT');expect(n).toBe(2)
})
for(const [name,body,code] of [
 ['truncated',completion('{}',model,'length'),'FREE_VISION_OUTPUT_TRUNCATED'],
 ['model mismatch',completion('{}','other'),'PROVIDER_MODEL_IDENTITY_MISMATCH'],
 ['malformed JSON',completion('no json'),'FREE_VISION_INVALID_OUTPUT'],
 ['empty output',completion(''),'FREE_VISION_INVALID_OUTPUT'],
 ['array output',completion('[]'),'FREE_VISION_INVALID_OUTPUT'],
 ['paid cost',completion('{}',model,'stop',0.1),'FREE_VISION_COST_NOT_ZERO'],
 ['secret echo',completion('{"echo":"unit-router-secret"}'),'PROVIDER_SECRET_ECHO_REJECTED'],
 ['missing envelope',{},'FREE_VISION_INVALID_RESPONSE'],
 ['safety rejection',completion('{}',model,'content_filter'),'FREE_VISION_OUTPUT_REJECTED'],
] as const) test('MOCKED_INTEGRATION: '+name+' never becomes successful extraction',async()=>{
 setup();const t=transport(()=>Response.json(body));await expect(call(t.send)).rejects.toThrow(code)
})
test('UNIT: malformed, unsupported and excessive images are rejected before provider contact',async()=>{
 setup();const t=transport()
 for(const image of [{mimeType:'image/png',data:'bad'},{mimeType:'image/gif',data:Buffer.from(png).toString('base64')},{mimeType:'image/png',data:'A'.repeat(8*1024*1024)}])
  await expect(call(t.send,{...input(),parts:[{inlineData:image}]})).rejects.toThrow()
 await expect(call(t.send,{...input(),parts:Array.from({length:17},()=>input().parts[1]!)})).rejects.toThrow('VISION_IMAGE_COUNT_LIMIT')
 expect(t.calls).toHaveLength(0)
})
test('UNIT: text-only turns cannot masquerade as image inference and invalid output budgets fail early',async()=>{
 setup();const t=transport();await expect(call(t.send,{...input(),parts:[{text:'no image'}]})).rejects.toThrow('FREE_VISION_IMAGE_REQUIRED')
 process.env.OPENROUTER_VISION_MAX_OUTPUT_TOKENS='999999';await expect(call(t.send)).rejects.toThrow('FREE_VISION_OUTPUT_BUDGET_INVALID');expect(t.calls).toHaveLength(0)
})
test('UNIT: Groq and OpenRouter key-shaped values are redacted even in diagnostic prose',()=>{
 const value=redact({message:'gsk_syntheticUnitToken and sk-or-v1-syntheticUnitToken'})
 expect(JSON.stringify(value)).not.toContain('syntheticUnitToken')
})
