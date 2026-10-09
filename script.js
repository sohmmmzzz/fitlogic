const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const API='/api/state';
const titles={home:'Good afternoon 👋',food:'Nutrition at a glance',activity:'Move with intention',lifestyle:'Your whole day matters',goals:'Your personalized plan',analytics:'See the bigger picture'};

const FOOD_DB={
 banana:{calories:105,protein:1.3,carbs:27,fats:.4,baseQty:1,unit:'medium',unitType:'piece'},
 apple:{calories:95,protein:.5,carbs:25,fats:.3,baseQty:1,unit:'medium',unitType:'piece'},
 orange:{calories:62,protein:1.2,carbs:15.4,fats:.2,baseQty:1,unit:'medium',unitType:'piece'},
 oats:{calories:389,protein:16.9,carbs:66.3,fats:6.9,baseQty:100,unit:'100g',unitType:'gram'},
 'high protein oats':{calories:370,protein:20,carbs:55,fats:8,baseQty:100,unit:'100g',unitType:'gram'},
 'chicken breast':{calories:165,protein:31,carbs:0,fats:3.6,baseQty:100,unit:'100g',unitType:'gram'},
 chicken:{calories:165,protein:31,carbs:0,fats:3.6,baseQty:100,unit:'100g',unitType:'gram'},
 rice:{calories:130,protein:2.7,carbs:28,fats:.3,baseQty:100,unit:'100g cooked',unitType:'gram'},
 'white rice':{calories:130,protein:2.7,carbs:28,fats:.3,baseQty:100,unit:'100g cooked',unitType:'gram'},
 'brown rice':{calories:123,protein:2.7,carbs:25.6,fats:1,baseQty:100,unit:'100g cooked',unitType:'gram'},
 egg:{calories:72,protein:6.3,carbs:.4,fats:4.8,baseQty:1,unit:'large egg',unitType:'piece'},
 eggs:{calories:72,protein:6.3,carbs:.4,fats:4.8,baseQty:1,unit:'large egg',unitType:'piece'},
 paneer:{calories:265,protein:18.3,carbs:6.1,fats:20.8,baseQty:100,unit:'100g',unitType:'gram'},
 milk:{calories:61,protein:3.2,carbs:4.8,fats:3.3,baseQty:100,unit:'100ml',unitType:'ml'},
 curd:{calories:61,protein:3.5,carbs:4.7,fats:3.3,baseQty:100,unit:'100g',unitType:'gram'},
 dal:{calories:116,protein:9,carbs:20,fats:.4,baseQty:100,unit:'100g cooked',unitType:'gram'},
 roti:{calories:120,protein:3.5,carbs:18,fats:3,baseQty:1,unit:'roti',unitType:'piece'},
 chapati:{calories:120,protein:3.5,carbs:18,fats:3,baseQty:1,unit:'chapati',unitType:'piece'},
 poha:{calories:180,protein:3.5,carbs:35,fats:3,baseQty:1,unit:'plate',unitType:'piece'},
 sprouts:{calories:80,protein:8,carbs:10,fats:.5,baseQty:100,unit:'100g',unitType:'gram'},
 chickpeas:{calories:164,protein:8.9,carbs:27.4,fats:2.6,baseQty:100,unit:'100g cooked',unitType:'gram'},
 chole:{calories:164,protein:8.9,carbs:27.4,fats:2.6,baseQty:100,unit:'100g cooked',unitType:'gram'},
 potato:{calories:87,protein:1.9,carbs:20,fats:.1,baseQty:100,unit:'100g',unitType:'gram'},
 aloo:{calories:87,protein:1.9,carbs:20,fats:.1,baseQty:100,unit:'100g',unitType:'gram'},
 'cold coffee':{calories:180,protein:5,carbs:28,fats:5,baseQty:1,unit:'glass',unitType:'piece'},
 bread:{calories:75,protein:2.5,carbs:13,fats:1,baseQty:1,unit:'slice',unitType:'piece'},
 'protein bar':{calories:200,protein:20,carbs:20,fats:7,baseQty:1,unit:'bar',unitType:'piece'},
 whey:{calories:120,protein:24,carbs:3,fats:2,baseQty:1,unit:'scoop',unitType:'piece'},
 'whey protein':{calories:120,protein:24,carbs:3,fats:2,baseQty:1,unit:'scoop',unitType:'piece'}
};

