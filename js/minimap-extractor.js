
window.RemnantMinimapExtractor = {
  extract(imageData){
    const sw=imageData.width, sh=imageData.height, src=imageData.data;
    let x0=Math.round(sw*0.0642), y0=Math.round(sh*0.2828);
    let x1=Math.round(sw*0.9358), y1=Math.round(sh*0.9192);
    x0=Math.max(0,x0);y0=Math.max(0,y0);x1=Math.min(sw,x1);y1=Math.min(sh,y1);
    const cw=Math.max(1,x1-x0),ch=Math.max(1,y1-y0);
    const out=new ImageData(cw,ch),od=out.data,klass=new Uint8Array(cw*ch);
    const BG=[1,55,78,255],MAP=[160,159,157,255],GREEN=[0,255,0,255];
    const isGreen=(r,g,b)=>g>180&&g>r*2.2&&g>b*1.8;
    const isCyan=(r,g,b)=>g>205&&b>205&&r<80&&Math.abs(g-b)<55;
    const isPink=(r,g,b)=>r>205&&b>155&&g>85&&g<190&&r>g*1.25;
    const isMap=(r,g,b)=>{
      const spread=Math.max(r,g,b)-Math.min(r,g,b);
      const neutral=r>105&&r<205&&g>105&&g<205&&b>105&&b<205&&spread<28;
      const blueGray=r>90&&r<165&&g>120&&g<185&&b>130&&b<195&&g>=r&&b>=r;
      return neutral||blueGray;
    };
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
      const i=((y+y0)*sw+(x+x0))*4,r=src[i],g=src[i+1],b=src[i+2];
      klass[y*cw+x]=isGreen(r,g,b)?2:(isCyan(r,g,b)||isPink(r,g,b))?3:isMap(r,g,b)?1:0;
    }
    const seen=new Uint8Array(cw*ch),dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
      const idx=y*cw+x;if(klass[idx]!==3||seen[idx])continue;
      const q=[[x,y]],comp=[];seen[idx]=1;
      for(let qi=0;qi<q.length;qi++){
        const [cx,cy]=q[qi];comp.push([cx,cy]);
        for(const [dx,dy] of dirs){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=cw||ny>=ch)continue;const ni=ny*cw+nx;if(!seen[ni]&&klass[ni]===3){seen[ni]=1;q.push([nx,ny])}}
      }
      let mv=0,bv=0;const set=new Set(comp.map(p=>p[1]*cw+p[0]));
      for(const [cx,cy] of comp)for(let yy=Math.max(0,cy-4);yy<=Math.min(ch-1,cy+4);yy++)for(let xx=Math.max(0,cx-4);xx<=Math.min(cw-1,cx+4);xx++){
        const ni=yy*cw+xx;if(set.has(ni))continue;if(klass[ni]===1)mv++;else if(klass[ni]===0)bv++;
      }
      const replacement=(mv>0&&mv>=bv*0.18)?1:0;for(const [cx,cy] of comp)klass[cy*cw+cx]=replacement;
    }
    let mapCount=0,greenCount=0;
    for(let i=0;i<klass.length;i++){const k=klass[i],o=i*4,c=k===2?GREEN:k===1?MAP:BG;od[o]=c[0];od[o+1]=c[1];od[o+2]=c[2];od[o+3]=255;if(k===2)greenCount++;else if(k===1)mapCount++}
    return {imageData:out,mapCount,greenCount};
  }
};
