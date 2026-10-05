/* Exact continuous-time convolution of causal rectangular/exponential signals. */
(function(root){
  'use strict';
  const value=(s,t)=>t<0?0:s.kind==='rect'?(t<s.width?s.amplitude:0):s.amplitude*Math.exp(-s.rate*t);
  function overlap(x,h,t){return{lo:Math.max(0,h.kind==='rect'?t-h.width:0),hi:Math.min(t,x.kind==='rect'?x.width:Infinity)};}
  function convolve(x,h,t){
    const {lo,hi}=overlap(x,h,t);if(hi<=lo)return 0;
    const a=x.kind==='exp'?x.rate:0,b=h.kind==='exp'?h.rate:0,d=b-a,L=hi-lo;
    // Factor at one endpoint; expm1 is stable when the decay rates nearly match.
    const scale=x.amplitude*h.amplitude*Math.exp(-a*lo-b*(t-lo));
    return scale*(Math.abs(d)<1e-12?L:Math.expm1(d*L)/d);
  }
  function endTime(x,h){return x.kind==='rect'&&h.kind==='rect'?Math.max(4,x.width+h.width+1):Math.max(6,(x.kind==='rect'?x.width:0)+(h.kind==='rect'?h.width:0)+5/Math.min(...[x,h].filter(s=>s.kind==='exp').map(s=>s.rate)));}
  const defaults=()=>({x:{kind:'rect',width:1,rate:1,amplitude:1},h:{kind:'rect',width:1,rate:1,amplitude:1},t:.75});
  root.ConvolutionMath={value,overlap,convolve,endTime,defaults};
})(typeof window==='undefined'?globalThis:window);
