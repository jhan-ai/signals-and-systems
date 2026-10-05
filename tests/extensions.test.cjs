'use strict';
const assert=require('node:assert/strict');require('../labs/math.js');require('../fourier/math.js');
const M=globalThis.SSMath,F=globalThis.FourierMath;let checks=0,maxTriangleError=0;
const close=(a,b,tol=1e-8)=>{checks++;assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,`${a} != ${b}, tolerance ${tol}`);};
// Support endpoint sums and shifted rectangle integration.
for(const sx of [-2,0,1])for(const sh of [-1,.5])for(const wx of [.5,2])for(const wh of [1,3])for(const t of [-4,0,1,3,7]){
 const lo=Math.max(sx,t-sh-wh),hi=Math.min(sx+wx,t-sh),q=hi>lo?M.integrate(tau=>-1.2*M.rect(tau,sx,sx+wx)*.7*M.rect(t-tau,sh,sh+wh),lo,hi,100):0;
 close(M.rectConv(t,sx,wx,sh,wh,-1.2,.7),q);close(M.rectConv(t,sx,wx,sh,wh),M.rectConv(t,sh,wh,sx,wx));close(M.rectConv(sx+sh,sx,wx,sh,wh),0);close(M.rectConv(sx+wx+sh+wh,sx,wx,sh,wh),0);
}
for(const k of [.5,1,2])for(const t of [0,.00001,.2,1.5,2,3,4,8]){let q=0;const edges=[0,...[1.5,3].filter(v=>v<t),t];for(let j=1;j<edges.length;j++)q+=M.integrate(v=>M.tri((v-1.5)/1.5)*Math.exp(-k*(t-v)),edges[j-1],edges[j],5000);const v=M.triangleExp(t,k);maxTriangleError=Math.max(maxTriangleError,Math.abs(q-v));close(v,q,1e-7);}
const coarse=M.riemannTriangle(4,1,6),fine=M.riemannTriangle(4,1,120),exact=M.triangleExp(4,1);assert.ok(Math.abs(fine-exact)<Math.abs(coarse-exact));checks++;
const events=[{a:1,t:0},{a:2,t:1},{a:1,t:2}];close(M.impulseTrain(events,t=>M.impulseResponse(t),2.5),40);close(events.reduce((a,e)=>a+e.a*10*Math.min(3,Math.max(0,2.5-e.t)),0),60);
for(const t of [0,.3,1,3,5]){const g=[1.2,-.7,.5,1.7,-.2],q=M.network(t,g);const a=M.integrate(v=>g[0]*Math.exp(-v)*g[1]*Math.exp(-(t-v)),0,t,1000),b=M.integrate(v=>g[0]*g[2]*v*Math.exp(-v)*g[3]*Math.exp(-(t-v)),0,t,1000),c=M.integrate(v=>g[4]*Math.exp(-v)*g[3]*Math.exp(-(t-v)),0,t,1000);close(q.total,a+b+c,1e-7);}
// Delay theorem with continuous (not quantized) phase changes and DC preserved.
for(const d of [-.31,0,.17,.5]){const p=F.initial(),shifted=p.map(c=>({...c,p:c.p-24*c.f*d}));const before=F.spectrum(p),after=F.spectrum(shifted);for(let i=0;i<before.length;i++)close(before[i].a,after[i].a);for(let j=0;j<30;j++)close(F.sample(p,.3,j/13-d),F.sample(shifted,.3,j/13));}

console.log(JSON.stringify({status:'passed',checks,maxTriangleError,coverage:['shifted pulse start/end','triangle/exponential convolution','finite-sum convergence','weighted impulse responses','serial/parallel paths','time-shift phases']},null,2));
