(function(){
  'use strict';
  const E=window.SignalExpression;let current=null,savedPresetTime=.75,expressionTime=.75;
  const examples={ramp:['(t-1)*u(t)','exp(-t)*u(t)'],pulse:['u(t-1)-u(t-3)','u(t+1)-u(t-1)'],sine:['sin(pi*t)*(u(t)-u(t-2))','exp(-t)*u(t)']};
  function clearErrors(){for(const id of ['expression-x','expression-h']){$(id).removeAttribute('aria-invalid');$(id+'-error').hidden=true;}$('expression-error').hidden=true;}
  function apply(){
    stop();clearErrors();let valid=true;
    for(const id of ['expression-x','expression-h']){try{E.compile($(id).value);}catch(e){$(id).setAttribute('aria-invalid','true');$(id+'-error').textContent=e.message;$(id+'-error').hidden=false;valid=false;}}
    if(!valid){$('expression-status').textContent='아직 적용되지 않았습니다' +': 아래 그래프는 마지막으로 적용한 함수의 결과입니다.';return false;}
    const a=$('integral-a').valueAsNumber,b=$('integral-b').valueAsNumber,start=$('display-start').valueAsNumber,end=$('display-end').valueAsNumber;
    try{
      const next=E.experiment($('expression-x').value,$('expression-h').value,{a,b,start,end});
      // Evaluate plotted values before replacing the currently applied state.
      const t=Math.max(start,Math.min(end,state.t));next.inspect(t);
      current=next;state.t=t;expressionTime=t;
      $('expression-status').textContent='적용됨 · 입력한 함수를 아래 그래프에 표시합니다.';render();return true;
    }catch(e){$('expression-error').textContent=e.message;$('expression-error').hidden=false;$('expression-status').textContent='적용되지 않았습니다. 그래프는 마지막으로 적용한 함수의 결과입니다.';return false;}
  }
  function setMode(mode){
    stop();if(state.mode==='expression')expressionTime=state.t;else savedPresetTime=state.t;
    state.mode=mode;
    for(const name of ['preset','expression']){$('mode-'+name).setAttribute('aria-pressed',String(name===mode));$(name+'-panel').hidden=name!==mode;}
    $('expression-result-note').hidden=mode!=='expression';
    if(mode==='expression'){
      state.t=expressionTime;
      if(!current){current=E.experiment(...examples.ramp,{a:-10,b:10,start:-2,end:8});$('expression-status').textContent='초기 예시가 적용되어 있습니다.';}
      state.t=Math.max(current.start,Math.min(current.end,state.t));
    }else{state.t=savedPresetTime;$('time').min=-1;$('time').step=.01;$('output-title').textContent='출력 y(t)';$('output-symbol').textContent='y';}
  }
  function number(v){return Math.abs(v)>=10000?Number(v.toPrecision(4)).toExponential(3):fmt(v,4);}
  function renderCustom(){
    if(!current)return;const c=current,t=state.t;
    try{
      const {value:y,tail,wider,resolution}=c.inspect(t),span=c.b-c.a;
      $('time').min=c.start;$('time').max=c.end;$('time').step=(c.end-c.start)/1000;$('time').value=t;
      $('time-value').textContent=fmt(t,2)+' s';$('time-range').textContent=`${fmt(c.start)} ~ ${fmt(c.end)} s`;
      $('output-t').textContent=fmt(t,2);$('output-value').textContent=number(y);$('output-title').textContent='구간 내 적분값 y[a,b](t)';$('output-symbol').textContent='y[a,b]';
      $('flip-legend').hidden=!state.showFlip;
      $('applied-expressions').textContent=`x(t) = ${c.x.source}  ·  h(t) = ${c.h.source}`;
      $('integration-note').textContent=`τ = ${fmt(c.a)} ~ ${fmt(c.b)}에서 수치 적분합니다. 구간 밖의 기여는 포함하지 않습니다.`;
      $('integration-warning').textContent=(resolution?'계산 간격을 줄였을 때 값이 달라집니다. 빠른 진동이나 좁은 구간 때문에 오차가 클 수 있습니다. ':'')+(tail?(wider===null?'적분 구간을 넓히면 계산이 어려워집니다. 무한 구간의 convolution 값으로 해석하지 마세요.':`현재 t에서 적분 구간을 ${fmt(c.a-span/2)} ~ ${fmt(c.b+span/2)}로 넓히면 ${number(wider)}입니다. 구간 밖의 기여 또는 발산 여부를 확인하세요.`):'현재 t에서 구간을 두 배로 넓힌 값과 비슷합니다. 이것만으로 무한 구간의 수렴이 보장되지는 않습니다.');
      $('integration-warning').classList.toggle('calculation-warning',tail||resolution);
      const shifted=tau=>c.h.value(t-tau),product=tau=>c.x.value(tau)*shifted(tau);
      const breaks=[...c.x.breaks,...c.h.breaks.map(v=>t-v)].filter(v=>v>=c.a&&v<=c.b);
      let amp=0,pa=0;const samples=Array.from({length:641},(_,i)=>c.a+span*i/640);
      for(const b of breaks)for(const d of [-1e-7,0,1e-7])if(b+d>=c.a&&b+d<=c.b)samples.push(b+d);
      for(const tau of samples){amp=Math.max(amp,Math.abs(c.x.value(tau)),Math.abs(shifted(tau)));if(state.showFlip)amp=Math.max(amp,Math.abs(c.h.value(-tau)));pa=Math.max(pa,Math.abs(product(tau)));}
      amp=amp>0?amp*1.15:1;pa=pa>0?pa*1.15:1;
      const a=chart('overlap-plot',c.a,c.b,-amp,amp,{title:`입력 함수 x(τ)와 h(${fmt(t)}−τ)`});
      if(state.showFlip)a.line(tau=>c.h.value(-tau),'#8b9ca9',1.6,{dash:'5 5',breaks:c.h.breaks.map(v=>-v)});
      a.line(c.x.value,'#007f9f',2.6,{breaks:c.x.breaks});a.line(shifted,'#c65327',2.6,{breaks:c.h.breaks.map(v=>t-v)});
      $('shift-note').textContent=`h(−τ)를 ${fmt(Math.abs(t))}초 ${t<0?'왼쪽':'오른쪽'}으로 이동 · 표시 범위는 적분 구간`;
      const p=chart('product-plot',c.a,c.b,-pa,pa,{title:'입력한 두 함수의 곱과 유한 구간의 면적'});p.area(product,breaks);p.line(product,'#33556b',2,{breaks});
      $('overlap-note').textContent=`τ = ${fmt(c.a)} ~ ${fmt(c.b)}의 양수 면적과 음수 면적을 더합니다.`;
      const min=Math.min(0,y,...c.values),max=Math.max(0,y,...c.values),pad=max>min?(max-min)*.15:1;
      const o=chart('output-plot',c.start,c.end,min-pad,max+pad,{xlabel:'t (s)',title:'유한 구간에서 수치 적분한 결과',yticks:[min-pad,0,max+pad]});
      o.line(c.interpolate,'#45505b',2.8,{breaks:c.knots});o.layer.append(node('line',{x1:o.X(t),x2:o.X(t),y1:o.top,y2:o.h-o.b,stroke:'#007f9f','stroke-dasharray':'4 4'}));o.layer.append(node('circle',{cx:o.X(t),cy:o.Y(y),r:6,fill:'#007f9f',stroke:'#fff','stroke-width':2}));
      $('output-formula').textContent=`y[a,b](${fmt(t)}) = ∫[${fmt(c.a)}, ${fmt(c.b)}] x(τ) h(${fmt(t)} − τ) dτ ≈ ${number(y)}`;
      $('observation-title').textContent='양수 면적과 음수 면적의 합';$('observation-detail').textContent='곡선 아래 면적을 부호와 함께 더합니다. 함수의 일부가 음수이면 두 면적이 서로 상쇄될 수 있습니다. y[a,b](t)는 지정한 구간에서 계산한 값입니다.';
    }catch(e){stop();$('expression-error').textContent=e.message;$('expression-error').hidden=false;$('output-value').textContent='계산 불가';$('output-formula').textContent='현재 시각에서 계산할 수 없습니다.';$('integration-warning').textContent=e.message;for(const id of ['overlap-plot','product-plot','output-plot'])$(id).replaceChildren();}
  }
  function swap(){const x=$('expression-x').value,h=$('expression-h').value;$('expression-x').value=h;$('expression-h').value=x;apply();}
  window.ExpressionUI={setMode,render:renderCustom,current:()=>current,swap,snapshot:()=>({mode:'expression',input:current.x.source,impulseResponse:current.h.source,time:state.t,integrationBounds:[current.a,current.b],output:current.at(state.t),method:'finite-interval numerical integration'})};
  for(const mode of ['preset','expression'])$('mode-'+mode).addEventListener('click',()=>{setMode(mode);render();});
  $('expression-form').addEventListener('submit',event=>{event.preventDefault();apply();});
  $('expression-form').addEventListener('input',()=>{$('expression-status').textContent='변경 사항을 반영하려면 ‘함수 적용’을 누르세요. 그래프는 마지막으로 적용한 함수의 결과입니다.';});
  for(const button of document.querySelectorAll('[data-expression-example]'))button.addEventListener('click',()=>{[$('expression-x').value,$('expression-h').value]=examples[button.dataset.expressionExample];$('integral-a').value=-10;$('integral-b').value=10;$('display-start').value=-2;$('display-end').value=8;apply();});
})();
