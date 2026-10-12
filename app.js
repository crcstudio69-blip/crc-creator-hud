/* CRC CREATOR STUDIO - app.js */
/* NO strict mode, ES5 compatible */

// ── STATE ──────────────────────────────
var S = {
  channels:[], schedules:[], animations:[],
  savedIdeas:[], scripts:[], competitors:[],
  todos:[], notifs:[], pipeline:[],
  activeScript:null, pickColor:'#ff0000',
  schFilter:'all', animFilter:'all',
  theme:'dark', username:'Creator', apiKey:'',
  curIdea:null, charts:{}, weekData:[0,0,0,0,0,0,0]
};
var CS_CAT = 'all';
var CS_CURRENT_IDEA = null;
var GEN_RESULTS = [];

// ── HELPERS ────────────────────────────
function gid(id){ return document.getElementById(id); }
function st(id,v){ var e=gid(id); if(e) e.textContent=String(v); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fn(n){
  n=parseInt(n)||0;
  if(n>=1000000000) return (n/1000000000).toFixed(1)+'B';
  if(n>=1000000) return (n/1000000).toFixed(1)+'M';
  if(n>=1000) return (n/1000).toFixed(1)+'K';
  return ''+n;
}
function pad2(x){ var s=''+x; return s.length<2?'0'+s:s; }

// ── SPLASH ─────────────────────────────
var _spTxts=['Memuat CRC Studio...','Menghubungkan channel...','Menyiapkan Content Studio...','Siap berkreasi!'];
var _spIdx=0;
var _spTmr=null;

function initSplash(){
  _spTmr=setInterval(function(){
    var e=gid('sp-txt');
    if(e) e.textContent=_spTxts[_spIdx++%_spTxts.length];
  },750);
  var w=gid('sp-particles');
  if(w){
    for(var i=0;i<20;i++){
      var p=document.createElement('div');
      p.className='sp-p';
      p.style.left=(Math.random()*100)+'%';
      p.style.animationDelay=(Math.random()*3)+'s';
      p.style.animationDuration=(2+Math.random()*2)+'s';
      w.appendChild(p);
    }
  }
}

// ── ENTRY POINT ────────────────────────
window.addEventListener('DOMContentLoaded',function(){
  initSplash();
  loadData();
  setTimeout(function(){
    clearInterval(_spTmr);
    var sp=gid('splash');
    if(sp) sp.style.opacity='0';
    setTimeout(function(){
      if(sp) sp.style.display='none';
      var app=gid('app');
      if(app) app.style.display='flex';
      try{ boot(); }catch(e){ console.error('[CRC] boot error:',e); }
    },400);
  },1500);
});

function boot(){
  if(S.theme==='light') document.body.classList.add('light-mode');
  startClock();
  initCRC();
  renderAll();
  firstLaunch();
  pushNotif('CRC Creator Studio berhasil dimuat!');
  pushNotif('Channel CRC STUDIO & MASTERCRC siap dipantau');
}

// ── SAVE / LOAD ────────────────────────
function save(){
  try{
    var d={
      channels:S.channels, schedules:S.schedules, animations:S.animations,
      savedIdeas:S.savedIdeas, scripts:S.scripts, competitors:S.competitors,
      todos:S.todos, theme:S.theme, username:S.username,
      apiKey:S.apiKey, weekData:S.weekData, pipeline:S.pipeline
    };
    localStorage.setItem('crc_v5',JSON.stringify(d));
  }catch(e){}
}
function loadData(){
  try{
    var raw=localStorage.getItem('crc_v5')||localStorage.getItem('crc_v4')||localStorage.getItem('crc_v3')||'{}';
    var d=JSON.parse(raw);
    S.channels    = d.channels    || [];
    S.schedules   = d.schedules   || [];
    S.animations  = d.animations  || [];
    S.savedIdeas  = d.savedIdeas  || [];
    S.scripts     = d.scripts     || [];
    S.competitors = d.competitors || [];
    S.todos       = d.todos       || [];
    S.pipeline    = d.pipeline    || [];
    S.theme       = d.theme       || 'dark';
    S.username    = d.username    || 'Creator';
    S.apiKey      = d.apiKey      || '';
    S.weekData    = d.weekData    || [0,0,0,0,0,0,0];
  }catch(e){}
}

// ── CLOCK ──────────────────────────────
function startClock(){
  setInterval(function(){
    var n=new Date(),e=gid('clock');
    if(e) e.textContent=pad2(n.getHours())+':'+pad2(n.getMinutes())+':'+pad2(n.getSeconds());
  },1000);
}
function heroDate(){
  var D=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  var M=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  var n=new Date(),e=gid('hero-date');
  if(e) e.textContent=D[n.getDay()]+', '+n.getDate()+' '+M[n.getMonth()]+' '+n.getFullYear();
}

// ── RENDER ALL ─────────────────────────
function renderAll(){
  // Tiap renderer dijalankan terpisah: kalau satu error / belum ada, yang lain tetap jalan
  var names=['heroDate','renderDash','renderCRCgrid','renderExtraGrid','renderSch','renderIdeas',
    'renderScriptList','renderAnims','renderComps','renderCompLessons','renderTools','renderThumbPage',
    'renderAnimTools','fillAnaSelects','renderAlgoTips','weekChart','renderPipeline'];
  for(var i=0;i<names.length;i++){
    try{
      if(typeof window[names[i]]==='function') window[names[i]]();
      else console.warn('[CRC] fungsi belum ada di app.js: '+names[i]);
    }catch(e){ console.error('[CRC] error di '+names[i]+':',e); }
  }
  try{ st('saved-count', S.savedIdeas.length); updatePipelineBadge(); }catch(e){ console.error(e); }
}

function updatePipelineBadge(){
  var active=S.pipeline.filter(function(p){ return !p.uploaded; }).length;
  st('pipeline-count', active);
  st('d-pipeline', active);
}

// ── NAVIGATION ─────────────────────────
var PAGE_TITLES={
  dashboard:'Dashboard', channels:'Channel Manager', schedule:'Jadwal Upload',
  ideas:'Content Studio', script:'Script Editor', analytics:'Analitik & SEO',
  competitor:'Analisa Kompetitor', animation:'Animasi Minecraft',
  thumbnail:'Thumbnail Planner', tools:'Tools & Resources'
};
function nav(p){
  var pages=document.querySelectorAll('.page');
  for(var i=0;i<pages.length;i++) pages[i].classList.remove('active');
  var navs=document.querySelectorAll('.ni');
  for(var j=0;j<navs.length;j++) navs[j].classList.remove('active');
  var pg=gid('page-'+p), ni=document.querySelector('[data-page="'+p+'"]');
  if(pg) pg.classList.add('active');
  if(ni) ni.classList.add('active');
  st('tb-title', PAGE_TITLES[p]||p);
  st('tb-sub', 'CRC Creator Studio \u203a '+(PAGE_TITLES[p]||p));
  var np=gid('notif-panel'); if(np) np.style.display='none';
  if(p==='analytics') setTimeout(updateAna,100);
  if(p==='animation') renderAnimTools();
}
function toggleSidebar(){
  var sb=gid('sidebar'); if(!sb) return;
  if(window.innerWidth<=600) sb.classList.toggle('mob-open');
  else sb.classList.toggle('collapsed');
}
function toggleTheme(){
  S.theme=S.theme==='dark'?'light':'dark';
  document.body.classList.toggle('light-mode');
  var ic=gid('theme-ic');
  if(ic) ic.className=S.theme==='light'?'fas fa-sun':'fas fa-moon';
  save();
}

// ── TOAST ──────────────────────────────
function toast(type,msg){
  var icons={ok:'[OK]',err:'[ERR]',info:'[?]'};
  var el=document.createElement('div');
  el.className='toast '+type;
  el.innerHTML='<span>'+(icons[type]||'i')+'</span><span>'+esc(msg)+'</span>';
  var w=gid('toasts'); if(w) w.appendChild(el);
  setTimeout(function(){
    el.style.animation='tOut .3s ease forwards';
    setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); },300);
  },3200);
}

// ── MODAL ──────────────────────────────
function closeModal(id){ var m=gid(id); if(m) m.style.display='none'; }
window.addEventListener('click',function(e){
  if(e.target && e.target.classList && e.target.classList.contains('modal')) e.target.style.display='none';
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    var modals=document.querySelectorAll('.modal');
    for(var i=0;i<modals.length;i++) modals[i].style.display='none';
    var np=gid('notif-panel'); if(np) np.style.display='none';
  }
});

// ── NOTIFICATIONS ──────────────────────
function pushNotif(msg){
  S.notifs.unshift({msg:msg, time:new Date().toLocaleTimeString('id-ID')});
  if(S.notifs.length>30) S.notifs.pop();
  var d=gid('nb-dot'); if(d) d.style.display='flex';
}
function toggleNotif(){
  var p=gid('notif-panel'); if(!p) return;
  p.style.display=(p.style.display==='none'?'block':'none');
  if(p.style.display==='block') renderNotifs();
}
function renderNotifs(){
  var el=gid('notif-body'); if(!el) return;
  if(!S.notifs.length){ el.innerHTML='<div class="np-empty">Tidak ada notifikasi</div>'; return; }
  var html='';
  for(var i=0;i<S.notifs.length;i++){
    html+='<div class="np-item"><div class="np-time">'+S.notifs[i].time+'</div>'+esc(S.notifs[i].msg)+'</div>';
  }
  el.innerHTML=html;
}
function clearNotifs(){
  S.notifs=[];
  var d=gid('nb-dot'); if(d) d.style.display='none';
  var el=gid('notif-body'); if(el) el.innerHTML='<div class="np-empty">Tidak ada notifikasi</div>';
}

// ── SETTINGS ───────────────────────────
function openSettings(){
  var sn=gid('set-name'); if(sn) sn.value=S.username;
  var ss=gid('set-streak'); if(ss) ss.value=localStorage.getItem('crc_streak')||'0';
  var m=gid('m-settings'); if(m) m.style.display='flex';
}
function saveSettings(){
  var n=gid('set-name'); n=n?n.value.trim():'';
  if(n){ S.username=n; st('hero-name',n); st('sb-name',n); var av=gid('sb-av'); if(av) av.textContent=n.charAt(0).toUpperCase(); }
  var ss=gid('set-streak'); localStorage.setItem('crc_streak',ss?ss.value||'0':'0');
  save(); closeModal('m-settings'); toast('ok','Pengaturan disimpan!');
}
function resetData(){
  if(!confirm('Hapus SEMUA data?')) return;
  localStorage.clear(); toast('info','Direset...');
  setTimeout(function(){ location.reload(); },1200);
}
function firstLaunch(){
  if(!localStorage.getItem('crc_launched')){
    localStorage.setItem('crc_launched','1');
    setTimeout(function(){
      var n=prompt('Nama Creator-mu?','Creator');
      if(n&&n.trim()){
        S.username=n.trim(); save();
        st('hero-name',n.trim()); st('sb-name',n.trim());
        var av=gid('sb-av'); if(av) av.textContent=n.trim().charAt(0).toUpperCase();
        toast('ok','Selamat datang, '+n.trim()+'!');
      }
    },600);
  }else{
    st('hero-name',S.username); st('sb-name',S.username);
    var av=gid('sb-av'); if(av) av.textContent=S.username.charAt(0).toUpperCase();
  }
}

// ── API KEY ─────────────────────────────
function openApiModal(){
  var el=gid('api-key-in');
  if(el) el.value=S.apiKey?'....'+S.apiKey.slice(-4):'';
  var m=gid('m-api'); if(m) m.style.display='flex';
}
function toggleKeyVis(inputId,btn){
  var inp=gid(inputId); if(!inp) return;
  var show=(inp.type==='password');
  inp.type=show?'text':'password';
  btn.innerHTML=show?'<i class="fas fa-eye-slash"></i>':'<i class="fas fa-eye"></i>';
}
function saveApiKey(){
  var k=gid('api-key-in'); k=k?k.value.trim():'';
  if(k&&k.charAt(0)!=='.') S.apiKey=k;
  save(); closeModal('m-api');
  if(S.apiKey){ toast('ok','YouTube API Key disimpan!'); setTimeout(refreshChannels,800); }
}

