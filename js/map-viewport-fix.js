(function(){
  const BASE_W=1000;
  const BASE_H=1000*(1056/1076);
  const MIN_ZOOM=.35, MAX_ZOOM=4;

  const style=document.createElement('style');
  style.textContent=`
    .world-wrap{height:calc(100vh - 66px)!important;min-height:0!important;overflow:hidden!important;position:relative!important}
    .world-viewport{position:relative!important;display:block!important;box-sizing:border-box!important;min-width:100%!important;min-height:100%!important;padding:0!important}
    .world-canvas{position:absolute!important;width:1000px!important;aspect-ratio:1076/1056!important;transform-origin:top left!important}
  `;
  document.head.appendChild(style);

  window.addEventListener('load',()=>{
    const wrap=document.getElementById('worldWrap');
    const viewport=document.getElementById('worldViewport');
    const canvas=document.getElementById('worldCanvas');
    const readout=document.getElementById('zoom100Btn');
    if(!wrap||!viewport||!canvas||!readout)return;

    function geometry(){
      const scaledW=BASE_W*worldZoom;
      const scaledH=BASE_H*worldZoom;
      const sideGap=Math.max(160,wrap.clientWidth*.12);
      const bottomGap=Math.max(480,wrap.clientHeight*.65);
      const viewportW=Math.max(wrap.clientWidth,scaledW+sideGap*2);
      const viewportH=Math.max(wrap.clientHeight,scaledH+18+bottomGap);

      viewport.style.width=viewportW+'px';
      viewport.style.height=viewportH+'px';
      canvas.style.left=((viewportW-scaledW)/2)+'px';
      canvas.style.top='18px';
      canvas.style.transform=`scale(${worldZoom})`;
      readout.textContent=Math.round(worldZoom*100)+'%';
    }

    window.setWorldZoom=function(value,clientX=null,clientY=null){
      const oldZoom=worldZoom;
      const oldRect=canvas.getBoundingClientRect();
      const wrapRect=wrap.getBoundingClientRect();

      if(clientX===null||clientY===null){
        clientX=wrapRect.left+wrapRect.width/2;
        clientY=wrapRect.top+wrapRect.height/2;
      }

      const mapX=Math.max(0,Math.min(BASE_W,(clientX-oldRect.left)/oldZoom));
      const mapY=Math.max(0,Math.min(BASE_H,(clientY-oldRect.top)/oldZoom));

      worldZoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,Number(value.toFixed(3))));
      document.body.dataset.fitMode='false';
      geometry();
      localStorage.setItem('remnant-atlas-world-zoom',String(worldZoom));

      requestAnimationFrame(()=>{
        const newRect=canvas.getBoundingClientRect();
        const targetX=newRect.left+mapX*worldZoom;
        const targetY=newRect.top+mapY*worldZoom;
        wrap.scrollLeft+=targetX-clientX;
        wrap.scrollTop+=targetY-clientY;
      });
    };

    window.fitWorldToScreen=function(){
      const availableW=Math.max(200,wrap.clientWidth-36);
      const availableH=Math.max(200,wrap.clientHeight-36);
      worldZoom=Math.max(MIN_ZOOM,Math.min(1,Math.min(availableW/BASE_W,availableH/BASE_H)));
      geometry();
      document.body.dataset.fitMode='true';
      localStorage.setItem('remnant-atlas-world-zoom',String(worldZoom));

      requestAnimationFrame(()=>{
        wrap.scrollLeft=Math.max(0,(viewport.scrollWidth-wrap.clientWidth)/2);
        wrap.scrollTop=0;
      });
    };

    const plus=document.getElementById('zoomInBtn');
    const minus=document.getElementById('zoomOutBtn');
    const reset=document.getElementById('zoom100Btn');
    const fit=document.getElementById('fitBtn');
    if(plus)plus.onclick=()=>window.setWorldZoom(worldZoom+.15);
    if(minus)minus.onclick=()=>window.setWorldZoom(worldZoom-.15);
    if(reset)reset.onclick=()=>window.setWorldZoom(1);
    if(fit)fit.onclick=()=>window.fitWorldToScreen();

    wrap.addEventListener('wheel',e=>{
      if(!(e.ctrlKey||e.metaKey))return;
      e.preventDefault();
      e.stopImmediatePropagation();
      window.setWorldZoom(worldZoom+(e.deltaY<0?.15:-.15),e.clientX,e.clientY);
    },{capture:true,passive:false});

    window.addEventListener('resize',()=>{
      if(document.body.dataset.fitMode==='true')window.fitWorldToScreen();
      else geometry();
    });

    requestAnimationFrame(()=>requestAnimationFrame(()=>window.fitWorldToScreen()));
  });
})();
