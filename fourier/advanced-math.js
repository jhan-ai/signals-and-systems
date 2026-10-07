'use strict';
window.FourierLessonMath=(()=>{
 const TAU=2*Math.PI,clean=x=>Math.abs(x)<1e-12?0:x;
 const sinc=x=>Math.abs(x)<1e-10?1:clean(Math.sin(Math.PI*x)/(Math.PI*x));
 const polar=(a,p)=>({re:clean(a*Math.cos(p)),im:clean(a*Math.sin(p))});
 const multiply=(a,b)=>({re:clean(a.re*b.re-a.im*b.im),im:clean(a.re*b.im+a.im*b.re)});
 const sum=terms=>terms.reduce((s,z)=>({re:clean(s.re+z.re),im:clean(s.im+z.im)}),{re:0,im:0});
 const scale=(z,a)=>({re:clean(z.re*a),im:clean(z.im*a)});
 function coefficients(parts,dc){
  const bins=new Map([[0,{k:0,re:dc,im:0}]]);
  parts.filter(p=>p.on).forEach(p=>{for(const sign of [-1,1]){const k=sign*p.f,z=polar(p.a/2,sign*p.p*Math.PI/12),old=bins.get(k)||{k,re:0,im:0};bins.set(k,{k,re:clean(old.re+z.re),im:clean(old.im+z.im)});}});
  return [...bins.values()].filter(z=>Math.hypot(z.re,z.im)>1e-10).sort((a,b)=>a.k-b.k);
 }
 const three=()=>[{k:1,re:1,im:0},{k:2,re:.8,im:0},{k:3,re:.5,im:0}];
 const lecture=()=>coefficients([{f:1,a:2,p:3,on:true},{f:3,a:1,p:-4,on:true}],1);
 const example53=()=>coefficients([{f:1,a:4,p:3,on:true},{f:3,a:2,p:-4,on:true}],6);
 const coefficient=(terms,k)=>terms.find(z=>z.k===k)||{k,re:0,im:0};
 const basisInner=(k,m,T)=>k===m?T:0;
 const inner=(terms,m,T)=>sum(terms.map(z=>scale(z,basisInner(z.k,m,T))));
 const signal=(terms,t,T=1,N=Infinity)=>sum(terms.filter(z=>Math.abs(z.k)<=N).map(z=>multiply(z,polar(1,TAU*z.k*t/T))));
 const pulseCoefficient=(A,T,w,k)=>clean(A*w/T*sinc(k*w/T));
 function pulseTarget(A,T,w,t){const distance=Math.abs(((t/T+.5)%1+1)%1-.5);return w===T?A:Math.abs(distance-w/(2*T))<1e-10?A/2:distance<w/(2*T)?A:0;}
 function pulseSum(A,T,w,N,t){let value=A*w/T;for(let k=1;k<=N;k++)value+=2*pulseCoefficient(A,T,w,k)*Math.cos(TAU*k*t/T);return clean(value);}
 return {sinc,polar,multiply,sum,scale,coefficients,three,lecture,example53,coefficient,basisInner,inner,signal,pulseCoefficient,pulseTarget,pulseSum};
})();