const defaults={
 foods:[],activities:[],movement:{walking:0,stairs:0,commute:0,steps:0},
 goals:{configured:false,goal:'Muscle Gain',age:19,sex:'male',height:180,bodyWeight:67,targetWeight:72,activityLevel:'moderate',calTarget:null,proteinTarget:null,maintenance:null},
 history:[175,230,-80,310,120,290,145],dailySnapshots:[]
};
let currentUser=null;
let state=structuredClone(defaults);
state.goals={...defaults.goals,...(state.goals||{})};
let charts={};

function saveLocal(){if(currentUser)localStorage.setItem('fitlogicState:'+currentUser.email,JSON.stringify(state))}
async function sync(){saveLocal();try{await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)})}catch(e){}}
function markChanged(){state._localEdited=true;sync()}

async function loadBackend(){
 try{
  const r=await fetch(API);if(!r.ok)throw new Error('Could not load your data');
  const d=await r.json();
  if(d&&typeof d==='object'){state={...structuredClone(defaults),...d,goals:{...defaults.goals,...(d.goals||{})},movement:{...defaults.movement,...(d.movement||{})}};saveLocal()}
  renderAll();
 }catch(e){toast('Could not load your account data')}
}

function showPage(id){
 $$('.page').forEach(p=>p.classList.toggle('active-page',p.id===id));
 $$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===id));
 $('#pageTitle').textContent=titles[id]||'FitLogic';
 if(id==='analytics')setTimeout(renderCharts,40);
 window.scrollTo({top:0,behavior:'smooth'});
}
$$('.nav').forEach(n=>n.onclick=()=>showPage(n.dataset.page));
$$('[data-open]').forEach(b=>b.onclick=()=>showPage(b.dataset.open));

function totals(){
 const f=state.foods.reduce((a,x)=>({cal:a.cal+(+x.calories||0),p:a.p+(+x.protein||0),c:a.c+(+x.carbs||0),fat:a.fat+(+x.fats||0)}),{cal:0,p:0,c:0,fat:0});
 const activity=state.activities.reduce((s,x)=>s+(+x.calories||0),0);
 const movement=Math.round(state.movement.walking*55+state.movement.stairs*4+state.movement.commute*2.7);
 return {...f,activity,movement,burned:activity+movement};
}
const pct=(a,b)=>b?Math.min(100,Math.max(0,Math.round(a/b*100))):0;

function calculatePlan(g=state.goals){
 const weight=+g.bodyWeight,height=+g.height,age=+g.age;
 if(!weight||!height||!age)return null;
 const bmr=g.sex==='female'?(10*weight+6.25*height-5*age-161):(10*weight+6.25*height-5*age+5);
 const mult={sedentary:1.2,light:1.375,moderate:1.55,active:1.725,very_active:1.9}[g.activityLevel]||1.55;
 const maintenance=Math.round(bmr*mult);
 const adjustment=g.goal==='Muscle Gain'?250:g.goal==='Fat Loss'?-400:0;
 const target=Math.round((maintenance+adjustment)/50)*50;
 const protein=Math.round(weight*(g.goal==='Fat Loss'?2.0:g.goal==='Muscle Gain'?1.8:1.6));
 return {bmr:Math.round(bmr),maintenance,adjustment,target,protein};
}

function recommendation(){
 const g=state.goals,t=totals(),plan=calculatePlan();
 if(!plan)return {title:'Set up your plan',text:'Enter your profile details in My Plan and FitLogic will calculate your calorie and protein targets.'};
 const left=Math.max(0,plan.target-t.cal),pleft=Math.max(0,plan.protein-t.p);
 if(left===0 && pleft===0)return {title:'Daily targets reached 🎯',text:'You have reached your recommended calorie and protein targets. Focus on hydration, recovery and a balanced meal if you are still hungry.'};
 if(pleft>20 && left>250)return {title:`Prioritize protein + ${Math.round(left/50)*50} kcal`,text:`You still need about ${Math.round(pleft)}g protein and ${Math.round(left)} kcal. Choose a protein-rich meal such as chicken, eggs, paneer, dal or Greek yogurt.`};
 if(left>250)return {title:`About ${Math.round(left)} kcal remaining`,text:'You have room for another balanced meal. Aim for protein + a carbohydrate source rather than only snacks.'};
 if(pleft>20)return {title:`Protein is the priority`,text:`You are close to your calorie target but still need about ${Math.round(pleft)}g protein. Choose a lean protein source.`};
 return {title:'You are close to target',text:'Your intake is close to your recommended range. Keep the next meal moderate and protein-focused.'};
}

