'use strict';
window.FourierSections=(()=>{
  const names=['series','transform'];
  const get=id=>document.getElementById(id);
  let active='series';
  function replaceHash(hash){
    if(window.location.hash===hash)return;
    try{window.history.replaceState(null,'',hash);}catch{}
  }
  function show(section,focus=false){
    if(!names.includes(section))throw new RangeError('Unknown Fourier section');
    active=section;
    for(const name of names){
      const selected=name===section,button=get('section-'+name);
      get('fourier-'+name+'-section').hidden=!selected;
      button.setAttribute('aria-selected',String(selected));
      button.tabIndex=selected?0:-1;
    }
    if(section==='transform'){
      window.FourierTransformLab?.activate();
      if(!window.location.hash.startsWith('#transform'))replaceHash('#transform');
    }else{
      render();
      if(window.location.hash.startsWith('#transform'))replaceHash('#series');
    }
    if(focus)get('section-'+section).focus();
  }
  for(const name of names)get('section-'+name).addEventListener('click',()=>show(name));
  get('fourier-sections').addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    show(event.key==='Home'?'series':event.key==='End'?'transform':active==='series'?'transform':'series',true);
  });
  function route(){
    const match=window.location.hash.match(/^#transform(?:-(bridge|properties|response))?$/);
    if(match){show('transform');if(match[1])window.FourierTransformLab?.select(match[1]);}
    else if(window.location.hash==='#series')show('series');
  }
  document.addEventListener('fourier-transform-tab',event=>{
    const tab=event.detail?.tab;
    if(active==='transform'&&['bridge','properties','response'].includes(tab))replaceHash('#transform-'+tab);
  });
  window.addEventListener('hashchange',route);
  route();
  return {show,current:()=>active};
})();
