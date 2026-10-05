(function(){
  'use strict';
  const colors=['#007f9f','#c65327','#16816a','#45505b','#6b51a4'];
  const fmt=(x,n=3)=>Number.isFinite(x)?(Math.abs(x)>=1e5?x.toExponential(2):Number(x.toFixed(n)).toString()).replace('-','−'):'—';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function svgNode(tag,attrs={},text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
  let chartIndex=0;
  function plot(host,title,curves,opts={}){
    const w=Math.max(320,Math.min(850,(host.clientWidth||742)-42)),l=57,r=20,b=42,top=24,h=opts.equal?w-l-r+top+b:(opts.height??280);
    const xmin=opts.xmin??-2,xmax=opts.xmax??4;
    const data=curves.map(c=>c.points||Array.from({length:701},(_,i)=>{const x=xmin+(xmax-xmin)*i/700;return [x,c.fn(x)];}));
    const ys=data.flat().map(p=>p[1]).filter(Number.isFinite);let ymin=opts.ymin??Math.min(0,...ys),ymax=opts.ymax??Math.max(0,...ys);
    if(ymax-ymin<.1){ymin-=1;ymax+=1;}else{const pad=(ymax-ymin)*.12;if(opts.ymin===undefined)ymin-=pad;if(opts.ymax===undefined)ymax+=pad;}
    const X=x=>l+(x-xmin)/(xmax-xmin)*(w-l-r),Y=y=>top+(ymax-y)/(ymax-ymin)*(h-top-b);
    const card=document.createElement('article');card.className='ss-plot';const hd=document.createElement('h3');hd.textContent=title;card.append(hd);
    const svg=svgNode('svg',{viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':title});svg.append(svgNode('title',{},title));
    const clipId='ss-clip-'+(++chartIndex),defs=svgNode('defs'),clip=svgNode('clipPath',{id:clipId});clip.append(svgNode('rect',{x:l,y:top,width:w-l-r,height:h-top-b}));defs.append(clip);svg.append(defs);
    const tick=(v,a,z,N)=>a+(z-a)*v/N;
    for(let j=0;j<=4;j++){const y=tick(j,ymin,ymax,4);svg.append(svgNode('line',{x1:l,x2:w-r,y1:Y(y),y2:Y(y),stroke:'#e0e7ee'}),svgNode('text',{x:l-8,y:Y(y)+4,'text-anchor':'end'},fmt(y,2)));}
    for(let j=0;j<=6;j++){const x=tick(j,xmin,xmax,6);svg.append(svgNode('line',{x1:X(x),x2:X(x),y1:top,y2:h-b,stroke:'#edf1f5'}),svgNode('text',{x:X(x),y:h-b+20,'text-anchor':'middle'},fmt(x,2)));}
    if(ymin<=0&&ymax>=0)svg.append(svgNode('line',{x1:l,x2:w-r,y1:Y(0),y2:Y(0),stroke:'#94a5b4'}));
    if(xmin<=0&&xmax>=0)svg.append(svgNode('line',{x1:X(0),x2:X(0),y1:top,y2:h-b,stroke:'#94a5b4'}));
    svg.append(svgNode('text',{x:w-r,y:h-4,'text-anchor':'end'},opts.xlabel||'t (s)'),svgNode('text',{x:l,y:15},opts.ylabel||'진폭'));
    const layer=svgNode('g',{'clip-path':`url(#${clipId})`});svg.append(layer);
    if(opts.roc?.type==='right')layer.append(svgNode('rect',{x:X(opts.roc.edge),y:top,width:Math.max(0,X(xmax)-X(opts.roc.edge)),height:h-top-b,fill:'#44bbaa',opacity:.13}));
    if(opts.roc?.type==='outside'){let d=`M${l},${top}H${w-r}V${h-b}H${l}Z`;for(let i=0;i<=180;i++){const a=2*Math.PI*i/180;d+=(i?'L':'M')+X(opts.roc.radius*Math.cos(a))+','+Y(opts.roc.radius*Math.sin(a));}d+='Z';layer.append(svgNode('path',{d,fill:'#44bbaa',opacity:.13,'fill-rule':'evenodd'}));}
    curves.forEach((c,i)=>{const color=c.color||colors[i%colors.length],ps=data[i];if(c.area){let d=`M${X(xmin)},${Y(0)}`;ps.forEach(([x,y])=>{if(Number.isFinite(y))d+=`L${X(x)},${Y(y)}`;});d+=`L${X(xmax)},${Y(0)}Z`;layer.append(svgNode('path',{d,fill:color,opacity:.12}));}
      if(c.stems){ps.forEach(([x,y])=>{if(!Number.isFinite(y))return;layer.append(svgNode('line',{x1:X(x),x2:X(x),y1:Y(0),y2:Y(y),stroke:color,'stroke-width':2}),svgNode('circle',{cx:X(x),cy:Y(y),r:3.5,fill:color}));if(c.impulses&&y!==0){const dy=y>0?7:-7;layer.append(svgNode('path',{d:`M${X(x)-5},${Y(y)+dy}L${X(x)},${Y(y)}L${X(x)+5},${Y(y)+dy}`,fill:'none',stroke:color,'stroke-width':2}));}});
      }else{let d='',pen=false;ps.forEach(([x,y])=>{if(!Number.isFinite(y)){pen=false;return;}d+=(pen?'L':'M')+X(x).toFixed(2)+','+Y(y).toFixed(2);pen=true;});layer.append(svgNode('path',{d,fill:'none',stroke:color,'stroke-width':c.width||2.6,'stroke-dasharray':c.dash||'','stroke-linejoin':'round'}));}
    });
    if(opts.marker!==undefined){layer.append(svgNode('line',{x1:X(opts.marker),x2:X(opts.marker),y1:top,y2:h-b,stroke:'#566a7a','stroke-dasharray':'4 4'}));}
    for(const m of opts.landmarks||[]){layer.append(svgNode('line',{x1:X(m.x),x2:X(m.x),y1:top,y2:h-b,stroke:m.color,'stroke-dasharray':'3 5',opacity:.6}),svgNode('circle',{cx:X(m.x),cy:Y(m.y),r:4,fill:m.color}),svgNode('text',{x:X(m.x)+7,y:Y(m.y)-9,style:`fill:${m.color};font-weight:700`},m.label));}
    card.append(svg);const legend=document.createElement('div');legend.className='ss-legend';curves.forEach((c,i)=>{const s=document.createElement('span');s.innerHTML=`<i style="background:${c.color||colors[i%colors.length]}"></i>${esc(c.name||'신호')}`;legend.append(s);});card.append(legend);host.append(card);return {svg,layer,X,Y};
  }
  function lab(root,config){
    root.classList.add('ss-lab');let current=0,s={},frame=null,last=0;
    root.innerHTML=`<nav class="ss-tabs" role="tablist" aria-label="${esc(config.title)}"></nav><div class="ss-workspace"><aside class="ss-controls"></aside><div class="ss-panels"></div></div>`;
    const nav=root.querySelector('.ss-tabs'),controls=root.querySelector('.ss-controls'),panelHost=root.querySelector('.ss-panels');
    const tabs=config.tabs;const uid=root.id||'ss';
    const panels=tabs.map((t,i)=>{const p=document.createElement('div');p.className='ss-results';p.id=`${uid}-panel-${i}`;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',`${uid}-tab-${i}`);p.hidden=i!==0;panelHost.append(p);return p;});let results=panels[0];
    function stop(){if(frame!==null)cancelAnimationFrame(frame);frame=null;const b=controls.querySelector('[data-play]');if(b){b.textContent='시간 재생';b.setAttribute('aria-pressed','false');}}
    const api={plot:(title,c,o)=>plot(results,title,c,o),note:(title,body)=>{const d=document.createElement('div');d.className='ss-note';d.innerHTML=`<strong>${title}</strong><p>${body}</p>`;results.append(d);},stats:items=>{const d=document.createElement('div');d.className='ss-stats';d.innerHTML=items.map(([k,v])=>`<div><span>${k}</span><strong>${v}</strong></div>`).join('');results.append(d);},html:html=>{const d=document.createElement('div');d.className='ss-copy';d.innerHTML=html;results.append(d);},fmt,colors,root};
    function render(){results.replaceChildren();const t=tabs[current];t.draw(s,api);controls.querySelectorAll('output').forEach(o=>o.textContent=fmt(s[o.dataset.key])+ (o.dataset.unit||''));}
    function mount(idx){stop();current=idx;results=panels[idx];panels.forEach((p,i)=>p.hidden=i!==idx);const t=tabs[idx];s={...t.defaults};nav.querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-selected',i===idx);b.tabIndex=i===idx?0:-1;});results.id=`${uid}-panel-${idx}`;results.setAttribute('aria-labelledby',`${uid}-tab-${idx}`);results.setAttribute('tabindex','0');
      controls.innerHTML=`<div class="ss-control-head"><h3>파라미터</h3><button type="button" data-reset>초기화</button></div><p class="ss-prompt">${t.prompt}</p>`;
      for(const c of t.controls){const id=`${uid}-${idx}-${c.key}`,div=document.createElement('div');div.className='ss-control';if(c.type==='select'){div.innerHTML=`<label for="${id}">${c.label}</label><select id="${id}" data-key="${c.key}">${c.options.map(([v,k])=>`<option value="${v}" ${s[c.key]===v?'selected':''}>${k}</option>`).join('')}</select>`;}else{div.innerHTML=`<label for="${id}">${c.label}<output for="${id}" data-key="${c.key}" data-unit="${c.unit||''}"></output></label><input id="${id}" data-key="${c.key}" type="range" min="${c.min}" max="${c.max}" step="${c.step||.1}" value="${s[c.key]}"><div class="ss-ends"><span>${c.min}${c.unit||''}</span><span>${c.max}${c.unit||''}</span></div>`;}controls.append(div);}
      if(t.animate){const b=document.createElement('button');b.type='button';b.dataset.play='';b.className='ss-play';b.textContent='시간 재생';b.setAttribute('aria-pressed','false');b.onclick=()=>{if(frame!==null){stop();return;}last=0;b.textContent='일시 정지';b.setAttribute('aria-pressed','true');const c=t.controls.find(c=>c.key===t.animate);function tick(now){if(document.hidden){stop();return;}if(last){s[t.animate]+=Math.min(.1,(now-last)/1000);if(s[t.animate]>c.max)s[t.animate]=c.min;const input=controls.querySelector(`input[data-key="${t.animate}"]`);input.value=s[t.animate];render();}last=now;frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);};controls.append(b);}
      controls.querySelector('[data-reset]').onclick=()=>mount(current);render();}
    tabs.forEach((t,i)=>{const b=document.createElement('button');b.id=`${uid}-tab-${i}`;b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-controls',`${uid}-panel-${i}`);b.textContent=t.name;b.onclick=()=>mount(i);b.onkeydown=e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();mount(n);nav.children[n].focus();};nav.append(b);});
    controls.addEventListener('input',e=>{const k=e.target.dataset.key;if(!k)return;stop();s[k]=e.target.tagName==='SELECT'?e.target.value:Number(e.target.value);if(tabs[current].change)tabs[current].change(s,k,controls);render();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});let resize;window.addEventListener('resize',()=>{clearTimeout(resize);resize=setTimeout(render,120);});mount(0);root.ssLab={state:()=>({...s}),select:mount,render,stop};
  }
  window.SSUI={lab,plot,fmt,colors};
})();
