'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../fourier/advanced-math.js'),'utf8'),ctx);
const F=ctx.window.FourierLessonMath;let checks=0;
const near=(a,b,tol=1e-9)=>{checks++;assert.ok(Math.abs(a-b)<tol,`${a} ≠ ${b}`);},znear=(a,b,tol)=>{near(a.re,b.re,tol);near(a.im,b.im,tol);};
// Independent quadrature verifies the unnormalized inner product: 0 or T, not 0 or 1.
for(const T of [1,2,4])for(const k of [-3,0,1,2,3])for(const m of [-3,0,1,2,4]){
 let re=0,im=0;const n=10000;for(let i=0;i<n;i++){const t=(i+.5)*T/n;re+=Math.cos(2*Math.PI*(k-m)*t/T)*T/n;im+=Math.sin(2*Math.PI*(k-m)*t/T)*T/n;}near(re,F.basisInner(k,m,T));near(im,0);
}
for(const source of [F.three(),F.lecture(),F.example53()])for(const T of [1,2,4])for(const m of [-3,-1,0,1,2,3,4]){
 let re=0,im=0;const n=12000;for(let i=0;i<n;i++){const t=(i+.5)*T/n,z=F.signal(source,t,T),c=Math.cos(2*Math.PI*m*t/T),s=Math.sin(2*Math.PI*m*t/T);re+=(z.re*c+z.im*s)*T/n;im+=(z.im*c-z.re*s)*T/n;}
 znear(F.inner(source,m,T),{re,im});znear(F.scale(F.inner(source,m,T),1/T),F.coefficient(source,m));
}
znear(F.inner(F.three(),2,2),{re:1.6,im:0});znear(F.inner(F.three(),4,2),{re:0,im:0});znear(F.coefficient(F.lecture(),-1),{re:Math.SQRT1_2,im:-Math.SQRT1_2});
const cancel=F.coefficients([{a:1,f:2,p:0,on:true},{a:1,f:2,p:12,on:true}],0);assert.equal(cancel.length,0);
for(const T of [1,4,8])for(const D of [.05,.25,.5,.73,1])for(const k of [-4,-3,-1,0,1,2,4]){
 let result=0;const n=60000,A=2,w=D*T;for(let i=0;i<n;i++){const t=(i+.5)*T/n-T/2;result+=(Math.abs(t)<w/2?A:0)*Math.cos(2*Math.PI*k*t/T)/n;}near(F.pulseCoefficient(A,T,w,k),result,4e-8);
}
near(F.pulseCoefficient(2,4,2,0),1);near(F.pulseCoefficient(2,4,2,2),0);near(F.pulseCoefficient(2,4,2,3),-2/(3*Math.PI));
near(F.pulseCoefficient(2,4,1,0),.5);near(F.pulseCoefficient(2,4,1,4),0);
for(const t of [-8,-3,-1,0,.3,1,3,8]){
 near(F.pulseSum(2,4,2,0,t),1);near(F.pulseSum(2,4,4,49,t),2);near(F.pulseSum(0,4,2,49,t),0);near(F.pulseTarget(2,4,2,t),F.pulseTarget(2,4,2,t+4));
 near(F.signal(F.lecture(),t,1,3).re,1+2*Math.cos(2*Math.PI*t+Math.PI/4)+Math.cos(6*Math.PI*t-Math.PI/3));
 near(F.signal(F.example53(),t,1,3).re,6+4*Math.cos(2*Math.PI*t+Math.PI/4)+2*Math.cos(6*Math.PI*t-Math.PI/3));
 near(F.signal(F.example53(),t,1,0).re,6);near(F.signal(F.example53(),t,1,2).re,F.signal(F.example53(),t,1,1).re);
}
console.log(`Slide-aligned Fourier mathematics passed (${checks} checks)`);