function renderRecommendation(id,compact=false){
 const r=recommendation();
 const el=$(id);if(!el)return;
 el.innerHTML=`<span>✦</span><div><b>${r.title}</b><p>${r.text}</p></div>${compact?'':'<button data-open="food">Log →</button>'}`;
 const btn=el.querySelector('[data-open]');if(btn)btn.onclick=()=>showPage('food');
}

function renderList(id,data,type){
 $('#'+id).innerHTML=data.length?data.map((x,i)=>`
 <div class="list-item"><div class="item-icon">${type==='food'?'🍽️':'🏃'}</div>
 <div><span class="item-name">${x.name}</span><span class="item-meta">${x.meta}</span></div>
 <div class="item-value">${Math.round(x.calories)} kcal<small>${type==='food'?Math.round(x.protein)+'g protein':x.type||'Activity'}</small><button class="delete-btn" data-t="${type}" data-i="${i}">×</button></div></div>`).join(''):'<div class="empty">Nothing logged yet. Add your first entry.</div>';
 $$('.delete-btn').forEach(b=>b.onclick=()=>{state[b.dataset.t+'s'].splice(+b.dataset.i,1);markChanged();renderAll();toast('Entry deleted')});
}

function todayKey(){return new Date().toISOString().slice(0,10)}
function snapshotToday(){
 const t=totals(),plan=calculatePlan();
 if(!state.dailySnapshots)state.dailySnapshots=[];
 const key=todayKey();
 const snap={date:key,cal:+t.cal.toFixed(1),protein:+t.p.toFixed(1),burned:+t.burned.toFixed(1),steps:state.movement.steps};
 const i=state.dailySnapshots.findIndex(x=>x.date===key);
 if(i>=0)state.dailySnapshots[i]=snap; else state.dailySnapshots.push(snap);
 state.dailySnapshots=state.dailySnapshots.slice(-30);
 if(plan){state.history=[...state.history.slice(-6),Math.round(t.cal-t.burned)];}
}
function analyticsMetrics(){
 const t=totals(),plan=calculatePlan(),hour=new Date().getHours()+new Date().getMinutes()/60;
 const elapsed=Math.max(.25,Math.min(1,(hour-6)/16));
 const forecastCal=t.cal/elapsed, forecastP=t.p/elapsed;
 const target=plan?.target||0, ptarget=plan?.protein||0;
 const left=plan?Math.max(0,target-t.cal):null, pleft=plan?Math.max(0,ptarget-t.p):null;
 const net=Math.round(t.cal-t.burned);
 const adherence=plan?Math.round((pct(t.cal,target)*.45+pct(t.p,ptarget)*.4+pct(state.movement.steps,10000)*.15)):null;
 const recent=(state.history||[]).slice(-7), avg=recent.length?recent.reduce((a,b)=>a+b,0)/recent.length:0;
 let direction='Stable'; if(avg>150)direction='Surplus'; else if(avg<-150)direction='Deficit';
 let timeline='—';
 return {t,plan,elapsed,forecastCal,forecastP,target,ptarget,left,pleft,net,adherence,recent,avg,direction};
}
function renderAnalyticsInsights(){
 const m=analyticsMetrics(),{t,plan,elapsed,forecastCal,forecastP,target,ptarget,left,pleft,net,adherence,avg,direction}=m;
 const set=(id,v)=>{const e=$(id);if(e)e.textContent=v};
 set('#analyticsCalories',Math.round(t.cal).toLocaleString());set('#analyticsBurned',Math.round(t.burned).toLocaleString());set('#analyticsNet',(net>=0?'+':'')+net+' kcal');
 set('#analyticsProtein',ptarget?Math.round(pleft)+'g left':Math.round(t.p)+'g');set('#analyticsLeft',left===null?'—':Math.round(left).toLocaleString());set('#analyticsSteps',state.movement.steps.toLocaleString());
 if(plan){
  $('#analyticsCalBar').style.width=Math.min(100,pct(t.cal,target))+'%';$('#analyticsBurnBar').style.width=Math.min(100,pct(t.burned,target))+'%';
  set('#analyticsCalStatus',Math.round(t.cal/target*100)+'% of calorie target');set('#analyticsBurnStatus',t.burned?Math.round(t.burned)+' kcal logged':'No movement logged');
  set('#analyticsBalanceStatus',net>target*.15?'High surplus':net<-target*.15?'Large deficit':'Within normal range');
  set('#analyticsAdherence',adherence+'%');set('#analyticsAdherenceStatus',adherence>=80?'On track':adherence>=60?'Needs attention':'Needs adjustment');
  const confidence=t.cal&&t.p?'Medium confidence':'Low confidence';set('#forecastConfidence',confidence);
  set('#forecastCalories',Math.round(forecastCal).toLocaleString()+' kcal');set('#forecastProtein',Math.round(forecastP)+'g');
  const calDelta=Math.round(forecastCal-target), pDelta=Math.round(forecastP-ptarget);
  set('#forecastCalDelta',(calDelta>=0?'+':'')+calDelta+' vs target');set('#forecastProteinDelta',(pDelta>=0?'+':'')+pDelta+'g vs target');
  $('#forecastCurrentBar').style.width=Math.min(100,pct(t.cal,target))+'%';$('#forecastProjectedBar').style.width=Math.min(100,Math.round(forecastCal/target*100))+'%';
  let forecastText='';
  if(forecastCal>target+150)forecastText=`At your current pace, you may finish about ${Math.round(forecastCal-target)} kcal over target. Keep the next meals lighter and protein-focused.`;
  else if(forecastCal<target-250)forecastText=`At your current pace, you may finish about ${Math.round(target-forecastCal)} kcal below target. Plan a balanced meal before the day ends.`;
  else if(forecastP<ptarget-15)forecastText=`Calories look close, but protein is projected to finish about ${Math.round(ptarget-forecastP)}g short. Prioritize a protein-rich meal.`;
  else forecastText='Your current pace is aligned with your plan. Keep the same approach and update your logs as the day changes.';
  set('#forecastCallout',forecastText);
  set('#trendValue',(avg>=0?'+':'')+Math.round(avg)+' kcal/day');set('#trendDirection',direction);set('#trendTargetWeight',(state.goals.targetWeight||'—')+' kg');
  const diff=Math.abs((state.goals.targetWeight||state.goals.bodyWeight)-state.goals.bodyWeight);
  const rate=Math.max(.05,Math.abs(avg)*7/7700); const weeks=rate?Math.ceil(diff/rate):0;
  set('#trendTimeline',diff<.1?'At target':weeks?weeks+'+ weeks':'Building data');
  set('#trendArrow',direction==='Surplus'?'↗':direction==='Deficit'?'↘':'→');
  let actionTitle='Stay on track',actionText='Your current numbers are reasonably aligned with your plan.';
  if(pleft>20&&left>200){actionTitle='Prioritize protein';actionText=`You have about ${Math.round(pleft)}g protein and ${Math.round(left)} kcal left. Choose chicken, eggs, paneer, dal or whey.`}
  else if(left>350){actionTitle='You still have room to eat';actionText=`About ${Math.round(left)} kcal remain. Add a complete meal instead of letting the day end too far below target.`}
  else if(state.movement.steps<7000){actionTitle='Add a short walk';actionText='Your nutrition is being tracked. A 10–20 minute walk can improve daily movement and energy expenditure.'}
  else if(adherence<60){actionTitle='Rebalance the day';actionText='Your current intake is drifting from the plan. Use the forecast above to decide your next meal.'}
  set('#analyticsActionTitle',actionTitle);set('#analyticsActionText',actionText);
 }else{
  ['#analyticsCalBar','#analyticsBurnBar'].forEach(id=>$(id).style.width='0%');
  set('#forecastCallout','Complete My Plan first. Once FitLogic knows your target, predictive analytics can forecast your day.');set('#forecastConfidence','Needs plan');set('#trendValue','—');set('#trendDirection','—');set('#trendTargetWeight','—');set('#trendTimeline','—');set('#trendArrow','—');set('#analyticsActionTitle','Set up your plan');set('#analyticsActionText','Add age, height, weight, activity level and goal to unlock personalized analytics.');
 }
}

