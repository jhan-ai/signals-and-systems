'use strict';
const M=window.FourierMath;
const $=id=>document.getElementById(id);
const colors=['#007f9f','#c65327','#16816a'];
const state={tab:'synth',parts:M.initial(),dc:0,showParts:true,probe:1,shape:'pulse',n:5,f0:1};
let scanTimer=null;
const fmt=(n,d=2)=>Math.abs(n)<1e-9?'0':Number(n.toFixed(d)).toString().replace('-','−');
function pi(v){
  if(Math.abs(v)<1e-8)return '0';
  const sign=v<0?'−':'';const r=Math.abs(v)/Math.PI;
  for(const den of [1,2,3,4,6,12]){
    const num=Math.round(r*den);
    if(Math.abs(r-num/den)<1e-7)return sign+(num===1?'':num)+'π'+(den===1?'':'/'+den);
  }
  return fmt(v,3);
}
const colorFor=f=>colors[Math.max(0,state.parts.findIndex(p=>p.on&&p.f===f))];
const bound=()=>Math.max(1.5,Math.ceil((state.parts.reduce((s,c)=>s+(c.on?c.a:0),0)+Math.abs(state.dc)+.2)*2)/2);
function el(tag,attrs={},content=''){
  const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
  Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,String(v)));
  if(content!=='')node.textContent=content;
  return node;
}
function chart(id,{xmin=0,xmax=2,ymin=-2,ymax=2,xticks=[0,.5,1,1.5,2],yticks=[-2,-1,0,1,2],xlabel='t (s)',ylabel='',title='',tickY=fmt}={}){
  const host=$(id),w=Math.max(260,host.clientWidth||600),h=host.clientHeight||220;
  const left=46,right=19,top=21,bottom=38,pw=w-left-right,ph=h-top-bottom;
  const X=x=>left+(x-xmin)/(xmax-xmin)*pw,Y=y=>top+(ymax-y)/(ymax-ymin)*ph;
  const svg=el('svg',{viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':title});
  svg.append(el('title',{},title));
  const defs=el('defs'),clip=el('clipPath',{id:`clip-${id}`});clip.append(el('rect',{x:left,y:top-4,width:pw,height:ph+8}));defs.append(clip);svg.append(defs);
  yticks.forEach(t=>{svg.append(el('line',{x1:left,x2:w-right,y1:Y(t),y2:Y(t),class:Math.abs(t)<1e-8?'zero':'grid'}));svg.append(el('text',{x:left-9,y:Y(t)+4,'text-anchor':'end'},tickY(t)));});
  xticks.forEach(t=>{svg.append(el('line',{x1:X(t),x2:X(t),y1:top,y2:h-bottom,class:'grid'}));svg.append(el('text',{x:X(t),y:h-bottom+19,'text-anchor':'middle'},fmt(t)));});
  if(xlabel)svg.append(el('text',{x:w-right,y:h-3,'text-anchor':'end',class:'axis-label'},xlabel));
  if(ylabel)svg.append(el('text',{x:7,y:12,class:'axis-label'},ylabel));
  const layer=el('g',{'clip-path':`url(#clip-${id})`});svg.append(layer);host.replaceChildren(svg);
  function path(fn,stroke='#45505b',width=2.6,{dash='',opacity=1,samples=Math.max(600,Math.ceil(pw*2))}={}){
    let d='';for(let i=0;i<=samples;i++){const x=xmin+(xmax-xmin)*i/samples;d+=(i===0?'M':'L')+X(x).toFixed(2)+','+Y(fn(x)).toFixed(2);}
    layer.append(el('path',{d,fill:'none',stroke,'stroke-width':width,'stroke-dasharray':dash,opacity,'stroke-linejoin':'round','stroke-linecap':'round'}));
  }
  function area(fn){
    const n=600;
    for(const sign of [1,-1]){
      let d=`M${X(xmin)},${Y(0)}`;
      for(let i=0;i<=n;i++){const x=xmin+(xmax-xmin)*i/n, val=fn(x);d+=`L${X(x).toFixed(2)},${Y(sign===1?Math.max(0,val):Math.min(0,val)).toFixed(2)}`;}
      d+=`L${X(xmax)},${Y(0)}Z`;layer.append(el('path',{d,fill:sign===1?'#16816a':'#c65327','fill-opacity':'.20'}));
    }
  }
  function stem(x,y,color,label){
    layer.append(el('line',{x1:X(x),x2:X(x),y1:Y(0),y2:Y(y),stroke:color,'stroke-width':2.8}));
    layer.append(el('circle',{cx:X(x),cy:Y(y),r:4.4,fill:color,stroke:'#fff','stroke-width':1}));
    if(label!==undefined)svg.append(el('text',{x:X(x),y:Y(y)+(y<0?19:-10),'text-anchor':'middle',class:'point-label',style:`fill:${color}`},label));
  }
  return {svg,layer,X,Y,path,area,stem,w,h,left,right,top,bottom};
}
function signalEquation(){
  const pieces=[];
  if(state.dc!==0)pieces.push(`<span class="term">${fmt(state.dc)}</span>`);
  state.parts.forEach((p,i)=>{if(!p.on||p.a===0)return;const phase=p.p===0?'':` ${p.p>0?'+':'−'} ${pi(Math.abs(M.phase(p.p)))}`;pieces.push(`<span class="term" style="color:${colors[i]}">${fmt(p.a)} cos(2π · ${p.f}t${phase})</span>`);});
  return 'x(t) = '+(pieces.length?pieces.join(' + '):'0');
}
function buildControls(){
  $('component-controls').innerHTML=state.parts.map((p,i)=>`<div class="component component-${i+1} ${p.on?'':'off'}" id="component-${i}"><div class="component-title"><label><input id="enabled-${i}" type="checkbox" data-part="${i}" data-prop="on" ${p.on?'checked':''}>sinusoid ${i+1}</label><span class="component-tag">${['파랑','주황','초록'][i]}</span></div><div class="sliders">${[
    ['a','진폭 A',0,2,.1,p.a,fmt(p.a,1)],['f','주파수 f',1,10,1,p.f,p.f+' Hz'],['p','위상 φ',-12,12,1,p.p,pi(M.phase(p.p))+' rad']
  ].map(([prop,label,min,max,step,val,out])=>`<div class="control-row"><label for="part-${i}-${prop}">${label}<output id="value-${i}-${prop}">${out}</output></label><input id="part-${i}-${prop}" type="range" min="${min}" max="${max}" step="${step}" value="${val}" data-part="${i}" data-prop="${prop}" aria-label="sinusoid ${i+1} ${label}" ${p.on?'':'disabled'}></div>`).join('')}</div></div>`).join('');
}
function setPreset(name){
  state.parts=M.initial();state.dc=0;
  if(name==='exercise')state.parts=[{f:3,a:2,p:-3,on:true},{f:4,a:1,p:-4,on:true},{f:5,a:.3,p:0,on:false}];
  if(name==='phase')state.parts=[{f:1,a:1,p:0,on:true},{f:3,a:.5,p:0,on:true},{f:5,a:.3,p:0,on:false}];
  if(name==='cancel')state.parts=[{f:2,a:1,p:0,on:true},{f:2,a:1,p:12,on:true},{f:5,a:.3,p:0,on:false}];
  $('preset').value=name;$('dc').value=0;buildControls();render();
}
function renderSpectrum(id,{phase=false,selected=null}={}){
  const data=M.spectrum(state.parts),maxA=Math.max(1.2,...data.map(v=>v.a*1.35),Math.abs(state.dc)*1.35);
  const max=Math.ceil(maxA*2)/2;
  const a=chart(id,{xmin:-.35,xmax:10.6,ymin:phase?-Math.PI*1.35:Math.min(-.06*max,state.dc<0?state.dc*1.35:-.06*max),ymax:phase?Math.PI*1.4:max,xticks:[0,1,2,3,4,5,6,7,8,9,10],yticks:phase?[-Math.PI,0,Math.PI]:state.dc<0?[state.dc,0,max/2,max]:[0,max/2,max],xlabel:'f (Hz)',tickY:phase?pi:fmt,title:phase?'코사인 기준 위상 스펙트럼, 단위 라디안':'단측 진폭 스펙트럼, DC는 부호 있는 평균값'});
  if(selected!==null){
    a.layer.append(el('rect',{x:a.X(selected)-13,y:a.top,width:26,height:a.h-a.bottom-a.top,fill:'#dceef4',rx:5}));
    a.layer.append(el('line',{x1:a.X(selected),x2:a.X(selected),y1:a.top,y2:a.h-a.bottom,stroke:'#007f9f','stroke-dasharray':'3 4','stroke-width':1}));
  }
  data.forEach(z=>a.stem(z.f,phase?z.phi:z.a,colorFor(z.f),phase?pi(z.phi):fmt(z.a)));
  if(!phase&&Math.abs(state.dc)>1e-9)a.stem(0,state.dc,'#536a7d',fmt(state.dc));
  if(!data.length&&(phase||Math.abs(state.dc)<1e-9)){
    const lines=phase?['진폭이 0인 성분의 위상은','정의하지 않습니다']:['0이 아닌 주파수 성분이','없습니다'];
    lines.forEach((line,i)=>a.svg.append(el('text',{x:(a.left+a.w-a.right)/2,y:a.h/2-14+i*19,'text-anchor':'middle',class:'axis-label'},line)));
  }
}
function renderSynth(){
  const b=bound(),a=chart('sum-plot',{ymin:-b,ymax:b,yticks:[-b,-b/2,0,b/2,b],ylabel:'x(t)',title:'시간에 따른 합성 신호와 개별 sinusoids, 0초부터 2초'});
  if(state.showParts)state.parts.forEach((p,i)=>{if(p.on)a.path(t=>p.a*Math.cos(M.TAU*p.f*t+M.phase(p.p)),colors[i],1.5,{opacity:.5});});
  a.path(t=>M.sample(state.parts,state.dc,t));
  $('equation').innerHTML=signalEquation();$('dc-value').textContent=fmt(state.dc,1);
  renderSpectrum('amplitude-plot');renderSpectrum('phase-plot',{phase:true});
  const frequencies=state.parts.filter(p=>p.on&&p.a>0).map(p=>p.f);
  $('synth-observation').textContent=new Set(frequencies).size<frequencies.length?'현재 같은 주파수의 성분이 있습니다. 두 성분의 진폭을 단순히 더하지 않고, 위상을 고려해 합친 결과를 표시합니다.':state.dc!==0?`DC = ${fmt(state.dc)}: 파형 전체가 위아래로 이동하며, 0 Hz의 평균값이 바뀝니다.`:'';
}
function renderDetect(){
  if(window.FourierAdvanced?.detect())return;
  const q=state.probe,r=M.analyze(state.parts,state.dc,q),b=bound();
  $('probe-value').textContent=q+' Hz';
  $('detect-source').innerHTML=state.parts.filter(p=>p.on&&p.a>0).map(p=>`${p.f} Hz · 진폭 ${fmt(p.a)} · 위상 ${pi(M.phase(p.p))}`).join('<br>')+(state.dc!==0?`<br>DC ${fmt(state.dc)}`:'')||'입력 신호가 0입니다.';
  renderSpectrum('detect-spectrum',{selected:q});
  const cosine=t=>M.sample(state.parts,state.dc,t)*Math.cos(M.TAU*q*t);
  const sine=t=>M.sample(state.parts,state.dc,t)*Math.sin(M.TAU*q*t);
  for(const [id,fn] of [['cos-product',cosine],['sin-product',sine]]){
    const a=chart(id,{xmax:1,xticks:[0,.25,.5,.75,1],ymin:-b,ymax:b,yticks:[-b,0,b],title:`${q} Hz 기준 ${id==='cos-product'?'코사인':'사인'}과 입력 신호를 곱한 파형`});a.area(fn);a.path(fn,'#33556b',1.8);
  }
  $('cos-result').textContent=`c = 2 × 부호 있는 면적 = ${fmt(r.c,3)}`;
  $('sin-result').textContent=`s = 2 × 부호 있는 면적 = ${fmt(r.s,3)}`;
  $('measure-f').innerHTML=`${q} <small>Hz</small>`;$('measure-a').textContent=r.a.toFixed(3);
  $('measure-p').innerHTML=r.phi===null?'정의 안 됨':`${pi(r.phi)} <small>rad</small>`;
  $('detect-conclusion').textContent=r.a<1e-9?`${q} Hz 성분은 없습니다. 두 곱의 양수·음수 면적이 각각 상쇄됩니다.`:`${q} Hz 성분을 찾았습니다. 진폭은 ${fmt(r.a,3)}, 위상은 ${pi(r.phi)} rad입니다.`;
}
function renderSeries(){
  if(window.FourierAdvanced?.series())return;
  const parts=M.harmonics(state.shape,state.n,state.f0),maxT=2/state.f0;
  $('harmonics-value').textContent='N = '+state.n;$('fundamental-value').textContent=fmt(state.f0)+' Hz';
  $('term-count').innerHTML=parts.length+'<span>개</span>';
  document.querySelectorAll('[data-n]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.n)===state.n));
  const names={square:'사각파',triangle:'삼각파',saw:'톱니파'},name=names[state.shape];
  $('harmonic-note').textContent=state.shape==='saw'?'톱니파에는 모든 정수차 harmonics가 있습니다.':`${name}에는 홀수 harmonics만 있습니다.`;
  $('series-task').textContent=state.shape==='saw'?'톱니파는 모든 차수에 성분이 있습니다. N을 하나씩 늘리며 파형이 어떻게 변하는지 보세요.':`${name}의 짝수차 계수는 0입니다. 차수를 하나 늘려도 파형이 변하지 않을 수 있습니다.`;
  const a=chart('series-plot',{xmax:maxT,xticks:[0,.5/state.f0,1/state.f0,1.5/state.f0,maxT],ymin:-1.6,ymax:1.6,yticks:[-1,0,1],ylabel:'x(t)',title:`${name} 목표 파형과 ${state.n}차까지의 푸리에 급수 합, 2주기`});
  a.path(t=>M.target(state.shape,state.f0,t),'#8fa2b1',1.7,{dash:'6 5',samples:2400});
  a.path(t=>M.sample(parts,0,t),'#45505b',2.6,{samples:2400});
  const cutoff=state.shape==='saw'?'k = 1, …, N':'k = 1, 3, …, N 이하';
  $('series-equation').innerHTML=state.shape==='square'?`x<sub>N</sub>(t) = ∑ [4/(πk)] sin(2πkf₀t) <span class="hint">(${cutoff})</span>`:state.shape==='triangle'?`x<sub>N</sub>(t) = ∑ [8(−1)<sup>(k−1)/2</sup>/(π²k²)] sin(2πkf₀t) <span class="hint">(${cutoff})</span>`:`x<sub>N</sub>(t) = ∑ [−2/(πk)] sin(2πkf₀t) <span class="hint">(${cutoff})</span>`;
  const xmax=Math.max(10,state.n+1),xTicks=state.n<=10?[0,1,3,5,7,9]:state.n<=20?[0,5,10,15,20]:[0,10,20,30,40,50];
  const h=chart('harmonic-spectrum',{xmin:-.4,xmax:Math.max(xmax,xTicks[xTicks.length-1]+.5),ymin:-.05,ymax:1.55,xticks:xTicks,yticks:[0,.5,1,1.5],xlabel:'harmonic 차수 k',title:`${name}의 ${state.n}차까지 harmonics별 코사인 진폭, 실제 주파수는 k 곱하기 ${state.f0} Hz`});
  parts.forEach(p=>h.stem(p.k,p.a,'#007f9f',parts.length<=5?fmt(p.a,3):undefined));
  const lineX=h.X(state.n);h.layer.append(el('line',{x1:lineX+6,x2:lineX+6,y1:h.top,y2:h.h-h.bottom,stroke:'#b9cdd9','stroke-dasharray':'4 4'}));
  $('series-conclusion').textContent=state.shape==='triangle'?'삼각파는 낮은 차수만 더해도 원래 모양에 빠르게 가까워집니다.':'차수를 늘려도 불연속점 근처의 돌출은 완전히 사라지지 않습니다.';
  $('series-detail').textContent=state.shape==='triangle'?'harmonics의 진폭이 1/k²에 비례해 작아집니다. 기본 주파수를 바꾸면 시간축의 2주기 길이도 함께 바뀝니다.':'Gibbs 현상입니다. 돌출이 나타나는 구간은 좁아지지만, 충분히 큰 N에서 최대 초과량은 점프 크기의 약 9%로 남습니다. 불연속점 자체에서는 좌우 값의 평균으로 수렴합니다.';
}
function render(){
  $('preset-status').hidden=$('preset').value!=='custom';if(state.tab==='synth')renderSynth();else if(state.tab==='pair')window.FourierAdvanced?.pair();else if(state.tab==='detect')renderDetect();else renderSeries();}
function stopScan(){if(scanTimer)clearInterval(scanTimer);scanTimer=null;$('scan').textContent='자동 탐색';$('scan').setAttribute('aria-pressed','false');}
function setTab(tab,focus=false){
  if(!['synth','pair','detect','series'].includes(tab))throw new Error('Unknown experiment');
  stopScan();window.FourierAdvanced?.stop();state.tab=tab;
  for(const t of ['synth','pair','detect','series']){$('panel-'+t).hidden=t!==tab;$('tab-'+t).setAttribute('aria-selected',t===tab);$('tab-'+t).tabIndex=t===tab?0:-1;}
  if(focus)$('tab-'+tab).focus();render();
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
document.querySelector('.tabs').addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();const list=['synth','pair','detect','series'],i=list.indexOf(state.tab);
  setTab(e.key==='Home'?list[0]:e.key==='End'?list[list.length-1]:list[(i+(e.key==='ArrowRight'?1:list.length-1))%list.length],true);
});
$('component-controls').addEventListener('input',e=>{
  const target=e.target;if(!target.dataset.prop)return;
  const i=Number(target.dataset.part),prop=target.dataset.prop;
  state.parts[i][prop]=prop==='on'?target.checked:Number(target.value);$('preset').value='custom';
  if(prop==='on'){buildControls();$('enabled-'+i).focus();}else $('value-'+i+'-'+prop).textContent=prop==='p'?pi(M.phase(state.parts[i].p))+' rad':prop==='f'?state.parts[i].f+' Hz':fmt(state.parts[i].a,1);
  render();
});
$('preset').addEventListener('change',e=>setPreset(e.target.value));
$('reset-synth').addEventListener('click',()=>{state.showParts=true;$('show-parts').checked=true;setPreset('lecture');});
$('dc').addEventListener('input',e=>{state.dc=Number(e.target.value);$('preset').value='custom';render();});
$('show-parts').addEventListener('change',e=>{state.showParts=e.target.checked;render();});
$('edit-source').addEventListener('click',()=>setTab('synth',true));
$('probe').addEventListener('input',e=>{stopScan();state.probe=Number(e.target.value);render();});
$('scan').addEventListener('click',()=>{if(scanTimer){stopScan();return;}$('scan').textContent='탐색 일시정지';$('scan').setAttribute('aria-pressed','true');scanTimer=setInterval(()=>{state.probe=state.probe===10?1:state.probe+1;$('probe').value=state.probe;render();},1000);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopScan();window.FourierAdvanced?.stop();}});
const setN=n=>{state.n=n;$('harmonics').value=n;render();};
$('waveform').addEventListener('change',e=>{state.shape=e.target.value;render();});
$('harmonics').addEventListener('input',e=>setN(Number(e.target.value)));
document.querySelectorAll('[data-n]').forEach(b=>b.addEventListener('click',()=>setN(Number(b.dataset.n))));
$('fundamental').addEventListener('input',e=>{state.f0=Number(e.target.value);render();});
$('reset-series').addEventListener('click',()=>{window.FourierAdvanced?.resetPulse();state.shape='pulse';state.n=5;state.f0=1;$('waveform').value='pulse';$('harmonics').value=5;$('fundamental').value=1;render();});
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(render,80);});
buildControls();render();

