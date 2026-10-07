'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../fourier/advanced-math.js'),'utf8'),ctx);
const F=ctx.window.FourierAdvancedMath;let checks=0;
const near=(a,b,tol=1e-9)=>{checks++;assert.ok(Math.abs(a-b)<tol,`${a} ≠ ${b}`);};
const znear=(a,b,tol)=>{near(a.re,b.re,tol);near(a.im,b.im,tol);};
// Independent midpoint quadrature of the real input times cos - j sin.
function numeric(fn,m,p,n=40000){let re=0,im=0;for(let j=0;j<n;j++){const t=(j+.5)*p/n,v=fn(t)*p/n;re+=v*Math.cos(2*Math.PI*m*t);im-=v*Math.sin(2*Math.PI*m*t);}return {re,im};}
const signal=t=>1+2*Math.cos(2*Math.PI*t+Math.PI/4)+Math.cos(6*Math.PI*t-Math.PI/3),terms=F.lecture();
for(const m of [-10,-3,-1,0,1,2,3,10])for(const p of [0,.17,.5,.93,1])znear(F.integral(terms,m,p),numeric(signal,m,p),2e-8);
znear(F.integral(terms,1,1),{re:Math.SQRT1_2,im:Math.SQRT1_2});znear(F.integral(terms,3,1),{re:.25,im:-Math.sqrt(3)/4});
znear(F.integral(terms,-1,1),{re:Math.SQRT1_2,im:-Math.SQRT1_2});znear(F.integral(terms,0,1),{re:1,im:0});znear(F.integral(terms,2,1),{re:0,im:0});
for(let k=-10;k<=10;k++){
 const d=k===0?1:k===1?Math.SQRT1_2:k===-1?Math.SQRT1_2:k===3||k===-3?.25:0;
 near(F.integral(terms,k,1).re,d);
 for(const z of terms)znear(F.contribution(z,k,1),z.k===k?z:{re:0,im:0});
}
const cancel=F.coefficients([{a:1,f:2,p:0,on:true},{a:1,f:2,p:12,on:true}],0);assert.equal(cancel.length,0);
// Integrate the centered pulse directly on [-T/2,T/2] with boundaries aligned to the mesh.
for(const D of [.05,.25,.5,.73,1])for(const k of [-9,-4,-3,-2,-1,0,1,2,3,4,9]){
 let result=0;const n=100000,A=2;
 for(let j=0;j<n;j++){const u=(j+.5)/n-.5;result+=(Math.abs(u)<D/2?A:0)*Math.cos(2*Math.PI*k*u)/n;}
 near(F.pulseCoefficient(A,D,k),result,2e-8);
}
near(F.pulseCoefficient(2,.5,0),1);near(F.pulseCoefficient(2,.5,2),0);near(F.pulseCoefficient(2,.5,3),-2/(3*Math.PI));
near(F.pulseCoefficient(2,.25,0),.5);near(F.pulseCoefficient(2,.25,4),0);
for(const t of [-8,-3,-1,0,1,3,8]){
 near(F.pulseTarget(2,4,.5,t),F.pulseTarget(2,4,.5,t+4));
 near(F.pulseTarget(2,4,.5,t)-F.pulseTarget(2,4,.5,t,false),1);
 near(F.pulseSum(2,4,.5,49,t)-F.pulseSum(2,4,.5,49,t,false),1);
 near(F.pulseSum(2,4,1,49,t),2);near(F.pulseSum(2,4,1,49,t,false),0);near(F.pulseSum(0,4,.5,49,t),0);
}
near(F.pulseTarget(2,4,.5,1),1);near(F.pulseSum(2,4,.5,49,1),1);
for(const A of [0,.7,2,3])for(const p of [-Math.PI,-.7,0,Math.PI/4,Math.PI])for(const k of [1,3,5])for(const t of [0,.17,.5,1]){
 const z=F.pair(A,p,k,t);near(z.total.re,A*Math.cos(2*Math.PI*k*t+p));near(z.total.im,0);near(Math.hypot(z.plus.re,z.plus.im),A/2);near(z.minus.re,z.plus.re);near(z.minus.im,-z.plus.im);
}
console.log(`Fourier continuous-time coefficient, quadrature and conjugate-pair checks passed (${checks})`);
