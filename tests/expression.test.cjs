'use strict';
const assert=require('node:assert/strict');
require('../convolution/expression.js');
const E=global.SignalExpression;let checks=0;
function near(actual,expected,tol=1e-8){checks++;assert.ok(Math.abs(actual-expected)<=tol*(1+Math.abs(expected)),`${actual} != ${expected}`);}
function throws(fn){checks++;assert.throws(fn);}
for(const [s,t,v] of [['(t-1)u(t)',2,1],['(t-1)u(t)',-1,0],['2sin(pi*t)',.5,2],['e^(-t)',2,Math.exp(-2)],['-t^2',2,-4],['(-t)^2',2,4],['2^3^2',0,512],['t^-2',2,.25],['2e',0,2*Math.E],['1e-3*t',2,.002],['sinc(t)',0,1],['r(t-2)',1,0],['rect(t)',.6,0],['2(t+1)(t-1)',3,16],['u(−t)',-2,1]])near(E.compile(s).value(t),v);
for(const s of ['', 'x(t)=t', 'alert(1)', 't.constructor', 'this', 't;1', 'u(', 'sin t','2**3', 't,1', '1e999', 'delta(t)', 'j*t','('.repeat(40)+'t'+')'.repeat(40)])throws(()=>E.compile(s));
throws(()=>E.compile('1/t').validate(-1,1));throws(()=>E.compile('1/(t-1)^2').validate(0,2));throws(()=>E.compile('t^-2').validate(-1,1));throws(()=>E.compile('sqrt(t)').validate(-1,1));
const opts={a:-10,b:10,start:-2,end:8};
const causal=E.experiment('(t-1)u(t)','e^(-t)u(t)',opts);
for(const t of [-2,-.1,0,.001,.2,1,2,5,8])near(causal.at(t),t<0?0:t-2+2*Math.exp(-t));
const delayed=E.experiment('(t-1)u(t-1)','exp(-t)u(t)',opts);
for(const t of [-1,0,.5,1,1.5,3,8])near(delayed.at(t),t<1?0:t-2+Math.exp(-(t-1)));
const pulse=E.experiment('u(t-1)-u(t-3)','u(t+1)-u(t-1)',opts);
for(const t of [-1,0,.25,1,2,2.5,3.9,4,5])near(pulse.at(t),Math.max(0,2-Math.abs(t-2)));
const swapped=E.experiment('u(t+1)-u(t-1)','u(t-1)-u(t-3)',opts);
for(const t of [-1,.4,1,2,3.7,5])near(swapped.at(t),pulse.at(t));
const narrow=E.experiment('u(t)-u(t-0.00001)','1',opts);near(narrow.at(1),.00001,1e-12);
const g=E.experiment('exp(-t^2)','exp(-t^2)',{a:-8,b:8,start:-2,end:2});
for(const t of [-2,-1,0,.5,2])near(g.at(t),Math.sqrt(Math.PI/2)*Math.exp(-t*t/2));
const divergent=E.experiment('(t-1)u(t)','exp(-t)',opts);
near(divergent.at(.75),Math.exp(-.75)*(8*Math.exp(10)+2));checks++;assert.equal(divergent.inspect(.75).tail,true);
checks++;assert.equal(causal.inspect(3).tail,false);
for(const o of [{a:1,b:0},{a:NaN},{end:opts.start},{a:-101},{b:Infinity}])throws(()=>E.experiment('t','t',{...opts,...o}));
console.log(JSON.stringify({status:'passed',checks,coverage:['restricted expression syntax','implicit multiplication and precedence','domain errors','causal ramp and delayed ramp closed forms','shifted pulses and commutativity','narrow step pulse','Gaussian convolution','divergent example tail warning']},null,2));