// ── CRC CHANNELS ───────────────────────
var CRC_DEF=[
  {id:'crc-studio',name:'CRC STUDIO',handle:'@studiocrc612',url:'https://youtube.com/@studiocrc612',category:'animation',color:'#ff2200',desc:'Channel animasi Minecraft & gaming berkualitas tinggi.',subs:0,views:0,videos:0,isCRC:true,lastUpdated:null},
  {id:'mastercrc',name:'MASTERCRC (CRC)',handle:'@mastercrc',url:'https://youtube.com/@mastercrc',category:'minecraft',color:'#cc0000',desc:'Channel Minecraft gaming utama CRC. Survival, challenge, gaming seru!',subs:0,views:0,videos:0,isCRC:true,lastUpdated:null}
];
function initCRC(){
  for(var i=0;i<CRC_DEF.length;i++){
    var def=CRC_DEF[i];
    if(!S.channels.find(function(c){ return c.id===def.id; })){
      var ch={}; for(var k in def) ch[k]=def[k];
      S.channels.unshift(ch);
    }
  }
  updateCRCbar();
}
function updateCRCbar(){
  var c1=null,c2=null;
  for(var i=0;i<S.channels.length;i++){
    if(S.channels[i].id==='crc-studio') c1=S.channels[i];
    if(S.channels[i].id==='mastercrc')  c2=S.channels[i];
  }
  function sb(p,ch){
    if(!ch) return;
    st(p+'-subs', ch.subs?fn(ch.subs):'Update');
    st(p+'-views',ch.views?fn(ch.views):'—');
    st(p+'-vids', ch.videos?fn(ch.videos):'—');
  }
  sb('c1',c1); sb('c2',c2);
}
function refreshChannels(){
  var ic=gid('refresh-ic'); if(ic) ic.classList.add('spinning');
  if(!S.apiKey){ toast('info','Masukkan YouTube API Key!'); setTimeout(openApiModal,600); }
  else{
    fetchYT('studiocrc612','crc-studio',function(){
      fetchYT('mastercrc','mastercrc',function(){
        renderCRCgrid(); renderExtraGrid(); renderDash(); updateCRCbar(); fillAnaSelects();
        setApiStatus(true); toast('ok','Data channel diupdate!');
      });
    });
  }
  setTimeout(function(){ var ic=gid('refresh-ic'); if(ic) ic.classList.remove('spinning'); },1400);
}
function fetchYT(handle,chId,cb){
  var url='https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle='+handle+'&key='+S.apiKey;
  fetch(url).then(function(r){ return r.json(); }).then(function(d){
    if(d.items&&d.items[0]){
      var st2=d.items[0].statistics;
      for(var i=0;i<S.channels.length;i++){
        if(S.channels[i].id===chId){
          S.channels[i].subs  =parseInt(st2.subscriberCount)||S.channels[i].subs;
          S.channels[i].views =parseInt(st2.viewCount)||S.channels[i].views;
          S.channels[i].videos=parseInt(st2.videoCount)||S.channels[i].videos;
          S.channels[i].lastUpdated=new Date().toLocaleString('id-ID');
          save(); break;
        }
      }
    }
    if(cb) cb();
  }).catch(function(){ if(cb) cb(); });
}
function setApiStatus(on){
  var b=gid('api-badge'); if(!b) return;
  b.className='api-badge'+(on?' on':'');
  b.innerHTML='<i class="fas fa-circle"></i> API: '+(on?'Connected':'Offline');
}
function fetchAllCh(){ refreshChannels(); }
function chCardHTML(ch){
  var cats={minecraft:'Minecraft',animation:'Animasi',gaming:'Gaming',tutorial:'Tutorial',shorts:'Shorts'};
  var html='<div class="ch-card">';
  html+='<div class="ch-top" style="background:linear-gradient(90deg,'+ch.color+',transparent)"></div>';
  html+='<div class="ch-head"><div class="ch-av" style="background:'+ch.color+'">'+ch.name.charAt(0)+'</div>';
  html+='<div><div class="ch-name-txt">'+esc(ch.name)+'</div><div class="ch-cat-txt">'+(cats[ch.category]||ch.category)+'</div></div>';
  html+='<div class="live-badge" style="margin-left:auto"><div class="live-dot"></div>LIVE</div></div>';
  if(ch.handle) html+='<div class="ch-handle-row"><i class="fab fa-youtube"></i>'+esc(ch.handle)+'</div>';
  html+='<div class="ch-stats">';
  html+='<div class="chs"><div class="chs-n" style="color:'+ch.color+'">'+fn(ch.subs)+'</div><div class="chs-l">Subscribers</div></div>';
  html+='<div class="chs"><div class="chs-n" style="color:'+ch.color+'">'+fn(ch.views)+'</div><div class="chs-l">Views</div></div>';
  html+='<div class="chs"><div class="chs-n" style="color:'+ch.color+'">'+fn(ch.videos)+'</div><div class="chs-l">Video</div></div>';
  html+='</div>';
  if(ch.desc) html+='<div style="font-size:12px;color:var(--muted);margin-bottom:10px;line-height:1.5">'+esc(ch.desc)+'</div>';
  if(ch.lastUpdated) html+='<div class="ch-updated">'+esc(ch.lastUpdated)+'</div>';
  html+='<div class="ch-btns">';
  if(ch.url) html+='<button class="ch-btn open" onclick="window.open(\''+esc(ch.url)+'\',\'_blank\')"><i class="fas fa-external-link-alt"></i> Buka</button>';
  html+='<button class="ch-btn" onclick="quickUpdateCh(\''+ch.id+'\')"><i class="fas fa-edit"></i> Update</button>';
  if(!ch.isCRC) html+='<button class="ch-btn del" onclick="deleteCh(\''+ch.id+'\')"><i class="fas fa-trash"></i></button>';
  html+='</div></div>';
  return html;
}
function renderCRCgrid(){
  var g=gid('crc-grid'); if(!g) return;
  var html='';
  for(var i=0;i<S.channels.length;i++){ if(S.channels[i].isCRC) html+=chCardHTML(S.channels[i]); }
  g.innerHTML=html;
}
function renderExtraGrid(){
  var g=gid('extra-grid'); if(!g) return;
  var ex=[]; for(var i=0;i<S.channels.length;i++){ if(!S.channels[i].isCRC) ex.push(S.channels[i]); }
  if(!ex.length){ g.innerHTML='<div class="ch-empty"><i class="fab fa-youtube"></i><p>Belum ada channel tambahan.</p><button class="btn-pri" onclick="openAddCh()"><i class="fas fa-plus"></i> Tambah</button></div>'; return; }
  var html=''; for(var j=0;j<ex.length;j++) html+=chCardHTML(ex[j]);
  g.innerHTML=html;
}
function openAddCh(){
  var ids=['ch-name','ch-handle','ch-url','ch-subs','ch-views','ch-vids','ch-desc'];
  for(var i=0;i<ids.length;i++){ var e=gid(ids[i]); if(e) e.value=''; }
  var m=gid('m-addch'); if(m) m.style.display='flex';
}
function pickCol(c,el){
  S.pickColor=c;
  var cos=document.querySelectorAll('.co'); for(var i=0;i<cos.length;i++) cos[i].classList.remove('sel');
  el.classList.add('sel');
}
function saveChannel(){
  var ne=gid('ch-name'); var name=ne?ne.value.trim():'';
  if(!name){ toast('err','Nama tidak boleh kosong!'); return; }
  function v(id){ var e=gid(id); return e?e.value:''; }
  S.channels.push({
    id:''+Date.now(), name:name, handle:v('ch-handle'), url:v('ch-url'),
    category:v('ch-cat')||'minecraft', subs:parseInt(v('ch-subs'))||0,
    views:parseInt(v('ch-views'))||0, videos:parseInt(v('ch-vids'))||0,
    desc:v('ch-desc'), color:S.pickColor, isCRC:false, lastUpdated:null
  });
  save(); closeModal('m-addch'); renderExtraGrid(); renderDash(); fillAnaSelects();
  toast('ok','Channel "'+name+'" ditambahkan!');
}
function quickUpdateCh(id){
  var ch=null; for(var i=0;i<S.channels.length;i++){ if(S.channels[i].id===id){ ch=S.channels[i]; break; } }
  if(!ch) return;
  var s=prompt('Subscriber:',ch.subs); if(s===null) return;
  var v=prompt('Views:',ch.views); if(v===null) return;
  var vid=prompt('Video:',ch.videos); if(vid===null) return;
  ch.subs=parseInt(s)||ch.subs; ch.views=parseInt(v)||ch.views; ch.videos=parseInt(vid)||ch.videos;
  ch.lastUpdated=new Date().toLocaleString('id-ID');
  save(); renderCRCgrid(); renderExtraGrid(); renderDash(); updateCRCbar(); fillAnaSelects();
  toast('ok','Stats diupdate!');
}
function deleteCh(id){
  if(!confirm('Hapus channel?')) return;
  S.channels=S.channels.filter(function(c){ return c.id!==id; });
  save(); renderExtraGrid(); renderDash();
}

// ── DASHBOARD ──────────────────────────
var TIPS=[
  'Target CTR 4-10%. Thumbnail merah dramatis + teks besar!',
  'Hook 30 detik pertama penting. Mulai dengan momen paling seru!',
  'Konsisten 2x seminggu lebih efektif dari 7x lalu berhenti.',
  'Balas komentar 24 jam pertama = sinyal kuat ke algoritma!',
  'Buat Shorts dari cuplikan video. Cara gratis dapat subscriber baru!',
  'Keyword "Minecraft Indonesia 2025" banyak dicari!',
  'Collab dengan channel sejenis = penonton mereka bisa jadi subscriber!',
  'Cek YouTube Analytics tiap minggu. Video mana paling ditonton?',
  'Animasi Minecraft 1-3 menit lebih mudah viral.',
  'End Screen ke video lain — satu penonton bisa nonton 3-5 video!'
];
var MOTS=[
  '"Satu video hari ini lebih baik dari seribu video dalam pikiran." — CRC',
  '"Algoritma YouTube menyukai konsistensi. Upload hari ini, lagi besok!"',
  '"Setiap YouTuber sukses pernah 0 subscriber. Yang beda? Tidak berhenti."',
  '"Animasi Minecraft pertamamu tidak harus sempurna. Yang penting ada!"',
  '"CRC bukan cuma channel — ini karya seni yang terus berkembang!"'
];
var _tipIdx=0, _motIdx=0;

function renderDash(){
  var tS=0,tV=0,tVid=0;
  for(var i=0;i<S.channels.length;i++){
    tS+=parseInt(S.channels[i].subs)||0;
    tV+=parseInt(S.channels[i].views)||0;
    tVid+=parseInt(S.channels[i].videos)||0;
  }
  var streak=parseInt(localStorage.getItem('crc_streak')||'0');
  var done=S.schedules.filter(function(s){return s.done;}).length;
  st('d-subs',fn(tS)); st('d-views',fn(tV)); st('d-vids',fn(tVid));
  st('d-streak',streak); st('d-done',done);
  updateLevel(tS);
  renderNextUpload();
  renderTodos();
  st('tip-box', TIPS[_tipIdx%TIPS.length]);
  st('mot-box', MOTS[_motIdx%MOTS.length]);
  updateCRCbar();
  st('hero-name', S.username);
  st('sb-name', S.username);
}
function nextTip(){ _tipIdx++; st('tip-box', TIPS[_tipIdx%TIPS.length]); }
function nextMot(){ _motIdx++; st('mot-box', MOTS[_motIdx%MOTS.length]); }

function updateLevel(subs){
  var lvs=[
    {min:0,max:99,name:'Beginner',e:'🌱'},
    {min:100,max:999,name:'Rookie Creator',e:'⚡'},
    {min:1000,max:9999,name:'Rising Star',e:'⭐'},
    {min:10000,max:99999,name:'Content Master',e:'🏆'},
    {min:100000,max:999999,name:'YouTube Pro',e:'💎'},
    {min:1000000,max:9999999999,name:'Legendary',e:'👑'}
  ];
  var lv=lvs[0];
  for(var i=0;i<lvs.length;i++){ if(subs>=lvs[i].min&&subs<=lvs[i].max){ lv=lvs[i]; break; } }
  var pct=lv.max>1000000?100:Math.min(100,((subs-lv.min)/(lv.max-lv.min)*100));
  st('lv-e',lv.e); st('lv-n',lv.name);
  st('lv-xp',fn(subs)+' / '+fn(lv.max>1000000?1000000:lv.max+1)+' Sub');
  st('sb-lv',lv.name);
  var bar=gid('lv-fill'); if(bar) bar.style.width=pct+'%';
  var ms=[
    {t:'Channel dibuat',done:true},
    {t:'100 Subscriber',done:subs>=100,near:subs>=50},
    {t:'1.000 Subscriber',done:subs>=1000,near:subs>=500},
    {t:'10.000 Subscriber',done:subs>=10000,near:subs>=5000},
    {t:'100K Silver',done:subs>=100000},
    {t:'1M Gold',done:subs>=1000000}
  ];
  var html='';
  for(var j=0;j<ms.length;j++){
    var cls=ms[j].done?'done':ms[j].near?'near':'';
    var icon=ms[j].done?'✅':ms[j].near?'🔥':'🔒';
    html+='<div class="ms '+cls+'">'+icon+' '+ms[j].t+'</div>';
  }
  var mel=gid('milestones'); if(mel) mel.innerHTML=html;
}

function renderNextUpload(){
  var el=gid('next-upload'); if(!el) return;
  var up=S.schedules.filter(function(s){return !s.done;}).sort(function(a,b){return new Date(a.date+'T'+a.time)-new Date(b.date+'T'+b.time);});
  if(!up.length){
    el.innerHTML='<div class="nu-empty"><i class="fas fa-calendar-plus"></i><p>Belum ada jadwal.</p><button class="btn-pri" onclick="nav(\'schedule\')"><i class="fas fa-plus"></i> Buat Jadwal</button></div>';
    return;
  }
  var nx=up[0], d=new Date(nx.date+'T'+nx.time), diff=d-new Date();
  var days=Math.floor(diff/86400000), hrs=Math.floor((diff%86400000)/3600000), mins=Math.floor((diff%3600000)/60000);
  var cd=diff<0?'Terlambat!':days>0?(days+'h '+hrs+'j lagi'):hrs>0?(hrs+'j '+mins+'m lagi'):mins>0?(mins+' mnt lagi'):'Sekarang!';
  el.innerHTML='<div class="nu-box"><div class="nu-date">'+d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'})+'</div><div class="nu-title">'+esc(nx.title)+'</div><div class="nu-meta">'+esc(nx.channel||'')+'  '+nx.time+'</div><div class="nu-cd"><i class="fas fa-clock"></i> '+cd+'</div></div>';
}

