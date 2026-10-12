// usage: node ana-open.js <serie-dir>  -- first/second raise fit + cap + turn per deck, ready bodies at own turn 5
const fs=require('fs'),path=require('path'); const {Bot}=require('./elysium-bot.js'); const dir=process.argv[2];
const bots={}; const B=dn=>bots[dn]||(bots[dn]=new Bot({server:'ws://x',room:'x',pass:'x',name:'U',deck:JSON.parse(fs.readFileSync('./deck-'+dn+'.json','utf8')),deckName:dn,log:()=>{}}));
const acc={}; const A=k=>acc[k]||(acc[k]={f1:[],f2:[],c1:[],t1:[],t2:[],r5:[]});
for(const f of fs.readdirSync(dir).filter(x=>/^match-.*jsonl$/.test(x))){ const rows=fs.readFileSync(path.join(dir,f),'utf8').split('\n').filter(Boolean).map(l=>JSON.parse(l));
  const deck={}; rows.forEach(r=>{ if(r.type==='manifest') deck[r.bot]=r.data.deck; }); const n={}, tn={};
  for(const r of rows){ const b=r.bot; if(!b||!deck[b]) continue; const a=A(deck[b]), bot=B(deck[b]);
    if(r.type==='raise'){ n[b]=(n[b]|0)+1; const fit=bot._deckFit({name:r.data.name}); if(n[b]===1){ a.f1.push(fit); a.c1.push(bot.fxCryptCap(r.data.name)|0); a.t1.push(r.data.turn); } if(n[b]===2){ a.f2.push(fit); a.t2.push(r.data.turn); } }
    if(r.type==='snapshot'&&r.data.tag==='unlock'){ tn[b]=(tn[b]|0)+1; if(tn[b]===5){ const x=r.data.ready; a.r5.push(typeof x==='number'?x:(x||[]).length); } } } }
const m=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2):'–';
Object.keys(acc).sort().forEach(k=>{ const a=acc[k]; console.log(k.padEnd(10),'1st fit',m(a.f1),'cap',m(a.c1),'turn',m(a.t1),'| 2nd fit',m(a.f2),'turn',m(a.t2),'| ready at own turn 5:',m(a.r5),'(n '+a.r5.length+')'); });
