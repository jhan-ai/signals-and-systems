(function(root){
  'use strict';
  const TAU=2*Math.PI;
  const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i);
  const mod=(x,n)=>((x%n)+n)%n;
  const sinc=x=>Math.abs(x)<1e-10?1:Math.sin(x)/x;
  const C=(re=0,im=0)=>({re,im});
  const add=(a,b)=>C(a.re+b.re,a.im+b.im);
  const mul=(a,b)=>C(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
  const exp=t=>C(Math.cos(t),Math.sin(t));
  const abs=z=>Math.hypot(z.re,z.im);
  function dtfs(x){return x.map((_,k)=>x.reduce((z,v,n)=>add(z,C(v*Math.cos(TAU*k*n/x.length)/x.length,-v*Math.sin(TAU*k*n/x.length)/x.length)),C()));}
  function synthesis(c,n,keys=c.map((_,k)=>k)){return keys.reduce((z,k)=>add(z,mul(c[mod(k,c.length)],exp(TAU*k*n/c.length))),C());}
  function convolve(x,h){const y=Array(x.length+h.length-1).fill(0);x.forEach((v,i)=>h.forEach((w,j)=>y[i+j]+=v*w));return y;}
  function recurrence(a1,a2,b,input,y1=0,y2=0){const out=[];for(const x of input){const y=a1*y1+a2*y2+b*x;out.push(y);y2=y1;y1=y;}return out;}
  function firstOrderParts(a,b,r,initial,n){
    const resonance=Math.abs(a-r)<1e-9;
    const particular=resonance?b*(n+1)*Math.pow(a,n):b*r/(r-a)*Math.pow(r,n);
    const homogeneous=resonance?Math.pow(a,n+1)*initial:Math.pow(a,n+1)*(initial-b/(r-a));
    return {particular,homogeneous,total:particular+homogeneous,resonance};
  }
  const alias=(f,fs)=>mod(f+fs/2,fs)-fs/2;
  const quantize=(x,bits)=>{const L=2**bits;return -1+2*Math.round((Math.max(-1,Math.min(1,x))+1)*(L-1)/2)/(L-1);};
  function pair(kind,w,T=2){
    if(kind==='rect')return C(T*sinc(w*T/2));
    if(kind==='triangle')return C(T/2*sinc(w*T/4)**2);
    if(kind==='exp')return C(1/(1+w*w),-w/(1+w*w));
    if(kind==='impulse')return C(1);
    return C();
  }
  function filter(kind,w,c=3,upper=8){const a=Math.abs(w);if(kind==='real')return C(c*c/(c*c+w*w),-c*w/(c*c+w*w));return C(Number(kind==='low'?a<=c:kind==='high'?a>=c:kind==='band'?a>=c&&a<=upper:!(a>=c&&a<=upper)));}
  const api={TAU,range,mod,sinc,C,add,mul,exp,abs,dtfs,synthesis,convolve,recurrence,firstOrderParts,alias,quantize,pair,filter};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LectureMath=api;
})(typeof window==='undefined'?globalThis:window);
