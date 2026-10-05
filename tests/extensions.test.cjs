'use strict';
const assert=require('node:assert/strict');require('../labs/math.js');require('../fourier/math.js');const M=globalThis.SSMath,F=globalThis.FourierMath;let checks=0,maxODEError=0,maxTriangleError=0;
const close=(a,b,tol=1e-8)=>{checks++;assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,`${a} != ${b}, tolerance ${tol}`);};
// Independent quadrature of finite-window energy, split at discontinuities.
for(const kind of ['pulse','constant','cos','exp','ramp'])for(const L of [1,2.3,10])for(const A of [.2,1.7]){
 const x=t=>M.energySignal(kind,t,A,.7),breaks=[-L,...[-1,0,1].filter(x=>x>-L&&x<L),L];let q=0;
 for(let j=1;j<breaks.length;j++)q+=M.integrate(t=>x(t)**2,breaks[j-1],breaks[j],10000);
 close(M.energy(kind,L,A,.7),q,1e-5);
}
// Exact lecture initial-condition decompositions.
for(const t of [0,.1,.5,1,3,8]){const q=M.firstOrder(1,1,2,t);close(q.total,1+Math.exp(-t));close(q.zi,2*Math.exp(-t));close(q.zs,1-Math.exp(-t));const c=M.secondOrder(1,1,1,2,1,t);close(c.total,1+(1+2*t)*Math.exp(-t));close(M.secondOrder(Math.sqrt(2),3/(2*Math.sqrt(2)),2,2,1,t).total,2+Math.exp(-t)-Math.exp(-2*t));}
// RK4 integrates the differential equation independently of the closed forms.
function rk4(wn,z,B,y0,v0,end){let y=y0,v=v0;const N=2000,dt=end/N,acc=(y,v)=>wn*wn*(B-y)-2*z*wn*v;for(let j=0;j<N;j++){const a1=v,b1=acc(y,v),a2=v+dt*b1/2,b2=acc(y+dt*a1/2,v+dt*b1/2),a3=v+dt*b2/2,b3=acc(y+dt*a2/2,v+dt*b2/2),a4=v+dt*b3,b4=acc(y+dt*a3,v+dt*b3);y+=dt*(a1+2*a2+2*a3+a4)/6;v+=dt*(b1+2*b2+2*b3+b4)/6;}return y;}
for(const wn of [.5,1,3])for(const z of [0,.5,.999999,1,1.000001,2])for(const end of [.1,1,5]){const exact=M.secondOrder(wn,z,.7,2,-1,end).total,n=rk4(wn,z,.7,2,-1,end);maxODEError=Math.max(maxODEError,Math.abs(n-exact));close(exact,n,1e-7);close(M.secondOrder(wn,z,.7,2,-1,0).total,2);}
// Support endpoint sums and shifted rectangle integration.
for(const sx of [-2,0,1])for(const sh of [-1,.5])for(const wx of [.5,2])for(const wh of [1,3])for(const t of [-4,0,1,3,7]){
 const lo=Math.max(sx,t-sh-wh),hi=Math.min(sx+wx,t-sh),q=hi>lo?M.integrate(tau=>-1.2*M.rect(tau,sx,sx+wx)*.7*M.rect(t-tau,sh,sh+wh),lo,hi,100):0;
 close(M.rectConv(t,sx,wx,sh,wh,-1.2,.7),q);close(M.rectConv(t,sx,wx,sh,wh),M.rectConv(t,sh,wh,sx,wx));close(M.rectConv(sx+sh,sx,wx,sh,wh),0);close(M.rectConv(sx+wx+sh+wh,sx,wx,sh,wh),0);
}
for(const k of [.5,1,2])for(const t of [0,.00001,.2,1.5,2,3,4,8]){let q=0;const edges=[0,...[1.5,3].filter(v=>v<t),t];for(let j=1;j<edges.length;j++)q+=M.integrate(v=>M.tri((v-1.5)/1.5)*Math.exp(-k*(t-v)),edges[j-1],edges[j],5000);const v=M.triangleExp(t,k);maxTriangleError=Math.max(maxTriangleError,Math.abs(q-v));close(v,q,1e-7);}
const coarse=M.riemannTriangle(4,1,6),fine=M.riemannTriangle(4,1,120),exact=M.triangleExp(4,1);assert.ok(Math.abs(fine-exact)<Math.abs(coarse-exact));checks++;
const events=[{a:1,t:0},{a:2,t:1},{a:1,t:2}];close(M.impulseTrain(events,t=>M.impulseResponse(t),2.5),40);close(events.reduce((a,e)=>a+e.a*10*Math.min(3,Math.max(0,2.5-e.t)),0),60);
for(const t of [0,.3,1,3,5]){const g=[1.2,-.7,.5,1.7,-.2],q=M.network(t,g);const a=M.integrate(v=>g[0]*Math.exp(-v)*g[1]*Math.exp(-(t-v)),0,t,1000),b=M.integrate(v=>g[0]*g[2]*v*Math.exp(-v)*g[3]*Math.exp(-(t-v)),0,t,1000),c=M.integrate(v=>g[4]*Math.exp(-v)*g[3]*Math.exp(-(t-v)),0,t,1000);close(q.total,a+b+c,1e-7);}
// Alias identity for phase-zero cosines at actual sampling instants.
for(const fs of [2,5,12])for(const f of [.5,3,7])for(let n=-10;n<=10;n++)close(Math.cos(M.TAU*f*n/fs),Math.cos(M.TAU*M.alias(f,fs)*n/fs));
close(M.sinc(0),1);for(let n=1;n<8;n++)close(M.sinc(n),0);
// Delay theorem with continuous (not quantized) phase changes and DC preserved.
for(const d of [-.31,0,.17,.5]){const p=F.initial(),shifted=p.map(c=>({...c,p:c.p-24*c.f*d}));const before=F.spectrum(p),after=F.spectrum(shifted);for(let i=0;i<before.length;i++)close(before[i].a,after[i].a);for(let j=0;j<30;j++)close(F.sample(p,.3,j/13-d),F.sample(shifted,.3,j/13));}
close(M.lowpass(2,2).gain,1/Math.sqrt(2));close(M.lowpass(2,2).phase,-Math.PI/4);
for(const t of [0,.1,1,4]){close(M.feedback(1,2,1,0,t).total,2/3*(1-Math.exp(-3*t)));close(M.feedback(1,-1,1,.5,t).total,.5-t);}
// Affine coordinate mappings in lecture examples.
[0,2,4].forEach((tau,i)=>close((tau-4)/-2,[2,1,0][i]));[-2,0,1].forEach((tau,i)=>close((tau-1)/-.5,[6,2,0][i]));
console.log(JSON.stringify({status:'passed',checks,maxODEError,maxTriangleError,coverage:['finite-window energy','lecture first/second-order responses','RK4 cross-check','repeated/near-repeated roots','shifted support endpoints','triangle/exponential convolution','Riemann convergence','weighted impulse responses','network paths','sample alias identity','sinc zeros','continuous phase delay','lowpass cutoff','feedback marginal root','affine landmark mappings']},null,2));