function renderTodos(){
  var el=gid('todo-wrap'); if(!el) return;
  if(!S.todos.length){ el.innerHTML='<div class="todo-empty">Belum ada tugas. Klik + untuk tambah!</div>'; return; }
  var ic={upload:'📤',edit:'✂️',record:'🎙️',design:'🎨',research:'🔍',other:'📌'};
  var html='';
  for(var i=0;i<S.todos.length;i++){
    var t=S.todos[i];
    html+='<div class="todo-item '+(t.done?'done':'')+'"><button class="todo-chk '+(t.done?'on':'')+'" onclick="toggleTodo(\''+t.id+'\')"></button><span class="todo-txt">'+esc(t.text)+'</span><span class="todo-cat">'+(ic[t.cat]||'📌')+' '+t.cat+'</span><button class="todo-del" onclick="delTodo(\''+t.id+'\')"><i class="fas fa-times"></i></button></div>';
  }
  el.innerHTML=html;
}
function openTodoModal(){ var e=gid('todo-in');if(e)e.value=''; var m=gid('m-todo');if(m)m.style.display='flex'; }
function saveTodo(){
  var el=gid('todo-in'), text=el?el.value.trim():'';
  if(!text){ toast('err','Tugas tidak boleh kosong!'); return; }
  var cat=gid('todo-cat');
  S.todos.push({id:''+Date.now(),text:text,cat:cat?cat.value:'other',done:false});
  save(); closeModal('m-todo'); renderTodos();
}
function toggleTodo(id){ for(var i=0;i<S.todos.length;i++){if(S.todos[i].id===id){S.todos[i].done=!S.todos[i].done;break;}} save();renderTodos(); }
function delTodo(id){ S.todos=S.todos.filter(function(x){return x.id!==id;}); save();renderTodos(); }

function weekChart(){
  var ctx=gid('weekly-chart'); if(!ctx) return;
  try{ if(S.charts.weekly) S.charts.weekly.destroy(); }catch(e){}
  S.charts.weekly=new Chart(ctx,{
    type:'bar',
    data:{labels:['Sen','Sel','Rab','Kam','Jum','Sab','Min'],datasets:[{label:'Upload',data:S.weekData,backgroundColor:'rgba(230,0,0,.4)',borderColor:'#e60000',borderWidth:2,borderRadius:6}]},
    options:{responsive:true,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#886060'},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'#886060',stepSize:1},grid:{color:'rgba(255,255,255,.04)'},beginAtZero:true}}}
  });
}

// ── SCHEDULE ───────────────────────────
function openAddSch(){
  var sel=gid('sch-ch');
  if(sel) sel.innerHTML=S.channels.length?S.channels.map(function(c){return '<option value="'+esc(c.name)+'">'+esc(c.name)+'</option>';}).join(''):'<option>Tambah channel dulu</option>';
  var ids=['sch-title','sch-kw','sch-notes']; for(var i=0;i<ids.length;i++){var e=gid(ids[i]);if(e)e.value='';}
  var sd=gid('sch-date'); if(sd) sd.value=new Date().toISOString().split('T')[0];
  var m=gid('m-addsch'); if(m) m.style.display='flex';
}
function saveSch(){
  var te=gid('sch-title'), title=te?te.value.trim():'';
  if(!title){ toast('err','Judul tidak boleh kosong!'); return; }
  function v(id){ var e=gid(id); return e?e.value:''; }
  var sch={id:''+Date.now(),title:title,channel:v('sch-ch'),type:v('sch-type'),date:v('sch-date'),time:v('sch-time'),priority:v('sch-prio'),status:v('sch-status'),keywords:v('sch-kw'),notes:v('sch-notes'),done:false};
  S.schedules.push(sch);
  var day=new Date(sch.date).getDay(); S.weekData[day===0?6:day-1]++;
  save(); closeModal('m-addsch'); renderSch(); renderDash(); weekChart();
  toast('ok','Jadwal "'+title+'" ditambahkan!');
}
function filtSch(f,btn){
  S.schFilter=f;
  var bs=document.querySelectorAll('#page-schedule .filt'); for(var i=0;i<bs.length;i++) bs[i].classList.remove('active');
  btn.classList.add('active'); renderSch();
}
function renderSch(){
  var list=gid('sch-list'); if(!list) return;
  var items=S.schedules.slice().sort(function(a,b){return new Date(a.date+'T'+a.time)-new Date(b.date+'T'+b.time);});
  if(S.schFilter==='upcoming') items=items.filter(function(s){return !s.done&&new Date(s.date+'T'+s.time)>=new Date();});
  else if(S.schFilter==='overdue') items=items.filter(function(s){return !s.done&&new Date(s.date+'T'+s.time)<new Date();});
  else if(S.schFilter==='done') items=items.filter(function(s){return s.done;});
  var tot=S.schedules.length, dn=S.schedules.filter(function(s){return s.done;}).length;
  var late=S.schedules.filter(function(s){return !s.done&&new Date(s.date+'T'+s.time)<new Date();}).length;
  var pct=tot?Math.round(dn/tot*100):0;
  st('ss-total',tot); st('ss-done',dn); st('ss-late',late); st('cr-pct',pct+'%');
  var fill=gid('cr-fill'); if(fill) fill.style.width=pct+'%';
  if(!items.length){ list.innerHTML='<div class="sch-empty"><i class="fas fa-calendar-alt"></i><p>Tidak ada jadwal.</p></div>'; return; }
  var TI={minecraft:'⛏️',animation:'🎬',gaming:'🎮',tutorial:'📚',short:'📱',live:'🔴'};
  var html='';
  for(var i=0;i<items.length;i++){
    var s=items[i], d=new Date(s.date+'T'+s.time), od=!s.done&&d<new Date();
    html+='<div class="sch-item '+(s.done?'done':'')+' '+(od?'overdue':'')+'"><div class="prio-dot '+s.priority+'"></div><div class="sch-info"><div class="sch-ttl">'+(TI[s.type]||'📹')+' '+esc(s.title)+'</div><div class="sch-meta"><span>'+d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})+'</span><span>'+s.time+'</span>'+(s.channel?'<span>'+esc(s.channel)+'</span>':'')+(od?'<span style="color:var(--red)">Terlambat!</span>':'')+'</div></div><div class="sch-btns"><button class="sch-b ck" onclick="toggleDone(\''+s.id+'\')"><i class="fas fa-'+(s.done?'undo':'check')+'"></i></button><button class="sch-b dl" onclick="delSch(\''+s.id+'\')"><i class="fas fa-trash"></i></button></div></div>';
  }
  list.innerHTML=html;
}
function toggleDone(id){
  var s=null; for(var i=0;i<S.schedules.length;i++){if(S.schedules[i].id===id){s=S.schedules[i];break;}}
  if(!s) return; s.done=!s.done;
  if(s.done){ var st2=parseInt(localStorage.getItem('crc_streak')||'0'); localStorage.setItem('crc_streak',st2+1); toast('ok','Upload selesai! Streak +1'); }
  save(); renderSch(); renderDash();
}
function delSch(id){ S.schedules=S.schedules.filter(function(s){return s.id!==id;}); save(); renderSch(); renderDash(); }

// ── CONTENT STUDIO ─────────────────────
var CC={minecraft:'rgba(76,175,80,.15)',animation:'rgba(150,50,255,.1)',gaming:'rgba(0,150,255,.1)',tutorial:'rgba(255,170,0,.1)',shorts:'rgba(230,0,0,.1)',challenge:'rgba(255,100,0,.1)',collab:'rgba(0,200,200,.1)',review:'rgba(200,200,0,.1)',vlog:'rgba(100,150,255,.1)',livestream:'rgba(255,50,50,.1)'};
var CB={minecraft:'#4caf50',animation:'#aa55ff',gaming:'#55aaff',tutorial:'#ffaa00',shorts:'#ff4444',challenge:'#ff6600',collab:'#00cccc',review:'#cccc00',vlog:'#6699ff',livestream:'#ff2222'};
var CN={minecraft:'Minecraft',animation:'Animasi',gaming:'Gaming',tutorial:'Tutorial',shorts:'Shorts',challenge:'Challenge',collab:'Kolaborasi',review:'Review',vlog:'Vlog',livestream:'Live'};

function csTab(tab,btn){
  var tabs=document.querySelectorAll('.cs-tab'); for(var i=0;i<tabs.length;i++) tabs[i].classList.remove('active');
  var panels=document.querySelectorAll('.cs-panel'); for(var j=0;j<panels.length;j++) panels[j].classList.remove('active');
  btn.classList.add('active');
  var panel=gid('cs-'+tab); if(panel) panel.classList.add('active');
  if(tab==='pipeline') renderPipeline();
}
function csSetCat(cat,btn){
  CS_CAT=cat;
  var cats=document.querySelectorAll('.cs-cat'); for(var i=0;i<cats.length;i++) cats[i].classList.remove('active');
  btn.classList.add('active'); renderIdeas();
}

// ── GENERATOR ──────────────────────────
var KW_CATS={
  minecraft:['minecraft','survival','bedwars','skyblock','manhunt','creeper','nether','build','craft','block','steve','diamond'],
  animation:['animasi','animation','anime','mineimator','parodi','komedi','lucu','cerita','story','lore'],
  gaming:['game','gaming','gamer','play','main','horror','indie','roblox','fps','rpg','valorant','mobile'],
  tutorial:['tutorial','cara','tips','belajar','setup','guide','panduan','pemula','edit','thumbnail'],
  shorts:['shorts','short','viral','trending','cepat','singkat'],
  challenge:['challenge','tantangan','mustahil','tanpa','impossible','hardcore'],
  collab:['collab','kolaborasi','vs','versus','bareng','bersama'],
  review:['review','ulasan','unboxing','test','rating','terbaik'],
  livestream:['live','stream','streaming','siaran','langsung'],
  vlog:['vlog','daily','sehari','kehidupan','behind']
};
function detectCat(kw){
  var kl=kw.toLowerCase(), best='minecraft', bestScore=0;
  var keys=Object.keys(KW_CATS);
  for(var i=0;i<keys.length;i++){
    var score=0; var arr=KW_CATS[keys[i]];
    for(var j=0;j<arr.length;j++){ if(kl.indexOf(arr[j])>=0) score++; }
    if(score>bestScore){ bestScore=score; best=keys[i]; }
  }
  return best;
}

var GEN_TPLS=[
  {t:'Survival {n} Hari {mod} — Dokumentasi Lengkap',d:'Tantang bertahan {n} hari di mode {mod}. Dokumentasikan setiap momen!',h:'Hari ini gue memulai tantangan paling gila...',v:'5K-50K',tm:'2-3 hari',vrl:'high'},
  {t:'Build {obj} EPIC dalam {n} Jam!',d:'Speed build dengan timer ketat. Drama dan chaos dalam satu video!',h:'{n} jam, satu {obj} epic. Apakah mungkin?',v:'3K-30K',tm:'1 hari',vrl:'high'},
  {t:'{n} Hal Tersembunyi yang Jarang Diketahui',d:'Tips dan fakta tersembunyi. Format list yang selalu viral!',h:'{n} hal yang bahkan pemain lama tidak tahu...',v:'5K-60K',tm:'6 jam',vrl:'high'},
  {t:'Challenge: Bisakah Gue Selesaikan?',d:'Challenge menegangkan dengan rules unik yang bikin penonton terus nonton!',h:'Rules: aturan unik. Bisakah gue selesaikan ini?',v:'3K-20K',tm:'1 hari',vrl:'med'},
  {t:'Gue Coba {kw} dan Ini yang Terjadi',d:'Format eksperimen yang selalu menghasilkan konten menarik dan relatable.',h:'Tidak ada yang tahu apa yang akan terjadi ketika gue mencoba ini...',v:'2K-20K',tm:'1 hari',vrl:'med'},
  {t:'Panduan Lengkap {kw} untuk Pemula 2025',d:'Tutorial step-by-step yang mudah diikuti. Konten evergreen yang terus dicari!',h:'Setelah nonton ini, kamu akan bisa melakukannya.',v:'3K-25K',tm:'6 jam',vrl:'safe'},
  {t:'{n} Tips {kw} yang Wajib Kamu Tahu',d:'Tips praktis yang langsung bisa diterapkan. Selalu dapat engagement tinggi!',h:'{n} tips ini akan mengubah cara kamu melakukannya selamanya.',v:'4K-30K',tm:'6 jam',vrl:'med'},
  {t:'POV: Pertama Kali Mencoba {kw}',d:'Format POV yang viral di Shorts. Relatable dan nostalgic!',h:'POV: kamu baru pertama kali mencoba ini...',v:'10K-200K',tm:'2 jam',vrl:'high'},
  {t:'{kw} tapi Ada Twist Unik!',d:'Format klasik dengan twist yang bikin penonton penasaran dari awal.',h:'Gue main hari ini, tapi ada satu aturan yang mengubah segalanya...',v:'4K-40K',tm:'1-2 hari',vrl:'high'},
  {t:'Review Jujur: {kw} Terbaik vs Terburuk',d:'Tier list yang selalu menarik perdebatan. Konten evergreen yang terus dicari!',h:'Gue akan rating semua ini secara jujur, dan hasilnya mungkin mengejutkan...',v:'3K-25K',tm:'6 jam',vrl:'high'}
];
var _NUMS=['3','5','7','10','100','24'];
var _MODS=['Hardcore','Survival','Creative'];
var _OBJS=['castle','rumah megah','pixel art','kota','menara'];

function fillTpl(tpl,kw){
  var kCap=kw?kw.charAt(0).toUpperCase()+kw.slice(1):'Konten';
  return tpl
    .replace(/\{kw\}/g,kCap)
    .replace(/\{n\}/g,_NUMS[Math.floor(Math.random()*_NUMS.length)])
    .replace(/\{mod\}/g,_MODS[Math.floor(Math.random()*_MODS.length)])
    .replace(/\{obj\}/g,_OBJS[Math.floor(Math.random()*_OBJS.length)]);
}

