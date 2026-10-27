// All browser calls use the same-origin gateway; server-only credentials stay on the server.
export const API_URL = '/backend';
export function apiFetch(input:RequestInfo|URL,init:RequestInit={}) {
 const headers=new Headers(init.headers);headers.set('x-accessops-request','1');
 return fetch(input,{...init,headers,credentials:'same-origin'});
}
