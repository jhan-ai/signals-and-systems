'use strict';
const M=window.ConvolutionMath,$=id=>document.getElementById(id);
const state={...M.defaults(),showFlip:false,speed:1};let frame=null,lastFrame=0;
const fmt=(v,n=2)=>v===0?'0':(Math.abs(v)>=1e4||Math.abs(v)<10**(-n)?v.toExponential(2):Number(v.toFixed(n)).toString()).replace('-','−');
function node(tag,attrs,text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n;}
function chart(id,xmin,xmax,ymin,ymax,{xlabel='τ (s)',title='',yticks=[ymin,0,ymax]}={}){
  const host=$(id),w=Math.max(260,host.clientWidth||500),h=host.clientHeight||220,l=46,r=18,top=20,b=38;
  const X=x=>l+(x-xmin)/(xmax-xmin)*(w-l-r),Y=y=>top+(ymax-y)/(ymax-ymin)*(h-top-b);
  const svg=node('svg',{viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':title});svg.append(node('title',{},title));
  const defs=node('defs'),clip=node('clipPath',{id:'clip-'+id});clip.append(node('rect',{x:l,y:top-2,width:w-l-r,height:h-top-b+4}));defs.append(clip);svg.append(defs);
  yticks.forEach(y=>{svg.append(node('line',{x1:l,x2:w-r,y1:Y(y),y2:Y(y),class:y===0?'zero':'grid'}));svg.append(node('text',{x:l-9,y:Y(y)+4,'text-anchor':'end'},fmt(y)));});
  const step=xmax-xmin>12?4:xmax-xmin>7?2:1;
  for(let x=Math.ceil(xmin/step)*step;x<=xmax;x+=step){svg.append(node('line',{x1:X(x),x2:X(x),y1:top,y2:h-b,class:'grid'}));svg.append(node('text',{x:X(x),y:h-b+18,'text-anchor':'middle'},fmt(x)));}
  svg.append(node('text',{x:w-r,y:h-3,'text-anchor':'end',class:'axis-label'},xlabel));
  const layer=node('g',{'clip-path':`url(#clip-${id})`});svg.append(layer);host.replaceChildren(svg);
  function points(fn,breaks=[]){const xs=Array.from({length:641},(_,i)=>xmin+(xmax-xmin)*i/640);for(const t of breaks)for(const d of [-1e-7,0,1e-7])if(t+d>=xmin&&t+d<=xmax)xs.push(t+d);xs.sort((a,b)=>a-b);return xs.map(t=>[X(t),Y(fn(t))]);}
  function line(fn,color,width=2.5,{dash='',breaks=[]}={}){const d=points(fn,breaks).map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(2)).join(',')).join('');layer.append(node('path',{d,fill:'none',stroke:color,'stroke-width':width,'stroke-dasharray':dash,'stroke-linejoin':'round'}));}
  function area(fn,breaks=[]){for(const sign of [1,-1]){const ps=points(t=>sign>0?Math.max(0,fn(t)):Math.min(0,fn(t)),breaks);const d=`M${X(xmin)},${Y(0)}`+ps.map(p=>'L'+p.map(v=>v.toFixed(2)).join(',')).join('')+`L${X(xmax)},${Y(0)}Z`;layer.append(node('path',{d,fill:sign>0?'#16816a':'#c65327','fill-opacity':'.25'}));}}
  return {svg,layer,X,Y,line,area,w,h,l,r,top,b};
}
function formula(s,v){return s.kind==='rect'?`${fmt(s.amplitude)} [u(${v}) − u(${v} − ${fmt(s.width)})]`:`${fmt(s.amplitude)} e<sup>−${fmt(s.rate)}${v}</sup> u(${v})`;}
function buildControls(){
  $('signal-controls').innerHTML=['x','h'].map((key,i)=>{const s=state[key];return `<section class="conv-signal" style="--component:${i?'#c65327':'#007f9f'}"><h3>${key==='x'?'입력 신호 x(t)':'임펄스 응답 h(t)'}</h3><label class="sr-only" for="${key}-kind">${key} 신호 형태</label><select id="${key}-kind" data-signal="${key}" data-property="kind"><option value="rect" ${s.kind==='rect'?'selected':''}>사각 펄스</option><option value="exp" ${s.kind==='exp'?'selected':''}>지수 감쇠</option></select><p class="formula" id="${key}-formula">${key}(t) = ${formula(s,'t')}</p><div class="control-row"><label for="${key}-amplitude">진폭 <output id="${key}-amplitude-value">${fmt(s.amplitude)}</output></label><input type="range" id="${key}-amplitude" aria-label="${key} 진폭" data-signal="${key}" data-property="amplitude" min="-2" max="2" step="0.1" value="${s.amplitude}"></div><div class="control-row"><label for="${key}-shape">${s.kind==='rect'?'펄스 폭':'감쇠율'} <output id="${key}-shape-value">${fmt(s.kind==='rect'?s.width:s.rate)} ${s.kind==='rect'?'s':'s⁻¹'}</output></label><input type="range" id="${key}-shape" aria-label="${key} ${s.kind==='rect'?'펄스 폭':'감쇠율'}" data-signal="${key}" data-property="${s.kind==='rect'?'width':'rate'}" min="0.5" max="3" step="0.1" value="${s.kind==='rect'?s.width:s.rate}"></div></section>`;}).join('');
}
function render(){
  if(state.mode==='expression'){window.ExpressionUI.render();return;}
  $('preset-status').hidden=$('preset').value!=='custom';
  const {x,h,t}=state,end=M.endTime(x,h),left=state.showFlip?-Math.min(6,h.kind==='rect'?h.width+.5:5/h.rate):-1.25,right=end+.3;
  const amp=Math.max(.5,Math.abs(x.amplitude),Math.abs(h.amplitude))*1.3;
  const {lo,hi}=M.overlap(x,h,t),hasOverlap=hi>lo&&x.amplitude!==0&&h.amplitude!==0,y=M.convolve(x,h,t);
  $('time-value').textContent=fmt(t,2)+' s';$('time').max=end;$('time').value=t;$('time-range').textContent=`−1 ~ ${fmt(end)} s`;
  $('output-t').textContent=fmt(t,2);$('output-value').textContent=(Math.abs(y)<1e-10?0:y).toFixed(3).replace('-','−');$('flip-legend').hidden=!state.showFlip;
  const a=chart('overlap-plot',left,right,-amp,amp,{title:`시각 ${fmt(t)}초에서 x(τ)와 h(t−τ)의 겹침`});
  if(hasOverlap)a.layer.append(node('rect',{x:a.X(lo),y:a.top,width:a.X(hi)-a.X(lo),height:a.h-a.top-a.b,fill:'#edf4f8'}));
  if(state.showFlip)a.line(tau=>M.value(h,-tau),'#8b9ca9',1.6,{dash:'5 5',breaks:[-h.width,0]});
  a.line(tau=>M.value(x,tau),'#007f9f',2.6,{breaks:[0,x.width]});
  a.line(tau=>M.value(h,t-tau),'#c65327',2.6,{breaks:[t-h.width,t]});
  $('shift-note').textContent=`h(−τ)를 ${Math.abs(t)<1e-10?'이동하지 않은 상태':`${fmt(Math.abs(t))}초 ${t<0?'왼쪽':'오른쪽'}으로 이동`}`;
  const product=tau=>M.value(x,tau)*M.value(h,t-tau),pa=Math.max(.5,Math.abs(x.amplitude*h.amplitude))*1.3;
  const p=chart('product-plot',left,right,-pa,pa,{title:'x(τ)h(t−τ)의 곱과 부호 있는 면적'});p.area(product,[lo,hi]);p.line(product,'#33556b',2,{breaks:[lo,hi]});
  $('overlap-note').textContent=hasOverlap?`곱이 0이 아닌 구간: ${fmt(lo)} < τ < ${fmt(hi)} s`:'곱의 면적이 0입니다.';
  let peak=0;for(let i=0;i<=500;i++)peak=Math.max(peak,Math.abs(M.convolve(x,h,end*i/500)));
  const bound=Math.max(.5,peak*1.25),negative=x.amplitude*h.amplitude<0;
  const ymin=negative?-bound:-.15*bound,ymax=negative?.15*bound:bound;
  const o=chart('output-plot',-1,end,ymin,ymax,{xlabel:'t (s)',title:'convolution 출력 y(t)와 현재 시각의 출력값',yticks:negative?[-bound,-bound/2,0]:[0,bound/2,bound]});
  o.line(v=>M.convolve(x,h,v),'#45505b',2.8,{breaks:[0,x.width,h.width,x.width+h.width]});
  o.layer.append(node('line',{x1:o.X(t),x2:o.X(t),y1:o.top,y2:o.h-o.b,stroke:'#007f9f','stroke-dasharray':'4 4','stroke-width':1.3}));
  o.layer.append(node('circle',{cx:o.X(t),cy:o.Y(y),r:6,fill:'#007f9f',stroke:'#fff','stroke-width':2}));
  $('output-formula').innerHTML=hasOverlap?`y(${fmt(t)}) = ∫<sub>${fmt(lo)}</sub><sup>${fmt(hi)}</sup> x(τ)h(${fmt(t)} − τ) dτ = <strong>${fmt(y,3)}</strong>`:`y(${fmt(t)}) = ∫ x(τ)h(${fmt(t)} − τ) dτ = 0`;
  if(!hasOverlap){$('observation-title').textContent='곱의 넓이가 0이므로 출력도 0입니다.';$('observation-detail').textContent=x.amplitude===0||h.amplitude===0?'한 신호의 진폭이 0입니다. 다른 신호가 어떤 모양이든 convolution 출력은 0입니다.':'t를 움직여 두 신호가 겹치기 시작하는 순간을 찾아보세요. 한 점에서만 닿는 경우에도 면적은 0입니다.';}
  else if(x.kind==='rect'&&h.kind==='rect'){$('observation-title').textContent=`겹치는 길이 ${fmt(hi-lo)} s × 곱의 높이 ${fmt(x.amplitude*h.amplitude)} = ${fmt(y,3)}`;$('observation-detail').textContent=x.width===h.width?'두 펄스의 폭이 같으면 출력은 삼각형입니다. 펄스 하나의 폭을 바꿔 사다리꼴이 되는 이유도 살펴보세요.':'두 펄스의 폭이 다르면 짧은 펄스가 완전히 겹치는 동안 출력이 일정해져 사다리꼴이 됩니다.';}
  else{$('observation-title').textContent=negative?'음수 면적이 쌓이므로 출력이 음수가 됩니다.':'겹친 구간의 곱을 적분한 값이 현재 출력입니다.';$('observation-detail').textContent=x.kind==='exp'&&h.kind==='exp'&&Math.abs(x.rate-h.rate)<1e-10?`감쇠율이 같을 때 y(t) = ${fmt(x.amplitude*h.amplitude)} t e^(−${fmt(x.rate)}t)u(t)입니다. x와 h를 맞바꿔도 출력은 같습니다.`:'지수 신호에서는 곱의 높이가 τ에 따라 달라지므로, 겹친 길이만으로 출력값을 구할 수 없습니다.';}
}
function stop(){if(frame!==null)cancelAnimationFrame(frame);frame=null;lastFrame=0;$('play').textContent='자동 재생';$('play').setAttribute('aria-pressed','false');}
function endTime(){return state.mode==='expression'?window.ExpressionUI.current().end:M.endTime(state.x,state.h);}
function startTime(){return state.mode==='expression'?window.ExpressionUI.current().start:-1;}
function tick(now){if(lastFrame&&now-lastFrame>=40){state.t=Math.min(endTime(),state.t+Math.min(.2,(now-lastFrame)/1000)*state.speed);lastFrame=now;render();if(state.t>=endTime()){stop();return;}}else if(!lastFrame)lastFrame=now;frame=requestAnimationFrame(tick);}
function setPreset(name){stop();if(window.ExpressionUI)window.ExpressionUI.setMode('preset');Object.assign(state,M.defaults());if(name==='filter')state.h.kind='exp';if(name==='exponentials'){state.x.kind='exp';state.h.kind='exp';}if(name==='negative')state.x.amplitude=-1;$('preset').value=name;buildControls();render();}
$('preset').addEventListener('change',e=>setPreset(e.target.value));
$('reset').addEventListener('click',()=>{state.showFlip=false;state.speed=1;$('show-flip').checked=false;$('speed').value='1';setPreset('rectangles');});
$('signal-controls').addEventListener('input',e=>{const key=e.target.dataset.signal,property=e.target.dataset.property;if(!key)return;stop();state[key][property]=property==='kind'?e.target.value:Number(e.target.value);state.t=Math.min(state.t,M.endTime(state.x,state.h));$('preset').value='custom';if(property==='kind'){buildControls();$(key+'-kind').focus();}else{$(key+'-amplitude-value').textContent=fmt(state[key].amplitude);$(key+'-shape-value').textContent=fmt(state[key].kind==='rect'?state[key].width:state[key].rate)+(state[key].kind==='rect'?' s':' s⁻¹');$(key+'-formula').innerHTML=key+'(t) = '+formula(state[key],'t');}render();});
$('time').addEventListener('input',e=>{stop();state.t=Number(e.target.value);render();});
$('show-flip').addEventListener('change',e=>{state.showFlip=e.target.checked;render();});
$('swap').addEventListener('click',()=>{stop();if(state.mode==='expression'){window.ExpressionUI.swap();return;}[state.x,state.h]=[state.h,state.x];$('preset').value='custom';buildControls();render();});
$('speed').addEventListener('change',e=>state.speed=Number(e.target.value));
$('play').addEventListener('click',()=>{if(frame!==null){stop();return;}if(state.t>=endTime())state.t=startTime();$('play').textContent='일시정지';$('play').setAttribute('aria-pressed','true');frame=requestAnimationFrame(tick);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(render,80);});
buildControls();render();
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController(),snapshot=()=>state.mode==='expression'?window.ExpressionUI.snapshot():({input:{...state.x},impulseResponse:{...state.h},time:state.t,output:M.convolve(state.x,state.h,state.t),overlap:M.overlap(state.x,state.h,state.t)});
 const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
 register({name:'read_convolution_experiment',title:'Convolution 실험 읽기',description:'Read the visible signals, current time and result, including finite integration bounds for expression mode.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:snapshot});
 register({name:'configure_convolution_experiment',title:'Convolution 실험 조절',description:'Select a visible preset and/or the current time. Does not persist any data.',inputSchema:{type:'object',properties:{preset:{type:'string',enum:['rectangles','filter','exponentials','negative']},time:{type:'number',minimum:-100,maximum:100}},additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['preset','time'].includes(k)))throw new Error('Invalid input');if(input.preset!==undefined&&!['rectangles','filter','exponentials','negative'].includes(input.preset))throw new Error('Invalid preset');const next=input.preset?M.defaults():state;if(input.preset==='filter')next.h.kind='exp';if(input.preset==='exponentials'){next.x.kind='exp';next.h.kind='exp';}if(input.time!==undefined&&(!Number.isFinite(input.time)||input.time<(input.preset?-1:startTime())||input.time>(input.preset?M.endTime(next.x,next.h):endTime())))throw new Error('Time outside the visible range');stop();if(input.preset)setPreset(input.preset);if(input.time!==undefined)state.t=input.time;render();return snapshot();}});
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
