const assert=require('node:assert/strict');
require('../fourier/math.js');require('../convolution/math.js');
const F=globalThis.FourierMath,C=globalThis.ConvolutionMath;
let checks=0,maxFourierError=0,maxConvolutionError=0;
function close(a,b,tol=1e-9){checks++;assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,`${a} != ${b}, tolerance ${tol}`);}
const initial=F.initial();
close(F.spectrum(initial)[0].a,1);close(F.spectrum(initial)[1].a,.5);close(F.spectrum(initial)[1].phi,Math.PI/2);
for(let q=1;q<=10;q++){const r=F.analyze(initial,.7,q);close(r.a,q===1?1:q===3?.5:0);if(q===3)close(r.phi,Math.PI/2);}
const exercise=[{f:3,a:2,p:-3,on:true},{f:4,a:1,p:-4,on:true}];close(F.analyze(exercise,0,3).phi,-Math.PI/4);close(F.analyze(exercise,0,4).phi,-Math.PI/3);
for(const phase of [-12,12]){const s=[{f:1,a:1,p:phase,on:true}];close(F.spectrum(s)[0].phi,Math.PI);close(F.analyze(s,0,1).phi,Math.PI);}
const cancelled=[{f:2,a:1,p:0,on:true},{f:2,a:1,p:12,on:true}];assert.equal(F.spectrum(cancelled).length,0);assert.equal(F.analyze(cancelled,0,2).phi,null);checks+=2;
let seed=3819;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let j=0;j<120;j++){
 const parts=Array.from({length:3},()=>({f:1+Math.floor(rand()*10),a:Math.round(rand()*20)/10,p:Math.floor(rand()*25)-12,on:rand()>.2}));const dc=Math.round((rand()*4-2)*10)/10,s=F.spectrum(parts);
 for(let k=0;k<41;k++){const t=k/20,rebuilt=dc+s.reduce((sum,z)=>sum+z.a*Math.cos(F.TAU*z.f*t+z.phi),0),exact=F.sample(parts,dc,t);maxFourierError=Math.max(maxFourierError,Math.abs(rebuilt-exact));close(rebuilt,exact,1e-9);}
 for(let q=1;q<=10;q++){const r=F.analyze(parts,dc,q),z=s.find(z=>z.f===q);close(r.a,z?.a||0,1e-9);if(z){close(Math.cos(r.phi),Math.cos(z.phi));close(Math.sin(r.phi),Math.sin(z.phi));}}
}
for(const f0 of [1,1.5,2,2.5,3])for(const shape of ['square','triangle','saw']){
 const parts=F.harmonics(shape,49,f0);assert.equal(parts.length,shape==='saw'?49:25);checks++;
 for(const u of [.13,.31,.68,.87])close(F.sample(parts,0,u/f0),F.target(shape,f0,u/f0),shape==='triangle'?.001:.04);
 close(F.target(shape,f0,1/f0),0);close(F.sample(parts,0,1/f0),0);
}
close(F.target('saw',1.5,(1-Number.EPSILON)/1.5),0);
const rect=(w=1,a=1)=>({kind:'rect',width:w,rate:1,amplitude:a}),exp=(r=1,a=1)=>({kind:'exp',width:1,rate:r,amplitude:a});
for(let t=-1;t<=4;t+=.05){close(C.convolve(rect(),rect(),t),Math.max(0,1-Math.abs(t-1)));close(C.convolve(rect(2),rect(1),t),Math.max(0,Math.min(2,t)-Math.max(0,t-1)));}
for(const t of [-1,0,.3,1,1.5,3,6]){
 close(C.convolve(rect(),exp(),t),t<=0?0:t<1?1-Math.exp(-t):Math.exp(-(t-1))-Math.exp(-t));
 close(C.convolve(exp(),exp(),t),t<=0?0:t*Math.exp(-t));
 close(C.convolve(exp(1),exp(1+1e-11),t),t<=0?0:t*Math.exp(-t),1e-9);
}
// Independent midpoint quadrature, split at all known discontinuities.
function numeric(x,h,t){if(t<=0)return 0;const edges=[0,t];if(x.kind==='rect'&&x.width<t)edges.push(x.width);if(h.kind==='rect'&&t-h.width>0)edges.push(t-h.width);edges.sort((a,b)=>a-b);let sum=0;for(let j=1;j<edges.length;j++){const n=4000,dt=(edges[j]-edges[j-1])/n;for(let i=0;i<n;i++){const tau=edges[j-1]+(i+.5)*dt;sum+=C.value(x,tau)*C.value(h,t-tau)*dt;}}return sum;}
for(let j=0;j<100;j++){
 const x=rand()<.5?rect(.5+rand()*2.5,rand()*4-2):exp(.5+rand()*2.5,rand()*4-2),h=rand()<.5?rect(.5+rand()*2.5,rand()*4-2):exp(.5+rand()*2.5,rand()*4-2),t=rand()*10-1;
 const exact=C.convolve(x,h,t),num=numeric(x,h,t),error=Math.abs(exact-num);maxConvolutionError=Math.max(maxConvolutionError,error);close(exact,num,1e-6);close(exact,C.convolve(h,x,t),1e-9);close(C.convolve({...x,amplitude:0},h,t),0);close(C.convolve(x,h,-.5),0);
}
console.log(JSON.stringify({status:'passed',checks,maxFourierReconstructionError:maxFourierError,maxConvolutionQuadratureError:maxConvolutionError,coverage:['lecture examples','phase endpoints','same-frequency addition/cancellation','DC','spectrum reconstruction','orthogonal projection','all three Fourier series','pulse overlap','pulse/exponential','equal/nearly-equal exponentials','commutativity','negative amplitudes','zero input','causality']},null,2));