function generateIdeas(){
  var kwEl=gid('gen-keyword'); var kw=kwEl?kwEl.value.trim():'';
  if(!kw){ toast('err','Masukkan kata kunci dulu!'); return; }
  var countEl=gid('gen-count'); var count=parseInt(countEl?countEl.value:10)||10;
  var cat=detectCat(kw);
  var tpls=GEN_TPLS.slice().sort(function(){return Math.random()-.5;});
  var results=[];
  for(var i=0;i<Math.min(count,tpls.length);i++){
    results.push({
      id:'gen_'+Date.now()+'_'+i, cat:cat,
      title:fillTpl(tpls[i].t,kw), desc:fillTpl(tpls[i].d,kw),
      hook:fillTpl(tpls[i].h,kw), views:tpls[i].v,
      time:tpls[i].tm, viral:tpls[i].vrl,
      tags:[kw.toLowerCase(),'minecraft','crc']
    });
  }
  GEN_RESULTS=results;
  var empty=gid('gen-empty-state'), res=gid('gen-results');
  if(empty) empty.style.display='none';
  if(res) res.style.display='block';
  st('gen-results-title','Hasil untuk: "'+kw+'"');
  st('gen-results-count',results.length+' ide');
  var grid=gid('gen-cards'); if(!grid) return;
  var vLbl={high:'Viral Tinggi',med:'Viral Sedang',safe:'Viral Stabil'};
  var vCls={high:'viral-high',med:'viral-med',safe:'viral-safe'};
  var html='';
  for(var j=0;j<results.length;j++){
    var idea=results[j], sv=S.savedIdeas.indexOf(idea.id)>=0;
    var catColor=CB[idea.cat]||'#ff4444';
    html+='<div class="gen-card" style="--gen-color:'+catColor+';animation-delay:'+(j*0.04)+'s">';
    html+='<div class="gen-card-top"><div style="display:flex;flex-direction:column;gap:5px"><span class="gen-cat-badge" style="background:'+CC[idea.cat]+';color:'+catColor+'">'+CN[idea.cat]+'</span><span class="gen-viral-badge '+vCls[idea.viral]+'">'+vLbl[idea.viral]+'</span></div>';
    html+='<button class="sv-btn '+(sv?'on':'')+'" onclick="genSave(\''+idea.id+'\',this)">'+(sv?'❤️':'🤍')+'</button></div>';
    html+='<div class="gen-card-title">'+esc(idea.title)+'</div>';
    html+='<div class="gen-card-hook">'+esc(idea.hook)+'</div>';
    html+='<div class="gen-card-meta"><span class="gen-meta-item"><i class="fas fa-eye"></i>'+idea.views+'</span><span class="gen-meta-item"><i class="fas fa-clock"></i>'+idea.time+'</span></div>';
    html+='<div class="gen-card-btns"><button class="gen-btn-sm primary" onclick="openGenIdea('+j+')"><i class="fas fa-magic"></i> Buat Konten</button><button class="gen-btn-sm" onclick="genToSchedule('+j+')"><i class="fas fa-calendar"></i> Jadwal</button><button class="gen-btn-sm" onclick="genToPipeline('+j+')"><i class="fas fa-stream"></i> Pipeline</button></div>';
    html+='</div>';
  }
  grid.innerHTML=html;
}

function setKeyword(kw){ var e=gid('gen-keyword');if(e){e.value=kw;updateGenClear();} }
function clearGen(){ var e=gid('gen-keyword');if(e)e.value=''; updateGenClear(); var em=gid('gen-empty-state');if(em)em.style.display='flex'; var r=gid('gen-results');if(r)r.style.display='none'; }
function updateGenClear(){ var e=gid('gen-keyword'),b=gid('gen-clear');if(b)b.style.display=(e&&e.value)?'block':'none'; }
function saveAllGenerated(){ for(var i=0;i<GEN_RESULTS.length;i++){if(S.savedIdeas.indexOf(GEN_RESULTS[i].id)<0)S.savedIdeas.push(GEN_RESULTS[i].id);} save();st('saved-count',S.savedIdeas.length);toast('ok',GEN_RESULTS.length+' ide disimpan!'); }
function genSave(id,btn){ var idx=S.savedIdeas.indexOf(id);if(idx>=0){S.savedIdeas.splice(idx,1);btn.textContent='🤍';}else{S.savedIdeas.push(id);btn.textContent='❤️';toast('ok','Ide disimpan!');} save();st('saved-count',S.savedIdeas.length); }

function openGenIdea(idx){
  var idea=GEN_RESULTS[idx]; if(!idea) return;
  CS_CURRENT_IDEA=idea; S.curIdea=idea;
  st('idea-m-title',idea.title);
  var ctag=gid('idea-cat-tag');if(ctag){ctag.textContent=CN[idea.cat]||idea.cat;ctag.style.background=CC[idea.cat];ctag.style.color=CB[idea.cat]||'#ff4444';}
  var mb=gid('idea-m-body');
  if(mb) mb.innerHTML='<p style="font-size:14px;line-height:1.8;margin-bottom:14px">'+esc(idea.desc)+'</p><div style="background:rgba(230,0,0,.05);border-radius:10px;padding:14px;border:1px solid var(--rb);margin-bottom:12px"><strong style="color:var(--red2)">Hook Pembuka:</strong><br><em>"'+esc(idea.hook)+'"</em></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div style="background:rgba(255,255,255,.03);border-radius:9px;padding:12px;border:1px solid var(--border)"><div style="font-size:10px;color:var(--muted)">PRODUKSI</div><strong>'+esc(idea.time)+'</strong></div><div style="background:rgba(255,255,255,.03);border-radius:9px;padding:12px;border:1px solid var(--border)"><div style="font-size:10px;color:var(--muted)">VIEWS</div><strong style="color:var(--red2)">'+esc(idea.views)+'</strong></div></div>';
  var sv=S.savedIdeas.indexOf(idea.id)>=0;
  var si=gid('modal-save-icon');if(si)si.className=sv?'fas fa-heart':'far fa-heart';
  st('modal-save-text',sv?'Disimpan':'Simpan');
  var m=gid('m-idea');if(m)m.style.display='flex';
}
function toggleSaveFromModal(){ if(!CS_CURRENT_IDEA)return; var id=CS_CURRENT_IDEA.id; var idx=S.savedIdeas.indexOf(id);if(idx>=0)S.savedIdeas.splice(idx,1);else S.savedIdeas.push(id); save(); var sv=S.savedIdeas.indexOf(id)>=0; var si=gid('modal-save-icon');if(si)si.className=sv?'fas fa-heart':'far fa-heart'; st('modal-save-text',sv?'Disimpan':'Simpan'); }

function genToSchedule(idx){
  var idea=GEN_RESULTS[idx];if(!idea)return;
  nav('schedule');
  setTimeout(function(){ openAddSch(); var e=gid('sch-title');if(e)e.value=idea.title; },400);
}
function genToPipeline(idx){
  var idea=GEN_RESULTS[idx];if(!idea)return;
  openNewProject('idea',idea.title,idea.cat);
  toast('ok','Ide masuk ke pipeline!');
}

// Browse ideas (static list)
var BROWSE_IDEAS=[
  {id:1,cat:'minecraft',e:'⛏️',title:'Survival 100 Hari Hardcore',desc:'Tantang bertahan 100 hari di Hardcore.',diff:'m',views:'5K-50K',time:'3 hari',hook:'Hari ini gue memulai tantangan paling gila...',tags:['survival','hardcore']},
  {id:2,cat:'minecraft',e:'🏠',title:'Build Rumah Megah Timelapse',desc:'Bangun mansion mewah dengan timelapse + tutorial.',diff:'e',views:'2K-20K',time:'1 hari',hook:'Gue punya 24 jam untuk build rumah paling megah...',tags:['build','tutorial']},
  {id:3,cat:'minecraft',e:'🏃',title:'Minecraft Manhunt 4 Hunter!',desc:'Format manhunt populer! Kamu speedrun, 4 teman mengejarmu.',diff:'h',views:'10K-100K',time:'2 hari',hook:'4 orang terbaik akan mengejarku...',tags:['manhunt','pvp']},
  {id:4,cat:'animation',e:'🎬',title:'Kehidupan Sehari-hari Steve',desc:'Animasi comedy absurd tentang Steve.',diff:'m',views:'10K-100K',time:'5 hari',hook:'Apa yang sebenarnya dilakukan Steve setiap hari?',tags:['comedy','steve']},
  {id:5,cat:'animation',e:'💚',title:'Creeper Mencari Teman',desc:'Animasi comedy Creeper yang malang. Menggemaskan dan viral!',diff:'e',views:'5K-50K',time:'3 hari',hook:'Creeper juga punya perasaan...',tags:['creeper','comedy']},
  {id:6,cat:'gaming',e:'👻',title:'Game Horror Jam 12 Malam',desc:'Gaming horror dengan reaksi asli. Sangat engaging!',diff:'e',views:'3K-25K',time:'6 jam',hook:'Keputusan terburuk yang pernah gue buat...',tags:['horror','reaction']},
  {id:7,cat:'tutorial',e:'✂️',title:'Edit Video Gaming Gratis',desc:'Tutorial editing dari nol pakai DaVinci Resolve gratis.',diff:'e',views:'2K-15K',time:'6 jam',hook:'Edit video gaming seperti YouTuber besar, GRATIS',tags:['editing','davinci']},
  {id:8,cat:'shorts',e:'⚡',title:'30 Detik Tips Minecraft',desc:'Satu tip berguna per video. Mudah dibuat dan shareable!',diff:'e',views:'5K-100K',time:'2 jam',hook:'Tips Minecraft yang jarang diketahui',tags:['tips','shorts']},
  {id:9,cat:'challenge',e:'🏆',title:'Survival Tanpa Senjata vs 100 Zombie',desc:'Challenge survival ekstrem. Tension tinggi!',diff:'h',views:'7K-50K',time:'1 hari',hook:'100 zombie, 0 senjata, 1 nyawa',tags:['challenge','survival']},
  {id:10,cat:'review',e:'⭐',title:'Review Jujur Update Minecraft Terbaru',desc:'Review mendalam update terbaru. Konten evergreen!',diff:'e',views:'3K-20K',time:'6 jam',hook:'Update terbaru: bagus atau mengecewakan?',tags:['review','update']}
];

function renderIdeas(){
  var g=gid('ideas-grid'); if(!g) return;
  var items=BROWSE_IDEAS.slice();
  if(CS_CAT==='saved') items=items.filter(function(i){return S.savedIdeas.indexOf(i.id)>=0;});
  else if(CS_CAT!=='all') items=items.filter(function(i){return i.cat===CS_CAT;});
  var qe=gid('idea-q'); var q=qe?qe.value.toLowerCase().trim():'';
  if(q) items=items.filter(function(i){return i.title.toLowerCase().indexOf(q)>=0||i.desc.toLowerCase().indexOf(q)>=0;});
  if(!items.length){ g.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)"><i class="fas fa-search" style="font-size:28px;margin-bottom:10px;display:block"></i>Tidak ada ide.</div>'; return; }
  st('saved-count',S.savedIdeas.length);
  var html='';
  for(var i=0;i<items.length;i++){
    var idea=items[i], sv=S.savedIdeas.indexOf(idea.id)>=0;
    var dl={e:'Mudah',m:'Sedang',h:'Sulit'}[idea.diff]||'Mudah';
    var cc=CB[idea.cat]||'#ff4444';
    html+='<div class="idea-card" style="--cat-color:'+cc+'"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px"><div class="idea-badge" style="background:'+CC[idea.cat]+';color:'+cc+'">'+CN[idea.cat]+'</div><button class="sv-btn '+(sv?'on':'')+'" onclick="toggleSave('+idea.id+')">'+(sv?'❤️':'🤍')+'</button></div><div class="idea-ttl">'+idea.e+' '+esc(idea.title)+'</div><div class="idea-desc">'+esc(idea.desc)+'</div><div class="idea-foot"><span class="diff '+idea.diff+'">'+dl+'</span><button class="idea-detail-btn" onclick="openBrowseIdea('+idea.id+')"><i class="fas fa-magic"></i> Buat Konten</button></div></div>';
  }
  g.innerHTML=html;
}
function filterIdeas(){ renderIdeas(); }
function randomIdea(){ var pool=CS_CAT==='all'?BROWSE_IDEAS:BROWSE_IDEAS.filter(function(i){return i.cat===CS_CAT;}); if(pool.length) openBrowseIdea(pool[Math.floor(Math.random()*pool.length)].id); }
function toggleSave(id){ var idx=S.savedIdeas.indexOf(id);if(idx>=0)S.savedIdeas.splice(idx,1);else{S.savedIdeas.push(id);toast('ok','Ide disimpan!');}save();renderIdeas();st('saved-count',S.savedIdeas.length); }
function openBrowseIdea(id){
  var idea=null; for(var i=0;i<BROWSE_IDEAS.length;i++){if(BROWSE_IDEAS[i].id===id){idea=BROWSE_IDEAS[i];break;}}
  if(!idea) return;
  CS_CURRENT_IDEA=idea; S.curIdea=idea;
  st('idea-m-title',idea.e+' '+idea.title);
  var ctag=gid('idea-cat-tag');if(ctag){ctag.textContent=CN[idea.cat]||idea.cat;ctag.style.background=CC[idea.cat];ctag.style.color=CB[idea.cat]||'#ff4444';}
  var mb=gid('idea-m-body');
  if(mb) mb.innerHTML='<p style="font-size:14px;line-height:1.8;margin-bottom:14px">'+esc(idea.desc)+'</p><div style="background:rgba(230,0,0,.05);border-radius:10px;padding:14px;border:1px solid var(--rb);margin-bottom:12px"><strong style="color:var(--red2)">Hook Pembuka:</strong><br><em>"'+esc(idea.hook)+'"</em></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div style="background:rgba(255,255,255,.03);border-radius:9px;padding:12px;border:1px solid var(--border)"><div style="font-size:10px;color:var(--muted)">PRODUKSI</div><strong>'+esc(idea.time)+'</strong></div><div style="background:rgba(255,255,255,.03);border-radius:9px;padding:12px;border:1px solid var(--border)"><div style="font-size:10px;color:var(--muted)">VIEWS</div><strong style="color:var(--red2)">'+esc(idea.views)+'</strong></div></div>';
  var sv=S.savedIdeas.indexOf(id)>=0;
  var si=gid('modal-save-icon');if(si)si.className=sv?'fas fa-heart':'far fa-heart';
  st('modal-save-text',sv?'Disimpan':'Simpan');
  var m=gid('m-idea');if(m)m.style.display='flex';
}
function openIdea(id){ openBrowseIdea(id); }
function ideaToTitle(){ if(!CS_CURRENT_IDEA)return; closeModal('m-idea'); csTab('title',document.querySelectorAll('.cs-tab')[2]); setTimeout(function(){var e=gid('tg-topic');if(e)e.value=CS_CURRENT_IDEA.title;generateTitles();},300); }
function ideaToDesc(){ if(!CS_CURRENT_IDEA)return; closeModal('m-idea'); csTab('title',document.querySelectorAll('.cs-tab')[2]); setTimeout(function(){var e=gid('dg-title');if(e)e.value=CS_CURRENT_IDEA.title;generateDescription();},300); }
function ideaToThumb(){ if(!CS_CURRENT_IDEA)return; closeModal('m-idea'); csTab('thumbnail',document.querySelectorAll('.cs-tab')[3]); setTimeout(function(){var e=gid('th-topic');if(e)e.value=CS_CURRENT_IDEA.title;generateThumbnailIdeas();},300); }
function ideaToScript(){ if(!CS_CURRENT_IDEA)return; var idea=CS_CURRENT_IDEA; closeModal('m-idea'); nav('script'); setTimeout(function(){newScript();setTimeout(function(){var t=gid('se-title');if(t)t.value=idea.title;var a=gid('se-area');if(a){a.value='[HOOK]\n"'+idea.hook+'"\n\n[INTRO]\nHalo semuanya! Selamat datang di channel CRC!\n\n[MAIN CONTENT]\n...\n\n[OUTRO]\nKalau suka, like dan subscribe ya! Sampai jumpa!';updateScriptMeta();}},200);},400); }
function ideaToPipeline(){ if(!CS_CURRENT_IDEA)return; openNewProject('idea',CS_CURRENT_IDEA.title,CS_CURRENT_IDEA.cat); closeModal('m-idea'); toast('ok','Ide masuk ke pipeline!'); }
function scheduleIdea(){ if(!CS_CURRENT_IDEA&&!S.curIdea)return; var idea=CS_CURRENT_IDEA||S.curIdea; closeModal('m-idea'); nav('schedule'); setTimeout(function(){openAddSch();var e=gid('sch-title');if(e)e.value=idea.title;},350); }

