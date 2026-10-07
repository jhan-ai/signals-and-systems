'use strict';
window.FourierAdvanced=(()=>{
  const F=window.FourierAdvancedMath, cyan='#007f9f',orange='#c65327',ink='#45505b';
  const pulse={A:2,T:4,D:.5,dc:true};
  const pairState={A:2,phase:3,k:1,t:0};
  const extract={mode:'complex',source:'lecture',m:1,p:1};
  let timer=null;
  const complex=z=>`${fmt(z.re,3)} ${z.im<0?'−':'+'} j${fmt(Math.abs(z.im),3)}`;
  const phase=z=>Math.hypot(z.re,z.im)<1e-9?'정의 안 됨':pi(M.principalPhase(z.re,z.im))+' rad';
  const sourceTerms=()=>extract.source==='lecture'?F.lecture():F.coefficients(state.parts,state.dc);
  const lineAt=(a,t)=>a.layer.append(el('line',{x1:a.X(t),x2:a.X(t),y1:a.top,y2:a.h-a.bottom,stroke:'#b93233','stroke-width':1.3,'stroke-dasharray':'4 4'}));
  const dot=(a,x,y,color)=>a.layer.append(el('circle',{cx:a.X(x),cy:a.Y(y),r:4,fill:color,stroke:'#fffddf','stroke-width':1.5}));
  function stop(){
    if(timer!==null)clearInterval(timer);timer=null;
    for(const [id,label] of [['pair-play','회전 재생'],['extract-play','적분 다시 보기']]){$(id).textContent=label;$(id).setAttribute('aria-pressed','false');}
  }
  function animate(kind){
    const button=$(kind+'-play'),already=button.getAttribute('aria-pressed')==='true';stop();if(already)return;
    if(kind==='extract')extract.p=0;
    button.textContent='일시정지';button.setAttribute('aria-pressed','true');
    timer=setInterval(()=>{
      if(kind==='pair'){pairState.t=+(pairState.t+.005).toFixed(3);if(pairState.t>1)pairState.t=0;$('pair-time').value=pairState.t;renderPair();}
      else{extract.p=Math.min(1,+(extract.p+.01).toFixed(2));$('extract-progress').value=extract.p;renderExtract();if(extract.p===1)stop();}
    },60);
  }
  function renderPair(){
    const {A,phase:p,k,t}=pairState,phi=M.phase(p),z=F.pair(A,phi,k,t),b=Math.max(1.5,A*1.15);
    $('pair-a-value').textContent=fmt(A);$('pair-phase-value').textContent=pi(phi)+' rad';$('pair-k-value').textContent=k;$('pair-time-value').textContent=fmt(t,3);
    const svg=el('svg',{viewBox:'0 0 340 340',role:'img','aria-label':`복소평면: z₊=${complex(z.plus)}, z₋=${complex(z.minus)}, 합=${fmt(z.total.re,3)}. 허수부는 0.`});
    const X=x=>170+125*x/b,Y=y=>170-125*y/b;
    svg.append(el('title',{},'반대 방향으로 회전하는 complex conjugate 쌍'));
    for(const n of [-1,0,1]){svg.append(el('line',{x1:X(-b),x2:X(b),y1:Y(n*b),y2:Y(n*b),stroke:n===0?'#a4a999':'#e1dfc8'}));svg.append(el('line',{x1:X(n*b),x2:X(n*b),y1:Y(-b),y2:Y(b),stroke:n===0?'#a4a999':'#e1dfc8'}));}
    svg.append(el('circle',{cx:170,cy:170,r:125*(A/2)/b,fill:'none',stroke:'#bdc6bb','stroke-dasharray':'4 4'}));
    svg.append(el('text',{x:316,y:185},'Re'));svg.append(el('text',{x:180,y:30},'Im'));
    for(const n of [-1,1]){svg.append(el('text',{x:X(n*A/2),y:190,'text-anchor':'middle'},fmt(n*A/2)));svg.append(el('text',{x:163,y:Y(n*A/2)-5,'text-anchor':'end'},fmt(n*A/2)));}
    function arrow(v,color,width){
      const x=X(v.re),y=Y(v.im),angle=Math.atan2(y-170,x-170);
      svg.append(el('line',{x1:170,y1:170,x2:x,y2:y,stroke:color,'stroke-width':width,'stroke-linecap':'round'}));
      if(Math.hypot(v.re,v.im)>1e-9)svg.append(el('path',{d:`M${x-9*Math.cos(angle-.45)},${y-9*Math.sin(angle-.45)} L${x},${y} L${x-9*Math.cos(angle+.45)},${y-9*Math.sin(angle+.45)}`,fill:'none',stroke:color,'stroke-width':width}));
    }
    for(const v of [z.plus,z.minus])svg.append(el('line',{x1:X(v.re),x2:X(v.re),y1:Y(v.im),y2:170,stroke:'#acb5a8','stroke-dasharray':'3 4'}));
    arrow(z.total,ink,5);arrow(z.plus,cyan,2.5);arrow(z.minus,orange,2.5);$('pair-plane').replaceChildren(svg);
    const a=chart('pair-wave',{xmax:1,xticks:[0,.25,.5,.75,1],ymin:-b,ymax:b,yticks:[-A,0,A].filter((v,i,a)=>a.indexOf(v)===i),ylabel:'Re',title:'각 복소지수의 실수부 A/2 cos와 합 A cos의 시간 파형'});
    a.path(x=>F.pair(A,phi,k,x).plus.re,cyan,3,{dash:'7 5'});a.path(x=>F.pair(A,phi,k,x).minus.re,orange,1.5,{dash:'2 5'});a.path(x=>F.pair(A,phi,k,x).total.re,ink,2.5);lineAt(a,t);dot(a,t,z.total.re,ink);
    $('pair-value').textContent=`Re 합 = ${fmt(z.total.re,3)} · Im 합 = 0`;
    for(const [id,bilateral] of [['pair-bilateral',true],['pair-unilateral',false]]){
      const g=chart(id,{xmin:bilateral?-5.7:-.5,xmax:5.7,xticks:bilateral?[-5,-k,0,k,5].filter((v,i,a)=>a.indexOf(v)===i):[0,k,5].filter((v,i,a)=>a.indexOf(v)===i),ymin:-.08,ymax:3.5,yticks:[0,1,2,3],xlabel:'f (Hz)',ylabel:bilateral?'|Xₙ|':'A',title:bilateral?'양측 복소 계수: 음과 양의 주파수에 A/2씩':'단측 cos 진폭: 양의 주파수에 A'});
      if(A>1e-9){if(bilateral)g.stem(-k,A/2,orange,fmt(A/2));g.stem(k,bilateral?A/2:A,cyan,fmt(bilateral?A/2:A));}
    }
    $('pair-bilateral-note').textContent=A===0?'모든 계수가 0입니다. 위상은 정의하지 않습니다.':`X₊ₖ: 크기 ${fmt(A/2)}, 위상 ${pi(phi)} · X₋ₖ: 크기 ${fmt(A/2)}, 위상 ${pi(M.principalPhase(Math.cos(phi),-Math.sin(phi)))}`;
    $('pair-unilateral-note').textContent=A===0?'신호가 0입니다.':`${fmt(A)} cos(2π · ${k}t ${phi<0?'−':'+'} ${pi(Math.abs(phi))})`;
  }
  function renderExtract(){
    const terms=sourceTerms(),{m,p}=extract,signal=t=>F.product(terms,0,t).re,product=t=>F.product(terms,m,t);
    const b=Math.max(1,terms.reduce((s,z)=>s+Math.hypot(z.re,z.im),0)*1.1),current=F.integral(terms,m,p),final=F.integral(terms,m,1);
    $('extract-m-value').textContent=`m = ${m}`;$('extract-progress-value').textContent=`${Math.round(p*100)}%`;
    $('extract-equation').innerHTML=extract.source==='lecture'?'x(t) = 1 + 2 cos(2πt + π/4)<br>+ cos(6πt − π/3)':signalEquation();
    $('extract-edit').hidden=extract.source!=='synth';
    document.querySelectorAll('[data-m]').forEach(button=>button.setAttribute('aria-pressed',+button.dataset.m===m));
    const options={xmax:1,xticks:[0,.25,.5,.75,1],ymin:-b,ymax:b,yticks:[-b,0,b]};
    const src=chart('extract-signal',{...options,ylabel:'x(t)',title:'분석할 신호의 한 주기'});src.path(signal);lineAt(src,p);
    for(const [id,key,color] of [['extract-real','re',cyan],['extract-imag','im',orange]]){
      const a=chart(id,{...options,title:`기준 복소지수를 곱한 결과의 ${key==='re'?'실수부':'허수부'}와 현재까지의 부호 있는 면적`});
      a.area(t=>t<=p?product(t)[key]:0);a.path(t=>product(t)[key],color,2);lineAt(a,p);
    }
    let ib=.2;for(let j=0;j<=200;j++){const z=F.integral(terms,m,j/200);ib=Math.max(ib,Math.abs(z.re)*1.25,Math.abs(z.im)*1.25);}
    const a=chart('extract-integral',{...options,ymin:-ib,ymax:ib,yticks:[-ib,0,ib],xlabel:'τ/T',title:'누적 적분의 실수부와 허수부. 한 주기가 끝나면 선택한 복소 계수가 됩니다.'});
    a.path(t=>F.integral(terms,m,t).re,cyan,2);a.path(t=>F.integral(terms,m,t).im,orange,2,{dash:'5 4'});lineAt(a,p);dot(a,p,current.re,cyan);dot(a,p,current.im,orange);
    $('extract-current').textContent=complex(current);$('extract-final').textContent=complex(final);$('extract-polar').textContent=`${fmt(Math.hypot(final.re,final.im),3)} · ${phase(final)}`;
    $('extract-terms').replaceChildren(...terms.map(z=>{
      const row=document.createElement('tr');if(z.k===m)row.className='selected';
      for(const value of [z.k,complex(z),z.k-m,complex(F.contribution(z,m,p))]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}return row;
    }));
    $('extract-conclusion').textContent=p<1?`현재 ${Math.round(p*100)}% 적분했습니다. 아직 X${m}으로 확정할 수 없습니다.`:m===0?`m = 0: 평균값 X₀ = ${fmt(final.re,3)}이 남습니다.`:Math.hypot(final.re,final.im)<1e-9?`m = ${m}: 한 주기에서 모든 기여분이 상쇄되어 Xₘ = 0입니다.`:`m = ${m}: 같은 차수의 성분만 남아 Xₘ = ${complex(final)}입니다.`;
  }
  function detect(){
    const advanced=extract.mode==='complex';$('detect-complex').hidden=!advanced;$('detect-real').hidden=advanced;
    $('mode-complex').setAttribute('aria-pressed',advanced);$('mode-real').setAttribute('aria-pressed',!advanced);
    if(advanced)renderExtract();return advanced;
  }
  function resetPulse(){Object.assign(pulse,{A:2,T:4,D:.5,dc:true});syncPulse();}
  function syncPulse(){
    $('pulse-a').value=pulse.A;$('pulse-period').value=pulse.T;
    $('pulse-width').min=pulse.T*.05;$('pulse-width').max=pulse.T;$('pulse-width').step=pulse.T*.01;$('pulse-width').value=pulse.D*pulse.T;$('pulse-dc').checked=pulse.dc;
  }
  function renderPulse(){
    const {A,T,D,dc}=pulse,N=state.n,mean=A*D,offset=dc?0:mean;
    syncPulse();$('pulse-a-value').textContent=fmt(A);$('pulse-period-value').textContent=fmt(T)+' s';$('pulse-width-value').textContent=fmt(D*T,3)+' s';$('pulse-duty').textContent=`w/T = ${fmt(D)} · f₀ = ${fmt(1/T,3)} Hz`;
    $('harmonics-value').textContent='N = '+N;document.querySelectorAll('[data-n]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.n===N));
    let count=0;for(let k=1;k<=N;k++)if(Math.abs(F.pulseCoefficient(A,D,k))>1e-9)count++;
    $('term-count').innerHTML=count+'<span>개</span>';$('harmonic-note').textContent=`양의 차수 ${count}개 + DC ${dc?fmt(mean):'제외'}. 양측 계수 쌍을 실수 cos로 더합니다.`;
    $('series-task-title').textContent='펄스 폭을 절반으로 줄이면?';$('series-task').textContent='w/T가 작아지면 DC는 줄고, sinc의 첫 영점은 더 높은 차수로 이동합니다.';
    const ymin=-Math.max(.3,A*.3)-offset,ymax=Math.max(1,A*1.35)-offset;
    const a=chart('series-plot',{xmin:-T,xmax:T,xticks:[-T,-T/2,0,T/2,T],ymin,ymax,yticks:[-offset,A/2-offset,A-offset].filter((v,i,a)=>a.indexOf(v)===i),ylabel:dc?'x(t)':'x(t) − X₀',title:`주기 ${T}초, 폭 ${fmt(T*D,3)}초, 높이 ${A}의 펄스와 ${N}차 부분합`});
    a.svg.setAttribute('role','group');
    // Exact step path keeps the discontinuities vertical at every viewport width.
    const edges=[];for(let j=-2;j<=2;j++)for(const sign of [-1,1]){const x=(j+sign*D/2)*T;if(x>-T&&x<T)edges.push(x);}edges.sort((x,y)=>x-y);
    const points=[-T,...new Set(edges),T];let d='';
    for(let i=0;i<points.length-1;i++){const x1=points[i],x2=points[i+1],y=F.pulseTarget(A,T,D,(x1+x2)/2,dc);d+=`${i?'L':'M'}${a.X(x1)},${a.Y(y)}L${a.X(x2)},${a.Y(y)}`;}
    a.layer.append(el('path',{d,fill:'none',stroke:'#8fa2b1','stroke-width':1.7,'stroke-dasharray':'6 5'}));
    a.path(t=>F.pulseSum(A,T,D,N,t,dc),ink,2.5,{samples:2400});
    for(const sign of [-1,1]){
      const x=sign*D*T/2,y=A/2-offset,handle=el('g',{class:'pulse-handle',tabindex:'0',role:'slider','aria-label':`${sign<0?'왼쪽':'오른쪽'} 펄스 경계 · 폭 조절`,'aria-valuemin':.05*T,'aria-valuemax':T,'aria-valuenow':+(D*T).toFixed(3),'aria-valuetext':`폭 ${fmt(D*T,3)}초`,'data-pulse-edge':sign});
      handle.append(el('line',{x1:a.X(x),x2:a.X(x),y1:a.top,y2:a.h-a.bottom,class:'pulse-guide'}));
      handle.append(el('rect',{x:a.X(x)-18,y:a.Y(y)-22,width:36,height:44,fill:'transparent'}));
      handle.append(el('circle',{cx:a.X(x),cy:a.Y(y),r:9,class:'handle-knob'}));handle.append(el('text',{x:a.X(x),y:a.Y(y)+4,'text-anchor':'middle',style:'fill:#007f9f;pointer-events:none'},'↔'));a.svg.append(handle);
    }
    $('series-equation').innerHTML=`D = w/T = ${fmt(D)} &nbsp; Xₖ = AD sinc(kD) &nbsp; X₀ = ${fmt(mean,3)}<br>x<sub>N</sub>(t) = ${dc?'X₀':'0'} + 2 ∑<sub>k=1</sub><sup>N</sup> Xₖ cos(2πkt/T)<br><span class="hint">sinc(v) = sin(πv)/(πv), sinc(0) = 1</span>`;
    $('series-spectrum-title').textContent='양측 복소 계수의 크기';$('series-spectrum-badge').textContent='|Xₖ|';
    const K=Math.max(10,N),ticks=K<=15?[-K,-5,0,5,K]:[-K,-Math.round(K/2),0,Math.round(K/2),K];
    const h=chart('harmonic-spectrum',{xmin:-K-1,xmax:K+1,xticks:ticks,ymin:-.03,ymax:Math.max(.3,mean*1.25),yticks:mean>0?[0,mean/2,mean]:[0,.1,.2],xlabel:'harmonic 차수 k',title:'펄스의 양측 복소 계수 크기. 선택한 N 이내는 진하게, 그 밖은 연하게 표시합니다.'});
    const ph=chart('pulse-phase',{xmin:-K-1,xmax:K+1,xticks:ticks,ymin:-.3,ymax:Math.PI*1.25,yticks:[0,Math.PI],tickY:pi,xlabel:'harmonic 차수 k',title:'펄스의 양측 복소 계수 위상. 0인 계수의 위상은 표시하지 않습니다.'});
    for(let k=-K;k<=K;k++){
      const v=k===0&&!dc?0:F.pulseCoefficient(A,D,k),active=Math.abs(k)<=N,color=active?cyan:'#bfc9b7';
      h.stem(k,Math.abs(v),color,Math.abs(k)<=3&&Math.abs(v)>1e-9&&K<=10?fmt(Math.abs(v),3):undefined);
      if(Math.abs(v)>1e-9)ph.stem(k,v<0?Math.PI:0,color);
    }
    $('series-spectrum-note').textContent=`진한 막대: |k| ≤ ${N}의 합성 성분 · 연한 막대: 그 밖의 계수. 실제 주파수는 k/${fmt(T)} Hz. ${dc?'0차 막대는 평균값입니다.':'DC를 제외하여 0차 막대가 0입니다.'}`;
    $('series-conclusion').textContent=A===0?'A = 0: 신호와 모든 계수가 0입니다.':D===1?'w = T: 상수 신호가 되어 DC만 남습니다.':`평균값 X₀ = Aw/T = ${fmt(mean,3)} · sinc 포락선의 첫 양의 영점 k = T/w = ${fmt(1/D,3)}`;
    $('series-detail').textContent=(dc?'':'DC를 끄면 목표와 부분합 모두에서 평균값을 뺍니다. ')+(D<1&&A>0?'영점이 정수 k와 일치할 때 해당 계수가 0입니다. N을 늘리면 펄스를 더 잘 재구성하지만 점프 근처에는 Gibbs 현상이 남습니다. 점프 지점은 양쪽 값의 평균으로 수렴합니다.':'N을 늘려도 파형이 변하지 않습니다.');
    return a;
  }
  function series(){
    const active=state.shape==='pulse';$('pulse-controls').hidden=!active;$('pulse-phase-card').hidden=!active;$('series-fundamental').hidden=active;$('series-plot').classList.toggle('pulse-draggable',active);
    if(active){renderPulse();return true;}
    $('series-spectrum-title').textContent='harmonics별 진폭';$('series-spectrum-badge').textContent='진폭';$('series-spectrum-note').textContent='가로축은 harmonic 차수 k입니다. 실제 주파수는 kf₀입니다.';$('series-task-title').textContent='차수를 5에서 6으로 바꾸면?';return false;
  }
  for(const [id,key] of [['pair-a','A'],['pair-phase','phase'],['pair-k','k'],['pair-time','t']])$(id).addEventListener('input',e=>{stop();pairState[key]=+e.target.value;renderPair();});
  $('pair-play').addEventListener('click',()=>animate('pair'));
  $('reset-pair').addEventListener('click',()=>{stop();Object.assign(pairState,{A:2,phase:3,k:1,t:0});for(const [id,key] of [['pair-a','A'],['pair-phase','phase'],['pair-k','k'],['pair-time','t']])$(id).value=pairState[key];renderPair();});
  for(const mode of ['complex','real'])$('mode-'+mode).addEventListener('click',()=>{stop();stopScan();extract.mode=mode;render();});
  $('extract-source').addEventListener('change',e=>{stop();extract.source=e.target.value;renderExtract();});
  $('extract-edit').addEventListener('click',()=>setTab('synth',true));
  for(const [id,key] of [['extract-m','m'],['extract-progress','p']])$(id).addEventListener('input',e=>{stop();extract[key]=+e.target.value;renderExtract();});
  document.querySelectorAll('[data-m]').forEach(b=>b.addEventListener('click',()=>{stop();extract.m=+b.dataset.m;$('extract-m').value=extract.m;renderExtract();}));
  $('extract-play').addEventListener('click',()=>animate('extract'));
  $('reset-extract').addEventListener('click',()=>{stop();Object.assign(extract,{source:'lecture',m:1,p:1});$('extract-source').value='lecture';$('extract-m').value=1;$('extract-progress').value=1;renderExtract();});
  $('pulse-a').addEventListener('input',e=>{pulse.A=+e.target.value;render();});
  $('pulse-period').addEventListener('input',e=>{pulse.T=+e.target.value;render();});
  $('pulse-width').addEventListener('input',e=>{pulse.D=+e.target.value/pulse.T;render();});
  $('pulse-dc').addEventListener('change',e=>{pulse.dc=e.target.checked;render();});
  $('pulse-example').addEventListener('click',()=>{resetPulse();state.n=5;$('harmonics').value=5;render();});
  const host=$('series-plot');let dragging=false;
  function drag(event){
    const svg=host.querySelector('svg'),box=svg.getBoundingClientRect();if(!box.width)return;
    const width=svg.viewBox?.baseVal?.width||Math.max(260,host.clientWidth||600),x=(event.clientX-box.left)*width/box.width;
    const t=-pulse.T+(x-46)/(width-65)*2*pulse.T;
    pulse.D=Math.max(.05,Math.min(1,Math.round(2*Math.abs(t)/pulse.T*100)/100));renderPulse();
  }
  host.addEventListener('pointerdown',e=>{if(state.shape!=='pulse'||!e.target.closest('[data-pulse-edge]'))return;e.preventDefault();dragging=true;host.classList.add('dragging');host.setPointerCapture?.(e.pointerId);drag(e);});
  host.addEventListener('pointermove',e=>{if(dragging)drag(e);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])host.addEventListener(event,()=>{dragging=false;host.classList.remove('dragging');});
  host.addEventListener('keydown',e=>{
    const handle=e.target.closest('[data-pulse-edge]');if(!handle||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
    e.preventDefault();const side=+handle.dataset.pulseEdge;
    pulse.D=e.key==='Home'?.05:e.key==='End'?1:Math.max(.05,Math.min(1,+(pulse.D+(e.key==='ArrowUp'?.01:e.key==='ArrowDown'?-.01:(e.key==='ArrowRight'?1:-1)*side*.01)).toFixed(2)));
    renderPulse();host.querySelector(`[data-pulse-edge="${side}"]`).focus();
  });
  window.addEventListener('pagehide',stop);
  syncPulse();
  return {pair:renderPair,detect,series,stop,resetPulse,snapshot:()=>({pulse:{...pulse,w:pulse.D*pulse.T},pair:{...pairState},extract:{...extract,current:F.integral(sourceTerms(),extract.m,extract.p),coefficient:F.integral(sourceTerms(),extract.m,1)}})};
})();
