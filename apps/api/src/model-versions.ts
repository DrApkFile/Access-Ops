import {and,desc,eq,sql} from 'drizzle-orm'
import type {FloorModel} from '@bumps/floor-model'
import {db} from './db'
import {projects,floorModels} from './db/schema'
import {AppError} from './accessops/errors'
export async function saveModelVersion(projectId:string,model:FloorModel,expectedVersion?:number,extra:{iteration?:number;critique?:unknown}={}){
 return db.transaction(async tx=>{await tx.execute(sql`select id from projects where id=${projectId} for update`);const latest=await tx.query.floorModels.findFirst({where:eq(floorModels.projectId,projectId),orderBy:desc(floorModels.version)});if(expectedVersion!==undefined&&(latest?.version??0)!==expectedVersion)throw new AppError('MODEL_VERSION_CONFLICT',409);const version=(latest?.version??0)+1;await tx.insert(floorModels).values({id:Bun.randomUUIDv7(),projectId,version,model,...extra});return version})
}
export function isCurrentDesign(designVersion:number,modelVersion:number){return designVersion===modelVersion}
