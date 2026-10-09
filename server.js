const express=require('express'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const app=express(),PORT=process.env.PORT||3000;
const dir=path.join(__dirname,'data'),usersFile=path.join(dir,'users.json');
const initial={foods:[],activities:[],movement:{walking:0,stairs:0,commute:0,steps:0},goals:{configured:false,goal:'Muscle Gain',age:19,sex:'male',height:180,bodyWeight:67,targetWeight:72,activityLevel:'moderate',calTarget:null,proteinTarget:null,maintenance:null},history:[175,230,-80,310,120,290,145]};
if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});
if(!fs.existsSync(usersFile))fs.writeFileSync(usersFile,JSON.stringify({},null,2));
app.use(express.json({limit:'1mb'}));
app.use(express.static(__dirname));

const sessions=new Map();
const readUsers=()=>JSON.parse(fs.readFileSync(usersFile,'utf8')||'{}');
const writeUsers=u=>fs.writeFileSync(usersFile,JSON.stringify(u,null,2));
const cleanEmail=e=>String(e||'').trim().toLowerCase();
const hashPassword=(password,salt=crypto.randomBytes(16).toString('hex'))=>({salt,hash:crypto.scryptSync(password,salt,64).toString('hex')});
const verifyPassword=(password,user)=>{try{const h=crypto.scryptSync(password,user.salt,64).toString('hex');return crypto.timingSafeEqual(Buffer.from(h,'hex'),Buffer.from(user.passwordHash,'hex'))}catch{return false}};
const publicUser=u=>({id:u.id,name:u.name,email:u.email,createdAt:u.createdAt});
function setSession(res,userId){const token=crypto.randomBytes(32).toString('hex');sessions.set(token,{userId,expires:Date.now()+1000*60*60*24*7});res.cookie('fitlogic_session',token,{httpOnly:true,sameSite:'lax',secure:false,maxAge:1000*60*60*24*7});}
function auth(req,res,next){const token=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('fitlogic_session='))?.split('=')[1];const s=token&&sessions.get(token);if(!s||s.expires<Date.now()){if(token)sessions.delete(token);return res.status(401).json({error:'Please log in'});}const users=readUsers(),u=users[s.userId];if(!u)return res.status(401).json({error:'Session expired'});req.user=u;req.userId=s.userId;next();}

app.get('/api/health',(q,s)=>s.json({ok:true,service:'FitLogic backend'}));
app.get('/api/me',(q,s)=>{const token=q.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('fitlogic_session='))?.split('=')[1];const sess=token&&sessions.get(token);if(!sess||sess.expires<Date.now())return s.json({authenticated:false});const u=readUsers()[sess.userId];if(!u)return s.json({authenticated:false});s.json({authenticated:true,user:publicUser(u)})});
app.post('/api/register',(q,s)=>{const {name,email,password}=q.body||{},e=cleanEmail(email);if(!name||!e||!password)return s.status(400).json({error:'Name, email and password are required'});if(!/^\S+@\S+\.\S+$/.test(e))return s.status(400).json({error:'Enter a valid email'});if(String(password).length<6)return s.status(400).json({error:'Password must be at least 6 characters'});const users=readUsers();if(users[e])return s.status(409).json({error:'An account with this email already exists'});const id=crypto.randomUUID(),hp=hashPassword(String(password));users[e]={id,name:String(name).trim(),email:e,salt:hp.salt,passwordHash:hp.hash,createdAt:new Date().toISOString(),state:JSON.parse(JSON.stringify(initial))};writeUsers(users);setSession(s,id);s.json({ok:true,user:publicUser(users[e])})});
app.post('/api/login',(q,s)=>{const {email,password}=q.body||{},e=cleanEmail(email),users=readUsers(),u=users[e];if(!u||!verifyPassword(String(password||''),u))return s.status(401).json({error:'Incorrect email or password'});setSession(s,u.id);s.json({ok:true,user:publicUser(u)})});
app.post('/api/logout',(q,s)=>{const token=q.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('fitlogic_session='))?.split('=')[1];if(token)sessions.delete(token);s.setHeader('Set-Cookie','fitlogic_session=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/');s.json({ok:true})});

app.get('/api/state',auth,(q,s)=>s.json(q.user.state||JSON.parse(JSON.stringify(initial))));
app.post('/api/state',auth,(q,s)=>{const d=q.body;if(!d||!Array.isArray(d.foods)||!Array.isArray(d.activities)||!d.goals||!d.movement)return s.status(400).json({error:'Invalid state'});const users=readUsers();users[q.userId].state=d;writeUsers(users);s.json({ok:true,savedAt:new Date().toISOString()})});
app.post('/api/reset',auth,(q,s)=>{const users=readUsers();users[q.userId].state=JSON.parse(JSON.stringify(initial));writeUsers(users);s.json(users[q.userId].state)});
app.listen(PORT,()=>console.log(`FitLogic running at http://localhost:${PORT}`));
