import assert from 'node:assert/strict'
import {test} from 'node:test'
import type {NextRequest} from 'next/server'
import {GET} from '../app/backend/[...path]/route'
// MOCKED_INTEGRATION: actual gateway handler; synthetic upstream response, no model/service call.
for(const state of ['current','provisional'])test('MOCKED_INTEGRATION: browser download retains '+state+' geometry provenance without leaking upstream credentials',async()=>{
 const original=globalThis.fetch,bytes=new Uint8Array([1,2,3,4])
 globalThis.fetch=(async()=>new Response(bytes,{headers:{'content-type':'model/stl','content-disposition':'attachment; filename="synthetic-'+state+'-map.stl"','x-floor-model-version':'11','x-tactile-design-id':'synthetic-design','x-geometry-status':state,'authorization':'Bearer synthetic-upstream-only'}})) as typeof fetch
 try{
  const url='http://localhost:3400/backend/projects/synthetic/export/map.stl',request=Object.assign(new Request(url),{nextUrl:new URL(url)}) as unknown as NextRequest
  const result=await GET(request,{params:Promise.resolve({path:['projects','synthetic','export','map.stl']})})
  assert.equal(result.status,200);assert.equal(result.headers.get('x-floor-model-version'),'11');assert.equal(result.headers.get('x-tactile-design-id'),'synthetic-design');assert.equal(result.headers.get('x-geometry-status'),state);assert.ok(result.headers.get('content-disposition')?.includes('synthetic-'+state));assert.equal(result.headers.get('authorization'),null);assert.equal(result.headers.get('cache-control'),'no-store');assert.deepEqual(new Uint8Array(await result.arrayBuffer()),bytes)
 }finally{globalThis.fetch=original}
})