// ── TITLE GENERATOR ────────────────────
var TITLE_TONES={
  hype:['{n} CARA {topik} yang BIKIN GILA!','{topik} PALING EKSTREM yang Pernah Gue Lakukan','APA YANG TERJADI Kalau {topik}??','Gue Coba {topik} Selama {n} Hari - MENGEJUTKAN','PERTAMA KALI {topik} di Indonesia!','{topik} dalam {n} Jam - Ini Hasilnya!','Akhirnya Berhasil {topik} Setelah Gagal Berkali-kali!','{topik} tapi MUSTAHIL - Gue Tetap Coba!','Gue {topik} dan Ini yang Terjadi...','REAKSI Pertama Gue Saat {topik}'],
  funny:['{topik} tapi Semuanya Salah','{n} Momen Paling Memalukan Saat {topik}','Mencoba {topik} dengan Mata Tertutup','POV: Kamu {topik} untuk Pertama Kali','{topik} tapi Gue Pura-Pura Tidak Tahu Apa-Apa','Cara PALING SALAH untuk {topik}'],
  info:['{n} Tips {topik} yang Jarang Diketahui','Tutorial Lengkap {topik} untuk Pemula Indonesia','Cara {topik} yang Benar - Panduan Step by Step','{topik}: Semua yang Perlu Kamu Tahu di 2025','{n} Kesalahan Umum Saat {topik}','Panduan Ultimate {topik} untuk Creator Indonesia'],
  mystery:['Rahasia {topik} yang Tidak Ingin Mereka Kamu Tahu','Apa yang BENAR-BENAR Terjadi Saat {topik}?','Misteri {topik} Akhirnya Terkuak...','Ada yang Aneh dengan {topik} ini...'],
  emotional:['Perjalanan {n} Hari {topik} yang Mengubah Hidupku','Terima Kasih Sudah Menonton {topik} Bersama Gue','Ini Alasan Gue Tidak Berhenti {topik}']
};
function seoScore(t){ var s=0; if(t.length>=30&&t.length<=60)s+=3;else if(t.length<=70)s+=1; if(/minecraft|gaming|game|animasi|tutorial|crc/i.test(t))s+=2; if(/\d/.test(t))s+=1; if(/!|\?|\.\.\./.test(t))s+=1; if(/[A-Z]{2}/.test(t))s+=1; if(s>=6)return{l:'SEO Bagus',c:'seo-good'}; if(s>=4)return{l:'SEO Cukup',c:'seo-ok'}; return{l:'SEO Kurang',c:'seo-bad'}; }
function generateTitles(){
  var topicEl=gid('tg-topic'), toneEl=gid('tg-tone');
  var topic=topicEl?topicEl.value.trim():''; if(!topic){toast('err','Masukkan topik video dulu!');return;}
  var tone=toneEl?toneEl.value:'hype';
  var tpls=(TITLE_TONES[tone]||TITLE_TONES.hype).slice();
  var tCap=topic.charAt(0).toUpperCase()+topic.slice(1);
  var nums=['5','7','10','3','100'];
  var titles=[];
  for(var i=0;i<tpls.length;i++){
    titles.push(tpls[i].replace(/\{topik\}/g,tCap).replace(/\{n\}/g,nums[Math.floor(Math.random()*nums.length)]));
  }
  titles.push('Minecraft '+tCap+' Indonesia 2025 — CRC');
  var card=gid('titles-output-card');if(card)card.style.display='block';
  var ph=gid('title-placeholder');if(ph)ph.style.display='none';
  st('titles-count','('+Math.min(titles.length,10)+' judul)');
  var el=gid('titles-output'); if(!el) return;
  var html='';
  for(var j=0;j<Math.min(titles.length,10);j++){
    var title=titles[j], seo=seoScore(title);
    html+='<div class="title-item" onclick="selectTitle(\''+esc(title)+'\')" title="Klik untuk gunakan"><div class="title-num">'+(j+1)+'</div><div style="flex:1"><div class="title-text">'+esc(title)+'</div><div style="display:flex;align-items:center;gap:8px;margin-top:4px"><span class="title-seo-score '+seo.c+'">'+seo.l+'</span><span style="font-size:10px;color:var(--muted)">'+title.length+' kar</span></div></div><div class="title-actions"><button class="title-action-btn" onclick="event.stopPropagation();navigator.clipboard.writeText(\''+esc(title)+'\').then(function(){toast(\'ok\',\'Disalin!\');})"><i class="fas fa-copy"></i></button></div></div>';
  }
  el.innerHTML=html;
}
function selectTitle(t){ var e=gid('dg-title');if(e){e.value=t;toast('ok','Judul dipilih!');e.scrollIntoView({behavior:'smooth',block:'center'});} }
function copyTitle(t){ navigator.clipboard.writeText(t).then(function(){toast('ok','Judul disalin!');}).catch(function(){toast('info','Judul: '+t);}); }

// ── DESCRIPTION GENERATOR ──────────────
var CH_LINKS={'crc-studio':{name:'CRC Studio',handle:'@studiocrc612',url:'https://youtube.com/@studiocrc612'},'mastercrc':{name:'MASTERCRC',handle:'@mastercrc',url:'https://youtube.com/@mastercrc'}};
function generateDescription(){
  var tEl=gid('dg-title'), pEl=gid('dg-points'), chEl=gid('dg-channel'), durEl=gid('dg-duration');
  var title=tEl?tEl.value.trim():''; if(!title){toast('err','Masukkan judul video dulu!');return;}
  var points=pEl?pEl.value.trim():'', chKey=chEl?chEl.value:'crc-studio', dur=durEl?durEl.value:'medium';
  var ch=CH_LINKS[chKey]||CH_LINKS['crc-studio'];
  var pts=points?points.split(',').map(function(p){return p.trim();}).filter(Boolean):[];
  var durText={short:'1-5 menit',medium:'5-15 menit',long:'15-30 menit',verylong:'30+ menit'}[dur]||'5-15 menit';
  var desc=title+'\n\n';
  desc+='TENTANG VIDEO INI:\n';
  desc+='Di video ini, gue '+(pts.length?'akan '+pts[0].toLowerCase():' berbagi konten seru')+'. Durasi: '+durText+'.\n\n';
  if(pts.length){ desc+='APA YANG AKAN KALIAN LIHAT:\n'; for(var i=0;i<pts.length;i++) desc+='- '+pts[i]+'\n'; desc+='\n'; }
  desc+='TIMESTAMPS:\n0:00 - Intro\n';
  var dur2={short:3,medium:10,long:20,verylong:35}[dur]||10;
  var interval=Math.floor(dur2/(pts.length+1));
  for(var j=0;j<pts.length;j++) desc+=((j+1)*interval)+':00 - '+pts[j]+'\n';
  desc+=dur2+':00 - Outro\n\n';
  desc+='SUBSCRIBE & aktifkan lonceng!\nLike video ini kalau bermanfaat!\n\n';
  desc+='Channel: '+ch.url+'\nHandle: '+ch.handle+'\n\n';
  desc+='#Minecraft #Gaming #MinecraftIndonesia #CRC #YouTubeGaming\n';
  var card=gid('desc-output-card');if(card)card.style.display='block';
  var ph=gid('title-placeholder');if(ph)ph.style.display='none';
  var el=gid('desc-output');if(el)el.textContent=desc;
  toast('ok','Deskripsi berhasil digenerate!');
}
function copyDesc(){ var e=gid('desc-output');if(!e)return; navigator.clipboard.writeText(e.textContent).then(function(){toast('ok','Deskripsi disalin!');}).catch(function(){toast('info','Pilih teks manual.');}); }
function useDescForScript(){ var t=gid('dg-title');nav('script');setTimeout(function(){newScript();setTimeout(function(){var ti=gid('se-title');if(ti)ti.value=t?t.value:'Script Baru';},200);},400);closeModal('m-idea');toast('ok','Membuat script dari deskripsi!'); }

// ── THUMBNAIL ──────────────────────────
var THUMB_TPLS={
  dramatic:[{title:'Full Drama - Ekspresi + Teks Besar',layout:'Wajah/karakter 60% frame, ekspresi KAGET, teks besar IMPACT di sisi lain, background screenshot gameplay, vignette merah di sudut.'}],
  funny:[{title:'Meme Style - Relatable Humor',layout:'Karakter ekspresi lucu/bingung, teks atas dan bawah seperti meme, warna cerah dan kontras.'}],
  'before-after':[{title:'Split Screen - Sebelum vs Sesudah',layout:'Frame dibagi 2 vertikal: kiri sebelum (gelap), kanan sesudah (terang). Garis merah di tengah. Label BEFORE/AFTER.'}],
  number:[{title:'Angka Dominan - Statistik Viral',layout:'Angka SANGAT besar (80% frame) warna merah/kuning. Karakter kecil di samping. Background gelap minimal.'}],
  minimal:[{title:'Clean & Bold - Less is More',layout:'1-2 elemen utama. Teks besar bold di atas background solid. Merah dan putih saja. Banyak ruang kosong.'}],
  collage:[{title:'Grid Kolase - Multiple Moments',layout:'4-6 screenshot dalam grid. Teks judul di atas. Border merah antar gambar. Nomor di setiap gambar.'}]
};
function generateThumbnailIdeas(){
  var topicEl=gid('th-topic');var topic=topicEl?topicEl.value.trim():''; if(!topic){toast('err','Masukkan topik video dulu!');return;}
  var styleEl=gid('th-style');var style=styleEl?styleEl.value:'dramatic';
  var colorEl=gid('th-color');var color=colorEl?colorEl.value:'red';
  var tpls=THUMB_TPLS[style]||THUMB_TPLS.dramatic;
  var colorGuide={red:'Merah #E60000 + Hitam #0D0D0D + Putih #FFFFFF',dark:'Hitam #0D0D0D + Merah gelap #990000 + Abu #888',bright:'Merah #FF2222 + Kuning #FFCC00 + Putih',green:'Hijau #4CAF50 + Merah #E60000 + Hitam',fire:'Oranye #FF6600 + Merah #E60000 + Kuning'}[color]||'Merah #E60000 + Hitam + Putih';
  var ph=gid('thumb-placeholder');if(ph)ph.style.display='none';
  var result=gid('thumb-ideas-result');if(!result)return;
  var html='';
  for(var i=0;i<tpls.length;i++){
    html+='<div class="thumb-idea-card"><div class="tic-header"><div class="tic-num">'+(i+1)+'</div><div class="tic-title" style="flex:1">'+tpls[i].title+'</div><div class="tic-style">'+style+'</div></div><div class="tic-preview"><strong>Layout:</strong> '+tpls[i].layout+'</div><div style="margin-bottom:8px"><div style="font-size:11px;color:var(--muted);margin-bottom:6px">Warna: '+colorGuide+'</div></div><div class="tic-actions"><button class="btn-out" style="font-size:11px" onclick="window.open(\'https://canva.com\',\'_blank\')"><i class="fas fa-external-link-alt"></i> Buka Canva</button></div></div>';
  }
  result.innerHTML=html; toast('ok',tpls.length+' ide thumbnail!');
}
function copyColor(c,n){ navigator.clipboard.writeText(c).then(function(){toast('ok',n+' ('+c+') disalin!');}).catch(function(){toast('info','Warna: '+c);}); }