function renderDashboard(){
 const t=totals(),g=state.goals,plan=calculatePlan(),target=plan?.target||0,proteinTarget=plan?.protein||0;
 const ci=pct(t.cal,target),pr=pct(t.p,proteinTarget),st=pct(state.movement.steps,10000);
 const left=plan?Math.max(0,target-t.cal):null;
 $('#calIn').textContent=Math.round(t.cal).toLocaleString();$('#calLeft').textContent=left===null?'—':left.toLocaleString();
 $('#protein').textContent=Math.round(t.p)+'g';$('#steps').textContent=state.movement.steps.toLocaleString();
 $('#calTargetSmall').textContent=target?target.toLocaleString():'—';$('#proteinTargetSmall').textContent=proteinTarget?proteinTarget+'g':'—';
 $('#calInBar').style.width=ci+'%';$('#calLeftBar').style.width=left===null?'0%':(left?Math.min(100,Math.round(left/target*100)):100)+'%';$('#proteinBar').style.width=pr+'%';$('#stepsBar').style.width=st+'%';
 $('#ringValue').textContent=Math.round((ci+pr+st)/3)+'%';
 const bal=Math.round(t.cal-t.burned);$('#balanceBadge').textContent=plan?(bal>=0?'+':'')+bal+' kcal':'Set plan';
 $('#balanceValue').textContent=plan?(bal>=0?'+':'')+bal+' kcal':'—';$('#energyIn').textContent=Math.round(t.cal)+' kcal';$('#energyOut').textContent=Math.round(t.burned)+' kcal';
 $('#energyInBar').style.width=target?pct(t.cal,target)+'%':'0%';$('#energyOutBar').style.width=target?Math.min(100,Math.round(t.burned/target*100))+'%':'0%';
 $('#homeFoodSummary').textContent=state.foods.length?`${state.foods.length} foods · ${Math.round(t.cal)} kcal · ${Math.round(t.p)}g protein`:'Nothing logged yet.';
 $('#homeActivitySummary').textContent=state.activities.length?`${state.activities.length} activities · ${Math.round(t.activity)} kcal burned`:'Nothing logged yet.';
 $('#homeLifeSummary').textContent=`${state.movement.steps.toLocaleString()} steps · ${state.movement.walking.toFixed(1)} km`;
 $('#homeGoalSummary').textContent=plan?`${g.goal} · ${target.toLocaleString()} kcal · ${proteinTarget}g protein`:'Not configured';
 $('#profileGoal').textContent=plan?g.goal:'Set up your plan';
 const vertices=[...new Set(['HOME',...state.activities.map(a=>(a.type||'activity').toUpperCase()),'COLLEGE'])];
 $('#routeGraph')?.replaceChildren(...vertices.flatMap((x,i)=>{const n=document.createElement('div');n.className='node';n.innerHTML=`<b>${x}</b><small>point ${i+1}</small>`;return i?[Object.assign(document.createElement('span'),{className:'edge',textContent:'→'}),n]:[n]}));
 renderRecommendation('#mainRecommendation');
 const next=$('#nextMeal');if(next){const r=recommendation();next.innerHTML=`<div class="next-icon">✦</div><div><b>${r.title}</b><p>${r.text}</p></div>`}
}

