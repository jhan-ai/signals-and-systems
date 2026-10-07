/* Pure continuous-time signal calculations. No sampled FFT is used. */
(function (root) {
  'use strict';
  const TAU = 2 * Math.PI;
  const initial = () => [{f:1,a:1,p:0,on:true},{f:3,a:0.5,p:6,on:true},{f:5,a:0.3,p:0,on:false}];
  const phase = p => p * Math.PI / 12;
  // Use (-π, π] everywhere so the equivalent endpoints have one display value.
  const principalPhase=(re,im)=>{const a=Math.atan2(im,re);return Math.abs(Math.abs(a)-Math.PI)<1e-10?Math.PI:Math.abs(a)<1e-10?0:a;};
  const sample = (parts, dc, t) => parts.reduce((s,c)=>s+(c.on?c.a*Math.cos(TAU*c.f*t+phase(c.p)):0),dc);
  function spectrum(parts) {
    const map=new Map();
    parts.filter(c=>c.on&&c.a>0).forEach(c=>{
      const z=map.get(c.f)||{f:c.f,re:0,im:0};
      z.re+=c.a*Math.cos(phase(c.p)); z.im+=c.a*Math.sin(phase(c.p)); map.set(c.f,z);
    });
    return [...map.values()].sort((a,b)=>a.f-b.f).map(z=>({...z,a:Math.hypot(z.re,z.im),phi:principalPhase(z.re,z.im)})).filter(z=>z.a>1e-9);
  }
  function analyze(parts,dc,q) {
    const n=2048; let c=0,s=0;
    for(let j=0;j<n;j++) {const t=(j+0.5)/n,x=sample(parts,dc,t);c+=x*Math.cos(TAU*q*t)*2/n;s+=x*Math.sin(TAU*q*t)*2/n;}
    const clean=v=>Math.abs(v)<1e-10?0:v;c=clean(c);s=clean(s);
    return {c,s,a:Math.hypot(c,s),phi:Math.hypot(c,s)<1e-9?null:principalPhase(c,-s)};
  }
  function harmonics(shape,n,f0=1) {
    const result=[];
    for(let k=1;k<=n;k++) {
      if(shape!=='saw'&&k%2===0)continue;
      let b=shape==='square'?4/(Math.PI*k):shape==='saw'?-2/(Math.PI*k):8/(Math.PI*Math.PI*k*k)*Math.pow(-1,(k-1)/2);
      result.push({k,f:k*f0,a:Math.abs(b),p:b>0?-6:6,on:true,b});
    }
    return result;
  }
  function target(shape,f,t) {
    const u=f*t, frac=u-Math.floor(u);
    if(shape==='triangle')return 2/Math.PI*Math.asin(Math.sin(TAU*u));
    if(shape==='square')return Math.abs(Math.sin(TAU*u))<1e-10?0:(Math.sin(TAU*u)>0?1:-1);
    return Math.abs(u-Math.round(u))<1e-10?0:2*frac-1;
  }
  root.FourierMath={TAU,initial,phase,principalPhase,sample,spectrum,analyze,harmonics,target};
})(typeof window==='undefined'?globalThis:window);