// Browser tools use exactly the same state and redraw functions as visible controls.
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
  const snapshot=()=>({experiment:state.tab,components:state.parts.map(p=>({...p,phaseRadians:M.phase(p.p)})),dc:state.dc,spectrum:M.spectrum(state.parts),probeHz:state.probe,analysis:M.analyze(state.parts,state.dc,state.probe),series:{shape:state.shape,maxHarmonic:state.n,fundamentalHz:state.shape==='pulse'?1/(window.FourierAdvanced?.snapshot().pulse.T||4):state.f0},advanced:window.FourierAdvanced?.snapshot()});
  register({name:'read_fourier_experiment',title:'주파수 실험 상태 읽기',description:'Read the current signal parameters, combined spectrum and analysis result.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>snapshot()});
  register({name:'configure_fourier_experiment',title:'주파수 실험 조절',description:'Change the visible experiment and its frequency or Fourier-series controls. Does not persist data.',inputSchema:{type:'object',properties:{experiment:{type:'string',enum:['synth','pair','detect','series']},preset:{type:'string',enum:['lecture','exercise','phase','cancel']},probeHz:{type:'integer',minimum:1,maximum:10},shape:{type:'string',enum:['pulse','square','triangle','saw']},maxHarmonic:{type:'integer',minimum:1,maximum:49},fundamentalHz:{type:'number',enum:[1,1.5,2,2.5,3]}},additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{
    if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Expected an object');
    for(const k of Object.keys(input))if(!['experiment','preset','probeHz','shape','maxHarmonic','fundamentalHz'].includes(k))throw new Error('Unknown property');
    if(input.experiment!==undefined&&!['synth','pair','detect','series'].includes(input.experiment))throw new Error('Invalid experiment');
    if(input.preset!==undefined&&!['lecture','exercise','phase','cancel'].includes(input.preset))throw new Error('Invalid preset');
    if(input.probeHz!==undefined&&(!Number.isInteger(input.probeHz)||input.probeHz<1||input.probeHz>10))throw new Error('Invalid probe frequency');
    if(input.shape!==undefined&&!['pulse','square','triangle','saw'].includes(input.shape))throw new Error('Invalid waveform');
    if(input.maxHarmonic!==undefined&&(!Number.isInteger(input.maxHarmonic)||input.maxHarmonic<1||input.maxHarmonic>49))throw new Error('Invalid harmonic order');
    if(input.fundamentalHz!==undefined&&![1,1.5,2,2.5,3].includes(input.fundamentalHz))throw new Error('Invalid fundamental frequency');
    if(input.preset!==undefined)setPreset(input.preset);
    if(input.probeHz!==undefined){state.probe=input.probeHz;$('probe').value=input.probeHz;}
    if(input.shape!==undefined){state.shape=input.shape;$('waveform').value=input.shape;}
    if(input.maxHarmonic!==undefined){state.n=input.maxHarmonic;$('harmonics').value=input.maxHarmonic;}
    if(input.fundamentalHz!==undefined){state.f0=input.fundamentalHz;$('fundamental').value=input.fundamentalHz;}
    setTab(input.experiment||state.tab);return snapshot();
  }});
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
