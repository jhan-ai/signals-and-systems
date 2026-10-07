'use strict';
// Continuous-time Fourier series. sinc uses the normalized convention sin(πv)/(πv).
window.FourierAdvancedMath=(()=>{
  const TAU=2*Math.PI, clean=x=>Math.abs(x)<1e-12?0:x;
  const sinc=x=>Math.abs(x)<1e-10?1:clean(Math.sin(Math.PI*x)/(Math.PI*x));
  const polar=(a,p)=>({re:clean(a*Math.cos(p)),im:clean(a*Math.sin(p))});
  const multiply=(a,b)=>({re:clean(a.re*b.re-a.im*b.im),im:clean(a.re*b.im+a.im*b.re)});
  const sum=terms=>terms.reduce((s,z)=>({re:clean(s.re+z.re),im:clean(s.im+z.im)}),{re:0,im:0});
  function coefficients(parts,dc){
    const bins=new Map([[0,{k:0,re:dc,im:0}]]);
    parts.filter(p=>p.on).forEach(p=>{
      for(const sign of [-1,1]){
        const k=sign*p.f,z=polar(p.a/2,sign*p.p*Math.PI/12),old=bins.get(k)||{k,re:0,im:0};
        bins.set(k,{k,re:clean(old.re+z.re),im:clean(old.im+z.im)});
      }
    });
    return [...bins.values()].filter(z=>Math.hypot(z.re,z.im)>1e-10).sort((a,b)=>a.k-b.k);
  }
  const lecture=()=>coefficients([{f:1,a:2,p:3,on:true},{f:3,a:1,p:-4,on:true}],1);
  const product=(terms,m,t,T=1)=>sum(terms.map(z=>multiply(z,polar(1,TAU*(z.k-m)*t/T))));
  // p is elapsed time / T. The normalization remains 1/T even when p < 1.
  const contribution=(z,m,p)=>multiply(z,polar(p*sinc((z.k-m)*p),Math.PI*(z.k-m)*p));
  const integral=(terms,m,p)=>sum(terms.map(z=>contribution(z,m,p)));
  const pulseCoefficient=(A,D,k)=>clean(A*D*sinc(k*D));
  function pulseTarget(A,T,D,t,dc=true){
    const distance=Math.abs(((t/T+.5)%1+1)%1-.5);
    const value=D===1?A:Math.abs(distance-D/2)<1e-10?A/2:distance<D/2?A:0;
    return value-(dc?0:A*D);
  }
  function pulseSum(A,T,D,N,t,dc=true){
    let value=dc?A*D:0;
    for(let k=1;k<=N;k++)value+=2*pulseCoefficient(A,D,k)*Math.cos(TAU*k*t/T);
    return clean(value);
  }
  function pair(A,phi,k,t){
    const plus=polar(A/2,TAU*k*t+phi),minus={re:plus.re,im:-plus.im};
    return {plus,minus,total:sum([plus,minus])};
  }
  return {sinc,polar,multiply,sum,coefficients,lecture,product,contribution,integral,pulseCoefficient,pulseTarget,pulseSum,pair};
})();
