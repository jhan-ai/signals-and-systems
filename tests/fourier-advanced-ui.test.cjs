'use strict';
const {JSDOM,VirtualConsole}=require('jsdom'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.cause?.stack||e.message));
 const dom=await JSDOM.fromFile(path.join(__dirname,'../fourier/index.html'),{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc});
 await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));const w=dom.window,d=w.document,$=id=>d.getElementById(id);let checks=0;
 const ok=(v,m)=>{checks++;assert.ok(v,m);},click=id=>$(id).click(),input=(id,v,event='input')=>{$(id).value=v;$(id).dispatchEvent(new w.Event(event,{bubbles:true}));};
 const valid=()=>{ok(!/NaN|Infinity|undefined/.test(d.body.textContent),'finite labels');ok([...d.querySelectorAll('svg path')].every(e=>!/NaN|Infinity/.test(e.getAttribute('d'))),'finite paths');const ids=[...d.querySelectorAll('[id]')].map(e=>e.id);ok(new Set(ids).size===ids.length,'unique IDs');};
 click('tab-pair');ok(!$('panel-pair').hidden,'panel accessible');
 ok($('pair-plane').querySelector('svg'),'complex plane rendered');const before=$('pair-plane').innerHTML;
 input('pair-time',.25);ok($('pair-plane').innerHTML!==before,'time rotates pair');input('pair-a',0);ok($('pair-bilateral-note').textContent.includes('정의하지'),'zero phase undefined');valid();
 for(const k of [1,5]){input('pair-k',k);input('pair-a',3);input('pair-phase',-12);valid();}
 click('pair-play');ok($('pair-play').getAttribute('aria-pressed')==='true','pair starts');click('tab-detect');ok($('pair-play').getAttribute('aria-pressed')==='false','tab stops animation');
 ok(!$('detect-complex').hidden&&$('detect-real').hidden,'complex default');ok($('extract-final').textContent==='0.707 + j0.707','lecture X1');
 input('extract-m',-1);ok($('extract-final').textContent==='0.707 − j0.707','negative conjugate');input('extract-m',0);ok($('extract-final').textContent==='1 + j0','DC');
 input('extract-m',2);ok($('extract-final').textContent==='0 + j0','missing coefficient');input('extract-progress',.25);ok($('extract-current').textContent!=='0 + j0','partial interval not orthogonal');input('extract-progress',0);ok($('extract-current').textContent==='0 + j0','zero elapsed integral');input('extract-progress',1);ok($('extract-current').textContent==='0 + j0','one period cancels');valid();
 click('extract-play');ok($('extract-play').getAttribute('aria-pressed')==='true','integration plays');click('mode-real');ok($('extract-play').getAttribute('aria-pressed')==='false'&&!$('detect-real').hidden,'mode stops animation and preserves real detector');input('probe',3);ok($('measure-f').textContent.includes('3'),'legacy detector responds');
 click('mode-complex');input('extract-source','synth','change');click('extract-edit');ok(!$('panel-synth').hidden,'edit source navigation');input('dc',1.5);click('tab-detect');input('extract-m',0);ok($('extract-final').textContent==='1.5 + j0','synthesis source DC linked');
 click('reset-extract');ok($('extract-final').textContent==='0.707 + j0.707','extraction reset');
 click('tab-series');ok($('waveform').value==='pulse'&&!$('pulse-controls').hidden,'pulse default');ok($('series-conclusion').textContent.includes('X₀ = Aw/T = 1'),'lecture pulse mean');
 input('pulse-width',1);ok(w.FourierAdvanced.snapshot().pulse.D===.25,'pulse width');ok($('series-conclusion').textContent.includes('k = T/w = 4'),'sinc zeros move');input('pulse-period',8);ok(+$('pulse-width').value===2,'period preserves duty ratio');
 $('pulse-dc').checked=false;$('pulse-dc').dispatchEvent(new w.Event('change',{bubbles:true}));ok($('series-detail').textContent.includes('평균값을 뺍니다'),'DC removal explained');
 const edge=$('series-plot').querySelector('[data-pulse-edge="1"]');edge.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));ok(w.FourierAdvanced.snapshot().pulse.D===.26,'keyboard width drag');ok(d.activeElement.dataset.pulseEdge==='1','keyboard focus preserved');
 // Pointer drag is dispatched through the persistent host while the SVG is redrawn.
 const svg=$('series-plot').querySelector('svg');svg.getBoundingClientRect=()=>({left:0,width:600});
 $('series-plot').querySelector('[data-pulse-edge="1"]').dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,clientX:380.375}));
 ok(Math.abs(w.FourierAdvanced.snapshot().pulse.D-.5)<1e-9,'pointer drag sets pulse width');
 $('series-plot').dispatchEvent(new w.MouseEvent('pointerup',{bubbles:true}));
 input('pulse-width',8);ok($('series-conclusion').textContent.includes('상수 신호'),'full duty');input('pulse-a',0);ok($('series-conclusion').textContent.includes('모든 계수가 0'),'zero pulse');valid();
 for(const shape of ['square','triangle','saw']){input('waveform',shape,'change');ok($('pulse-controls').hidden&&$('pulse-phase-card').hidden,'legacy controls '+shape);input('harmonics',49);input('fundamental',3);valid();}
 click('reset-series');ok($('waveform').value==='pulse'&&+$('harmonics').value===5&&w.FourierAdvanced.snapshot().pulse.A===2,'reset restores pulse');
 $('tab-series').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));ok($('tab-synth').getAttribute('aria-selected')==='true','four tab keyboard wrap');$('tab-synth').dispatchEvent(new w.KeyboardEvent('keydown',{key:'End',bubbles:true}));ok($('tab-series').getAttribute('aria-selected')==='true','End navigates series');valid();
 ok(errors.length===0,JSON.stringify(errors));dom.window.close();console.log(`Fourier advanced UI passed (${checks} checks)`);
})().catch(e=>{console.error(e);process.exitCode=1;});
