const $=s=>document.querySelector(s);
const modal=$("#modal"),appBox=$("#app");

function tick(){
let d=new Date();
$("#clock").textContent=d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
$("#date").textContent=d.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"}).toUpperCase()
}
tick();
setInterval(tick,1000);

let snakeLoop=null,keyHandler=null,swLoop=null;

function cleanup(){
clearInterval(snakeLoop);
snakeLoop=null;
clearInterval(swLoop);
swLoop=null;
if(keyHandler)document.removeEventListener("keydown",keyHandler);
keyHandler=null
}

function show(which){
cleanup();
modal.classList.remove("hidden");
let names={calc:"Calculatrice",timer:"Chronomètre",snake:"Snake",convert:"Convertisseur"};
$("#modalTitle").textContent=names[which];
appBox.innerHTML="";
if(which==="calc")calc();
if(which==="timer")timer();
if(which==="snake")snake();
if(which==="convert")convert()
}

document.querySelectorAll("[data-app]").forEach(b=>b.onclick=()=>show(b.dataset.app));

function close(){
modal.classList.add("hidden");
cleanup()
}

$("#close").onclick=close;
modal.onclick=e=>{if(e.target===modal)close()};
document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});

function calc(){
appBox.innerHTML='<input class="calcdisplay" id="display" value="0" readonly><div class="keys">'+["C","⌫","%","÷","7","8","9","×","4","5","6","−","1","2","3","+","±","0",".","="].map(k=>`<button data-k="${k}">${k}</button>`).join("")+'</div>';

let expr="",d=$("#display");

appBox.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{
let k=b.dataset.k;

if(k==="C"){
expr="";
d.value="0"
}
else if(k==="⌫"){
expr=expr.slice(0,-1);
d.value=expr||"0"
}
else if(k==="="){
try{
let s=expr.replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-");
if(!/^[0-9+*/().% -]+$/.test(s))throw 0;
let v=Function('"use strict";return ('+s+')')();
if(!Number.isFinite(v))throw 0;
expr=String(Number(v.toFixed(8)));
d.value=expr
}catch{
expr="";
d.value="Erreur"
}
}
else{
expr+=k;
d.value=expr
}
})
}

function timer(){
appBox.innerHTML='<div class="timertext" id="time">00:00.00</div><div class="actionrow"><button class="action" id="start">Démarrer</button><button class="action" id="lap">Tour</button><button class="action" id="reset">Réinitialiser</button></div><p id="laps" class="help">Aucun tour enregistré.</p>';

let elapsed=0,start=0,run=false,n=0;
let out=$("#time"),btn=$("#start");

let fmt=x=>{
let cs=Math.floor(x/10)%100,s=Math.floor(x/1000)%60,m=Math.floor(x/60000);
return String(m).padStart(2,"0")+":"+String(s).padStart(2,"0" )+"."+String(cs).padStart(2,"0")
};

btn.onclick=()=>{
if(run){
elapsed+=Date.now()-start;
run=false;
clearInterval(swLoop);
btn.textContent="Reprendre"
}else{
start=Date.now();
run=true;
swLoop=setInterval(()=>out.textContent=fmt(elapsed+Date.now()-start),30);
btn.textContent="Pause"
}
};

$("#lap").onclick=()=>{
if(run){
n++;
$("#laps").innerHTML=`Tour ${n} : ${fmt(elapsed+Date.now()-start)}<br>`+$("#laps").innerHTML.replace("Aucun tour enregistré.","")
}
};

$("#reset").onclick=()=>{
cleanup();
elapsed=0;
run=false;
n=0;
out.textContent="00:00.00";
btn.textContent="Démarrer";
$("#laps").textContent="Aucun tour enregistré."
}
}

function snake(){
appBox.innerHTML='<canvas class="snakecanvas" id="board" width="320" height="320"></canvas><p class="help">Flèches du clavier ou boutons. Mange les points !</p><div class="actionrow"><button class="action" data-dir="up">↑</button></div><div class="actionrow"><button class="action" data-dir="left">←</button><button class="action" data-dir="down">↓</button><button class="action" data-dir="right">→</button></div><p class="help" id="score">Score : 0</p><div class="actionrow"><button class="action" id="again">Recommencer</button></div>';

let c=$("#board"),ctx=c.getContext("2d"),cell=20,body,dir,food,score,alive;

function reset(){
body=[{x:8,y:8},{x:7,y:8},{x:6,y:8}];
dir={x:1,y:0};
food={x:12,y:8};
score=0;
alive=true;
$("#score").textContent="Score : 0";
draw();
clearInterval(snakeLoop);
snakeLoop=setInterval(step,130)
}

function set(d){
let m={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}},v=m[d];
if(v&&!(v.x===-dir.x&&v.y===-dir.y))dir=v
}

