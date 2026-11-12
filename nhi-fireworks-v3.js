/* Original celebratory fireworks, drawn on the site's existing canvas.
   No external library; particle budget capped for mobile and respects reduced motion. */
(function(){
'use strict';
var token=0,raf=0;
var palette=['#facc15','#fb7185','#22d3ee','#a78bfa','#34d399','#fb923c','#60a5fa','#f472b6'];
function launch(){
  var canvas=document.getElementById('confetti');
  if(!canvas||!canvas.getContext)return;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var ctx=canvas.getContext('2d');if(!ctx)return;
  token++;var id=token;
  if(raf)cancelAnimationFrame(raf);
  var W=innerWidth,H=innerHeight,ratio=Math.min(devicePixelRatio||1,W<720?1.5:2);
  canvas.hidden=false;canvas.width=Math.round(W*ratio);canvas.height=Math.round(H*ratio);
  ctx.setTransform(ratio,0,0,ratio,0,0);
  var mobile=W<720,particles=[],cap=mobile?235:360,batch=mobile?40:64;
  var schedule=[
    {ms:120,x:.2,y:.24},{ms:390,x:.78,y:.32},{ms:690,x:.48,y:.18},
    {ms:1080,x:.24,y:.44},{ms:1390,x:.79,y:.18},{ms:1830,x:.51,y:.37}
  ],next=0,begin=performance.now(),previous=begin,duration=3700;
  function burst(x,y){
    var amount=Math.min(batch,cap-particles.length),color=palette[(next+2)%palette.length];
    for(var i=0;i<amount;i++){
      var angle=i/amount*Math.PI*2+(Math.random()-.5)*.13;
      var speed=1.45+Math.random()*2.65;
      particles.push({
        x:x,y:y,px:x,py:y,
        vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
        life:0,max:44+Math.random()*30,
        r:1.5+Math.random()*2.3,
        color:i%4===0?'#ffffff':(i%3===0?color:palette[(i+next)%palette.length]),
        star:i%8===0
      });
    }
  }
  function frame(now){
    if(token!==id)return;
    var elapsed=now-begin,step=Math.min(2.1,Math.max(.1,(now-previous)/16.7));previous=now;
    ctx.clearRect(0,0,W,H);
    while(next<schedule.length&&elapsed>=schedule[next].ms){
      var b=schedule[next];next++;
      burst(W*b.x+(Math.random()-.5)*W*.07,H*b.y+(Math.random()-.5)*H*.05);
    }
    for(var i=particles.length-1;i>=0;i--){
      var p=particles[i];p.px=p.x;p.py=p.y;
      p.x+=p.vx*step*1.85;p.y+=p.vy*step*1.85;
      p.vy+=.055*step;p.vx*=Math.pow(.988,step);p.vy*=Math.pow(.991,step);p.life+=step;
      if(p.life>=p.max){particles.splice(i,1);continue;}
      var remain=1-p.life/p.max;
      ctx.globalAlpha=Math.max(0,Math.min(1,remain*1.5));
      ctx.strokeStyle=p.color;ctx.fillStyle=p.color;
      ctx.lineWidth=Math.max(.7,p.r*.65);
      ctx.beginPath();ctx.moveTo(p.px,p.py);ctx.lineTo(p.x,p.y);ctx.stroke();
      if(p.star){
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.life*.055);
        var rr=p.r*(.6+.5*remain);
        ctx.fillRect(-rr*.25,-rr*1.8,rr*.5,rr*3.6);
        ctx.fillRect(-rr*1.8,-rr*.25,rr*3.6,rr*.5);
        ctx.restore();
      }else{
        ctx.beginPath();ctx.arc(p.x,p.y,p.r*remain+.35,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.globalAlpha=1;
    if(elapsed>=duration||(next>=schedule.length&&!particles.length)){
      ctx.clearRect(0,0,W,H);canvas.hidden=true;raf=0;return;
    }
    raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
}
window.NHI_FIREWORKS={launch:launch};
})();