/** Binary STL structural validation; units are exporter millimeters, not source-building meters. */
export function inspectBinaryStl(bytes:Uint8Array){
 if(bytes.byteLength<134)throw new Error('STL_EMPTY_OR_TRUNCATED')
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),triangles=view.getUint32(80,true)
 if(!triangles||bytes.byteLength!==84+50*triangles)throw new Error('STL_LENGTH_MISMATCH')
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],edges=new Map<string,{count:number;orientation:number}>();let volume6=0
 for(let n=0;n<triangles;n++){
  const offset=84+n*50,vertices:number[][]=[]
  for(let v=0;v<3;v++){const p=[];for(let k=0;k<3;k++){const x=view.getFloat32(offset+12+v*12+k*4,true);if(!Number.isFinite(x))throw new Error('STL_NONFINITE_VERTEX');p.push(x);min[k]=Math.min(min[k]!,x);max[k]=Math.max(max[k]!,x)}vertices.push(p)}
  const [a,b,c]=vertices as [number[],number[],number[]],u=b.map((v,k)=>v-a[k]!),v=c.map((v,k)=>v-a[k]!),cross=[u[1]!*v[2]!-u[2]!*v[1]!,u[2]!*v[0]!-u[0]!*v[2]!,u[0]!*v[1]!-u[1]!*v[0]!]
  if(Math.hypot(...cross)<1e-12)throw new Error('STL_DEGENERATE_TRIANGLE')
  volume6+=a[0]!*(b[1]!*c[2]!-b[2]!*c[1]!)+a[1]!*(b[2]!*c[0]!-b[0]!*c[2]!)+a[2]!*(b[0]!*c[1]!-b[1]!*c[0]!)
  for(let i=0;i<3;i++){const x=vertices[i]!.join(','),y=vertices[(i+1)%3]!.join(','),forward=x<y,key=forward?x+'|'+y:y+'|'+x,edge=edges.get(key)??{count:0,orientation:0};edge.count++;edge.orientation+=forward?1:-1;edges.set(key,edge)}
 }
 const nonManifoldEdges=[...edges.values()].filter(e=>e.count!==2||e.orientation!==0).length
 if(nonManifoldEdges)throw new Error('STL_NON_MANIFOLD_EDGES_'+nonManifoldEdges)
 if(Math.abs(volume6)<1e-6)throw new Error('STL_ZERO_VOLUME')
 return {bytes:bytes.byteLength,triangles,bbox:{min,max},watertight:true,nonManifoldEdges,volumeMm3:Math.abs(volume6)/6}
}