// ── SCRIPT EDITOR ──────────────────────
function renderScriptList(){
  var el=gid('script-list'); if(!el) return;
  if(!S.scripts.length){ el.innerHTML='<div style="color:var(--muted);font-size:12px;text-align:center;padding:12px">Belum ada script</div>'; return; }
  var html='';
  for(var i=0;i<S.scripts.length;i++){
    var sc=S.scripts[i];
    html+='<div class="sc-item '+(S.activeScript===sc.id?'on':'')+'" onclick="openScript(\''+sc.id+'\')"><div class="sc-ttl">'+esc(sc.title||'Tanpa Judul')+'</div><div class="sc-meta">'+sc.type+' - '+new Date(sc.upd).toLocaleDateString('id-ID')+'</div></div>';
  }
  el.innerHTML=html;
}
function newScript(){ var sc={id:''+Date.now(),title:'Script Baru',type:'minecraft',content:'',crt:new Date().toISOString(),upd:new Date().toISOString()}; S.scripts.push(sc);save();renderScriptList();openScript(sc.id); }
function openScript(id){
  S.activeScript=id;
  var sc=null; for(var i=0;i<S.scripts.length;i++){if(S.scripts[i].id===id){sc=S.scripts[i];break;}}
  if(!sc) return;
  var se=gid('script-empty');if(se)se.style.display='none';
  var ed=gid('script-editor');if(ed){ed.style.display='flex';ed.style.flexDirection='column';ed.style.height='100%';}
  var t=gid('se-title');if(t)t.value=sc.title;
  var tp=gid('se-type');if(tp)tp.value=sc.type;
  var a=gid('se-area');if(a)a.value=sc.content;
  st('se-saved','Disimpan: '+new Date(sc.upd).toLocaleString('id-ID'));
  updateScriptMeta(); renderScriptList();
}
function updateScriptMeta(){ var a=gid('se-area'),txt=a?a.value:'',words=txt.trim()?txt.trim().split(/\s+/).length:0; st('se-wc',words+' kata'); st('se-dur','~'+Math.round(words/130)+' menit'); }
function saveScript(){
  if(!S.activeScript) return;
  var sc=null; for(var i=0;i<S.scripts.length;i++){if(S.scripts[i].id===S.activeScript){sc=S.scripts[i];break;}}
  if(!sc) return;
  var t=gid('se-title');sc.title=t?t.value||'Tanpa Judul':'Tanpa Judul';
  var tp=gid('se-type');sc.type=tp?tp.value:'minecraft';
  var a=gid('se-area');sc.content=a?a.value:'';
  sc.upd=new Date().toISOString();
  st('se-saved','Disimpan: '+new Date().toLocaleString('id-ID'));
  save(); renderScriptList(); toast('ok','Script disimpan!');
}
function deleteScript(){
  if(!S.activeScript||!confirm('Hapus script?')) return;
  S.scripts=S.scripts.filter(function(s){return s.id!==S.activeScript;}); S.activeScript=null;
  var se=gid('script-empty');if(se)se.style.display='flex';
  var ed=gid('script-editor');if(ed)ed.style.display='none';
  save(); renderScriptList(); toast('info','Script dihapus.');
}
function insertSection(tag){ var ta=gid('se-area');if(!ta)return;var pos=ta.selectionStart;ta.value=ta.value.slice(0,pos)+'\n\n'+tag+'\n'+ta.value.slice(pos);ta.selectionStart=ta.selectionEnd=pos+tag.length+3;ta.focus();updateScriptMeta(); }
function insertTemplate(){
  var tpls={minecraft:'[HOOK - 5 DETIK PERTAMA]\n"Hari ini gue akan [aksi]... dan ini GILA!"\n\n[INTRO]\nHalo semuanya! Selamat datang di channel CRC!\nJangan lupa like dan subscribe ya!\n\n[MAIN CONTENT]\n[Bagian 1]\n...\n\n[OUTRO]\nKalau suka, like dan subscribe! See ya!',animation:'[PREMISE]\nJudul: ...\nGenre: Comedy\n\n[SCENE 1 - PEMBUKA]\nSetting: ...\nDialog: "..."\n\n[SCENE 2 - KONFLIK]\n...\n\n[OUTRO]\n...'};
  var tp=gid('se-type'),a=gid('se-area');
  if(a){ a.value=tpls[tp?tp.value:'minecraft']||tpls.minecraft; updateScriptMeta(); toast('ok','Template dimasukkan!'); }
}

// ── ANALYTICS ──────────────────────────
function fillAnaSelects(){
  var sel=gid('ana-sel'); if(!sel) return;
  sel.innerHTML=S.channels.length?S.channels.map(function(c){return '<option value="'+c.id+'">'+esc(c.name)+'</option>';}).join(''):'<option value="">Tambah channel dulu</option>';
  updateAna();
}
function updateAna(){
  var sel=gid('ana-sel'); if(!sel||!S.channels.length) return;
  var ch=null; for(var i=0;i<S.channels.length;i++){if(S.channels[i].id===sel.value){ch=S.channels[i];break;}} if(!ch) ch=S.channels[0]; if(!ch) return;
  st('an-subs',fn(ch.subs)); st('an-views',fn(ch.views)); st('an-vids',fn(ch.videos));
  st('an-avg',fn(ch.videos?Math.round(ch.views/ch.videos):0));
  st('an-vps',ch.subs?(ch.views/ch.subs).toFixed(1)+'x':'—');
  var mls=[100,1000,10000,100000,1000000], nxt=null;
  for(var j=0;j<mls.length;j++){if(mls[j]>ch.subs){nxt=mls[j];break;}} if(!nxt) nxt=10000000;
  st('an-next',fn(nxt-ch.subs));
  renderPlayBtn(ch.subs); renderUpdateForm(ch); buildCharts(ch);
}
function renderPlayBtn(subs){
  var el=gid('play-btn-prog'); if(!el) return;
  var ms=[{icon:'🥈',label:'Silver',target:100000,c:'#c0c0c0'},{icon:'🥇',label:'Gold',target:1000000,c:'#ffd700'},{icon:'💎',label:'Diamond',target:10000000,c:'#b9f2ff'},{icon:'🔴',label:'Ruby',target:50000000,c:'#ff2222'}];
  var html='';
  for(var i=0;i<ms.length;i++){
    var m=ms[i], pct=Math.min(100,(subs/m.target*100)).toFixed(1), done=subs>=m.target;
    html+='<div class="pb-row"><div class="pb-icon">'+m.icon+'</div><div class="pb-info"><div class="pb-label">'+m.label+' Play Button — '+fn(m.target)+' Sub '+(done?'✅':'')+'</div><div class="pb-bg"><div class="pb-fill" style="width:'+pct+'%;background:'+(done?m.c:'linear-gradient(90deg,var(--red4),var(--red2))')+'"></div></div></div><div class="pb-pct">'+pct+'%</div></div>';
  }
  el.innerHTML=html;
}
function renderAlgoTips(){
  var el=gid('algo-grid'); if(!el||el.innerHTML.trim()) return;
  var tips=[{icon:'🎯',t:'CTR (Click-Through Rate)',p:'Target CTR 4-10%. Thumbnail merah dramatis + teks besar!'},{icon:'⏱️',t:'Watch Time & Retention',p:'Target >40%. Hook kuat di 30 detik pertama!'},{icon:'📅',t:'Konsistensi Upload',p:'2-3x seminggu rutin. Algoritma YouTube menyukai konsistensi!'},{icon:'💬',t:'Engagement Rate',p:'Balas komentar dalam 24 jam. Like+Comment = sinyal kuat!'},{icon:'🔑',t:'SEO & Keyword',p:'Gunakan "Minecraft Indonesia 2025", "CRC Studio" di judul.'},{icon:'📱',t:'YouTube Shorts',p:'Buat Shorts dari cuplikan. Cara dapat exposure gratis!'}];
  var html='';
  for(var i=0;i<tips.length;i++) html+='<div class="algo-item"><div class="algo-icon">'+tips[i].icon+'</div><div><strong>'+tips[i].t+'</strong><p>'+tips[i].p+'</p></div></div>';
  el.innerHTML=html;
}
function renderUpdateForm(ch){
  var el=gid('update-form'); if(!el) return;
  el.innerHTML='<div class="us-row"><div class="fr"><label>Subscriber</label><input id="us-subs" class="fi" type="number" value="'+ch.subs+'"></div><div class="fr"><label>Views</label><input id="us-views" class="fi" type="number" value="'+ch.views+'"></div><div class="fr"><label>Video</label><input id="us-vids" class="fi" type="number" value="'+ch.videos+'"></div></div><button class="btn-pri" onclick="applyUpdate(\''+ch.id+'\')"><i class="fas fa-save"></i> Update Statistik</button>';
}
function applyUpdate(id){
  var ch=null; for(var i=0;i<S.channels.length;i++){if(S.channels[i].id===id){ch=S.channels[i];break;}} if(!ch) return;
  var s=gid('us-subs'),v=gid('us-views'),vid=gid('us-vids');
  ch.subs=parseInt(s?s.value:ch.subs)||ch.subs; ch.views=parseInt(v?v.value:ch.views)||ch.views; ch.videos=parseInt(vid?vid.value:ch.videos)||ch.videos;
  ch.lastUpdated=new Date().toLocaleString('id-ID');
  save(); renderCRCgrid(); renderExtraGrid(); renderDash(); updateCRCbar(); updateAna(); toast('ok','Statistik diupdate!');
}
function buildCharts(ch){
  var MONS=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],n=new Date(),lbls=[],data=[];
  for(var i=5;i>=0;i--){ var d=new Date(n.getFullYear(),n.getMonth()-i,1);lbls.push(MONS[d.getMonth()]);data.push(Math.max(0,Math.round(ch.subs*(6-i)/6*(0.6+Math.random()*.4)))); }
  data[5]=ch.subs;
  var gc=gid('ch-growth');
  if(gc){ try{if(S.charts.growth)S.charts.growth.destroy();}catch(e){} S.charts.growth=new Chart(gc,{type:'line',data:{labels:lbls,datasets:[{label:'Subscriber',data:data,borderColor:'#e60000',backgroundColor:'rgba(230,0,0,.1)',borderWidth:2,fill:true,tension:.4,pointBackgroundColor:'#ff2222',pointRadius:4}]},options:{responsive:true,plugins:{legend:{labels:{color:'#886060'}}},scales:{x:{ticks:{color:'#886060'},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'#886060'},grid:{color:'rgba(255,255,255,.04)'}}}}}); }
  var pc=gid('ch-pie');
  if(pc){ try{if(S.charts.pie)S.charts.pie.destroy();}catch(e){} var cnt={},ks=Object.keys(cnt); S.schedules.forEach(function(s){cnt[s.type]=(cnt[s.type]||0)+1;}); if(!Object.keys(cnt).length) cnt={minecraft:5,animation:3,gaming:4,tutorial:2,short:6}; S.charts.pie=new Chart(pc,{type:'doughnut',data:{labels:Object.keys(cnt),datasets:[{data:Object.values(cnt),backgroundColor:['#cc2200','#ff4400','#ff6600','#990000','#ff2222','#660000'],borderColor:'transparent',borderWidth:2}]},options:{responsive:true,plugins:{legend:{labels:{color:'#886060',padding:14}}}}}); }
}
function checkSEO(){
  var inp=gid('seo-in'),el=gid('seo-out'); if(!el) return;
  var title=inp?inp.value:''; if(!title||title.length<3){el.innerHTML='';return;}
  var checks=[{t:'Panjang optimal (30-60)',ok:title.length>=30&&title.length<=60},{t:'Ada keyword Minecraft/Gaming',ok:/minecraft|gaming|game|survival|animasi|build|pvp|crc/i.test(title)},{t:'Mengandung angka',ok:/\d/.test(title)},{t:'Ada kata emosi/power word',ok:/gila|epic|pertama|terbaik|viral|seru|keren|menang|wajib/i.test(title)},{t:'Ada huruf kapital',ok:/[A-Z]/.test(title)&&title!==title.toUpperCase()},{t:'Tidak lebih dari 70 karakter',ok:title.length<=70}];
  var score=Math.round(checks.filter(function(c){return c.ok;}).length/checks.length*100);
  var sc=score>=80?'#00cc66':score>=50?'#ffaa00':'#ff4444';
  var html='<div class="seo-score-row"><div class="seo-circle" style="border-color:'+sc+';color:'+sc+'">'+score+'</div><div class="seo-items">';
  for(var i=0;i<checks.length;i++) html+='<div class="seo-chk '+(checks[i].ok?'ok':'fail')+'"><i class="fas fa-'+(checks[i].ok?'check':'times')+'"></i>'+checks[i].t+'</div>';
  html+='</div></div><div style="font-size:12px;color:var(--muted);margin-top:8px">'+title.length+' karakter — '+(score>=80?'Bagus!':score>=50?'Bisa lebih baik':'Perlu perbaikan')+'</div>';
  el.innerHTML=html;
}

