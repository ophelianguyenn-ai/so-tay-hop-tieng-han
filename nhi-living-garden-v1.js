/* Living garden overlays for the original spring art and six chosen summer/autumn/winter images.
 * Real CSS/SVG movement: migrating birds, wing-flapping butterflies, jumping animals,
 * shoals of fish, glowing nighttime fireflies, clouds, wind, swaying reeds and falling leaves.
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
    butterfly: '<svg viewBox="0 0 84 70" aria-hidden="true"><g class="nhi-butter-wing nhi-butter-left"><path d="M41 31C2-11-9 18 36 39C5 38 18 75 41 42Z" fill="var(--wing-main,#efb7cf)" stroke="#725272" stroke-width="1.6"/><path d="M12 19Q23 22 36 37M21 51Q28 44 38 41" fill="none" stroke="#fff9" stroke-width="2"/></g><g class="nhi-butter-wing nhi-butter-right"><path d="M43 31C82-11 93 18 48 39C79 38 66 75 43 42Z" fill="var(--wing-second,#ffe1a8)" stroke="#725272" stroke-width="1.6"/><path d="M72 19Q61 22 48 37M63 51Q56 44 46 41" fill="none" stroke="#fff9" stroke-width="2"/></g><path d="M42 25V50" stroke="#43344c" stroke-width="5" stroke-linecap="round"/><path d="M42 26Q30 6 24 11M42 26Q54 6 60 11" fill="none" stroke="#43344c" stroke-width="1.5"/></svg>',
    dragonfly: '<svg viewBox="0 0 100 62" aria-hidden="true"><path d="M50 25Q18-13 2 18Q24 39 49 31Q75-12 98 19Q77 42 51 31Z" fill="#c8ffff" stroke="#75c0cd" stroke-width="2" opacity=".88"/><path d="M50 26L50 56" stroke="#3b9b95" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="20" r="5" fill="#3b9b95"/></svg>',
    fish: '<svg viewBox="0 0 106 54" aria-hidden="true"><path d="M76 25L104 8L99 26L104 47L76 30Z" fill="var(--fish-tail,#efab60)"/><path d="M9 26Q34-4 77 25Q41 59 9 26Z" fill="var(--fish-body,#ffd08a)" stroke="#9d7659" stroke-width="2.2"/><path d="M37 10Q42 24 38 44M59 11Q50 25 58 42" stroke="#ef8867" fill="none" stroke-width="9" opacity=".72"/><circle cx="21" cy="24" r="3" fill="#384f52"/><path d="M31 18L42 6L53 15" fill="var(--fish-body,#ffd08a)"/></svg>',
    rabbit: '<svg viewBox="0 0 130 85" aria-hidden="true"><g fill="var(--creature,#c69a70)" stroke="var(--creature-outline,#7c5a44)" stroke-width="2"><ellipse cx="73" cy="48" rx="37" ry="22" transform="rotate(-8 73 48)"/><ellipse cx="42" cy="34" rx="18" ry="17"/><ellipse cx="31" cy="13" rx="8" ry="22" transform="rotate(-17 31 13)"/><ellipse cx="47" cy="11" rx="7" ry="24" transform="rotate(9 47 11)"/><ellipse cx="108" cy="38" rx="11" ry="11" fill="#fff9ee"/><path class="nhi-creature-leg" d="M85 57Q114 72 121 65Q123 57 109 52" fill="none" stroke-width="9" stroke-linecap="round"/><path class="nhi-creature-leg" d="M49 58L30 75" fill="none" stroke-width="9" stroke-linecap="round"/></g><circle cx="34" cy="32" r="2.8" fill="#2a292d"/><circle cx="23" cy="39" r="2.6" fill="#b97f7b"/></svg>',
    fox: '<svg viewBox="0 0 148 75" aria-hidden="true"><path d="M18 38Q-6 4 15 12Q29 11 37 36Q83 7 115 35L143 18Q133 49 103 49Q85 65 47 50Q25 57 18 38Z" fill="var(--creature,#d28547)" stroke="var(--creature-outline,#814d35)" stroke-width="2"/><path d="M23 40L5 19L5 2L25 14L38 0L38 23L44 39Z" fill="var(--creature,#d28547)"/><path d="M7 20L22 29L35 22L23 43Z" fill="#fff0da"/><path d="M44 45Q66 53 96 39L107 47Q78 66 46 55Z" fill="#fff1dc"/><path class="nhi-creature-leg" d="M53 51L37 70M86 51L101 68" stroke="#6b503e" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="15" cy="26" r="3" fill="#28333a"/></svg>',
    squirrel: '<svg viewBox="0 0 125 84" aria-hidden="true"><path d="M55 39Q22 23 27 0Q2 7 3 31Q4 67 34 63Q37 84 72 73L92 57L77 34Z" fill="var(--creature,#b86a44)" stroke="var(--creature-outline,#704636)" stroke-width="2"/><ellipse cx="75" cy="48" rx="29" ry="18" fill="var(--creature,#b86a44)"/><circle cx="92" cy="33" r="16" fill="var(--creature,#b86a44)"/><path d="M88 21L94 10L105 20" fill="var(--creature,#b86a44)"/><circle cx="99" cy="32" r="2.7" fill="#26373b"/><path class="nhi-creature-leg" d="M63 58L45 76M85 62L106 76" stroke="#7f4938" stroke-width="7" fill="none" stroke-linecap="round"/></svg>',
    deer: '<svg viewBox="0 0 153 96" aria-hidden="true"><path d="M56 36Q83 24 112 36L116 44L134 24L148 30L144 40L128 50L112 49Q86 66 59 51Z" fill="var(--creature,#c5956c)" stroke="var(--creature-outline,#73543c)" stroke-width="2"/><path d="M141 27L141 7M141 14L151 3M141 19L130 5" stroke="var(--creature-outline,#73543c)" stroke-width="2.6" fill="none"/><path class="nhi-creature-leg" d="M68 50L59 92M109 52L124 92" stroke="#87664b" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="143" cy="31" r="2" fill="#2d353a"/></svg>',
    wind: '<svg viewBox="0 0 240 64" aria-hidden="true"><path d="M3 30Q70-5 135 24T236 14M29 48Q105 20 170 43" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></svg>',
    reeds: '<svg viewBox="0 0 180 140" aria-hidden="true"><g class="nhi-reed-blades" fill="none" stroke="var(--reed-color,#8faf77)" stroke-width="3.2" stroke-linecap="round"><path d="M83 138Q66 78 24 26M85 138Q98 63 151 13M82 138Q80 75 75 5M83 138Q41 104 9 75M87 138Q119 99 175 76"/></g></svg>'
  };
  var pulse=0;
  function add(kind, markup, props) {
    var node=document.createElement('span');
    node.className='nhi-life '+kind;
    if(markup) node.innerHTML=markup;
    props=props||{};
    Object.keys(props).forEach(function(k){node.style.setProperty(k,String(props[k]));});
    layer.appendChild(node);
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
    layer.dataset.season=season;
    layer.dataset.lighting=dark?'night':'day';
    if(reduced)return; // Everything animated here is decorative.
    var sky=dark?'#dce4ee':season==='winter'?'#526577':'#476b82';
    var animals=season==='winter'?['rabbit','fox']:season==='autumn'?['fox','squirrel','deer']:season==='summer'?['rabbit','squirrel']:['rabbit','squirrel'];
    var numbers={birds:phone?3:7, butterflies:phone?3:7, dragonflies:phone?1:4,
      fish:phone?3:6, clouds:phone?2:5, wind:phone?2:5, animals:phone?1:3,
      fireflies:phone?9:23, reeds:phone?2:4};
    if(dark){numbers.butterflies=Math.max(2,Math.floor(numbers.butterflies*.6));numbers.birds=Math.max(2,numbers.birds-2);}
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
    // Light butterflies at all hours; moon moths glow softly at night.
    for(var f=0;f<numbers.butterflies;f++){
      add('nhi-life-butterfly'+(dark?' night-moth':''),svg.butterfly,{
        '--x':(4+rand(f,14)*88)+'%',
        '--y':(35+rand(f,2)*34)+'%',
        '--duration':(7+rand(f,17)*8).toFixed(1)+'s',
        '--delay':(-rand(f,9)*16).toFixed(1)+'s',
        '--scale':(.38+rand(f,4)*.40).toFixed(2),
        '--wing-main':dark?'#ebf9b8':season==='autumn'?'#efc05b':season==='winter'?'#d9eefb':'#e9adca',
        '--wing-second':dark?'#cddfed':season==='autumn'?'#ef9b49':season==='winter'?'#b5daf5':'#c6b5ed'
      });
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
    // Visible aquatic shoals use the bottom stretch of water.
    for(var fish=0;fish<numbers.fish;fish++){
      var swimmer=add('nhi-life-fish',svg.fish,{
        '--y':(76+rand(fish,7)*13)+'%',
        '--scale':(.24+rand(fish,19)*.32).toFixed(2),
        '--duration':(12+rand(fish,23)*18).toFixed(1)+'s',
        '--delay':(-rand(fish,8)*33).toFixed(1)+'s',
        '--fish-body':fish%2?'#f8d8a7':'#fff0ce',
        '--fish-tail':fish%2?'#e58e58':'#e6b57d'
      });
      if(fish%2)swimmer.classList.add('reverse');
    }
    for(var cr=0;cr<numbers.animals;cr++){
      var animal=animals[cr%animals.length];
      add('nhi-life-creature',svg[animal],{
        '--y':(67+rand(cr,29)*15)+'%',
        '--size':(phone?51:70+cr*9)+'px',
        '--duration':(20+rand(cr,31)*19).toFixed(1)+'s',
        '--delay':(-rand(cr,27)*39).toFixed(1)+'s',
        '--creature':season==='winter'&&animal==='rabbit'?'#eff5ed':animal==='fox'?'#da9252':animal==='deer'?'#bb9a77':'#c7966e',
        '--creature-outline':season==='winter'?'#6e8594':'#80533b'
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