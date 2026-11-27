(function(){
  'use strict';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=(n,d=3)=>Number.isFinite(n)?String(Number(n.toFixed(d))).replace('-','−'):'—';
  const row=(label,key,min,max,step=1,unit='')=>({label,key,min,max,step,unit});
  const select=(label,key,options)=>({label,key,options});
  const eq=s=>`<div class="lesson-equation">${s}</div>`;
  const table=(heads,rows)=>`<div class="table-wrap"><table><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  function mount(config){
    const root=document.getElementById('lesson');let state={},index=-1,latest={};
    root.innerHTML='<nav class="lesson-tabs" role="tablist" aria-label="실험 선택"></nav><div class="lesson-intro"></div><div class="lesson-workspace"><aside class="lesson-controls" aria-label="실험 조건"></aside><section class="lesson-results" role="tabpanel" tabindex="0"></section></div>';
    const tabs=root.querySelector('nav'),intro=root.querySelector('.lesson-intro'),controls=root.querySelector('aside'),results=root.querySelector('section');
    const api={fmt,eq,table,plot:(title,curves,options={})=>{const width=(window.innerWidth>1050?(results.clientWidth-16)/2:results.clientWidth)-22;const discrete=/^(n|k)( |$)|샘플 개수/.test(options.xlabel||'');if(discrete&&options.xmin!==undefined){const step=Math.max(1,Math.ceil((options.xmax-options.xmin)/6));options.xticks=Array.from({length:Math.floor((options.xmax-options.xmin)/step)+1},(_,i)=>options.xmin+i*step);}const p=SSUI.plot(results,title,curves,{height:245,width:width>0?width:700,...options});p.svg.setAttribute('role','img');p.svg.setAttribute('aria-label',title);curves.forEach((c,i)=>{if(c.hideLegend)p.svg.parentElement.querySelectorAll('.ss-legend span')[i]?.setAttribute('hidden','');});return p;},note:(title,text)=>{const d=document.createElement('article');d.className='lesson-note';d.innerHTML=`<h3>${title}</h3><p>${text}</p>`;results.append(d);},html:(html,cls='')=>{const d=document.createElement('article');d.className='lesson-copy '+cls;d.innerHTML=html;results.append(d);},stats:items=>{const d=document.createElement('div');d.className='lesson-stats';d.innerHTML=items.map(([label,v])=>`<div><span>${label}</span><strong>${v}</strong></div>`).join('');results.append(d);},snapshot:v=>latest=v};
    function render(){
      const t=config.tabs[index];if(t.normalize)t.normalize(state);
      controls.querySelectorAll('[data-key]').forEach(e=>{const c=t.controls.find(c=>c.key===e.dataset.key);if(typeof c.max==='function')e.max=c.max(state);e.value=state[c.key];e.closest('.lesson-control').hidden=c.when?!c.when(state):false;});
      controls.querySelectorAll('output').forEach(o=>o.textContent=fmt(state[o.dataset.output])+ (o.dataset.unit||''));
      results.replaceChildren();latest={};t.draw(state,api);
    }
    function choose(i,update=true){
      if(i<0||i>=config.tabs.length)i=0;index=i;const t=config.tabs[i];state={...t.defaults};
      tabs.querySelectorAll('button').forEach((b,j)=>{b.setAttribute('aria-selected',String(j===i));b.tabIndex=j===i?0:-1;b.setAttribute('aria-controls','lesson-panel');});
      results.id='lesson-panel';results.setAttribute('aria-labelledby','tab-'+t.id);
      intro.innerHTML=`<div><h2>${t.title}</h2><p>${t.goal}</p></div><button type="button" class="lesson-export">그래프 SVG 저장</button>`;
      intro.querySelector('button').onclick=exportGraphs;
      controls.innerHTML='<div class="lesson-control-head"><h3>직접 바꿔보기</h3><button type="button" data-reset>초기화</button></div>';
      for(const c of t.controls){const id='control-'+c.key;const d=document.createElement('div');d.className='lesson-control';
        d.innerHTML=`<label for="${id}">${c.label}${c.options?'':`<output for="${id}" data-output="${c.key}" data-unit="${c.unit||''}"></output>`}</label>`+(c.options?`<select id="${id}" data-key="${c.key}">${c.options.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select>`:`<input id="${id}" data-key="${c.key}" type="range" min="${c.min}" max="${typeof c.max==='function'?c.max(state):c.max}" step="${c.step}" value="${state[c.key]}">`);controls.append(d);
      }
      if(t.presets){const d=document.createElement('div');d.className='lesson-presets';d.innerHTML='<h3>추천 실험</h3>';t.presets.forEach(p=>{const b=document.createElement('button');b.type='button';b.textContent=p.name;b.onclick=()=>{state={...t.defaults,...p.values};render();};d.append(b);});controls.append(d);}
      const guide=document.createElement('p');guide.className='lesson-hint';guide.textContent=t.hint;controls.append(guide);
      controls.querySelector('[data-reset]').onclick=()=>{state={...t.defaults};render();};render();
      if(update){try{history.replaceState(null,'','#'+t.id);}catch{/* Local file previews may disallow history updates. */}}
      document.title=t.title+' · '+config.title+' · 신호 및 시스템 실험실';
    }
    config.tabs.forEach((t,i)=>{const b=document.createElement('button');b.id='tab-'+t.id;b.type='button';b.textContent=t.name;b.setAttribute('role','tab');b.setAttribute('aria-controls','panel-'+t.id);b.onclick=()=>choose(i);b.onkeydown=e=>{let j=i;if(e.key==='ArrowRight')j=(i+1)%config.tabs.length;else if(e.key==='ArrowLeft')j=(i+config.tabs.length-1)%config.tabs.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=config.tabs.length-1;else return;e.preventDefault();choose(j);tabs.children[j].focus();};tabs.append(b);});
    controls.addEventListener('input',e=>{if(e.target.dataset.key){state[e.target.dataset.key]=e.target.tagName==='SELECT'?e.target.value:Number(e.target.value);render();}});
    function route(){const i=config.tabs.findIndex(t=>t.id===location.hash.slice(1));if(i>=0)choose(i,false);else if(index<0)choose(0,false);}
    window.addEventListener('hashchange',route);
    function exportGraphs(){
      const svgs=[...results.querySelectorAll('svg')];const NS='http://www.w3.org/2000/svg';const out=document.createElementNS(NS,'svg');out.setAttribute('viewBox',`0 0 760 ${svgs.length*350+60}`);out.setAttribute('width','760');out.setAttribute('height',String(svgs.length*350+60));
      const bg=document.createElementNS(NS,'rect');bg.setAttribute('width','100%');bg.setAttribute('height','100%');bg.setAttribute('fill','#fffddf');out.append(bg);
      const title=document.createElementNS(NS,'text');title.setAttribute('x','24');title.setAttribute('y','32');title.setAttribute('font-size','20');title.textContent=config.tabs[index].title;out.append(title);
      svgs.forEach((svg,i)=>{const label=document.createElementNS(NS,'text');label.setAttribute('x','24');label.setAttribute('y',String(70+i*350));label.setAttribute('font-size','18');label.textContent=svg.getAttribute('aria-label');out.append(label);const clone=svg.cloneNode(true);clone.setAttribute('class','plot-export');clone.setAttribute('x','20');clone.setAttribute('y',String(85+i*350));clone.setAttribute('width','720');clone.setAttribute('height','270');out.append(clone);const legend=svg.parentElement.querySelector('.ss-legend');if(legend){const text=document.createElementNS(NS,'text');text.setAttribute('x','30');text.setAttribute('y',String(370+i*350));text.setAttribute('font-size','14');text.textContent=[...legend.querySelectorAll('span:not([hidden])')].map(e=>e.textContent).join(' · ');out.append(text);}});
      const style=document.createElementNS(NS,'style');style.textContent='text{font-family:system-ui,sans-serif;fill:#45505b}.plot-export text{font-size:14px}';out.prepend(style);
      const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(out)],{type:'image/svg+xml;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=config.slug+'-'+config.tabs[index].id+'.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
    }
    let resize;window.addEventListener('resize',()=>{clearTimeout(resize);resize=setTimeout(render,120);});route();window.LectureLab={select:choose,state:()=>({...state}),snapshot:()=>latest,render,config};
  }
  window.LectureUI={mount,row,select,eq,table,fmt,esc};
})();
