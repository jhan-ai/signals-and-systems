'use strict';const assert=require('node:assert/strict'),M=require('../labs/lecture-math.js');let checks=0;
const near=(a,b,e=1e-9)=>{checks++;assert.ok(Number.isFinite(a)&&Math.abs(a-b)<e,`${a} ≠ ${b}`);};
// Independent known coefficients and reconstruction, including negative k windows.
for(const N of [4,8,13,16]){const impulse=Array.from({length:N},(_,n)=>+(n===0)),c=M.dtfs(impulse);c.forEach(z=>{near(z.re,1/N);near(z.im,0);});const x=Array.from({length:N},(_,n)=>Math.sin(2*Math.PI*n/N)+.3*Math.cos(4*Math.PI*n/N)),d=M.dtfs(x);for(const start of [-17,-4,0,7])for(let n=-N;n<2*N;n++){const z=M.synthesis(d,n,M.range(start,start+N-1));near(z.re,x[M.mod(n,N)]);near(z.im,0);}near(x.reduce((a,v)=>a+v*v,0)/N,d.reduce((a,z)=>a+M.abs(z)**2,0));}
assert.deepEqual(M.convolve([1,2,1],[1,1,1]),[1,3,4,3,1]);checks++;
assert.deepEqual(M.convolve([1,1],[1,-1]),[1,0,-1]);checks++;
// Closed form and recurrence are separate implementations; include resonance.
for(const a of [.2,.5,.9])for(const r of [.2,.5,1,1.2])for(const init of [-2,0,1]){const y=M.recurrence(a,0,1,M.range(0,20).map(n=>r**n),init);y.forEach((z,n)=>near(M.firstOrderParts(a,1,r,init,n).total,z,1e-8));}
for(const a of [-1.2,-.5,0,.5,1,1.2]){const x=M.range(0,20).map(n=>n<4?1:0),y=M.recurrence(a,0,1,x,2),zs=M.recurrence(a,0,1,x),zi=M.recurrence(a,0,1,x.map(()=>0),2);y.forEach((v,n)=>near(v,zs[n]+zi[n],1e-8));const h=M.range(0,20).map(n=>a**n);M.convolve(x,h).slice(0,21).forEach((v,n)=>near(v,zs[n]));}
for(let bits=1;bits<=6;bits++){const step=2/(2**bits-1);for(const x of [-1,-.99,-.1,0,.23,.99,1]){const q=M.quantize(x,bits);assert.ok(Math.abs(q-x)<=step/2+1e-12);checks++;near((q+1)/step,Math.round((q+1)/step));}}
for(const fs of [2,4,10])for(const f of [.5,1,5,9]){const fa=M.alias(f,fs);for(let n=0;n<20;n++)near(Math.cos(2*Math.PI*f*n/fs),Math.cos(2*Math.PI*fa*n/fs));}
// Independently integrate time-domain transform pairs.
const integrate=(f,a,b,N=24000)=>{let z=0;for(let i=0;i<N;i++)z+=f(a+(i+.5)*(b-a)/N)*(b-a)/N;return z;};
for(const T of [.5,2,4])for(const w of [0,.5,2,5]){near(M.pair('rect',w,T).re,integrate(t=>Math.cos(w*t),-T/2,T/2),1e-7);near(M.pair('triangle',w,T).re,integrate(t=>(1-2*Math.abs(t)/T)*Math.cos(w*t),-T/2,T/2),1e-7);}
near(M.abs(M.filter('real',3,3)),1/Math.sqrt(2));near(M.filter('low',2,3).re,1);near(M.filter('low',6,3).re,0);console.log(`Lecture mathematics: ${checks} checks passed`);
