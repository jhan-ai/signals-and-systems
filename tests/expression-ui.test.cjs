'use strict';
const {JSDOM,VirtualConsole}=require('jsdom'),assert=require('node:assert/strict'),path=require('node:path');
let checks=0;const errors=[];
function ok(v,m){checks++;assert.ok(v,m);}
(async()=>{
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=await JSDOM.fromFile(path.join(__dirname,'../convolution/index.html'),{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 const w=dom.window,d=w.document,$=id=>d.getElementById(id);
 const click=id=>$(id).click(),input=(id,v)=>{$(id).value=String(v);$(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
 const submit=()=>$('expression-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const checkPlots=()=>{for(const id of ['overlap-plot','product-plot','output-plot'])ok($(id).querySelector('svg'),'plot exists '+id);ok(!/NaN|Infinity/.test([...d.querySelectorAll('svg path')].map(p=>p.getAttribute('d')).join('')),'finite SVG paths');};
 ok($('expression-panel').hidden,'presets default');const old=$('output-value').textContent;
 click('mode-expression');ok(!$('expression-panel').hidden&&$('preset-panel').hidden,'expression mode');ok($('output-value').textContent!==old,'new result');ok($('output-title').textContent.includes('구간'),'finite result label');checkPlots();
 input('expression-x','u(t-1)-u(t-3)');input('expression-h','u(t+1)-u(t-1)');ok($('expression-status').textContent.includes('함수 적용'),'draft state');submit();input('time',2);ok(Math.abs(Number($('output-value').textContent)-2)<1e-4,'shifted pulse exact peak');checkPlots();
 const before=$('output-value').textContent;click('swap');ok($('output-value').textContent===before,'swap finite pulses');
 input('expression-x','alert(1)');submit();ok($('expression-x').getAttribute('aria-invalid')==='true','invalid expression field');ok(!$('expression-x-error').hidden,'visible parser error');ok($('output-value').textContent===before,'keep last valid result');
 input('expression-x','1/t');submit();ok(!$('expression-error').hidden,'reject singularity');ok($('output-value').textContent===before,'keep result on domain error');
 input('expression-x','(t-1)u(t)');input('expression-h','e^(-t)');submit();ok($('integration-warning').classList.contains('calculation-warning'),'tail warning');checkPlots();
 input('integral-a',10);input('integral-b',-10);submit();ok(!$('expression-error').hidden,'invalid bounds');
 input('integral-a',-10);input('integral-b',10);input('expression-h','e^(-t)u(t)');submit();ok($('expression-error').hidden,'clear domain error');ok(!$('integration-warning').classList.contains('calculation-warning'),'causal result stable');
 click('show-flip');checkPlots();click('play');ok($('play').getAttribute('aria-pressed')==='true','play expression');click('play');ok($('play').getAttribute('aria-pressed')==='false','stop expression');
 input('time',-1);ok(Number($('output-value').textContent)===0,'negative causal time');
 click('mode-preset');ok($('expression-panel').hidden&&!$('preset-panel').hidden,'return to presets');ok($('output-title').textContent==='출력 y(t)','restore exact label');ok($('time').min==='-1','restore time range');checkPlots();
 $('preset').value='filter';$('preset').dispatchEvent(new w.Event('change',{bubbles:true}));ok($('h-kind').value==='exp','load old preset');
 click('mode-expression');ok($('expression-h').value==='e^(-t)u(t)','preserve typed expression');click('reset');ok($('expression-panel').hidden&&$('preset').value==='rectangles','reset to initial preset');ok($('output-value').textContent==='0.750','reset exact value');
 ok(errors.length===0,JSON.stringify(errors));dom.window.close();console.log(JSON.stringify({status:'passed',checks,scriptErrors:errors},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