function draw(){
ctx.fillStyle="#07101b";
ctx.fillRect(0,0,320,320);
ctx.fillStyle="#ffb36b";
ctx.fillRect(food.x*cell+4,food.y*cell+4,12,12);
body.forEach((p,i)=>{
ctx.fillStyle=i?"#56d6ad":"#a99eff";
ctx.fillRect(p.x*cell+1,p.y*cell+1,18,18)
})
}

function step(){
if(!alive)return;
let h={x:body[0].x+dir.x,y:body[0].y+dir.y};

if(h.x<0||h.y<0||h.x>=16||h.y>=16||body.some(p=>p.x===h.x&&p.y===h.y)){
alive=false;
clearInterval(snakeLoop);
ctx.fillStyle="white";
ctx.font="20px Arial";
ctx.fillText("Perdu !",120,160);
return
}

body.unshift(h);

if(h.x===food.x&&h.y===food.y){
score++;
$("#score").textContent="Score : "+score;
food={x:Math.floor(Math.random()*16),y:Math.floor(Math.random()*16)}
}else{
body.pop()
}

draw()
}

keyHandler=e=>{
let m={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right"};
if(m[e.key]){
e.preventDefault();
set(m[e.key])
}
};

document.addEventListener("keydown",keyHandler);

appBox.querySelectorAll("[data-dir]").forEach(b=>b.onclick=()=>set(b.dataset.dir));
$("#again").onclick=reset;
reset()
}

function convert(){
appBox.innerHTML='<p class="help">Choisis une conversion et saisis une valeur.</p><select class="field" id="kind"><option value="speed">km/h → m/s</option><option value="speed2">m/s → km/h</option><option value="distance">km → m</option><option value="distance2">m → km</option></select><input class="field" id="value" type="number" placeholder="Valeur"><div class="result" id="result">Résultat : —</div>';

function update(){
let v=Number($("#value").value),k=$("#kind").value,m={speed:v/3.6,speed2:v*3.6,distance:v*1000,distance2:v/1000};
$("#result").textContent="Résultat : "+(( $("#value").value==="")?"—":Number(m[k].toFixed(4)))
}

$("#value").oninput=update;
$("#kind").onchange=update
}

const canvas=$("#canvas"),ctx=canvas.getContext("2d");

function drawFace(){
let color=$("#color").value,label=$("#label").value||"PACE 4",style=$("#style").value;

ctx.fillStyle="#0c1323";
ctx.fillRect(0,0,360,440);

ctx.fillStyle="#202c43";
ctx.beginPath();
ctx.roundRect(45,12,270,416,58);
ctx.fill();

ctx.fillStyle="#090f1c";
ctx.beginPath();
ctx.roundRect(57,24,246,392,48);
ctx.fill();

ctx.fillStyle=color;
ctx.font="bold 16px Arial";
ctx.fillText("COROS",82,65);

ctx.fillStyle="#f5f6ff";
ctx.font=style==="Minimal"?"54px Arial":"bold 62px Arial";
ctx.fillText(new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),78,180);

ctx.fillStyle="#9ba9c4";
ctx.font="13px Arial";
ctx.fillText(new Date().toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"}).toUpperCase(),82,210);

ctx.fillStyle=color;
ctx.fillRect(82,245,196,3);

ctx.fillStyle="#f5f6ff";
ctx.font="bold 20px Arial";
ctx.fillText(label.toUpperCase(),82,295);

ctx.fillStyle="#9ba9c4";
ctx.font="13px Arial";
ctx.fillText(style==="Sport"?"DISTANCE   TEMPS   BPM":"PERSONNALISÉ",82,330)
}

["color","label","style"].forEach(id=>$("#"+id).addEventListener("input",drawFace));

$("#download").onclick=()=>{
let a=document.createElement("a");
a.download="coros-unlocked-watchface-preview.png";
a.href=canvas.toDataURL("image/png");
a.click()
};

drawFace();
