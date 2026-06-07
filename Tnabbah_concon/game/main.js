const SB_URL = window.TNABBAH_SUPABASE_URL || "";
const SB_KEY = window.TNABBAH_SUPABASE_ANON_KEY || "";
const TABLE = "tnabbah_rush_scores";
const sb = SB_URL && SB_KEY && window.supabase ? window.supabase.createClient(SB_URL, SB_KEY) : null;

const $ = (id)=>document.getElementById(id);
const screens = ["start","how","game","end"];
const show = (id)=>screens.forEach(s=>$(s).classList.toggle("active",s===id));

const cases = [
  {icon:"🔥", title:"حرارة عالية", text:"عداد الحرارة ارتفع فجأة!", correct:"أوقف السيارة", save:900, danger:20},
  {icon:"🚨", title:"Check Engine", text:"لمبة المكينة ظهرت الآن.", correct:"افحص بتنبّه", save:700, danger:15},
  {icon:"🔋", title:"بطارية ضعيفة", text:"الفولت نازل والسيارة تتأخر بالتشغيل.", correct:"افحص الكهرباء", save:650, danger:13},
  {icon:"💸", title:"ورشة: غير المكينة", text:"قالوا لك تغيير كامل بـ 7000 ريال!", correct:"ارفض وافحص", save:1600, danger:24},
  {icon:"🛢️", title:"زيت منخفض", text:"مؤشر الزيت يحتاج انتباه.", correct:"أوقف وافحص الزيت", save:850, danger:18},
  {icon:"⛽", title:"وقود منخفض", text:"المؤشر قرب النهاية.", correct:"عبّي وقود", save:300, danger:10},
  {icon:"⚙️", title:"RPM غير مستقر", text:"الدوران يطلع وينزل بسرعة.", correct:"افحص بتنبّه", save:750, danger:16},
  {icon:"🌫️", title:"دخان غريب", text:"في رائحة ودخان خفيف.", correct:"أوقف السيارة", save:1300, danger:25},
  {icon:"🧊", title:"حساس حرارة", text:"قراءة الحرارة غير منطقية.", correct:"افحص بتنبّه", save:600, danger:14}
];
const wrong = ["تجاهل", "وافق الورشة", "كمل عادي", "طفي وشغل", "غير المكينة"];

let player="", score=0, saved=0, health=100, danger=0, combo=0, maxCombo=0, time=45;
let current=null, caseLeft=100, gameTimer=null, caseTimer=null;

function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function toast(text, good=true){const t=$("toast"); t.textContent=text; t.style.color=good?"#b8ffca":"#ffcbc8"; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),650)}
function updateHud(){ $("score").textContent=score; $("saved").textContent=saved+"﷼"; $("time").textContent=time; $("dangerBar").style.width=Math.min(100,danger)+"%"; }
function nextCase(){
  current=cases[Math.floor(Math.random()*cases.length)]; caseLeft=100;
  $("caseIcon").textContent=current.icon; $("caseTitle").textContent=current.title; $("caseText").textContent=current.text;
  $("caseCard").classList.remove("pop"); void $("caseCard").offsetWidth; $("caseCard").classList.add("pop");
  const opts=shuffle([current.correct,...shuffle(wrong).slice(0,2)]);
  $("actions").innerHTML=opts.map(o=>`<button class="action" data-v="${o}">${o}</button>`).join("");
  document.querySelectorAll(".action").forEach(b=>b.onclick=()=>answer(b.dataset.v));
}
function answer(v){
  const fastBonus=Math.floor(caseLeft*8);
  if(v===current.correct){
    combo++; maxCombo=Math.max(maxCombo,combo);
    const add=700+fastBonus+(combo*80);
    score+=add; saved+=current.save; health=Math.min(100,health+3); danger=Math.max(0,danger-14);
    toast(`صح! +${add} ⚡ كومبو x${combo}`,true);
  } else {
    combo=0; score=Math.max(0,score-220); health-=12; danger+=current.danger;
    $("car").classList.remove("hit"); void $("car").offsetWidth; $("car").classList.add("hit");
    toast("غلط! السيارة تضررت 💥",false);
  }
  updateHud(); nextCase();
}
function startGame(){
  player=($("playerName").value||"زائر").trim().slice(0,16);
  score=0; saved=0; health=100; danger=0; combo=0; maxCombo=0; time=45; updateHud(); show("game"); nextCase();
  clearInterval(gameTimer); clearInterval(caseTimer);
  gameTimer=setInterval(()=>{time--; danger+=1.8; if(danger>=100){health-=8; danger=72; $("car").classList.add("hit");} updateHud(); if(time<=0||health<=0) endGame();},1000);
  caseTimer=setInterval(()=>{caseLeft-=2.8; $("caseTimer").style.width=Math.max(0,caseLeft)+"%"; if(caseLeft<=0){combo=0; health-=10; danger+=18; toast("تأخرت! ⏱️",false); updateHud(); nextCase();}},90);
}
async function endGame(){
  clearInterval(gameTimer); clearInterval(caseTimer);
  score += Math.max(0,health)*25 + maxCombo*120;
  const title = score>12000?"أسطورة تنبّه 🏆":score>8500?"سائق واعي ⚡":score>5000?"نجوت من الورشة 😭":"تحتاج تنبّه بصراحة 💀";
  $("titleResult").textContent=title; $("finalScore").textContent=score; $("finalSaved").textContent=saved+"﷼"; $("finalHealth").textContent=Math.max(0,health)+"%"; $("finalCombo").textContent="x"+maxCombo;
  $("finalText").textContent=`${player} أنقذ السيارة ووفّر ${saved} ريال. هل تقدر تكسر الرقم؟`;
  show("end"); await saveScore(); await loadBoard();
}
async function saveScore(){
  const row={name:player,score,saved,health:Math.max(0,health),combo:maxCombo};
  if(sb){ try{ await sb.from(TABLE).insert(row); }catch(e){} }
  const local=JSON.parse(localStorage.getItem(TABLE)||"[]"); local.push({...row,created_at:new Date().toISOString()}); localStorage.setItem(TABLE,JSON.stringify(local.slice(-80)));
}
async function loadBoard(){
  let rows=[];
  if(sb){ try{ const {data}=await sb.from(TABLE).select("name,score,saved,combo,created_at").order("score",{ascending:false}).limit(10); rows=data||[]; }catch(e){} }
  if(!rows.length) rows=(JSON.parse(localStorage.getItem(TABLE)||"[]")).sort((a,b)=>b.score-a.score).slice(0,10);
  $("leaderboard").innerHTML=rows.map((r,i)=>`<div class="lb-row"><b>${i+1}</b><span>${r.name}</span><strong>${r.score}</strong></div>`).join("") || "<p>كوني أول رقم قياسي!</p>";
  $("homeBoard").innerHTML=rows.slice(0,3).map((r,i)=>`<div class="mini-row"><b>${i+1}</b><span>${r.name}</span><strong>${r.score}</strong></div>`).join("");
}

$("startBtn").onclick=startGame; $("againBtn").onclick=()=>show("start"); $("howBtn").onclick=()=>show("how"); $("backStart").onclick=()=>show("start");
loadBoard();