function renderAll(){
 snapshotToday();
 const t=totals(),plan=calculatePlan();
 renderDashboard();
 renderList('foodList',state.foods,'food');renderList('activityList',state.activities,'activity');
 const left=plan?Math.max(0,plan.target-t.cal):null,pleft=plan?Math.max(0,plan.protein-t.p):null;
 $('#foodCal').textContent=Math.round(t.cal).toLocaleString();$('#foodCalLeft').textContent=left===null?'—':left.toLocaleString();$('#foodProtein').textContent=Math.round(t.p)+'g';$('#foodCarbs').textContent=Math.round(t.c)+'g';$('#foodFats').textContent=Math.round(t.fat)+'g';
 $('#foodProteinLeft').textContent=pleft===null?'target —':`${Math.round(pleft)}g protein left`;$('#foodCount').textContent=state.foods.length+' ITEMS';renderRecommendation('#foodRecommendation',true);
 $('#activityBurnBadge').innerHTML=Math.round(t.activity)+' <small>kcal</small>';$('#activityCount').innerHTML=state.activities.length+' <small>logged</small>';
 $('#activityRecommendation').textContent=state.activities.length?'Keep moving':'Add activity';
 $('#activityAdvice').innerHTML=`<span>✦</span><div><b>${state.movement.steps<7000?'Try to reach 7,000–10,000 steps':'Great movement today'}</b><p>${state.movement.steps<7000?'A short walk is an easy way to increase daily activity.':'Your step count is already strong. Focus on your planned workout and recovery.'}</p></div>`;
 const m=state.movement;$('#walk').value=m.walking;$('#stairs').value=m.stairs;$('#commute').value=m.commute;$('#lifeSteps').value=m.steps;
 $('#walkOut').textContent=m.walking.toFixed(1)+' km';$('#stairsOut').textContent=m.stairs+' floors';$('#commuteOut').textContent=m.commute+' min';$('#lifeStepsOut').textContent=m.steps.toLocaleString();
 const wb=Math.round(m.walking*55),sb=Math.round(m.stairs*4),cb=Math.round(m.commute*2.7);$('#lifeBurn').innerHTML=(wb+sb+cb)+' <small>kcal</small>';$('#walkBurn').textContent=wb+' kcal';$('#stairsBurn').textContent=sb+' kcal';$('#commuteBurn').textContent=cb+' kcal';
 const g=state.goals;$('#age').value=g.age||'';$('#sex').value=g.sex||'male';$('#height').value=g.height||'';$('#bodyWeight').value=g.bodyWeight||'';$('#targetWeight').value=g.targetWeight||'';$('#activityLevel').value=g.activityLevel||'moderate';
 if(plan){$('#targetCalPreview').textContent=plan.target.toLocaleString();$('#targetProteinPreview').textContent=plan.protein+'g';$('#maintenancePreview').textContent=plan.maintenance.toLocaleString()+' kcal';$('#adjustmentPreview').textContent=(plan.adjustment>=0?'+':'')+plan.adjustment+' kcal';$('#weightPreview').textContent=`${g.bodyWeight} → ${g.targetWeight} kg`;$('#planStatus').innerHTML=`<span>✦</span><div><b>${g.goal} plan ready</b><p>Your target is ${plan.target.toLocaleString()} kcal and ${plan.protein}g protein per day.</p></div>`}
 else {$('#targetCalPreview').textContent='—';$('#targetProteinPreview').textContent='—';$('#maintenancePreview').textContent='—';$('#adjustmentPreview').textContent='—';$('#weightPreview').textContent='—'}
 renderAnalyticsInsights();
 $$('.goal').forEach(x=>x.classList.toggle('active',x.dataset.goal===g.goal));
 if($('#analytics').classList.contains('active-page'))renderCharts();
}

