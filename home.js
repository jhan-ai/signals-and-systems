'use strict';
const svg=document.getElementById('preview');
const make=(tag,attrs,text)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text)e.textContent=text;svg.append(e);return e;};
for(const y of [43,83,123])make('line',{x1:44,x2:568,y1:y,y2:y,stroke:y===83?'#bdcdd9':'#e0e9ef'});
for(let i=0;i<=4;i++){const x=44+i*131;make('line',{x1:x,x2:x,y1:30,y2:135,stroke:'#e0e9ef'});make('text',{x,y:158,'text-anchor':'middle'},String(i/2));}
make('text',{x:8,y:22},'x(t)');make('text',{x:568,y:180,'text-anchor':'end'},'t (s)');
const waves=[t=>Math.cos(2*Math.PI*t),t=>.5*Math.cos(6*Math.PI*t+Math.PI/2),t=>Math.cos(2*Math.PI*t)+.5*Math.cos(6*Math.PI*t+Math.PI/2)];
waves.forEach((f,j)=>{let d='';for(let i=0;i<=1000;i++)d+=(i?'L':'M')+(44+i/1000*524).toFixed(2)+','+(83-f(i/500)*30).toFixed(2);make('path',{d,fill:'none',stroke:['#007f9f','#c65327','#45505b'][j],'stroke-width':j===2?2.8:1.6,opacity:j===2?1:.45});});
make('text',{x:8,y:214},'A');make('line',{x1:44,x2:568,y1:288,y2:288,stroke:'#bdcdd9'});
for(let f=0;f<=5;f++)make('text',{x:44+f*100,y:311,'text-anchor':'middle'},String(f));
for(const [f,a,c]of[[1,1,'#007f9f'],[3,.5,'#c65327']]){const x=44+f*100,y=288-a*61;make('line',{x1:x,x2:x,y1:288,y2:y,stroke:c,'stroke-width':3});make('circle',{cx:x,cy:y,r:5,fill:c});make('text',{x,y:y-12,'text-anchor':'middle',style:'fill:'+c,'font-weight':650},String(a));}
make('text',{x:595,y:311,'text-anchor':'end'},'f (Hz)');
const cv=document.getElementById('convolution-preview');
const add=(tag,attrs,text)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text)e.textContent=text;cv.append(e);return e;};
const X=t=>70+t*200;
add('rect',{x:X(.5),y:57,width:100,height:58,fill:'#16816a','fill-opacity':'.15'});
add('line',{x1:40,x2:568,y1:115,y2:115,stroke:'#bdcdd9'});
add('path',{d:`M40 115H${X(0)}V57H${X(1)}V115H568`,stroke:'#007f9f','stroke-width':3,fill:'none'});
add('path',{d:`M40 115H${X(.5)}V57H${X(1.5)}V115H568`,stroke:'#c65327','stroke-width':2.5,fill:'none','stroke-dasharray':'7 4'});
add('text',{x:45,y:28,style:'fill:#007f9f'},'x(τ)');add('text',{x:440,y:28,style:'fill:#c65327'},'h(1.5 − τ)');
for(const t of [0,.5,1,1.5,2])add('text',{x:X(t),y:141,'text-anchor':'middle'},String(t));
add('text',{x:578,y:164,'text-anchor':'end'},'τ (s)');
add('line',{x1:40,x2:568,y1:280,y2:280,stroke:'#bdcdd9'});
add('path',{d:`M40 280H${X(0)}L${X(1)} 205L${X(2)} 280H568`,stroke:'#45505b','stroke-width':3,fill:'none'});
add('line',{x1:X(1.5),x2:X(1.5),y1:191,y2:280,stroke:'#007f9f','stroke-dasharray':'4 4'});
add('circle',{cx:X(1.5),cy:242.5,r:5,fill:'#007f9f'});add('text',{x:X(1.5)+13,y:231,style:'fill:#007f9f'},'y(1.5) = 0.5');
add('text',{x:10,y:206},'y(t)');for(const t of [0,1,2])add('text',{x:X(t),y:307,'text-anchor':'middle'},String(t));add('text',{x:578,y:307,'text-anchor':'end'},'t (s)');
// Lecture extensions share the existing cream / slate / red visual language.
document.querySelectorAll('[data-lesson-preview]').forEach(svg=>{
 const kind=svg.dataset.lessonPreview,NS='http://www.w3.org/2000/svg';
 const add=(tag,a,t)=>{const e=document.createElementNS(NS,tag);Object.entries(a).forEach(([k,v])=>e.setAttribute(k,v));if(t)e.textContent=t;svg.append(e);};
 const axis=(y,label)=>{add('line',{x1:42,x2:565,y1:y,y2:y,stroke:'#c9cbbc'});add('text',{x:42,y:y-74},label);};
 const stem=(xs,ys,ybase,color)=>xs.forEach((x,i)=>{add('line',{x1:x,x2:x,y1:ybase,y2:ybase-ys[i]*42,stroke:color,'stroke-width':2.5});add('circle',{cx:x,cy:ybase-ys[i]*42,r:4,fill:color});});
 const curve=(f,ybase,color)=>{let d='';for(let i=0;i<=520;i++)d+=(i?'L':'M')+(42+i)+','+(ybase-42*f(i/520));add('path',{d,fill:'none',stroke:color,'stroke-width':2.5});};
 if(kind==='discrete'){axis(115,'샘플링: x(t)에서 x[n]으로');curve(t=>Math.cos(6*Math.PI*t),115,'#c4c2ae');stem(Array.from({length:13},(_,i)=>42+i*43.3),Array.from({length:13},(_,i)=>Math.cos(Math.PI*i/2)),115,'#007f9f');add('text',{x:42,y:220},'시간은 이산화하고, 샘플값을 기록합니다.');}
 else if(kind==='dtfs'){axis(105,'시간 영역: N개의 샘플');stem(Array.from({length:16},(_,i)=>48+i*33),Array.from({length:16},(_,i)=>i%8<3?1:0),105,'#007f9f');axis(235,'주파수 영역: N개의 계수');const c=LectureMath.dtfs([1,1,1,0,0,0,0,0]);stem(Array.from({length:16},(_,i)=>48+i*33),Array.from({length:16},(_,i)=>LectureMath.abs(c[i%8])*2),235,'#c65327');}
 else if(kind==='discrete-systems'){axis(110,'x[k]와 h[n−k]의 곱');stem(Array.from({length:9},(_,i)=>60+i*55),[0,0,1,2,1,0,0,0,0],110,'#007f9f');axis(240,'곱을 더한 결과 y[n]');stem(Array.from({length:9},(_,i)=>60+i*55),[0,0,.4,1.2,1.6,1.2,.4,0,0],240,'#c65327');}
 else{axis(115,'시간 영역: 진폭 변조');curve(t=>Math.exp(-Math.abs(t-.5)*7)*Math.cos(60*t),115,'#007f9f');axis(240,'주파수 영역: 두 대역으로 이동');curve(t=>.85/(1+((t-.28)*25)**2)+.85/(1+((t-.72)*25)**2),240,'#c65327');}
});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 let count=0;document.querySelectorAll('.lab-card').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.domain!==button.dataset.filter;if(!card.hidden)count++;});
 document.querySelector('.home-count').textContent=count+'개 실험실';
}));
