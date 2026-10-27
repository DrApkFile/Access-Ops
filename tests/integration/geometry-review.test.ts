import {test,expect} from 'bun:test'
import {attachExtractionEvidence,floorModelSchema} from '../../packages/floor-model/src/index'
test.skipIf(process.env.ACCESSOPS_INTEGRATION!=='1')('LOCAL_INTEGRATION: geometry review, optimistic versioning, immutable history, provisional gate and tenant isolation',async()=>{
 if(!process.env.DATABASE_URL?.includes('127.0.0.1:55434'))throw new Error('Isolated local test database required')
 const {db}=await import('../../apps/api/src/db'),t=await import('../../apps/api/src/accessops/schema'),{app}=await import('../../apps/api/src/app')
 const uid=crypto.randomUUID(),oid=crypto.randomUUID(),wid=crypto.randomUUID(),password=crypto.randomUUID(),email=uid+'@test.invalid'
 await db.transaction(async tx=>{await tx.insert(t.organizations).values({id:oid,name:'Geometry review isolated test'});await tx.insert(t.workspaces).values({id:wid,organizationId:oid,name:'Geometry review'});await tx.insert(t.users).values({id:uid,email,passwordHash:await Bun.password.hash(password,{algorithm:'argon2id',memoryCost:19456,timeCost:2})});await tx.insert(t.memberships).values({userId:uid,workspaceId:wid,role:'admin'})})
 let cookie='';async function request(route:string,method='GET',body?:unknown){const r=await app.request(route,{method,headers:{cookie,'content-type':'application/json','x-accessops-request':'1'},body:body===undefined?undefined:JSON.stringify(body)},{remoteIp:uid});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie')!.split(';')[0]!;return r}
 expect((await request('/auth/login','POST',{email,password,workspaceId:wid})).status).toBe(200)
 const form=new FormData(),png=await Bun.file(new URL('../fixtures/geometry-benchmark/01-clean.png',import.meta.url)).bytes();form.set('file',new File([png],'geometry-integration.png',{type:'image/png'}))
 const uploaded=await app.request('/projects',{method:'POST',headers:{cookie,'x-accessops-request':'1'},body:form},{remoteIp:uid}),project=await uploaded.json() as any;expect(uploaded.status).toBe(201)
 const base=attachExtractionEvidence(floorModelSchema.parse({schemaVersion:1,plan:{widthPx:680,heightPx:540,pixelsPerMeter:null,north:null},walls:[{id:'w',kind:'wall',a:{x:50,y:300},b:{x:550,y:300},thickness:8,confidence:.9}],openings:[{id:'d',kind:'door',at:{x:300,y:300},width:80,wallId:'w',confidence:.9}],rooms:[{id:'r',kind:'room',label:'Room',polygon:[{x:50,y:50},{x:550,y:50},{x:550,y:300},{x:50,y:300}],confidence:.9}],features:[]}))
 const imported=await request('/projects/'+project.id+'/model','POST',base);expect(imported.status).toBe(201)
 const initial=await(await request('/projects/'+project.id+'/model')).json() as any
 const marked=await request('/projects/'+project.id+'/model/review','POST',{version:initial.version,reason:'Explicit synthetic geometry test import, not live model output'});expect(marked.status).toBe(200)
 expect((await request('/projects/'+project.id+'/tactile','POST')).status).toBe(409)
 const reason='Checked the synthetic fixture and corrected the recorded value.'
 const bad=await request('/projects/'+project.id+'/model/measurement-review','POST',{expectedVersion:initial.version,correction:{kind:'opening',id:'d',at:{x:900,y:300},width:80,wallId:'w',reason}});expect(bad.status).toBe(422)
 const fixed=await request('/projects/'+project.id+'/model/measurement-review','POST',{expectedVersion:initial.version,correction:{kind:'opening',id:'d',at:{x:320,y:300},width:72,wallId:'w',reason}}),saved=await fixed.json() as any;expect(fixed.status).toBe(201);expect(saved.model.geometryEvidence.features.find((f:any)=>f.elementId==='d').origin).toBe('user_corrected')
 expect((await request('/projects/'+project.id+'/model/measurement-review','POST',{expectedVersion:initial.version,correction:{kind:'scale',pixelsPerMeter:80,reason}})).status).toBe(409)
 const calibrated=await request('/projects/'+project.id+'/model/measurement-review','POST',{expectedVersion:saved.version,correction:{kind:'scale',pixelsPerMeter:80,reason}}),current=await calibrated.json() as any;expect(calibrated.status).toBe(201)
 const reopened=await(await request('/projects/'+project.id+'/model')).json() as any;expect(reopened.model.plan.pixelsPerMeter).toBe(80);expect(reopened.model.openings[0].at.x).toBe(320);expect(reopened.model.geometryEvidence.features.find((f:any)=>f.elementId==='d').originalValue).toContain('300')
 const historic=await(await request('/projects/'+project.id+'/model?version='+initial.version)).json() as any;expect(historic.model.openings[0].at.x).toBe(300);expect(historic.model.plan.pixelsPerMeter).toBeNull();expect((await request('/projects/'+project.id+'/model/svg?version='+initial.version)).status).toBe(200)
 const denied=await app.request('/projects/'+project.id+'/model',{headers:{}},{remoteIp:'anonymous-geometry'});expect(denied.status).toBe(401)
 const forged=structuredClone(reopened.model);forged.geometryEvidence.features[0].origin='user_corrected';forged.geometryEvidence.features[0].note='Forged client metadata';const raw=await request('/projects/'+project.id+'/model','POST',forged),rawResult=await raw.json() as any;expect(raw.status).toBe(201);expect(rawResult.model.geometryEvidence.features[0].note).not.toBe('Forged client metadata')
 expect((await request('/projects/'+project.id+'/model/doorway-audit','POST',{expectedVersion:rawResult.version})).status).toBe(403)
 const details=await(await request('/projects/'+project.id+'/model/review-details')).json() as any;expect(details.reviews.length).toBeGreaterThan(0)
},30000)
