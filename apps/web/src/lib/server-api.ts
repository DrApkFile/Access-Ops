import 'server-only';
import {cookies} from 'next/headers';
export async function serverApi(path:string,init:RequestInit={}){
 const cookie=(await cookies()).get('ao_session');const headers=new Headers(init.headers);
 if(cookie)headers.set('cookie','ao_session='+encodeURIComponent(cookie.value));
 return fetch((process.env.API_INTERNAL_URL??process.env.NEXT_PUBLIC_API_URL??'http://localhost:3003')+path,{...init,headers,cache:'no-store',signal:AbortSignal.timeout(15000)});
}