// ── COMPETITOR ─────────────────────────
var DEF_COMPS=[{id:'dc1',name:'MANGO MC',handle:'@MangoPlaysMC',url:'https://youtube.com/@MangoPlaysMC',subs:800000,views:120000000,videos:450,strat:'Minecraft survival Indonesia. Konsisten 3x seminggu.'},{id:'dc2',name:'Ikabun',handle:'@ikabun',url:'https://youtube.com/@ikabun',subs:1200000,views:200000000,videos:600,strat:'Minecraft survival terpopuler. Komunitas loyal.'},{id:'dc3',name:'Ryanzeen',handle:'@ryanzeen',url:'https://youtube.com/@ryanzeen',subs:500000,views:80000000,videos:300,strat:'Minecraft challenge & manhunt.'},{id:'dc4',name:'JESS NO LIMIT',handle:'@JessNoLimit',url:'https://youtube.com/@JessNoLimit',subs:20000000,views:3000000000,videos:2000,strat:'Gaming & Minecraft terbesar Indonesia.'}];
function openAddComp(){ var ids=['comp-name','comp-url','comp-subs','comp-views','comp-vids','comp-strat']; for(var i=0;i<ids.length;i++){var e=gid(ids[i]);if(e)e.value='';} var m=gid('m-addcomp');if(m)m.style.display='flex'; }
function saveComp(){
  var ne=gid('comp-name'), name=ne?ne.value.trim():''; if(!name){toast('err','Nama tidak boleh kosong!');return;}
  function v(id){var e=gid(id);return e?e.value:'';}
  S.competitors.push({id:''+Date.now(),name:name,url:v('comp-url'),subs:parseInt(v('comp-subs'))||0,views:parseInt(v('comp-views'))||0,videos:parseInt(v('comp-vids'))||0,strat:v('comp-strat')});
  save(); closeModal('m-addcomp'); renderComps(); toast('ok','"'+name+'" ditambahkan!');
}
function loadDefaultComps(){ for(var i=0;i<DEF_COMPS.length;i++){var dc=DEF_COMPS[i];if(!S.competitors.find(function(c){return c.id===dc.id;})){var obj={};for(var k in dc)obj[k]=dc[k];S.competitors.push(obj);}} save();renderComps();toast('ok','Channel populer berhasil di-load!'); }
function renderComps(){
  var g=gid('comp-grid'); if(!g) return;
  var all=[];
  for(var i=0;i<DEF_COMPS.length;i++){ var dc=DEF_COMPS[i]; if(!S.competitors.find(function(c){return c.id===dc.id;})) all.push(dc); }
  for(var j=0;j<S.competitors.length;j++) all.push(S.competitors[j]);
  if(!all.length){ g.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:36px;color:var(--muted)">Belum ada kompetitor.</div>'; return; }
  var html='';
  for(var k=0;k<all.length;k++){
    var c=all[k], isDef=!!DEF_COMPS.find(function(d){return d.id===c.id;});
    html+='<div class="comp-card"><div class="comp-head"><div class="comp-av">'+c.name.charAt(0)+'</div><div><div class="comp-nm">'+esc(c.name)+'</div><div class="comp-hn">'+esc(c.handle||'')+'</div></div>'+(c.url?'<button class="btn-out" style="margin-left:auto;padding:5px 9px;font-size:11px" onclick="window.open(\''+esc(c.url)+'\',\'_blank\')"><i class="fas fa-external-link-alt"></i></button>':'')+'</div><div class="comp-stats"><div class="comp-stat"><div class="comp-sn">'+fn(c.subs)+'</div><div class="comp-sl">Subs</div></div><div class="comp-stat"><div class="comp-sn">'+fn(c.views)+'</div><div class="comp-sl">Views</div></div><div class="comp-stat"><div class="comp-sn">'+fn(c.videos)+'</div><div class="comp-sl">Video</div></div></div>'+(c.strat?'<div class="comp-strat">'+esc(c.strat)+'</div>':'')+(!isDef?'<button class="btn-del" style="font-size:11px" onclick="delComp(\''+c.id+'\')"><i class="fas fa-trash"></i> Hapus</button>':'')+'</div>';
  }
  g.innerHTML=html;
}
function delComp(id){ S.competitors=S.competitors.filter(function(c){return c.id!==id;}); save();renderComps(); }
function renderCompLessons(){
  var el=gid('comp-lessons'); if(!el||el.innerHTML.trim()) return;
  var ls=[{t:'Konsistensi adalah kunci',p:'Channel Minecraft terbesar upload 1-2x seminggu tanpa gagal.'},{t:'Format Challenge selalu viral',p:'Penonton suka creator dalam situasi sulit.'},{t:'Thumbnail yang konsisten',p:'Template konsisten agar channel mudah dikenali.'},{t:'Community building aktif',p:'Balas komentar, buat Discord. Komunitas = channel kuat.'},{t:'Kolaborasi strategis',p:'Channel Minecraft Indonesia tumbuh cepat dengan collab similar.'}];
  var html='';
  for(var i=0;i<ls.length;i++) html+='<div class="cl-row"><div class="cl-num">'+(i+1)+'</div><div class="cl-txt"><strong>'+ls[i].t+':</strong> '+ls[i].p+'</div></div>';
  el.innerHTML=html;
}

// ── ANIMATION ──────────────────────────
function openAddAnim(){
  var sel=gid('anim-ch'); if(sel) sel.innerHTML=S.channels.length?S.channels.map(function(c){return '<option value="'+esc(c.name)+'">'+esc(c.name)+'</option>';}).join(''):'<option>—</option>';
  var ids=['anim-title','anim-desc','anim-sw','anim-dur']; for(var i=0;i<ids.length;i++){var e=gid(ids[i]);if(e)e.value='';}
  var ap=gid('anim-prog');if(ap)ap.value=0; st('anim-pv','0');
  var m=gid('m-addanim');if(m)m.style.display='flex';
}
function saveAnim(){
  var te=gid('anim-title'), title=te?te.value.trim():''; if(!title){toast('err','Judul tidak boleh kosong!');return;}
  function v(id){var e=gid(id);return e?e.value:'';}
  S.animations.push({id:''+Date.now(),title:title,desc:v('anim-desc'),status:v('anim-st'),sw:v('anim-sw'),dur:v('anim-dur'),dl:v('anim-dl'),prog:parseInt(v('anim-prog'))||0,ch:v('anim-ch'),crt:new Date().toISOString()});
  save(); closeModal('m-addanim'); renderAnims(); renderDash(); toast('ok','Proyek "'+title+'" dibuat!');
}
function filtAnim(f,btn){ S.animFilter=f; var bs=document.querySelectorAll('#page-animation .filt');for(var i=0;i<bs.length;i++)bs[i].classList.remove('active'); btn.classList.add('active'); renderAnims(); }
function renderAnims(){
  var g=gid('anim-grid'); if(!g) return;
  var items=S.animations.slice();
  if(S.animFilter==='planning') items=items.filter(function(a){return a.status==='planning';});
  else if(S.animFilter==='inprogress') items=items.filter(function(a){return ['scripting','animating','rendering','editing'].indexOf(a.status)>=0;});
  else if(S.animFilter==='done') items=items.filter(function(a){return a.status==='done';});
  if(!items.length){ g.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:36px;color:var(--muted)"><i class="fas fa-film" style="font-size:32px;margin-bottom:10px;display:block;opacity:.3"></i><p>Belum ada proyek animasi.</p></div>'; return; }
  var SL={planning:'Planning',scripting:'Scripting',animating:'Animating',rendering:'Rendering',editing:'Editing',done:'Selesai'};
  var SC={planning:'sp-planning',scripting:'sp-scripting',animating:'sp-animating',rendering:'sp-rendering',editing:'sp-editing',done:'sp-done'};
  var html='';
  for(var i=0;i<items.length;i++){
    var a=items[i];
    html+='<div class="anim-card"><div class="anim-head"><div class="anim-ttl">'+esc(a.title)+'</div><div class="anim-pill '+(SC[a.status]||'sp-planning')+'">'+(SL[a.status]||a.status)+'</div></div>'+(a.desc?'<div class="anim-desc">'+esc(a.desc)+'</div>':'')+'<div><div class="prog-hdr"><span>Progress</span><span>'+a.prog+'%</span></div><div class="prog-bg"><div class="prog-fill" style="width:'+a.prog+'%"></div></div></div><div class="anim-meta" style="margin-top:9px">'+(a.dur?'<span>'+a.dur+' mnt</span>':'')+(a.dl?'<span>'+new Date(a.dl).toLocaleDateString('id-ID')+'</span>':'')+(a.sw?'<span>'+esc(a.sw)+'</span>':'')+'</div><div class="anim-btns"><button class="anim-b" onclick="updateAnimProg(\''+a.id+'\')"><i class="fas fa-tasks"></i> Update</button>'+(a.status!=='done'?'<button class="anim-b" onclick="finishAnim(\''+a.id+'\')"><i class="fas fa-check"></i> Selesai</button>':'')+'<button class="anim-b del" onclick="delAnim(\''+a.id+'\')"><i class="fas fa-trash"></i></button></div></div>';
  }
  g.innerHTML=html;
}
function updateAnimProg(id){ var a=null;for(var i=0;i<S.animations.length;i++){if(S.animations[i].id===id){a=S.animations[i];break;}} if(!a)return; var p=prompt('Progress (0-100):',a.prog);if(p===null)return; var s=prompt('Status:',a.status);if(s===null)return; a.prog=Math.min(100,Math.max(0,parseInt(p)||a.prog)); if(['planning','scripting','animating','rendering','editing','done'].indexOf(s)>=0)a.status=s; save();renderAnims();toast('ok','Progress diupdate!'); }
function finishAnim(id){ for(var i=0;i<S.animations.length;i++){if(S.animations[i].id===id){S.animations[i].status='done';S.animations[i].prog=100;break;}} save();renderAnims();toast('ok','Animasi selesai!'); }
function delAnim(id){ if(!confirm('Hapus proyek?'))return; S.animations=S.animations.filter(function(a){return a.id!==id;}); save();renderAnims();renderDash(); }
function renderAnimTools(){
  var el=gid('anim-tools'); if(!el||el.innerHTML.trim()) return;
  var tools=[{icon:'🎬',name:'Mine-imator',desc:'Software animasi Minecraft gratis paling populer.',url:'https://www.mineimator.com'},{icon:'🖥️',name:'Blender',desc:'Software 3D profesional gratis.',url:'https://www.blender.org'},{icon:'✂️',name:'DaVinci Resolve',desc:'Video editor profesional gratis terbaik.',url:'https://www.blackmagicdesign.com'},{icon:'🎞️',name:'CapCut',desc:'Editor mobile gratis untuk Shorts.',url:'https://www.capcut.com'},{icon:'🎨',name:'Canva',desc:'Design thumbnail gratis.',url:'https://www.canva.com'},{icon:'🎵',name:'Audacity',desc:'Edit audio dan SFX. Gratis!',url:'https://www.audacityteam.org'}];
  var html='';
  for(var i=0;i<tools.length;i++) html+='<div class="tm-card"><div class="tm-icon">'+tools[i].icon+'</div><div class="tm-name">'+tools[i].name+'</div><div class="tm-desc">'+tools[i].desc+'</div><span class="tm-free">GRATIS</span><a href="'+tools[i].url+'" target="_blank" style="display:block;margin-top:7px;color:var(--red2);font-size:11px;font-weight:600">Buka</a></div>';
  el.innerHTML=html;
}

// ── THUMBNAIL PAGE ──────────────────────
function renderThumbPage(){
  var cl=gid('thumb-checks'); if(!cl||cl.innerHTML.trim()) return;
  var items=[{t:'Ukuran 1280x720 px (16:9)',s:'Tidak pixelated atau terpotong'},{t:'Warna kontras & cerah',s:'Merah, kuning, oranye efektif untuk gaming'},{t:'Teks maksimal 4-6 kata',s:'Font tebal besar, terbaca di HP kecil'},{t:'Ada elemen Minecraft/karakter',s:'Creeper, Steve, Diamond, atau ikonik'},{t:'Ekspresi wajah dramatis',s:'Kaget/senang meningkatkan CTR signifikan'},{t:'Tidak terlalu banyak elemen',s:'Fokus 1-2 elemen utama. Less is more!'},{t:'Background mendukung',s:'Tidak mengalihkan perhatian'},{t:'File size maksimal 2MB',s:'Kompres jika perlu. Format JPG atau PNG'}];
  var html='';
  for(var i=0;i<items.length;i++) html+='<div class="tc-row"><button class="tc-chk" id="tc-'+i+'" onclick="toggleTC('+i+')"></button><div><div class="tc-ttl">'+items[i].t+'</div><div class="tc-sub">'+items[i].s+'</div></div></div>';
  cl.innerHTML=html;
  var pp=gid('mc-palette');
  if(pp&&!pp.innerHTML.trim()){
    var colors=[{c:'#2d5a27',n:'Grass'},{c:'#4a3728',n:'Dirt'},{c:'#7f7f7f',n:'Stone'},{c:'#2a5ba0',n:'Water'},{c:'#ff0000',n:'Redstone'},{c:'#ff6600',n:'Lava'},{c:'#ffff00',n:'Gold'},{c:'#00ff00',n:'Lime'},{c:'#00ffff',n:'Diamond'},{c:'#ffffff',n:'Snow'},{c:'#1a1a1a',n:'Coal'},{c:'#8b4513',n:'Wood'}];
    var chtml='';
    for(var j=0;j<colors.length;j++) chtml+='<div class="pal-c" style="background:'+colors[j].c+'" title="'+colors[j].n+': '+colors[j].c+'" onclick="copyColor(\''+colors[j].c+'\',\''+colors[j].n+'\')"></div>';
    pp.innerHTML=chtml;
  }
}
function toggleTC(i){ var b=gid('tc-'+i); if(!b)return; b.classList.toggle('on'); var row=b.closest?b.closest('.tc-row'):b.parentNode; if(row) row.style.opacity=b.classList.contains('on')?'.5':'1'; }
function genThumb(){
  var topic=gid('thumb-topic'), el=gid('thumb-ideas-out');
  topic=topic?topic.value.trim():''; if(!topic){toast('err','Masukkan topik dulu!');return;}
  var ideas=['<strong>Ide 1: Dramatic Red</strong><br>Background '+topic+' dramatis. Karakter ekspresi KAGET. Teks: "'+topic.substring(0,20).toUpperCase()+'!!" Warna MERAH + KUNING.','<strong>Ide 2: Before vs After</strong><br>2 bagian - kiri: sebelum (gelap), kanan: sesudah (epik). Panah merah besar di tengah.','<strong>Ide 3: Angka Besar + Karakter</strong><br>Angka besar di kiri. Karakter Minecraft dramatis di tengah. Background hitam pekat.','<strong>Ide 4: Close-Up Glow</strong><br>Close-up karakter dengan efek glow merah. Teks bagian bawah Impact + outline hitam.'];
  if(el) el.innerHTML=ideas.map(function(i){return '<div class="ti-card">'+i+'</div>';}).join('');
}

// ── TOOLS ──────────────────────────────
function renderTools(){
  var el=gid('tools-content'); if(!el||el.innerHTML.trim()) return;
  var sections=[
    {title:'Animasi Minecraft',items:[{icon:'🎬',name:'Mine-imator',cat:'Animasi',desc:'Software animasi Minecraft gratis paling populer. Perfect untuk pemula!',url:'https://www.mineimator.com'},{icon:'🖥️',name:'Blender',cat:'3D',desc:'Software 3D profesional gratis. Hasil animasi sangat halus.',url:'https://www.blender.org'},{icon:'🎭',name:'Blockbench',cat:'3D Modeling',desc:'Buat model 3D Minecraft custom untuk animasi.',url:'https://www.blockbench.net'}]},
    {title:'Video Editing',items:[{icon:'✂️',name:'DaVinci Resolve',cat:'Editor',desc:'Video editor profesional gratis terbaik.',url:'https://www.blackmagicdesign.com'},{icon:'🎞️',name:'CapCut',cat:'Mobile',desc:'Editor mobile gratis. Ideal untuk Shorts.',url:'https://www.capcut.com'},{icon:'📹',name:'Kdenlive',cat:'Desktop',desc:'Video editor open-source gratis.',url:'https://kdenlive.org'}]},
    {title:'Desain & Thumbnail',items:[{icon:'🎨',name:'Canva',cat:'Design',desc:'Tool desain thumbnail termudah. Ada template gaming!',url:'https://www.canva.com'},{icon:'✏️',name:'Photopea',cat:'Photo Editor',desc:'Photoshop gratis online. Tidak perlu install!',url:'https://www.photopea.com'},{icon:'🖌️',name:'GIMP',cat:'Photo Editor',desc:'Alternatif Photoshop gratis.',url:'https://www.gimp.org'}]},
    {title:'Analytics & SEO',items:[{icon:'📊',name:'TubeBuddy',cat:'SEO',desc:'Extension YouTube untuk riset keyword.',url:'https://www.tubebuddy.com'},{icon:'📈',name:'VidIQ',cat:'Analytics',desc:'Analisa channel dan lihat kompetitor.',url:'https://vidiq.com'},{icon:'🔍',name:'Google Trends',cat:'Research',desc:'Cek tren kata kunci Minecraft & gaming.',url:'https://trends.google.com'}]}
  ];
  var html='';
  for(var i=0;i<sections.length;i++){
    var sec=sections[i];
    html+='<div class="card tools-sec"><div class="card-h"><i class="fas fa-tools"></i> '+sec.title+'</div><div class="tools-sec-grid">';
    for(var j=0;j<sec.items.length;j++){
      var t=sec.items[j];
      html+='<div class="tool-card"><div class="tc-head"><div class="tc-icon">'+t.icon+'</div><div><div class="tc-name">'+t.name+'</div><div class="tc-cat">'+t.cat+'</div></div></div><div class="tc-desc">'+t.desc+'</div><div class="tc-badges"><span class="badge-f">GRATIS</span><span class="badge-w">WEB/DESKTOP</span></div><a href="'+t.url+'" target="_blank" class="tc-link">Buka Website</a></div>';
    }
    html+='</div></div>';
  }
  el.innerHTML=html;
}

// ── CONTENT PIPELINE ───────────────────
var PIP_STAGES=['idea','script','production','editing','thumbnail','upload'];
var PIP_LABELS={idea:'Ide',script:'Script',production:'Produksi',editing:'Editing',thumbnail:'Thumbnail',upload:'Upload'};
var PIP_CLs={
  idea:['Tentukan topik & format','Riset keyword','Cek kompetitor','Tulis ide & hook','Pilih channel'],
  script:['Buat outline','Tulis hook 5 detik','Tulis isi utama','Tulis outro & CTA','Review script'],
  production:['Setup recording/animasi','Rekam/buat animasi','Cek kualitas','Backup file source'],
  editing:['Import semua footage','Edit urutan konten','Tambah musik & SFX','Tambah teks/subtitle','Export video final'],
  thumbnail:['Tentukan konsep','Kumpulkan aset','Design di Canva','Test readability','Export JPG/PNG <2MB'],
  upload:['Upload video','Masukkan judul SEO','Paste deskripsi','Tambah tags & keyword','Set thumbnail custom','Schedule atau publish!']
};
function renderPipeline(){
  var total=S.pipeline.length;
  var inprog=S.pipeline.filter(function(p){return p.stage!=='upload';}).length;
  var uploaded=S.pipeline.filter(function(p){return p.uploaded;}).length;
  st('pip-total',total); st('pip-inprog',inprog); st('pip-done',S.pipeline.filter(function(p){return p.stage==='upload';}).length); st('pip-uploaded',uploaded);
  updatePipelineBadge();
  for(var i=0;i<PIP_STAGES.length;i++){
    var stage=PIP_STAGES[i];
    var cnt=gid('cnt-'+stage), body=gid('body-'+stage);
    if(!cnt||!body) continue;
    var cards=S.pipeline.filter(function(p){return p.stage===stage;});
    cnt.textContent=cards.length;
    if(!cards.length){ body.innerHTML='<div class="pip-empty-col"><i class="fas fa-inbox"></i><div>Belum ada proyek</div></div>'; continue; }
    var html='';
    for(var j=0;j<cards.length;j++){
      var p=cards[j];
      var overdue=p.deadline&&new Date(p.deadline)<new Date()&&!p.uploaded;
      var prog=calcPipProg(p);
      html+='<div class="pip-card" onclick="openEditProject(\''+p.id+'\')">';
      html+='<div class="pip-card-prio '+p.priority+'"></div>';
      html+='<div class="pip-card-title">'+esc(p.title)+'</div>';
      html+='<div class="pip-card-meta"><span>'+esc(p.channel||'—')+'</span></div>';
      html+='<div class="pip-card-progress"><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:3px"><span>Progress</span><span>'+prog+'%</span></div><div class="pip-card-prog-bar"><div class="pip-card-prog-fill" style="width:'+prog+'%"></div></div></div>';
      if(p.deadline) html+='<div class="pip-card-deadline '+(overdue?'overdue':'')+'"><i class="fas fa-calendar"></i> '+new Date(p.deadline).toLocaleDateString('id-ID',{day:'numeric',month:'short'})+(overdue?' — Terlambat!':'')+'</div>';
      if(p.uploaded) html+='<div style="font-size:10px;color:#4ade80;margin-top:4px"><i class="fas fa-check-circle"></i> Uploaded</div>';
      html+='</div>';
    }
    body.innerHTML=html;
  }
}
function calcPipProg(p){
  var idx=PIP_STAGES.indexOf(p.stage);
  if(p.uploaded) return 100;
  var base=Math.round(idx/PIP_STAGES.length*100);
  var cl=p.checklists&&p.checklists[p.stage]?p.checklists[p.stage]:[];
  var stCl=PIP_CLs[p.stage]||[];
  var done=cl.filter(function(x){return x;}).length;
  var within=stCl.length?Math.round(done/stCl.length*(100/PIP_STAGES.length)):0;
  return Math.min(99,base+within);
}
function openNewProject(stage,title,type){
  stage=stage||'idea'; title=title||''; type=type||'minecraft';
  gid('pip-edit-id').value='';
  var ti=gid('pip-title');if(ti)ti.value=title;
  var ty=gid('pip-type');if(ty)ty.value=type;
  var st2=gid('pip-stage');if(st2){st2.value=stage;updatePipelineStepUI();}
  var ch=gid('pip-channel');if(ch)ch.value='CRC STUDIO';
  var ids2=['pip-desc','pip-notes'];for(var i=0;i<ids2.length;i++){var e=gid(ids2[i]);if(e)e.value='';}
  var dl=gid('pip-deadline');if(dl)dl.value='';
  var pr=gid('pip-priority');if(pr)pr.value='medium';
  var db=gid('pip-delete-btn');if(db)db.style.display='none';
  st('pip-modal-title','Proyek Konten Baru');
  renderPipelineChecklist(stage,null);
  var m=gid('m-pipeline');if(m)m.style.display='flex';
}
function openEditProject(id){
  var p=null; for(var i=0;i<S.pipeline.length;i++){if(S.pipeline[i].id===id){p=S.pipeline[i];break;}} if(!p)return;
  gid('pip-edit-id').value=id;
  var ti=gid('pip-title');if(ti)ti.value=p.title;
  var ty=gid('pip-type');if(ty)ty.value=p.type||'minecraft';
  var ch=gid('pip-channel');if(ch)ch.value=p.channel||'CRC STUDIO';
  var dc=gid('pip-desc');if(dc)dc.value=p.desc||'';
  var st2=gid('pip-stage');if(st2){st2.value=p.stage;updatePipelineStepUI();}
  var pr=gid('pip-priority');if(pr)pr.value=p.priority||'medium';
  var dl=gid('pip-deadline');if(dl)dl.value=p.deadline||'';
  var nt=gid('pip-notes');if(nt)nt.value=p.notes||'';
  var db=gid('pip-delete-btn');if(db)db.style.display='flex';
  st('pip-modal-title','Edit Proyek');
  renderPipelineChecklist(p.stage,p);
  var m=gid('m-pipeline');if(m)m.style.display='flex';
}
function updatePipelineStepUI(){
  var st2=gid('pip-stage'); if(!st2)return;
  var stage=st2.value;
  var idx=PIP_STAGES.indexOf(stage);
  for(var i=0;i<PIP_STAGES.length;i++){
    var sep=gid('pst-'+PIP_STAGES[i]);
    var lin=gid('pst-line-'+(i+1));
    if(!sep) continue;
    sep.classList.remove('active','done');
    if(i<idx) sep.classList.add('done');
    else if(i===idx) sep.classList.add('active');
    if(lin){ lin.classList.remove('done','active'); if(i<idx)lin.classList.add('done'); else if(i===idx)lin.classList.add('active'); }
  }
  var editId=gid('pip-edit-id');
  var p=editId&&editId.value?S.pipeline.find(function(x){return x.id===editId.value;}):null;
  renderPipelineChecklist(stage,p);
}
function renderPipelineChecklist(stage,project){
  var el=gid('pip-checklist-area'); if(!el)return;
  var items=PIP_CLs[stage]||[];
  var saved=project&&project.checklists&&project.checklists[stage]?project.checklists[stage]:[];
  var done=0; for(var i=0;i<items.length;i++){if(saved[i])done++;}
  var html='<div class="pip-checklist-wrap"><div class="pip-cl-title"><i class="fas fa-tasks"></i> Checklist: '+PIP_LABELS[stage]+'</div>';
  for(var j=0;j<items.length;j++){
    var checked=saved[j]||false;
    html+='<div class="pip-cl-item '+(checked?'done':'')+'" onclick="togglePipCl('+j+')"><button class="pip-cl-check '+(checked?'on':'')+'" id="picl-'+j+'"></button><span class="pip-cl-text">'+items[j]+'</span></div>';
  }
  html+='<div class="pip-cl-prog"><i class="fas fa-chart-bar" style="color:var(--red)"></i> '+done+'/'+items.length+' selesai</div></div>';
  el.innerHTML=html;
}
function togglePipCl(idx){
  var stage=gid('pip-stage'); if(!stage)return;
  var s=stage.value;
  var editId=gid('pip-edit-id');
  var p=editId&&editId.value?S.pipeline.find(function(x){return x.id===editId.value;}):null;
  if(p){
    if(!p.checklists) p.checklists={};
    if(!p.checklists[s]) p.checklists[s]=[];
    p.checklists[s][idx]=!p.checklists[s][idx];
    save(); renderPipeline();
  }
  var btn=gid('picl-'+idx); if(btn)btn.classList.toggle('on');
  var row=btn&&btn.parentNode?btn.parentNode:null; if(row)row.classList.toggle('done');
  var cl=gid('pip-checklist-area');
  if(cl){ var ps=cl.querySelectorAll('.pip-cl-item'); var done2=0; for(var i=0;i<ps.length;i++){if(ps[i].classList.contains('done'))done2++;} var pp=cl.querySelector('.pip-cl-prog'); if(pp)pp.innerHTML='<i class="fas fa-chart-bar" style="color:var(--red)"></i> '+done2+'/'+(PIP_CLs[s]||[]).length+' selesai'; }
}
function savePipelineProject(){
  var te=gid('pip-title'), title=te?te.value.trim():''; if(!title){toast('err','Judul tidak boleh kosong!');return;}
  var stage=gid('pip-stage'); stage=stage?stage.value:'idea';
  function v(id){var e=gid(id);return e?e.value:'';}
  var editId=gid('pip-edit-id');
  if(editId&&editId.value){
    var p=S.pipeline.find(function(x){return x.id===editId.value;});
    if(p){p.title=title;p.type=v('pip-type');p.channel=v('pip-channel');p.desc=v('pip-desc');p.stage=stage;p.priority=v('pip-priority');p.deadline=v('pip-deadline');p.notes=v('pip-notes');}
  }else{
    S.pipeline.push({id:''+Date.now(),title:title,type:v('pip-type'),channel:v('pip-channel'),desc:v('pip-desc'),stage:stage,priority:v('pip-priority'),deadline:v('pip-deadline'),notes:v('pip-notes'),checklists:{},uploaded:false,createdAt:new Date().toISOString()});
  }
  save(); closeModal('m-pipeline'); renderPipeline(); toast('ok','Proyek "'+title+'" disimpan!');
}
function deletePipelineProject(){
  var editId=gid('pip-edit-id'); var id=editId?editId.value:'';
  if(!id||!confirm('Hapus proyek ini?')) return;
  S.pipeline=S.pipeline.filter(function(p){return p.id!==id;});
  save(); closeModal('m-pipeline'); renderPipeline(); toast('info','Proyek dihapus.');
}

console.log('CRC Creator Studio - Ready!');
