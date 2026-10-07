'use strict';
window.FourierLesson=(()=>{
 const F=window.FourierLessonMath,cyan='#007f9f',orange='#c65327',ink='#45505b',red='#b93233';
 const detectState={source:'three',T:2,m:2,inspectK:1};
 const seriesState={example:'pulse',A:2,T:4,D:.5,k:1,N:5};
 // Native MathML keeps the displayed derivations aligned with the lecture notation.
 const mi=s=>`<mi>${s}</mi>`,mo=s=>`<mo>${s}</mo>`,mn=s=>`<mn>${typeof s==='number'?fmt(s,4):s}</mn>`,row=s=>`<mrow>${s}</mrow>`;
 const sub=(s,k)=>`<msub>${mi(s)}${typeof k==='number'?mn(k):mi(k)}</msub>`,sup=(a,b)=>`<msup>${a}${row(b)}</msup>`,frac=(a,b)=>`<mfrac>${row(a)}${row(b)}</mfrac>`;
 const math=s=>`<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">${row(s)}</math>`;
 const f0=sub('f',0),X=k=>sub('X',k),j=mi('j'),t=mi('t'),T=mi('T'),dt=mi('d')+t,eq=mo('='),times=mo('·');
 const exp=a=>sup(mi('e'),a),wrap=a=>mo('(')+a+mo(')');
 const exponent=k=>k===0?mn(1):exp(j+mn(2)+mi('π')+(k===1?'':k<0?wrap(mn(k)):mn(k))+f0+t);
 const basis=k=>exp(j+mn(2)+mi('π')+(typeof k==='number'?(k<0?wrap(mn(k)):mn(k)):mi(k))+f0+t);
 const integral=(lo,hi,body)=>`<msubsup>${mo('∫')}${row(lo)}${row(hi)}</msubsup>`+body+dt;
 const sigma=(lo,hi,body)=>`<munderover>${mo('∑')}${row(lo)}${row(hi)}</munderover>`+body;
 const scalar=z=>Math.abs(z.im)<1e-9?fmt(z.re,3):`${fmt(z.re,3)} ${z.im<0?'−':'+'} j${fmt(Math.abs(z.im),3)}`;
 const zMath=z=>Math.abs(z.im)<1e-9?mn(z.re):(Math.abs(Math.hypot(z.re,z.im)-1)<1e-9?'':mn(Math.hypot(z.re,z.im)))+exp(j+`<mtext>${pi(M.principalPhase(z.re,z.im))}</mtext>`);
 const phase=z=>Math.hypot(z.re,z.im)<1e-9?'정의 안 됨':pi(M.principalPhase(z.re,z.im))+' rad';
 const divT=frac(mn(1),T),generalCoefficient=divT+integral(mn(0),T,mi('x')+wrap(t)+exp(mo('−')+j+mn(2)+mi('π')+mi('k')+f0+t));
 const generalSeries=sigma(mi('k')+eq+mo('−')+mi('∞'),mi('∞'),X('k')+basis('k'));
 function currentSource(){return detectState.source==='three'?F.three():detectState.source==='lecture'?F.lecture():F.coefficients(state.parts,state.dc);}
 function detectT(){return detectState.source==='synth'?1:detectState.T;}
 function sourceEquation(terms){return math(mi('x')+wrap(t)+eq+(terms.length?terms.map(z=>zMath(z)+(z.k===0?'':exponent(z.k))).join(mo('+')):mn(0)));}
 function renderProof(){
  const k=detectState.inspectK,m=detectState.m,q=k-m,period=detectT(),z=F.coefficient(currentSource(),k);
  $('orthogonality-title').textContent=`k = ${k}, m = ${m}의 내적 계산 · 145–146쪽`;
  const left=mo('⟨')+basis(k)+mo(',')+basis(m)+mo('⟩'),power=j+mn(2)+mi('π')+wrap(mn(k)+mo('−')+mn(m))+frac(t,T);
  let lines=[math(left+eq+integral(mn(0),T,exp(power)))];
  if(q===0){
   lines.push(math(eq+integral(mn(0),T,mn(1))+eq+T+eq+mn(period)));
   lines.push(`<p>k=m이므로 지수가 0이 됩니다. 같은 기저끼리의 내적은 T입니다.</p>`);
  }else{
   const primitive=frac(T+exp(j+mn(2)+mi('π')+wrap(mn(q))+frac(t,T)),j+mn(2)+mi('π')+wrap(mn(q)));
   lines.push(math(eq+`<msubsup>${row(mo('[')+primitive+mo(']'))}${mn(0)}${T}</msubsup>`));
   lines.push(math(eq+frac(T,j+mn(2)+mi('π')+wrap(mn(q)))+wrap(exp(j+mn(2)+mi('π')+wrap(mn(q)))+mo('−')+mn(1))+eq+mn(0)));
   lines.push(`<p>k−m=${q}는 0이 아닌 정수이므로 e<sup>j2π(${q})</sup>=1입니다. 따라서 한 주기에서 서로 직교합니다.</p>`);
  }
  const weighted=F.scale(z,F.basisInner(k,m,period));
  lines.push(`<p class="proof-result">원래 성분의 계수 X<sub>${k}</sub>까지 곱한 결과: <strong>${scalar(weighted)}</strong>${q===0?' (= X'+k+'T)':''}</p>`);
  $('orthogonality-calculation').innerHTML=lines.join('');
  document.querySelectorAll('[data-inspect-k]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.inspectK===k));
 }
 function detect(){
  const terms=currentSource(),{source,m}=detectState,period=detectT(),z=F.coefficient(terms,m),raw=F.inner(terms,m,period);
  $('detect-period').disabled=source==='synth';$('detect-period').value=period;$('detect-period-value').textContent=fmt(period)+' s';
  $('detect-period-note').textContent=source==='synth'?'01의 모든 성분은 정수 Hz입니다. 공통 주기 T=1 s를 내적 구간으로 사용합니다.':`구간 [0, ${fmt(period)}] · f₀ = 1/T = ${fmt(1/period,3)} Hz`;
  $('detect-example-note').textContent=source==='three'?'148쪽의 세 성분 X₁, X₂, X₃에 각각 1, 0.8, 0.5를 넣은 예시입니다.':source==='lecture'?'154쪽의 신호에 T를 지정하여 같은 방식으로 내적합니다.':'01에서 조절한 신호의 계수를 내적으로 구합니다.';
  $('edit-detect-source').hidden=source!=='synth';$('detect-m-value').textContent=`m = ${m} · ${fmt(m/period,3)} Hz`;
  $('detect-basis').innerHTML=math(basis(m));$('detect-conjugate').innerHTML=math(basis(-m));
  document.querySelectorAll('[data-m]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.m===m));
  $('detect-equation').innerHTML=sourceEquation(terms);
  const bound=Math.max(1,terms.reduce((s,z)=>s+Math.hypot(z.re,z.im),0)*1.15),complex=source==='three';
  const a=chart('detect-signal',{xmax:period,xticks:[0,period/2,period],ymin:-bound,ymax:bound,yticks:[-bound,0,bound],title:complex?'세 복소지수 성분의 합: 실수부와 허수부를 각각 표시':'분석할 실수 주기 신호의 한 주기'});
  a.path(t=>F.signal(terms,t,period).re,complex?cyan:ink,2.4);
  if(complex)a.path(t=>F.signal(terms,t,period).im,orange,2,{dash:'5 4'});
  $('detect-signal-legend').innerHTML=complex?'<span class="plus-color">실선 · Re x(t)</span><span class="minus-color">점선 · Im x(t)</span>':'<span>x(t)</span>';
  $('detect-signal-note').textContent=complex?'이 예시는 복소 신호이므로 Re x(t), Im x(t)를 따로 그렸습니다. 아래 내적은 복소지수식 그대로 계산합니다.':'아래 표에서는 실수 신호를 구성하는 양·음의 주파수 계수를 모두 표시합니다.';
  $('detect-rule').innerHTML=math(integral(mn(0),T,exp(j+mn(2)+mi('π')+wrap(mi('k')+mo('−')+mi('m'))+f0+t))+eq+mo('{')+`<mtable columnalign="left"><mtr><mtd>${T}</mtd><mtd>${mi('k')+eq+mi('m')}</mtd></mtr><mtr><mtd>${mn(0)}</mtd><mtd>${mi('k')+mo('≠')+mi('m')}</mtd></mtr></mtable>`);
  const rows=terms.some(v=>v.k===m)?terms:[...terms,{k:m,re:0,im:0}].sort((a,b)=>a.k-b.k);
  $('detect-rows').innerHTML=rows.map(c=>{const match=c.k===m,q=c.k-m,output=F.scale(c,F.basisInner(c.k,m,period));return `<tr class="${match?'matching-row':''}"><th scope="row"><button data-inspect-k="${c.k}" class="coefficient-button" aria-label="k=${c.k}의 내적 계산 보기" aria-pressed="${c.k===detectState.inspectK}">k=${c.k}</button><small>${fmt(c.k/period,3)} Hz</small></th><td>${math(X(c.k)+(c.k===0?times+mn(1):exponent(c.k)))}<small>X<sub>${c.k}</sub> = ${scalar(c)}</small></td><td>${math(X(c.k)+(q===0?times+mn(1):exponent(q)))}<small>${match?'k=m':'k≠m'}</small></td><td>${math(match?X(c.k)+T+eq+zMath(output):mn(0))}<small>${match?'같은 주파수':'직교 → 0'}</small></td></tr>`;}).join('');
  if(!rows.some(v=>v.k===detectState.inspectK))detectState.inspectK=rows[0]?.k??m;
  renderProof();
  const innerLeft=mo('⟨')+mi('x')+wrap(t)+mo(',')+basis(m)+mo('⟩');
  $('detect-sum').innerHTML=math(innerLeft+eq+rows.map(c=>c.k===m?X(m)+T:mn(0)).join(mo('+'))+eq+X(m)+T);
  $('detect-normalize').innerHTML=math(X(m)+eq+frac(X(m)+T,T)+eq+frac(zMath(raw),mn(period))+eq+zMath(z));
  $('detect-inner-value').textContent=scalar(raw);$('detect-coefficient-value').textContent=scalar(z);$('detect-polar').textContent=`${fmt(Math.hypot(z.re,z.im),3)} · ${phase(z)}`;
  $('detect-conclusion').textContent=Math.hypot(z.re,z.im)<1e-9?`X${m}=0이므로 ${fmt(m/period,3)} Hz 성분은 없습니다. 다른 주파수의 성분들은 이 기저와 직교합니다.`:`다른 주파수의 성분들은 내적이 0이 되고, k=${m} 성분에서 X${m}T만 남습니다. T=${fmt(period)}로 나누면 X${m}=${scalar(z)}입니다.`;
 }
 function seriesTerms(){return seriesState.example==='coefficients'?F.example53():F.lecture();}
 function pulseSettings(){return {A:seriesState.A,T:seriesState.T,w:seriesState.D*seriesState.T};}
 function seriesCoefficient(k){const p=pulseSettings();return seriesState.example==='pulse'?{k,re:F.pulseCoefficient(p.A,p.T,p.w,k),im:0}:F.coefficient(seriesTerms(),k);}
 function plotPulseStep(a,A,T,w){
  const lo=-T,hi=T,edges=[];for(let n=-2;n<=2;n++)for(const sign of [-1,1]){const p=n*T+sign*w/2;if(p>lo&&p<hi)edges.push(p);}
  const points=[lo,...new Set(edges.sort((x,y)=>x-y)),hi];let d='';for(let i=0;i<points.length-1;i++){const x1=points[i],x2=points[i+1],y=F.pulseTarget(A,T,w,(x1+x2)/2);d+=`${i?'L':'M'}${a.X(x1)},${a.Y(y)}L${a.X(x2)},${a.Y(y)}`;}
  a.layer.append(el('path',{d,fill:'none',stroke:'#8b9699','stroke-width':1.9,'stroke-dasharray':'6 5'}));
 }
 function renderSpectra(){
  const {k,N,example}=seriesState,K=Math.max(5,Math.abs(k),N),data=Array.from({length:2*K+1},(_,i)=>seriesCoefficient(i-K));
  const max=Math.max(.2,...data.map(z=>Math.hypot(z.re,z.im))),ticks=K<=5?[-5,-3,-1,0,1,3,5]:[-K,-Math.round(K/2),0,Math.round(K/2),K];
  for(const [id,phasePlot] of [['series-amplitude',false],['series-phase',true]]){
   const a=chart(id,{xmin:-K-1,xmax:K+1,xticks:ticks,ymin:phasePlot?-Math.PI*1.3:-.06*max,ymax:phasePlot?Math.PI*1.3:max*1.35,yticks:phasePlot?[-Math.PI,0,Math.PI]:[0,max/2,max],tickY:phasePlot?pi:fmt,xlabel:'k (f = kf₀)',title:phasePlot?'푸리에 계수의 위상 스펙트럼':'푸리에 계수의 크기 스펙트럼'});
   a.layer.append(el('rect',{x:a.X(k)-8,y:a.top,width:16,height:a.h-a.bottom-a.top,fill:'#f6ded7'}));
   data.forEach(z=>{const amplitude=Math.hypot(z.re,z.im);if(phasePlot&&amplitude<1e-9)return;const y=phasePlot?M.principalPhase(z.re,z.im):amplitude;const color=z.k===k?red:Math.abs(z.k)<=N?cyan:'#bfc5b6';a.stem(z.k,y,color,z.k===k?(phasePlot?pi(y):fmt(y,3)):undefined);});
  }
  const period=example==='pulse'?seriesState.T:1;
  $('series-spectrum-note').textContent=`실제 주파수는 kf₀ = k × ${fmt(1/period,3)} Hz입니다. 붉은 표시: 선택한 k=${k}. 진한 막대: |k|≤${N}의 합성 성분. 크기가 0인 계수의 위상은 정의하지 않습니다.`;
 }
 function pulseDerivation(){
  const {A,T:period,w}=pulseSettings(),k=seriesState.k;
  const minusHalf=mo('−')+frac(mi('w'),mn(2)),plusHalf=frac(mi('w'),mn(2)),power=exp(mo('−')+j+mn(2)+mi('π')+mi('k')+frac(t,T));
  const common=math(X('k')+eq+divT+integral(mo('−')+frac(T,mn(2)),frac(T,mn(2)),mi('x')+wrap(t)+power)+eq+frac(mi('A'),T)+integral(minusHalf,plusHalf,power));
  const lines=[common];
  if(k===0){lines.push(math(X(0)+eq+frac(mi('A'),T)+integral(minusHalf,plusHalf,mn(1))+eq+frac(mi('A')+mi('w'),T)+eq+mn(A*w/period)));lines.push('<p>k=0에서는 지수항이 1입니다. X₀는 한 주기의 평균값, 즉 DC 성분입니다.</p>');}
  else{
   const primitive=frac(power,mo('−')+j+mn(2)+mi('π')+frac(mi('k'),T));
   lines.push(math(X('k')+eq+frac(mi('A'),T)+`<msubsup>${row(mo('[')+primitive+mo(']'))}${row(minusHalf)}${row(plusHalf)}</msubsup>`+eq+frac(mi('A'),mi('π')+mi('k'))+mi('sin')+wrap(frac(mi('π')+mi('k')+mi('w'),T))));
   lines.push(math(X(k)+eq+frac(mn(A),mi('π')+wrap(mn(k)))+mi('sin')+wrap(frac(mi('π')+wrap(mn(k))+times+mn(w),mn(period)))+eq+mn(F.pulseCoefficient(A,period,w,k))));
  }
  lines.push(math(X('k')+eq+frac(mi('A')+mi('w'),T)+mi('sinc')+wrap(frac(mi('k')+mi('w'),T))));
  lines.push('<p class="chart-note">sinc(v)=sin(πv)/(πv), sinc(0)=1. 예제 5-5에서는 A=2, T=4, w=2이므로 Xₖ=sinc(k/2)입니다.</p>');
  return lines.join('');
 }
 function series(){
  const {example,A,T:storedT,D,k,N}=seriesState,pulse=example==='pulse',given=example==='coefficients',period=pulse?storedT:1,w=D*storedT,terms=seriesTerms(),z=seriesCoefficient(k);
  $('pulse-controls').hidden=!pulse;$('pulse-a').value=A;$('pulse-period').value=storedT;$('pulse-width').min=storedT*.05;$('pulse-width').max=storedT;$('pulse-width').step=storedT*.01;$('pulse-width').value=w;
  $('pulse-a-value').textContent=fmt(A);$('pulse-period-value').textContent=fmt(storedT)+' s';$('pulse-width-value').textContent=fmt(w,3)+' s';$('pulse-period-note').textContent='중심은 t=0입니다. T를 바꾸면 폭의 비율 w/T를 유지합니다.';
  $('series-k-value').textContent=`k = ${k}`;$('harmonics-value').textContent=`N = ${N}`;
  document.querySelectorAll('[data-k]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.k===k));document.querySelectorAll('[data-n]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.n===N));
  $('series-example-note').textContent=pulse?'152쪽의 예제 5-5에서 시작합니다. A, T, w를 바꾸며 같은 계수 계산식을 적용해 보세요.':given?'150쪽의 예제 5-3입니다. 주어진 Xₖ를 급수에 대입하고 삼각함수의 합으로 나타냅니다.':'154쪽의 신호입니다. 시간 영역의 신호와 진폭·위상 스펙트럼을 연결합니다.';
  $('series-period').textContent=`T = ${fmt(period)} s · f₀ = ${fmt(1/period,3)} Hz`;
  $('series-source-overline').textContent=given?'01 · GIVEN COEFFICIENTS':'01 · TIME DOMAIN';$('series-operation').textContent=given?'02 · SPECTRUM':'02 · ANALYSIS';
  $('series-source-title').textContent=given?'주어진 푸리에 계수':'주기 신호 x(t)';$('series-source').hidden=given;
  $('series-source-equation').innerHTML=pulse?(D===1?math(mi('x')+wrap(t)+eq+mn(A)):math(mi('x')+wrap(t)+eq+mo('{')+`<mtable columnalign="left"><mtr><mtd>${mn(A)}</mtd><mtd>${mo('|')+t+mo('|')+mo('<')+mn(w/2)}</mtd></mtr><mtr><mtd>${mn(0)}</mtd><mtd><mtext>나머지 구간</mtext></mtd></mtr></mtable>`)):given?terms.map(c=>math(X(c.k)+eq+zMath(c))).join(''):math(mi('x')+wrap(t)+eq+mn(1)+mo('+')+mn(2)+mi('cos')+wrap(mn(2)+mi('π')+t+mo('+')+frac(mi('π'),mn(4)))+mo('+')+mi('cos')+wrap(mn(6)+mi('π')+t+mo('−')+frac(mi('π'),mn(3))));
  $('series-source-note').textContent=pulse?`한 주기 [−${fmt(period/2)}, ${fmt(period/2)}]에서 정의한 뒤 T=${fmt(period)} s마다 반복합니다. 펄스가 0이 아닌 구간 [−${fmt(w/2,3)}, ${fmt(w/2,3)}]에서 계수 적분을 계산합니다.`:given?'위에 주어지지 않은 Xₖ는 모두 0입니다. 아래에서 각 계수를 스펙트럼으로 읽고 신호를 합성합니다.':'주파수 분석은 이 신호를 구성하는 각 성분의 계수 Xₖ를 구하는 과정입니다.';
  const bound=pulse?Math.max(1,A*1.35):terms.reduce((s,z)=>s+Math.hypot(z.re,z.im),0)*1.12;
  const plotOptions={xmin:pulse?-period:0,xmax:pulse?period:2*period,xticks:pulse?[-period,-period/2,0,period/2,period]:[0,.5,1,1.5,2],ymin:pulse?-Math.max(.3,A*.3):-bound,ymax:bound,yticks:pulse?[0,A/2,A].filter((v,i,a)=>a.indexOf(v)===i):[-bound,0,bound]};
  if(!given){const src=chart('series-source',{...plotOptions,title:'계수를 구할 원래 주기 신호'});if(pulse)plotPulseStep(src,A,period,w);else src.path(t=>F.signal(terms,t,period).re);}
  $('series-slide').textContent=pulse?'152쪽':given?'150쪽':'154쪽';$('series-coefficient-title').textContent=given?'계수와 스펙트럼 읽기':'푸리에 계수 Xₖ 계산';
  if(pulse)$('series-coefficient-formula').innerHTML=pulseDerivation();
  else if(given)$('series-coefficient-formula').innerHTML=math(X(k)+eq+zMath(z))+`<p>예제에서 주어진 계수입니다. X<sub>${k}</sub>가 주파수 ${k} Hz 성분의 크기와 위상을 결정합니다.</p>`;
  else $('series-coefficient-formula').innerHTML=math(X('k')+eq+generalCoefficient)+sourceEquation(terms)+math(X(k)+eq+frac(X(k)+T,T)+eq+zMath(z))+`<p>02의 직교성과 같은 원리입니다. k=${k} 이외의 성분은 내적이 0이 됩니다.</p>`;
  $('series-coefficient-label').textContent=`선택한 계수 X${k}`;$('series-coefficient-value').textContent=scalar(z);$('series-magnitude').textContent=fmt(Math.hypot(z.re,z.im),3);$('series-phase-value').textContent=phase(z);
  renderSpectra();
  const finiteSum=sigma(mi('k')+eq+mo('−')+mi('N'),mi('N'),X('k')+basis('k'));
  let synthesis=math(mi('x')+wrap(t)+eq+generalSeries)+math(sub('x','N')+wrap(t)+eq+finiteSum);
  if(!pulse){
   const dc=given?6:1,a1=given?4:2,a3=given?2:1;
   synthesis+=math(sub('x','N')+wrap(t)+eq+mn(dc)+(N>=1?mo('+')+mn(a1)+mi('cos')+wrap(mn(2)+mi('π')+t+mo('+')+frac(mi('π'),mn(4))):'')+(N>=3?mo('+')+(a3===1?'':mn(a3))+mi('cos')+wrap(mn(6)+mi('π')+t+mo('−')+frac(mi('π'),mn(3))):''));
  }else synthesis+=math(X('k')+eq+frac(mn(A)+times+mn(w),mn(period))+mi('sinc')+wrap(frac(mi('k')+times+mn(w),mn(period))));
  $('series-synthesis-formula').innerHTML=synthesis;
  const graph=chart('series-plot',{...plotOptions,title:`원래 신호와 −${N}차부터 ${N}차까지의 푸리에 부분합`});
  if(pulse)plotPulseStep(graph,A,period,w);else graph.path(t=>F.signal(terms,t,period).re,'#8b9699',1.8,{dash:'6 5'});
  graph.path(t=>pulse?F.pulseSum(A,period,w,N,t):F.signal(terms,t,period,N).re,ink,2.6,{samples:Math.max(800,N*60)});
  $('series-conclusion').textContent=N===0?'N=0: X₀만 더했으므로 DC 성분만 남습니다.':!pulse&&N>=3?'0이 아닌 계수 X₀, X±₁, X±₃을 모두 포함했습니다. 이 예제에서는 합성한 신호가 원래 x(t)와 같습니다.':`−${N}≤k≤${N}의 항을 더했습니다. ${Math.abs(k)>N?`선택한 X${k}는 아직 이 합에 포함되지 않습니다.`:Math.hypot(z.re,z.im)<1e-9?`X${k}=0이므로 해당 항을 더해도 합은 변하지 않습니다.`:`선택한 X${k}도 이 합에 사용됩니다.`}`;
 }
 function resetDetect(){Object.assign(detectState,{source:'three',T:2,m:2,inspectK:1});$('detect-example').value='three';$('detect-period').value=2;$('detect-m').value=2;detect();}
 function resetSeries(){Object.assign(seriesState,{example:'pulse',A:2,T:4,D:.5,k:1,N:5});$('series-example').value='pulse';$('series-k').value=1;$('harmonics').value=5;series();}
 $('reset-detect').addEventListener('click',resetDetect);$('reset-series').addEventListener('click',resetSeries);
 $('detect-example').addEventListener('change',e=>{detectState.source=e.target.value;detectState.T=e.target.value==='three'?2:1;detectState.inspectK=e.target.value==='three'?1:-1;detect();});
 $('detect-period').addEventListener('input',e=>{detectState.T=+e.target.value;detect();});$('detect-m').addEventListener('input',e=>{detectState.m=+e.target.value;detect();});
 document.querySelectorAll('[data-m]').forEach(b=>b.addEventListener('click',()=>{detectState.m=+b.dataset.m;$('detect-m').value=detectState.m;detect();}));
 $('detect-rows').addEventListener('click',e=>{const b=e.target.closest('[data-inspect-k]');if(b){detectState.inspectK=+b.dataset.inspectK;renderProof();}});
 $('edit-detect-source').addEventListener('click',()=>setTab('synth',true));
 $('series-example').addEventListener('change',e=>{seriesState.example=e.target.value;seriesState.N=e.target.value==='pulse'?5:3;$('harmonics').value=seriesState.N;series();});
 for(const [id,key] of [['pulse-a','A'],['pulse-period','T'],['series-k','k'],['harmonics','N']])$(id).addEventListener('input',e=>{seriesState[key]=+e.target.value;series();});
 $('pulse-width').addEventListener('input',e=>{seriesState.D=+e.target.value/seriesState.T;series();});
 $('pulse-example').addEventListener('click',()=>{seriesState.A=2;seriesState.T=4;seriesState.D=.5;series();});
 for(const key of ['k','n'])document.querySelectorAll(`[data-${key}]`).forEach(b=>b.addEventListener('click',()=>{seriesState[key==='n'?'N':'k']=+b.dataset[key];$(key==='n'?'harmonics':'series-k').value=b.dataset[key];series();}));
 const snapshot=()=>({experiment:state.tab,components:state.parts.map(p=>({...p})),dc:state.dc,detect:{...detectState,T:detectT(),inner:F.inner(currentSource(),detectState.m,detectT()),coefficient:F.coefficient(currentSource(),detectState.m)},series:{...seriesState,w:seriesState.D*seriesState.T,coefficient:seriesCoefficient(seriesState.k)}});
 // Browser tooling controls the same fields as the visible UI; removed experiments are not registered.
 if(document.modelContext?.registerTool){
  const controller=new AbortController(),register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:controller.signal})).catch(()=>{});}catch{}};
  register({name:'read_fourier_experiment',title:'푸리에 실험 상태 읽기',description:'Read synthesis, inner-product and Fourier-series parameters and results.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:snapshot});
  register({name:'configure_fourier_experiment',title:'푸리에 실험 조절',description:'Select a lecture-aligned experiment or change its coefficient index and series order. Does not persist data.',inputSchema:{type:'object',properties:{experiment:{type:'string',enum:['synth','detect','series']},detectExample:{type:'string',enum:['three','lecture','synth']},m:{type:'integer',minimum:-10,maximum:10},seriesExample:{type:'string',enum:['pulse','lecture','coefficients']},k:{type:'integer',minimum:-10,maximum:10},maxHarmonic:{type:'integer',minimum:0,maximum:49}},additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{
   if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Expected an object');
   for(const key of Object.keys(input))if(!['experiment','detectExample','m','seriesExample','k','maxHarmonic'].includes(key))throw Error('Unknown property');
   if(input.experiment!==undefined&&!['synth','detect','series'].includes(input.experiment))throw Error('Unknown experiment');
   if(input.detectExample!==undefined&&!['three','lecture','synth'].includes(input.detectExample))throw Error('Unknown detector example');
   if(input.seriesExample!==undefined&&!['pulse','lecture','coefficients'].includes(input.seriesExample))throw Error('Unknown series example');
   for(const [key,min,max] of [['m',-10,10],['k',-10,10],['maxHarmonic',0,49]])if(input[key]!==undefined&&(!Number.isInteger(input[key])||input[key]<min||input[key]>max))throw Error('Invalid '+key);
   if(input.detectExample!==undefined){detectState.source=input.detectExample;detectState.T=input.detectExample==='three'?2:1;$('detect-example').value=input.detectExample;}
   if(input.m!==undefined){detectState.m=input.m;$('detect-m').value=input.m;}
   if(input.seriesExample!==undefined){seriesState.example=input.seriesExample;$('series-example').value=input.seriesExample;}
   if(input.k!==undefined){seriesState.k=input.k;$('series-k').value=input.k;}
   if(input.maxHarmonic!==undefined){seriesState.N=input.maxHarmonic;$('harmonics').value=input.maxHarmonic;}
   setTab(input.experiment||state.tab);return snapshot();
  }});window.addEventListener('pagehide',()=>controller.abort(),{once:true});
 }
 return {detect,series,snapshot};
})();
