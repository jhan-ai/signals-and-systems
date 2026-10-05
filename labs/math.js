/* Shared pure calculations. Continuous integrals use analytic formulas where available. */
(function(root){
  'use strict';
  const TAU=2*Math.PI, step=t=>t>=0?1:0, ramp=t=>Math.max(0,t);
  const sinc=t=>Math.abs(t)<1e-10?1:Math.sin(Math.PI*t)/(Math.PI*t);
  const rect=(t,a=0,b=1)=>t>=a&&t<b?1:0;
  const tri=t=>Math.max(0,1-Math.abs(t));
  const trapezoid=t=>t<0||t>=4?0:t<=2?1:(4-t)/2;
  const bipolar=t=>t>=-2&&t<0?1:t>=0&&t<1?-1:0;
  function integrate(f,a,b,n=1200){if(b<=a)return 0;let s=0;const d=(b-a)/n;for(let k=0;k<n;k++)s+=f(a+(k+.5)*d);return s*d;}
  const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
  const alias=(f,fs)=>Math.abs(f-fs*Math.round(f/fs));
  const energySignal=(kind,t,A=1,k=1)=>A*({pulse:()=>rect(t,-1,1),constant:()=>1,cos:()=>Math.cos(TAU*t),exp:()=>t<0?0:Math.exp(-k*t),ramp:()=>ramp(t)}[kind]());
  function energy(kind,L,A=1,k=1){const q=A*A;return q*({pulse:()=>2*Math.min(L,1),constant:()=>2*L,cos:()=>L+Math.sin(2*TAU*L)/(2*TAU),exp:()=>-Math.expm1(-2*k*L)/(2*k),ramp:()=>L**3/3}[kind]());}
  function firstOrder(a,B,y0,t){if(t<0)return NaN;const decay=Math.exp(-a*t),zi=y0*decay,zs=a===0?B*t:B*(-Math.expm1(-a*t))/a;return {zi,zs,total:zi+zs,steady:a>0?B/a:null,transient:a>0?(y0-B/a)*decay:null};}
  function homogeneous(wn,z,y0,v0,t){const a=z*wn,d=z*z-1;if(Math.abs(d)<1e-10)return (y0+(v0+a*y0)*t)*Math.exp(-a*t);if(d<0){const w=wn*Math.sqrt(-d);return Math.exp(-a*t)*(y0*Math.cos(w*t)+(v0+a*y0)/w*Math.sin(w*t));}const b=wn*Math.sqrt(d),r1=-a+b,r2=-a-b,c1=(v0-r2*y0)/(r1-r2);return c1*Math.exp(r1*t)+(y0-c1)*Math.exp(r2*t);}
  function secondOrder(wn,z,B,y0,v0,t){const zi=homogeneous(wn,z,y0,v0,t),zs=B+homogeneous(wn,z,-B,0,t);return {zi,zs,total:zi+zs};}
  function roots(wn,z){const a=-z*wn,d=wn*Math.sqrt(Math.abs(z*z-1));return z<1?[{re:a,im:d},{re:a,im:-d}]:[{re:a+d,im:0},{re:a-d,im:0}];}
  function impulseResponse(t,kind='rect',rate=1){return kind==='rect'?10*rect(t,0,3):t>=0?Math.exp(-rate*t):0;}
  function impulseTrain(events,h,t){return events.reduce((s,e)=>s+e.a*h(t-e.t),0);}
  function rectConv(t,sx,wx,sh,wh,Ax=1,Ah=1){return Ax*Ah*Math.max(0,Math.min(sx+wx,t-sh)-Math.max(sx,t-sh-wh));}
  // Ramp convolved with e^(-kt)u(t). Series avoids cancellation near zero.
  function rampExp(t,k){if(t<=0)return 0;const z=k*t;if(Math.abs(z)<1e-3)return t*t*(.5-z/6+z*z/24-z**3/120);return (z+Math.expm1(-z))/(k*k);}
  function triangleExp(t,k=1,p=1.5){return (rampExp(t,k)-2*rampExp(t-p,k)+rampExp(t-2*p,k))/p;}
  function riemannTriangle(t,k=1,n=12){const d=3/n;let s=0;for(let j=0;j<n;j++){const tau=(j+.5)*d;s+=tri((tau-1.5)/1.5)*d*(t>=tau?Math.exp(-k*(t-tau)):0);}return s;}
  function network(t,g){return t<0?{a:0,b:0,c:0,total:0}:(()=>{const e=Math.exp(-t),a=g[0]*g[1]*t*e,b=g[0]*g[2]*g[3]*t*t*e/2,c=g[4]*g[3]*t*e;return {a,b,c,total:a+b+c};})();}
  const lowpass=(f,fc)=>({gain:1/Math.sqrt(1+(f/fc)**2),phase:-Math.atan(f/fc)});
  function feedback(a,K,B,y0,t){const c=a+K;return firstOrder(Math.abs(c)<1e-12?0:c,K*B,y0,t);}
  root.SSMath={TAU,step,ramp,sinc,rect,tri,trapezoid,bipolar,integrate,gcd,alias,energySignal,energy,firstOrder,homogeneous,secondOrder,roots,impulseResponse,impulseTrain,rectConv,rampExp,triangleExp,riemannTriangle,network,lowpass,feedback};
})(typeof window==='undefined'?globalThis:window);