function renderCharts(){
 if(!window.Chart)return;
 const t=totals(),text=getComputedStyle(document.body).color,line=getComputedStyle(document.body).getPropertyValue('--line');
 const opts={responsive:true,plugins:{legend:{labels:{color:text}}},scales:{x:{ticks:{color:text},grid:{color:line}},y:{ticks:{color:text},grid:{color:line}}}};
 Object.values(charts).forEach(c=>c?.destroy());
 const hist=(state.history||[]).slice(-7); const labels=hist.map((_,i)=>i===hist.length-1?'Today':'D-'+(hist.length-1-i));
 charts.energy=new Chart($('#energyChart'),{type:'line',data:{labels,datasets:[{label:'Net energy balance (kcal)',data:hist,tension:.35,fill:true}]},options:opts});
 charts.macro=new Chart($('#macroChart'),{type:'doughnut',data:{labels:['Protein','Carbs','Fats'],datasets:[{data:[t.p*4,t.c*4,t.fat*9]}]},options:{plugins:{legend:{labels:{color:text}}}}});
 charts.activity=new Chart($('#activityChart'),{type:'bar',data:{labels:state.activities.length?state.activities.map(x=>x.name):['No activity'],datasets:[{label:'Calories burned',data:state.activities.length?state.activities.map(x=>x.calories):[0]}]},options:opts});
}

