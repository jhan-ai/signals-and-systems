/* Restricted real-valued signal expressions and finite-interval quadrature.
 * No JavaScript evaluation, property access, assignment, or external dependency. */
(function(root){
  'use strict';
  const functions={u:v=>v>=0?1:0,r:v=>Math.max(0,v),sin:Math.sin,cos:Math.cos,
    exp:Math.exp,abs:Math.abs,sqrt:Math.sqrt,log:Math.log,ln:Math.log,
    rect:v=>Math.abs(v)<.5?1:0,sinc:v=>Math.abs(v)<1e-12?1:Math.sin(Math.PI*v)/(Math.PI*v)};
  function compile(source){
    if(typeof source!=='string'||!source.trim())throw Error('함수를 입력해 주세요.');
    if(source.length>240)throw Error('수식은 240자 이내로 입력해 주세요.');
    const text=source.replace(/[−–]/g,'-').replace(/[×·]/g,'*').replace(/π/g,'pi').trim();
    const tokens=[];let offset=0;
    while(offset<text.length){
      if(/\s/.test(text[offset])){offset++;continue;}
      const match=text.slice(offset).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|^[a-zA-Z]+|^[+\-*/^()]/);
      if(!match)throw Error(`${offset+1}번째 문자를 읽을 수 없습니다. 식의 오른쪽만 입력해 주세요. 예: (t-1)*u(t)`);
      tokens.push(match[0]);offset+=match[0].length;
    }
    if(tokens.length>160)throw Error('수식이 너무 복잡합니다. 항의 수를 줄여 주세요.');
    let pos=0,depth=0;const peek=()=>tokens[pos];
    const make=(op,...args)=>({op,args});
    function primary(){
      if(++depth>32)throw Error('괄호가 너무 깊습니다. 수식을 간단히 해 주세요.');
      const token=tokens[pos++];let n;
      if(token==='('){n=sum();if(tokens[pos++]!==')')throw Error('닫는 괄호 )가 필요합니다.');}
      else if(token&&/^(?:\d|\.)/.test(token)){const v=Number(token);if(!Number.isFinite(v))throw Error('숫자가 너무 큽니다.');n=make('number',v);}
      else if(token==='t')n=make('t');
      else if(token==='pi'||token==='e')n=make('number',token==='pi'?Math.PI:Math.E);
      else if(Object.hasOwn(functions,token)){if(tokens[pos++]!=='(')throw Error(`${token} 뒤에는 괄호가 필요합니다. 예: ${token}(t)`);n=make('call',token,sum());if(tokens[pos++]!==')')throw Error('닫는 괄호 )가 필요합니다.');}
      else throw Error(token?`지원하지 않는 이름 또는 기호: ${token}. 변수는 t를 사용해 주세요.`:'수식이 끝나지 않았습니다.');
      depth--;return n;
    }
    function power(){let n=primary();if(peek()==='^'){pos++;n=make('^',n,unary());}return n;}
    function unary(){if(peek()==='+'||peek()==='-'){const sign=tokens[pos++];return make(sign==='-'?'neg':'pos',unary());}return power();}
    function product(){let n=unary();while(pos<tokens.length){const token=peek();if(token==='*'||token==='/'){pos++;n=make(token,n,unary());}else if(token==='('||/^[a-zA-Z\d.]/.test(token))n=make('*',n,unary());else break;}return n;}
    function sum(){let n=product();while(peek()==='+'||peek()==='-'){const op=tokens[pos++];n=make(op,n,product());}return n;}
    const ast=sum();if(pos!==tokens.length)throw Error('괄호 또는 연산자의 위치를 확인해 주세요.');
    function evaluator(n){
      const [a,b]=n.args;
      if(n.op==='number')return()=>a;if(n.op==='t')return t=>t;
      if(n.op==='call'){const f=evaluator(b);return t=>functions[a](f(t));}
      const f=evaluator(a);if(n.op==='neg')return t=>-f(t);if(n.op==='pos')return f;
      const g=evaluator(b);
      switch(n.op){case '+':return t=>f(t)+g(t);case '-':return t=>f(t)-g(t);case '*':return t=>f(t)*g(t);case '/':return t=>f(t)/g(t);case '^':return t=>f(t)**g(t);}
    }
    // Locate affine step boundaries so narrow pulses and discontinuities are split exactly.
    function affine(n){
      const [a,b]=n.args;
      if(n.op==='number')return[0,a];if(n.op==='t')return[1,0];
      if(n.op==='call')return null;const p=affine(a);if(!p)return null;
      if(n.op==='neg')return p.map(v=>-v);if(n.op==='pos')return p;
      const q=affine(b);if(!q)return null;
      if(n.op==='+')return[p[0]+q[0],p[1]+q[1]];if(n.op==='-')return[p[0]-q[0],p[1]-q[1]];
      if(n.op==='*'&&(p[0]===0||q[0]===0))return[p[0]*q[1]+p[1]*q[0],p[1]*q[1]];
      if(n.op==='/'&&q[0]===0&&q[1]!==0)return p.map(v=>v/q[1]);return null;
    }
    const breaks=[],singular=[];
    function roots(n,target,out){const a=affine(n);if(a&&a[0]!==0)out.push((target-a[1])/a[0]);else if(n.op==='^'&&target===0)roots(n.args[0],0,out);}
    function visit(n){
      if(n.op==='call'){const [name,arg]=n.args;if(['u','r','abs','sqrt','log','ln'].includes(name))roots(arg,0,breaks);if(name==='rect'){roots(arg,-.5,breaks);roots(arg,.5,breaks);}visit(arg);}
      else{if(n.op==='/')roots(n.args[1],0,singular);if(n.op==='^'&&n.args[1].op==='neg')roots(n.args[0],0,singular);for(const a of n.args)if(a&&typeof a==='object')visit(a);}
    }
    visit(ast);const raw=evaluator(ast);
    function value(t){const v=raw(t);if(!Number.isFinite(v)||Math.abs(v)>1e12)throw Error(`t = ${Number(t.toFixed(5))}에서 함수가 정의되지 않거나 값이 너무 큽니다. 수식과 구간을 확인해 주세요.`);return v;}
    function validate(lo,hi){
      if(singular.some(v=>v>=lo&&v<=hi))throw Error('계산 구간에 분모가 0이 되는 지점이 있습니다. 특이점이 없는 함수나 구간을 사용해 주세요.');
      for(let i=0;i<=240;i++)value(lo+(hi-lo)*i/240);
      for(const b of breaks)if(b>=lo&&b<=hi)value(b);
    }
    return{source:text,value,breaks:[...new Set(breaks)].filter(Number.isFinite),validate};
  }
  // Eight-point Gauss–Legendre on panels split at known discontinuities.
  const nodes=[-.9602898564975363,-.7966664774136267,-.525532409916329,-.1834346424956498,.1834346424956498,.525532409916329,.7966664774136267,.9602898564975363];
  const weights=[.1012285362903763,.2223810344533745,.3137066458778873,.362683783378362,.362683783378362,.3137066458778873,.2223810344533745,.1012285362903763];
  function integral(x,h,t,a,b,panels=32){
    const cuts=[a,b,...x.breaks,...h.breaks.map(v=>t-v)].filter(v=>v>=a&&v<=b).sort((v,w)=>v-w);
    let total=0;
    for(let k=1;k<cuts.length;k++){
      const lo=cuts[k-1],hi=cuts[k];if(hi<=lo)continue;
      const count=Math.max(1,Math.ceil(panels*(hi-lo)/(b-a))),half=(hi-lo)/count/2;
      for(let i=0;i<count;i++){const mid=lo+(2*i+1)*half;let s=0;for(let j=0;j<8;j++){const tau=mid+half*nodes[j];s+=weights[j]*x.value(tau)*h.value(t-tau);}total+=half*s;}
    }
    if(!Number.isFinite(total)||Math.abs(total)>1e15)throw Error('적분값이 너무 큽니다. 함수와 계산 구간을 확인해 주세요.');
    return total;
  }
  function experiment(xSource,hSource,settings){
    const {a,b,start,end}=settings;
    if(![a,b,start,end].every(v=>Number.isFinite(v)&&Math.abs(v)<=100)||b<=a||end<=start||b-a<.01||end-start<.01)throw Error('구간은 −100~100 안에서 시작 < 끝으로 입력해 주세요. 구간 길이는 0.01 이상이어야 합니다.');
    const x=compile(xSource),h=compile(hSource);
    x.validate(a,b);h.validate(Math.min(start-b,-b),Math.max(end-a,-a));
    const knots=[a,b,...x.breaks].flatMap(a=>h.breaks.map(b=>a+b)).filter(t=>t>=start&&t<=end);
    const times=[...new Set([...Array.from({length:241},(_,i)=>start+(end-start)*i/240),...knots])].sort((a,b)=>a-b),values=[];let resolutionWarning=false;
    for(const t of times){const fine=integral(x,h,t,a,b,64),coarse=integral(x,h,t,a,b,32);values.push(fine);if(Math.abs(fine-coarse)>2e-4*(1+Math.abs(fine)))resolutionWarning=true;}
    const at=t=>integral(x,h,t,a,b,64);
    const interpolate=t=>{let lo=0,hi=times.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(times[mid]<=t)lo=mid;else hi=mid;}const f=Math.max(0,Math.min(1,(t-times[lo])/(times[hi]-times[lo])));return values[lo]+(values[hi]-values[lo])*f;};
    function inspect(t){
      const value=at(t),coarse=integral(x,h,t,a,b,32),width=b-a;
      const resolution=resolutionWarning||Math.abs(value-coarse)>2e-4*(1+Math.abs(value));
      try{
        const aa=a-width/2,bb=b+width/2;x.validate(aa,bb);h.validate(t-bb,t-aa);
        const wider=integral(x,h,t,aa,bb,128);
        return{value,wider,resolution,tail:Math.abs(wider-value)>1e-3*(1+Math.abs(value))};
      }catch{return{value,resolution,tail:true,wider:null};}
    }
    return{x,h,a,b,start,end,times,values,knots,at,interpolate,inspect};
  }
  root.SignalExpression={compile,integral,experiment};
})(typeof window==='undefined'?globalThis:window);
