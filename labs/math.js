/* Shared pure calculations. Continuous integrals use analytic formulas where available. */
(function(root){
  'use strict';
  const TAU=2*Math.PI, step=t=>t>=0?1:0, ramp=t=>Math.max(0,t);
  const rect=(t,a=0,b=1)=>t>=a&&t<b?1:0;
  const tri=t=>Math.max(0,1-Math.abs(t));
  function integrate(f,a,b,n=1200){if(b<=a)return 0;let s=0;const d=(b-a)/n;for(let k=0;k<n;k++)s+=f(a+(k+.5)*d);return s*d;}
  const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
  function impulseResponse(t,kind='rect',rate=1){return kind==='rect'?10*rect(t,0,3):t>=0?Math.exp(-rate*t):0;}
  function impulseTrain(events,h,t){return events.reduce((s,e)=>s+e.a*h(t-e.t),0);}
  function rectConv(t,sx,wx,sh,wh,Ax=1,Ah=1){return Ax*Ah*Math.max(0,Math.min(sx+wx,t-sh)-Math.max(sx,t-sh-wh));}
  // Ramp convolved with e^(-kt)u(t). Series avoids cancellation near zero.
  function rampExp(t,k){if(t<=0)return 0;const z=k*t;if(Math.abs(z)<1e-3)return t*t*(.5-z/6+z*z/24-z**3/120);return (z+Math.expm1(-z))/(k*k);}
  function triangleExp(t,k=1,p=1.5){return (rampExp(t,k)-2*rampExp(t-p,k)+rampExp(t-2*p,k))/p;}
  function riemannTriangle(t,k=1,n=12){const d=3/n;let s=0;for(let j=0;j<n;j++){const tau=(j+.5)*d;s+=tri((tau-1.5)/1.5)*d*(t>=tau?Math.exp(-k*(t-tau)):0);}return s;}
  function network(t,g){return t<0?{a:0,b:0,c:0,total:0}:(()=>{const e=Math.exp(-t),a=g[0]*g[1]*t*e,b=g[0]*g[2]*g[3]*t*t*e/2,c=g[4]*g[3]*t*e;return {a,b,c,total:a+b+c};})();}
  root.SSMath={TAU,step,ramp,rect,tri,integrate,gcd,impulseResponse,impulseTrain,rectConv,rampExp,triangleExp,riemannTriangle,network};
})(typeof window==='undefined'?globalThis:window);