function parseFoodInput(input){
 let q=input.trim().toLowerCase().replace(/\s+/g,' ');
 let quantity=null, mode=null;
 let m=q.match(/^(\d+(?:\.\d+)?)\s*(g|grams|kg|ml|l)\s+(.+)$/i);
 if(m){quantity=parseFloat(m[1]);mode=m[2].toLowerCase();q=m[3]}
 else {m=q.match(/^(\d+(?:\.\d+)?)\s*(?:x|×)?\s+(.+)$/i);if(m){quantity=parseFloat(m[1]);q=m[2]}}
 const key=Object.keys(FOOD_DB).sort((a,b)=>b.length-a.length).find(k=>q===k||q.includes(k)||k.includes(q));
 if(!key)return null;
 const f=FOOD_DB[key];let factor=1,displayQty=f.unit;
 if(quantity!==null){
  if(mode){
   if(mode==='kg'||mode==='l')quantity*=1000;
   factor=quantity/f.baseQty;displayQty=quantity+(mode==='ml'||mode==='l'?'ml':'g');
  }else{
   if(f.unitType==='piece')factor=quantity/f.baseQty;
   else factor=quantity/f.baseQty;
   displayQty=quantity+' '+f.unit;
  }
 }
 return {key,...f,factor,displayQty,calories:f.calories*factor,protein:f.protein*factor,carbs:f.carbs*factor,fats:f.fats*factor};
}

function openModal(title,body){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;$('#modal').classList.remove('hidden')}
function closeModal(){$('#modal').classList.add('hidden')}
$('#modalClose').onclick=closeModal;$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};

function foodForm(){
 openModal('Add food',`<form id="foodForm"><div class="smart-input"><span>⌕</span><input required id="foodNameInput" name="name" autocomplete="off" placeholder="e.g. 100g chicken breast, 2 eggs"></div><div id="foodPreview" class="food-preview hidden"></div><div class="suggestions">${['100g chicken breast','2 eggs','1 banana','3 chapati','80g oats','200ml milk','100g paneer','1 plate poha'].map(x=>`<button type="button" class="suggest" data-food="${x}">${x}</button>`).join('')}</div><button class="primary full" type="submit">Add to today's food</button><p class="modal-help">Nutrition is estimated automatically from the built-in food database.</p></form>`);
 const input=$('#foodNameInput'),preview=$('#foodPreview');
 const update=()=>{const f=parseFoodInput(input.value);if(f){preview.classList.remove('hidden');preview.innerHTML=`<b>${f.displayQty} ${f.key}</b><span>${Math.round(f.calories)} kcal · ${Math.round(f.protein)}g protein · ${Math.round(f.carbs)}g carbs · ${Math.round(f.fats)}g fat</span>`}else preview.classList.add('hidden')};
 input.oninput=update;$$('.suggest').forEach(b=>b.onclick=()=>{input.value=b.dataset.food;update();input.focus()});
}

function activityForm(){
 openModal('Add activity',`<form id="activityForm"><input required name="name" class="wide-input" placeholder="Running, walking, gym, cycling..."><div class="form-grid"><input required type="number" name="duration" min="1" placeholder="Duration (minutes)"><input type="number" name="intensity" min="1" max="10" value="6" placeholder="Intensity 1–10"></div><div class="activity-preview" id="activityPreview">Enter duration for an estimate.</div><button class="primary full" type="submit">Add activity</button></form>`);
 const f=$('#activityForm'),p=$('#activityPreview');
 const calc=()=>{const n=f.name.value.toLowerCase(),d=+f.duration.value||0,i=+f.intensity.value||6,base=n.includes('run')?10:n.includes('cycling')?8:n.includes('walk')?4.5:n.includes('gym')||n.includes('strength')?6.5:n.includes('swim')?9:5,k=Math.round(d*base*(.75+i*.05));p.textContent=d?`Estimated burn: ${k} kcal`:'Enter duration for an estimate.';return k};
 f.name.oninput=calc;f.duration.oninput=calc;f.intensity.oninput=calc;
}

$('#addFood').onclick=foodForm;$('#addActivity').onclick=activityForm;

