/* Living garden overlays for the original spring art and six chosen summer/autumn/winter images.
 * Subtle CSS/SVG movement: fewer migrating birds, fish strictly masked to the river,
 * swaying flowers, flowing water, clouds, wind, reeds and nighttime fireflies.
 * Does not change app data, study flow, mascot or navigation. */
(function () {
  'use strict';
  var cover = document.getElementById('cover');
  if (!cover) return;
  var garden = cover.querySelector('.landscape');
  if (!garden) return;

  var layer = document.createElement('div');
  layer.id = 'nhi-living-garden';
  layer.setAttribute('aria-hidden','true');
  layer.setAttribute('role','presentation');
  garden.appendChild(layer);

  var svg = {
    bird: '<svg viewBox="0 0 104 62" aria-hidden="true"><path class="nhi-bird-wing nhi-bird-left" d="M52 26Q27 1 2 18Q25 21 43 38Z" fill="currentColor"/><path class="nhi-bird-wing nhi-bird-right" d="M52 26Q78 1 102 18Q79 21 61 38Z" fill="currentColor"/><path d="M43 30Q52 19 61 30L57 40L52 36L47 40Z" fill="currentColor"/><path d="M53 34Q54 45 44 58L53 51L62 58Q54 47 55 34" fill="currentColor" opacity=".85"/></svg>',
    dragonfly: '<svg viewBox="0 0 100 62" aria-hidden="true"><path d="M50 25Q18-13 2 18Q24 39 49 31Q75-12 98 19Q77 42 51 31Z" fill="#c8ffff" stroke="#75c0cd" stroke-width="2" opacity=".88"/><path d="M50 26L50 56" stroke="#3b9b95" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="20" r="5" fill="#3b9b95"/></svg>',
    fish: '<svg viewBox="0 0 106 54" aria-hidden="true"><path d="M76 25L104 8L99 26L104 47L76 30Z" fill="var(--fish-tail,#efab60)"/><path d="M9 26Q34-4 77 25Q41 59 9 26Z" fill="var(--fish-body,#ffd08a)" stroke="#9d7659" stroke-width="2.2"/><path d="M37 10Q42 24 38 44M59 11Q50 25 58 42" stroke="#ef8867" fill="none" stroke-width="9" opacity=".72"/><circle cx="21" cy="24" r="3" fill="#384f52"/><path d="M31 18L42 6L53 15" fill="var(--fish-body,#ffd08a)"/></svg>',
    wind: '<svg viewBox="0 0 240 64" aria-hidden="true"><path d="M3 30Q70-5 135 24T236 14M29 48Q105 20 170 43" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></svg>',
    reeds: '<svg viewBox="0 0 180 140" aria-hidden="true"><g class="nhi-reed-blades" fill="none" stroke="var(--reed-color,#8faf77)" stroke-width="3.2" stroke-linecap="round"><path d="M83 138Q66 78 24 26M85 138Q98 63 151 13M82 138Q80 75 75 5M83 138Q41 104 9 75M87 138Q119 99 175 76"/></g></svg>',
    bloom: '<svg viewBox="0 0 80 138" aria-hidden="true"><path d="M38 135Q35 93 42 56" fill="none" stroke="var(--bloom-stem,#608d69)" stroke-width="3.8" stroke-linecap="round"/><path d="M39 108Q15 85 12 104Q25 120 39 114M39 89Q63 69 66 87Q55 97 39 97" fill="var(--bloom-leaf,#88aa7a)"/><g transform="translate(42 52)"><g fill="var(--bloom-petal,#f6c4d7)" opacity=".87"><ellipse cx="0" cy="-15" rx="10" ry="17"/><ellipse cx="14" cy="-5" rx="10" ry="17" transform="rotate(75 14 -5)"/><ellipse cx="9" cy="13" rx="10" ry="17" transform="rotate(143 9 13)"/><ellipse cx="-9" cy="13" rx="10" ry="17" transform="rotate(-143 -9 13)"/><ellipse cx="-14" cy="-5" rx="10" ry="17" transform="rotate(-75 -14 -5)"/></g><circle r="7" fill="var(--bloom-heart,#ecd26b)"/></g></svg>',
    current: '<svg viewBox="0 0 220 45" aria-hidden="true"><g fill="none" stroke="var(--foam-color,#e8faff)" stroke-linecap="round"><path d="M0 15Q22 3 45 15T90 15T135 15T180 15T220 15" stroke-width="2.7" opacity=".68"/><path d="M20 28Q45 15 72 28T124 28T178 28" stroke-width="1.8" opacity=".65"/><path d="M88 38Q108 32 131 38" stroke-width="2.3" opacity=".82"/></g></svg>'
  };
  var water = document.createElement('div');
  water.className = 'nhi-life-water';
  water.setAttribute('aria-hidden','true');
  function add(kind, markup, props, destination) {
    var node=document.createElement('span');
    node.className='nhi-life '+kind;
    if(markup) node.innerHTML=markup;
    props=props||{};
    Object.keys(props).forEach(function(k){node.style.setProperty(k,String(props[k]));});
    (destination||layer).appendChild(node);
    return node;
  }
  function rand(i,salt){return ((i*41+salt*31)%101)/100;}
  var last='';
  function paint(){
    var season=cover.dataset.season||'spring';
    var dark=document.documentElement.getAttribute('data-theme')==='dark';
    var phone=(window.innerWidth||900)<700;
    var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var identity=season+'|'+(dark?'night':'day')+'|'+(phone?'mobile':'desktop')+'|'+(reduced?'reduce':'animate');
    if(identity===last)return;
    last=identity;
    layer.replaceChildren();
    layer.appendChild(water);
    water.replaceChildren();
    layer.dataset.season=season;
    layer.dataset.lighting=dark?'night':'day';
    if(reduced)return; // Everything animated here is decorative.
    var sky=dark?'#dce4ee':season==='winter'?'#526577':'#476b82';
    var numbers={birds:phone?2:4,dragonflies:phone?1:2,fish:phone?2:4,
      currents:phone?5:9,clouds:phone?2:4,wind:phone?2:4,
      blossoms:season==='winter'?0:(phone?3:6),
      fireflies:phone?8:17,reeds:phone?2:4};
    if(dark){numbers.birds=Math.max(1,Math.floor(numbers.birds*.75));}
    // Repeated flocks from either side with tiny independently flapping wings.
    for(var b=0;b<numbers.birds;b++){
      var flying=add('nhi-life-bird',svg.bird,{
        '--y':(11+rand(b,3)*29)+'%',
        '--scale':(.36+rand(b,7)*.48).toFixed(2),
        '--duration':(16+rand(b,11)*17).toFixed(1)+'s',
        '--delay':(-rand(b,5)*34).toFixed(1)+'s',
        '--bird-color':sky,
        '--flap':(.45+rand(b,13)*.28).toFixed(2)+'s'
      });
      if(b%3===0)flying.classList.add('reverse');
    }
    if(season!=='winter'){
      for(var d=0;d<numbers.dragonflies;d++){
        add('nhi-life-dragonfly',svg.dragonfly,{
          '--x':(12+rand(d,21)*74)+'%',
          '--y':(63+rand(d,5)*24)+'%',
          '--duration':(6+rand(d,3)*6).toFixed(1)+'s',
          '--delay':(-rand(d,6)*12).toFixed(1)+'s',
          '--scale':(.30+rand(d,22)*.35).toFixed(2)
        });
      }
    }
    // Both fish and currents live inside a clipped river zone, NEVER on the meadow.
    // SVG details are transparent and scaled down to feel submerged in the painted river.
    for(var flow=0;flow<numbers.currents;flow++){
      add('nhi-life-current',svg.current,{
        '--x':(3+rand(flow,35)*78)+'%',
        '--y':(9+rand(flow,7)*70)+'%',
        '--width':(45+rand(flow,18)*90)+'px',
        '--duration':(3+rand(flow,25)*3.5).toFixed(2)+'s',
        '--delay':(-rand(flow,21)*8).toFixed(2)+'s',
        '--foam-color':dark?'#a9d9ea':'#ebffff'
      },water);
    }
    for(var fish=0;fish<numbers.fish;fish++){
      var swimmer=add('nhi-life-fish',svg.fish,{
        '--x':(7+rand(fish,35)*37)+'%',
        '--y':(25+rand(fish,7)*36)+'%',
        '--scale':(.20+rand(fish,19)*.18).toFixed(2),
        '--duration':(9+rand(fish,23)*11).toFixed(1)+'s',
        '--delay':(-rand(fish,8)*24).toFixed(1)+'s',
        '--fish-body':fish%2?'#f8d8a7':'#fff0ce',
        '--fish-tail':fish%2?'#e58e58':'#e6b57d'
      },water);
      if(fish%2)swimmer.classList.add('reverse');
    }
    // A few foreground blossoms bend gently in the breeze, with rotating flower heads.
    for(var flower=0;flower<numbers.blossoms;flower++){
      add('nhi-life-bloom',svg.bloom,{
        '--x':(flower%2 ? 76+rand(flower,16)*18 : 3+rand(flower,11)*16)+'%',
        '--bottom':(flower%3*3-2)+'%',
        '--scale':(.28+rand(flower,14)*.23).toFixed(2),
        '--duration':(3.8+rand(flower,20)*3.7).toFixed(1)+'s',
        '--delay':(-rand(flower,18)*7).toFixed(1)+'s',
        '--bloom-petal':season==='autumn'?(flower%2?'#df9a66':'#eac88a'):season==='summer'?(flower%2?'#ffe9a6':'#f0b5c1'):'#f5c0d9',
        '--bloom-heart':season==='autumn'?'#9c6943':'#e6c35c'
      });
    }
    // Passing cloud cover moves separately from the painted sky.
    for(var cl=0;cl<numbers.clouds;cl++){
      add('nhi-life-cloud',null,{
        '--y':(7+rand(cl,32)*31)+'%',
        '--width':(phone?85:125+cl*27)+'px',
        '--duration':(45+rand(cl,16)*48).toFixed(1)+'s',
        '--delay':(-rand(cl,18)*97).toFixed(1)+'s',
        '--cloud-opacity':dark?'.11':'.22'
      });
    }
    // Gusts and moving reeds make the breeze feel continuous.
    for(var w=0;w<numbers.wind;w++){
      add('nhi-life-wind',svg.wind,{
        '--x':(rand(w,10)*78)+'%',
        '--y':(19+rand(w,20)*60)+'%',
        '--duration':(7+rand(w,9)*7).toFixed(1)+'s',
        '--delay':(-rand(w,4)*17).toFixed(1)+'s',
        '--wind-color':dark?'#d2f1e6':'#eef9ff'
      });
    }
    for(var g=0;g<numbers.reeds;g++){
      add('nhi-life-reeds',svg.reeds,{
        '--x':(g%2?76+rand(g,12)*20:rand(g,16)*19)+'%',
        '--y':(85+rand(g,8)*12)+'%',
        '--scale':(.5+rand(g,4)*.7).toFixed(2),
        '--delay':(-rand(g,25)*7).toFixed(1)+'s',
        '--reed-color':season==='autumn'?'#c4a16a':season==='winter'?'#b9d2d8':'#81b48e'
      });
    }
    if(dark){
      for(var light=0;light<numbers.fireflies;light++){
        add('nhi-life-firefly',null,{
          '--x':(2+rand(light,33)*96)+'%',
          '--y':(42+rand(light,15)*48)+'%',
          '--duration':(3.5+rand(light,26)*5).toFixed(1)+'s',
          '--delay':(-rand(light,21)*13).toFixed(1)+'s'
        });
      }
    }
  }
  paint();
  new MutationObserver(paint).observe(cover,{attributes:true,attributeFilter:['data-season']});
  new MutationObserver(paint).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  window.addEventListener('resize',function(){
    // Rebuild only when the mobile/desktop category actually changes.
    var phone=(window.innerWidth||900)<700;
    if(last.indexOf('|'+(phone?'mobile':'desktop')+'|')<0)paint();
  },{passive:true});
})();