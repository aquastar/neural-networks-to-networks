// Slide 2: one transformer block in 3D, after the style of bbycroft.net/llm.
// Words are rows, information flows left to right on one shared whiteboard.
// Driven by Reveal fragments 0..4 on the slide that contains #wb3d.
(function(){
  const host=document.getElementById('wb3d'); if(!host||!window.THREE) return;
  const section=host.closest('section');
  const canvas=host.querySelector('canvas'); const labelBox=host.querySelector('.wblabels');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setClearColor(0xffffff,0);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(30,3,0.1,200);
  scene.add(new THREE.AmbientLight(0xffffff,0.8));
  const dl=new THREE.DirectionalLight(0xffffff,0.45); dl.position.set(3,6,10); scene.add(dl);

  const WORDS=['The','Space','Needle','is','in'];
  const C={ink:0x4C5B66,acc:0xF76902,attn:0x1f6f8b,mlp:0xb8442c,out:0x2e7d32};
  const ROWS=5, DIM=8, CS=0.22, CSTEP=0.27, RSTEP=0.62;
  const rowY=i=>(2-i)*RSTEP;
  const groups={};
  function grp(name){const g=new THREE.Group(); scene.add(g); groups[name]=g; return g;}
  const cellGeo=new THREE.BoxGeometry(CS,CS,CS*0.6);
  const grids=[];
  function grid(g,kind,cols,rows,cx,cy,cstep,rstep,extra={}){
    const cells=[];
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const m=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:1});
      const b=new THREE.Mesh(cellGeo,m);
      b.position.set(cx+(c-(cols-1)/2)*cstep,cy+((rows-1)/2-r)*rstep,0);
      b.userData={r,c,seed:((Math.sin(r*12.9898+c*78.233+cx*3.7)*43758.5453)%1+1)%1};
      g.add(b); cells.push(b);
    }
    grids.push(Object.assign({kind,cells},extra)); return cells;
  }
  function frame(g,w,h,cx,cy,color){
    const l=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w,h)),new THREE.LineBasicMaterial({color,transparent:true,opacity:1}));
    l.position.set(cx,cy,-0.12); g.add(l);
    const bg=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.85}));
    bg.position.set(cx,cy,-0.14); g.add(bg);
  }
  function curve(pts){return new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));}
  function tube(g,pts,color,r=0.04){
    const cv=curve(pts);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(cv,48,r,8,false),new THREE.MeshLambertMaterial({color,transparent:true,opacity:1})));
    return cv;
  }
  function plus(g,x,y,color){ tube(g,[[x-0.17,y,0.1],[x+0.17,y,0.1]],color,0.045); tube(g,[[x,y-0.17,0.1],[x,y+0.17,0.1]],color,0.045); }

  // shared whiteboard (residual stream) with three snapshots of the board
  const BX=[-8,0,8];
  const gBoard=grp('board');
  const wb=new THREE.Mesh(new THREE.PlaneGeometry(19.4,4.0),new THREE.MeshLambertMaterial({color:0xd3e3ee,transparent:true,opacity:0.75}));
  wb.position.set(0,0,-0.3); gBoard.add(wb);
  const gRes=grp('res');
  BX.forEach((x,k)=>grid(gRes,'res',DIM,ROWS,x,0,CSTEP,RSTEP,{stage:k}));
  // copy-forward arrows along the board
  const gCopy=grp('copy');
  [[BX[0]+1.25,BX[1]-1.25],[BX[1]+1.25,BX[2]-1.25]].forEach(([a,b])=>{
    tube(gCopy,[[a,-1.75,0],[b,-1.75,0]],C.ink,0.03);
    const cone=new THREE.Mesh(new THREE.ConeGeometry(0.1,0.25,12),new THREE.MeshLambertMaterial({color:C.ink,transparent:true,opacity:1}));
    cone.rotation.z=-Math.PI/2; cone.position.set(b,-1.75,0); gCopy.add(cone);
  });

  // attention block: above, between board 0 and board 1
  const gAttn=grp('attn'); const AX=-4, AY=3.45;
  frame(gAttn,3.9,2.6,AX,AY,C.attn);
  const ASTEP=0.4;
  grid(gAttn,'pattern',5,5,AX+0.45,AY-0.15,ASTEP,ASTEP);
  const aIn=tube(gAttn,[[BX[0],1.6,0],[BX[0]+0.3,AY-0.4,0],[AX-1.95,AY-0.4,0]],C.attn);
  const aOut=tube(gAttn,[[AX+1.95,AY-0.4,0],[BX[1]-0.3,AY-0.4,0],[BX[1],1.6,0]],C.attn);
  plus(gAttn,BX[1]-0.55,1.75,C.attn);
  // arcs on board 1: rows Space and Needle feed row "in"
  const gArcs=grp('arcs'); const arcCurves=[];
  [[1,1.1],[2,0.8]].forEach(([src,bulge])=>{
    const x=BX[1]-1.35;
    arcCurves.push(tube(gArcs,[[x+0.2,rowY(src),0.1],[x-bulge,(rowY(src)+rowY(4))/2,0.5],[x+0.2,rowY(4),0.1]],C.acc,0.05));
  });

  // MLP block: below, between board 1 and board 2
  const gMlp=grp('mlp'); const MX=4, MY=-3.45;
  frame(gMlp,3.9,2.6,MX,MY,C.mlp);
  grid(gMlp,'hidden',14,5,MX,MY+0.05,0.22,0.4);
  const mIn=tube(gMlp,[[BX[1],-1.6,0],[BX[1]+0.3,MY+0.4,0],[MX-1.95,MY+0.4,0]],C.mlp);
  const mOut=tube(gMlp,[[MX+1.95,MY+0.4,0],[BX[2]-0.3,MY+0.4,0],[BX[2],-1.6,0]],C.mlp);
  plus(gMlp,BX[2]-0.55,-1.75,C.mlp);

  // output: next-word bars, fed by the "in" row of the last board
  const gOut=grp('out'); const OX=11.0, OY=rowY(4)+0.55;
  const outFeed=tube(gOut,[[BX[2]+1.15,rowY(4),0],[OX-0.35,rowY(4),0]],C.out,0.035);
  const words=[['Seattle',1.0],['Paris',0.2],['Tokyo',0.12],['London',0.08]];
  words.forEach(([w,p],i)=>{
    const len=0.25+2.6*p;
    const m=new THREE.Mesh(new THREE.BoxGeometry(len,0.3,0.12),new THREE.MeshLambertMaterial({color:i?0xb9c2c8:C.out,transparent:true,opacity:1}));
    m.position.set(OX+0.9+len/2,OY-i*0.42,0); gOut.add(m);
  });

  // moving dots that show where information travels
  const gDots=grp('dots'); const dots=[];
  function dotPath(cv,step,n=3,color=C.acc){
    for(let k=0;k<n;k++){
      const d=new THREE.Mesh(new THREE.SphereGeometry(0.11,16,12),new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}));
      gDots.add(d); dots.push({d,cv,step,phase:k/n});
    }
  }
  arcCurves.forEach(cv=>dotPath(cv,2,3));
  dotPath(aIn,2,2,C.attn); dotPath(aOut,2,2,C.attn);
  dotPath(mIn,3,3,C.mlp); dotPath(mOut,3,3,C.mlp);
  dotPath(outFeed,4,3,C.out);

  // labels (HTML), anchored to 3D points, shown at given steps (null = always)
  const L=[];
  function label(html,pos,cls,steps){const d=document.createElement('div'); d.className='wbl '+(cls||''); d.innerHTML=html; labelBox.appendChild(d); L.push({d,p:new THREE.Vector3(...pos),steps}); }
  WORDS.forEach((w,i)=>label(w,[BX[0]-1.45,rowY(i),0],'word',null));
  WORDS.forEach((w,i)=>label(w,[AX-1.35,AY-0.15+(2-i)*ASTEP,0],'aword',[0,2]));
  label('the whiteboard (residual stream)',[4.6,2.3,0],'board',[0,1]);
  label('copied forward, then edited',[BX[0]+4,-2.1,0],'mini',[1]);
  label('copied forward, then edited',[BX[1]+4,-2.1,0],'mini',[1]);
  label('one word = one row of numbers',[BX[0],1.95,0],'mini',[1]);
  label('board after attention',[BX[1],1.95,0],'mini',[1,2]);
  label('board after the MLP',[BX[2],1.95,0],'mini',[1,3]);
  label('Attention: which earlier words does each word read?',[AX,AY+1.6,0],'attn',[0,2]);
  label('"in" reads "Space" and "Needle"',[BX[1]-2.0,0.15,0],'hot',[2]);
  label('MLP: a lookup table, applied to each row on its own',[MX,MY-1.6,0],'mlp',[0,3]);
  label('in + Space Needle &rarr; Seattle',[MX+3.9,MY+0.4,0],'hot',[3]);
  label('next word',[OX+1.7,OY+0.55,0],'out',[0,4]);
  words.forEach(([w],i)=>label(w,[OX+0.45,OY-i*0.42,0],i?'mini right':'outw right',[0,4]));
  label('read out from the last row',[BX[2],rowY(4)-0.6,0],'mini',[4]);

  // camera stops, one per fragment step
  const STOPS=[
    {p:[1.6,0.6,22.5],t:[1.6,0,0]},
    {p:[0.4,0.5,18.5],t:[0.4,0.3,0]},
    {p:[-3.4,2.2,14.5],t:[-3.4,1.8,0]},
    {p:[4.6,-2.2,14.5],t:[4.6,-1.8,0]},
    {p:[9.2,0.3,13.0],t:[9.2,-0.6,0]},
  ];
  const FOCUS={0:null,1:['board','res','copy'],2:['attn','arcs','res','board','dots'],3:['mlp','res','board','dots'],4:['out','res','board','dots']};
  let step=0; const camP=new THREE.Vector3(...STOPS[0].p), camT=new THREE.Vector3(...STOPS[0].t);
  camera.position.copy(camP); camera.lookAt(camT);
  function currentStep(){ const i=Reveal.getIndices(); return (i.f===undefined||i.f===null)?0:Math.max(0,Math.min(4,i.f+1)); }
  function sync(){ if(section.classList.contains('present')){ step=currentStep(); host.dataset.step=step; } }
  ['slidechanged','fragmentshown','fragmenthidden','ready'].forEach(ev=>Reveal.on(ev,sync));

  function resize(){
    const w=host.clientWidth, h=host.clientHeight; if(!w||!h) return false;
    const dpr=Math.min(2,window.devicePixelRatio||1)*1.5;
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){ renderer.setPixelRatio(dpr); renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
    return true;
  }
  const tmp=new THREE.Color(), white=new THREE.Color(0xffffff), ink=new THREE.Color(0x3d4a54), acc=new THREE.Color(C.acc),
        cAttn=new THREE.Color(C.attn), cMlp=new THREE.Color(C.mlp), grey=new THREE.Color(0xeef1f3);
  function tick(time){
    requestAnimationFrame(tick);
    if(!section.classList.contains('present')) return;
    if(!resize()) return;
    const t=time/1000, st=STOPS[step];
    const wob=step===0?0.8*Math.sin(t*0.3):0;
    camP.lerp(new THREE.Vector3(st.p[0]+wob,st.p[1],st.p[2]),0.06); camT.lerp(new THREE.Vector3(...st.t),0.06);
    camera.position.copy(camP); camera.lookAt(camT);
    const foc=FOCUS[step];
    Object.entries(groups).forEach(([n,g])=>{
      const on=!foc||foc.includes(n); const target=on?1:0.15;
      if(n==='arcs') g.visible=step===2;
      if(n==='dots') g.visible=step>=2;
      g.traverse(o=>{ if(o.material){ const base=(n==='board')?0.75:(o.material.type==='MeshBasicMaterial'&&n!=='dots'?0.85:1);
        o.material.opacity+=((target*base)-o.material.opacity)*0.12; o.material.depthWrite=o.material.opacity>0.9; } });
    });
    grids.forEach(G=>G.cells.forEach(b=>{
      const u=b.userData; let v;
      if(G.kind==='res'){
        v=0.25+0.6*u.seed;
        tmp.copy(white).lerp(ink,v);
        const hotRow=(step===2&&G.stage===1&&u.r===4)||(step===3&&G.stage===2&&u.r===4)||(step===4&&G.stage===2&&u.r===4);
        if(hotRow) tmp.lerp(acc,0.55+0.35*Math.sin(t*4+u.c*0.5));
      } else if(G.kind==='pattern'){
        if(u.c>u.r){ tmp.copy(grey); }
        else { v=(u.r===4&&(u.c===1||u.c===2))?0.95:0.15+0.35*u.seed; tmp.copy(white).lerp(cAttn,v);
          if(step===2&&u.r===4&&(u.c===1||u.c===2)) tmp.lerp(acc,0.5+0.4*Math.sin(t*4)); }
      } else if(G.kind==='hidden'){
        v=u.seed>0.8?0.8:0.08; tmp.copy(white).lerp(cMlp,v);
        if(step===3&&u.r===4){ tmp.copy(white).lerp(cMlp,u.seed>0.45?0.6+0.4*Math.sin(t*5+u.c):0.15); }
      }
      b.material.color.copy(tmp);
    }));
    dots.forEach(o=>{ const show=o.step===step; o.d.visible=show; if(show){ const s=(t*0.45+o.phase)%1; o.d.position.copy(o.cv.getPointAt(s)); o.d.position.z+=0.15; } });
    renderer.render(scene,camera);
    const w=host.clientWidth,h=host.clientHeight;
    L.forEach(o=>{
      const v=o.p.clone().project(camera);
      const show=(!o.steps||o.steps.includes(step))&&v.z<1;
      o.d.style.opacity=show?1:0;
      const ax=(o.d.classList.contains('right')||o.d.classList.contains('word')||o.d.classList.contains('aword'))?'-100%':'-50%';
      o.d.style.transform=`translate(${(v.x*0.5+0.5)*w}px,${(-v.y*0.5+0.5)*h}px) translate(${ax},-50%)`;
    });
  }
  requestAnimationFrame(tick);
  setTimeout(sync,300);
})();