$('#modal').addEventListener('submit',async e=>{
 e.preventDefault();const o=Object.fromEntries(new FormData(e.target));
 if(e.target.id==='foodForm'){
  const f=parseFoodInput(o.name);if(!f){toast('Food not found — try a suggested item');return}
  state.foods.push({name:o.name,meta:`Automatic nutrition · ${f.displayQty}`,calories:f.calories,protein:f.protein,carbs:f.carbs,fats:f.fats,loggedAt:new Date().toISOString()});
 }else{
  const n=o.name.toLowerCase(),d=+o.duration,i=+o.intensity||6,base=n.includes('run')?10:n.includes('cycling')?8:n.includes('walk')?4.5:n.includes('gym')||n.includes('strength')?6.5:n.includes('swim')?9:5,k=Math.round(d*base*(.75+i*.05));
  state.activities.push({name:o.name,meta:`${d} min · intensity ${i}/10`,calories:k,type:'Workout',loggedAt:new Date().toISOString()});
 }
 markChanged();closeModal();renderAll();toast('Saved — dashboard updated');
});

['walk','stairs','commute','lifeSteps'].forEach(id=>$('#'+id).oninput=e=>{state.movement[{walk:'walking',stairs:'stairs',commute:'commute',lifeSteps:'steps'}[id]]=+e.target.value;markChanged();renderAll()});

$$('.goal').forEach(g=>g.onclick=()=>{$$('.goal').forEach(x=>x.classList.remove('active'));g.classList.add('active');state.goals.goal=g.dataset.goal});

$('#saveGoal').onclick=()=>{
 const g=state.goals;g.age=+$('#age').value;g.sex=$('#sex').value;g.height=+$('#height').value;g.bodyWeight=+$('#bodyWeight').value;g.targetWeight=+$('#targetWeight').value;g.activityLevel=$('#activityLevel').value;g.configured=true;
 const plan=calculatePlan(g);if(!plan){toast('Complete all profile fields');return}
 g.calTarget=plan.target;g.proteinTarget=plan.protein;g.maintenance=plan.maintenance;
 markChanged();renderAll();toast(`Plan calculated: ${plan.target} kcal · ${plan.protein}g protein`);
 showPage('home');
};

function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1900)}
$('#themeBtn').onclick=()=>{document.body.classList.toggle('dark');localStorage.setItem('fitlogicTheme',document.body.classList.contains('dark')?'dark':'light');if($('#analytics').classList.contains('active-page'))setTimeout(renderCharts,30)};
if(localStorage.getItem('fitlogicTheme')==='dark')document.body.classList.add('dark');
async function enterApp(user){
 currentUser=user;
 $('#authScreen').classList.add('hidden');$('#appShell').style.display='flex';
 $('#profileName').textContent=user.name;$('#avatar').textContent=user.name.split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();
 state=structuredClone(defaults);await loadBackend();showPage('home');
}
function leaveApp(){currentUser=null;state=structuredClone(defaults);localStorage.removeItem('fitlogicState');$('#appShell').style.display='none';$('#authScreen').classList.remove('hidden');$('#authPassword').value='';$('#authMessage').textContent='';}
async function checkAuth(){
 try{const r=await fetch('/api/me');const d=await r.json();if(d.authenticated){await enterApp(d.user)}else{leaveApp()}}
 catch(e){$('#authMessage').textContent='Backend is not running. Start it with npm start.';$('#authMessage').className='auth-message error'}
}
let authMode='login';
$$('.auth-tab').forEach(tab=>tab.onclick=()=>{authMode=tab.dataset.authMode;$$('.auth-tab').forEach(x=>x.classList.toggle('active',x===tab));$('#nameField').classList.toggle('hidden',authMode!=='register');$('#authName').required=authMode==='register';$('#authSubmit').textContent=authMode==='register'?'Create account':'Log in';$('#authMessage').textContent='';});
$('#authForm').onsubmit=async e=>{
 e.preventDefault();const msg=$('#authMessage'),btn=$('#authSubmit');btn.disabled=true;btn.textContent=authMode==='register'?'Creating…':'Logging in…';msg.textContent='';
 const body={email:$('#authEmail').value.trim(),password:$('#authPassword').value};if(authMode==='register')body.name=$('#authName').value.trim();
 try{const r=await fetch(authMode==='register'?'/api/register':'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Authentication failed');await enterApp(d.user)}catch(err){msg.textContent=err.message;msg.className='auth-message error'}finally{btn.disabled=false;btn.textContent=authMode==='register'?'Create account':'Log in'}
};
$('#logoutBtn').onclick=async()=>{try{await fetch('/api/logout',{method:'POST'})}catch(e){}leaveApp()};
window.addEventListener('load',()=>{setTimeout(()=>$('#intro').classList.add('hide'),2200);checkAuth()});
