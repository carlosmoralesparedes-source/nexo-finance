/* ==================================================
   NEXO FINANCE 3.0
   Finanzas personales - Ecuador - USD
   Datos guardados localmente en el dispositivo
   ================================================== */

(() => {
"use strict";

const KEY = "nexo-finance-v1";
const $ = s => document.querySelector(s);
const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const cash = n => new Intl.NumberFormat("es-EC", {
  style:"currency", currency:"USD"
}).format(Number(n)||0);

let db;
try { db = JSON.parse(localStorage.getItem(KEY)); } catch(e) {}

if (!db) db = {};
db.accounts ||= [];
db.transactions ||= [];
db.debts ||= [];
db.budgets ||= [];
db.goals ||= [];
db.commitments ||= [];
db.theme ||= "light";

db.accounts = db.accounts.map(a => ({
  id:a.id || id(),
  name:a.name || "Cuenta",
  type:a.type || "other",
  balance:Number(a.balance)||0
}));

db.transactions = db.transactions.map(t => ({
  ...t,
  id:t.id || id(),
  amount:Math.abs(Number(t.amount)||0),
  date:t.date || today(),
  category:t.category || "Otros"
}));

function save() {
  localStorage.setItem(KEY, JSON.stringify(db));
}

function totalAccounts() {
  return db.accounts.reduce((s,a)=>s+a.balance,0);
}
function totalDebt() {
  return db.debts.filter(d=>d.type==="payable")
    .reduce((s,d)=>s+d.amount,0);
}
function totalReceivable() {
  return db.debts.filter(d=>d.type==="receivable")
    .reduce((s,d)=>s+d.amount,0);
}
function reserved() {
  return db.commitments.reduce((s,c)=>s+c.amount,0);
}
function netWorth() {
  return totalAccounts()-totalDebt()+totalReceivable();
}
function freeMoney() {
  return totalAccounts()-reserved();
}
function monthTransactions() {
  return db.transactions.filter(t=>t.date?.slice(0,7)===today().slice(0,7));
}
function sumType(list,type) {
  return list.filter(t=>t.type===type)
    .reduce((s,t)=>s+t.amount,0);
}
function account(id) {
  return db.accounts.find(a=>a.id===id);
}
function pichincha() {
  return db.accounts.find(a=>
    a.type==="bank" && a.name.toLowerCase().includes("pichincha")
  );
}
function esc(s) {
  return String(s??"").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
}

/* DISEÑO */

const css = `
:root {
 --green:#176b55;--green2:#25866b;--bg:#f3f6f4;
 --card:#fff;--text:#193129;--muted:#78877f;
 --line:#e4ece7;--soft:#eaf4ef;--red:#c65353;
}
body.night {
 --green:#65c4a2;--green2:#309a78;--bg:#101b17;
 --card:#1c2a24;--text:#edf6f0;--muted:#a2b2a9;
 --line:#34443b;--soft:#263c31;--red:#ff8585;
}
* {box-sizing:border-box}
body {margin:0;background:var(--bg);color:var(--text);
 font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#nexo {max-width:1050px;margin:auto;padding:22px 17px 100px}
header {display:flex;align-items:center;justify-content:space-between;margin-bottom:25px}
.brand {display:flex;align-items:center;gap:12px}
.logo {width:44px;height:44px;background:var(--green);color:white;
 border-radius:15px;display:grid;place-items:center;font-size:23px;font-weight:900}
.brand h1 {font-size:21px;margin:0}
.brand small {display:block;color:var(--muted);font-size:11px;margin-top:4px}
button {cursor:pointer;font:inherit}
.icon {border:1px solid var(--line);background:var(--card);color:var(--text);
 padding:11px;border-radius:13px}
.page {display:none}
.page.active {display:block}
.welcome {margin-bottom:18px}
.welcome h2 {font-size:25px;margin:0 0 6px;letter-spacing:-.6px}
.welcome p {font-size:13px;color:var(--muted);margin:0}
.hero {background:linear-gradient(130deg,#145b49,#25866b);
 color:white;border-radius:23px;padding:24px;margin-bottom:15px}
.hero small {color:#d3e9df}
.hero strong {display:block;font-size:34px;margin:10px 0}
.grid {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin:15px 0}
.card,.panel {background:var(--card);border:1px solid var(--line);
 border-radius:18px;padding:16px}
.card small {color:var(--muted);font-size:11px}
.card strong {display:block;font-size:20px;margin-top:8px;overflow-wrap:anywhere}
.section {display:flex;align-items:center;justify-content:space-between;margin:23px 0 12px}
.section h3 {font-size:16px;margin:0}
.actions {display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.action {border:0;background:var(--card);color:var(--text);
 border-radius:15px;padding:13px 3px;font-size:11px;font-weight:700}
.action span {display:block;font-size:22px;margin-bottom:6px}
.row {display:flex;align-items:center;justify-content:space-between;
 gap:10px;padding:14px 0;border-bottom:1px solid var(--line)}
.row:last-child {border:0}
.row strong {font-size:13px}
.row small {display:block;color:var(--muted);font-size:11px;margin-top:5px}
.amount {font-size:13px;font-weight:800;white-space:nowrap}
.positive {color:#26946d}.negative {color:var(--red)}
.empty {padding:24px 8px;text-align:center;color:var(--muted);font-size:13px}
.btn {border:0;border-radius:12px;background:var(--green);color:white;
 padding:13px 16px;font-weight:750;font-size:13px}
.btn.full {width:100%}
.btn.soft {background:var(--soft);color:var(--green)}
.form {display:grid;gap:13px}
.form label {display:grid;gap:6px;color:var(--muted);font-size:12px;font-weight:650}
.form input,.form select {width:100%;padding:13px;border:1px solid var(--line);
 border-radius:12px;background:var(--bg);color:var(--text);font-size:15px}
.note {padding:12px;background:var(--soft);color:var(--green);
 border-radius:12px;font-size:12px;line-height:1.5}
.progress {height:8px;background:var(--soft);border-radius:20px;overflow:hidden;margin-top:9px}
.progress span {display:block;height:100%;background:var(--green)}
.tabs {position:fixed;z-index:5;bottom:0;left:0;right:0;
 display:flex;justify-content:space-around;background:var(--card);
 border-top:1px solid var(--line);padding:9px 2px max(10px,env(safe-area-inset-bottom))}
.tab {border:0;background:none;color:var(--muted);font-size:10px;
 display:grid;justify-items:center;gap:4px}
.tab span {font-size:20px}
.tab.active {color:var(--green);font-weight:800}
.modal {display:none;position:fixed;z-index:20;inset:0;background:#0008;
 align-items:flex-end;justify-content:center;padding:10px}
.modal.open {display:flex}
.modalbox {background:var(--card);color:var(--text);width:100%;max-width:520px;
 max-height:90vh;overflow:auto;border-radius:23px;padding:20px}
.modalhead {display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.modalhead h3 {margin:0}
.close {border:0;background:var(--soft);color:var(--text);padding:8px 12px;border-radius:10px}
.link {color:var(--green);font-size:12px;font-weight:700;border:0;background:none}
@media(min-width:700px) {
 #nexo {padding:30px}
 .grid {grid-template-columns:repeat(4,minmax(0,1fr))}
 .tabs {position:static;border:1px solid var(--line);border-radius:15px;margin-top:25px}
 .modal {align-items:center}
}
`;

const style=document.createElement("style");
style.textContent=css;
document.head.appendChild(style);

/* INTERFAZ */

document.body.innerHTML=`
<div id="nexo">
<header>
 <div class="brand"><div class="logo">N</div>
 <div><h1>Nexo Finance</h1><small>Tus finanzas bajo control</small></div></div>
 <button class="icon" id="theme">◐</button>
</header>

<section class="page active" id="home">
 <div class="welcome"><h2>Tu panorama financiero</h2><p id="date"></p></div>
 <div class="hero"><small>PATRIMONIO NETO ESTIMADO</small>
 <strong id="networth">$0</strong><small>Lo que tienes menos lo que debes</small></div>
 <div class="grid">
  <div class="card"><small>Dinero disponible</small><strong id="available">$0</strong></div>
  <div class="card"><small>Dinero libre</small><strong id="free">$0</strong></div>
  <div class="card"><small>Ingresos del mes</small><strong class="positive" id="income">$0</strong></div>
  <div class="card"><small>Gastos del mes</small><strong class="negative" id="expense">$0</strong></div>
  <div class="card"><small>Deudas por pagar</small><strong id="debttotal">$0</strong></div>
  <div class="card"><small>Compromisos reservados</small><strong id="reserved">$0</strong></div>
 </div>
 <div class="section"><h3>Acciones rápidas</h3></div>
 <div class="actions">
  <button class="action" data-action="income"><span>＋</span>Ingreso</button>
  <button class="action" data-action="expense"><span>－</span>Gasto</button>
  <button class="action" data-action="transfer"><span>⇄</span>Transferir</button>
  <button class="action" data-action="account"><span>▣</span>Cuenta</button>
 </div>
 <div class="section"><h3>Mis cuentas</h3><button class="link" data-page="accounts">Ver todas</button></div>
 <div class="panel" id="preview"></div>
 <div class="section"><h3>Movimientos recientes</h3><button class="link" data-page="movements">Ver todos</button></div>
 <div class="panel" id="recent"></div>
</section>

<section class="page" id="accounts">
 <div class="welcome"><h2>Mis cuentas</h2><p>Todo tu dinero en un solo lugar.</p></div>
 <div class="hero"><small>TOTAL EN TUS CUENTAS</small><strong id="accountTotal">$0</strong></div>
 <button class="btn full" data-action="account">＋ Agregar cuenta</button>
 <div class="section"><h3>Cuentas registradas</h3></div>
 <div class="panel" id="accountList"></div>
</section>

<section class="page" id="movements">
 <div class="welcome"><h2>Movimientos</h2><p>Historial de ingresos y gastos.</p></div>
 <div class="grid">
  <div class="card"><small>Ingresos del mes</small><strong id="mi">$0</strong></div>
  <div class="card"><small>Gastos del mes</small><strong id="me">$0</strong></div>
 </div>
 <div class="panel" id="movementList"></div>
</section>

<section class="page" id="analysis">
 <div class="welcome"><h2>Análisis financiero</h2><p>Descubre cómo utilizas tu dinero.</p></div>
 <div class="hero"><small>BALANCE DEL MES</small><strong id="result">$0</strong></div>
 <div class="section"><h3>Gastos por categoría</h3></div>
 <div class="panel" id="categories"></div>
 <div class="section"><h3>Resumen mensual</h3></div>
 <div class="panel" id="months"></div>
</section>

<section class="page" id="planning">
 <div class="welcome"><h2>Planificación</h2><p>Presupuestos, ahorro y obligaciones.</p></div>
 <div class="section"><h3>Presupuestos</h3><button class="btn soft" data-action="budget">＋ Crear</button></div>
 <div class="panel" id="budgetList"></div>
 <div class="section"><h3>Metas de ahorro</h3><button class="btn soft" data-action="goal">＋ Crear</button></div>
 <div class="panel" id="goalList"></div>
 <div class="section"><h3>Deudas y cobros</h3><button class="btn soft" data-action="debt">＋ Agregar</button></div>
 <div class="panel" id="debtList"></div>
 <div class="section"><h3>Compromisos</h3><button class="btn soft" data-action="commitment">＋ Agregar</button></div>
 <div class="panel" id="commitList"></div>
</section>

<section class="page" id="settings">
 <div class="welcome"><h2>Configuración</h2><p>Preferencias y respaldo de información.</p></div>
 <div class="panel">
  <div class="section"><h3>Apariencia</h3></div>
  <button class="btn soft full" id="theme2">Cambiar modo claro / oscuro</button>
  <div class="section"><h3>Seguridad de datos</h3></div>
  <p class="note">Tus datos se guardan en este dispositivo. Exporta respaldos regularmente y guárdalos en un lugar privado.</p>
  <button class="btn full" id="backup">↓ Descargar respaldo</button>
  <div style="height:10px"></div>
  <button class="btn soft full" id="restore">↑ Restaurar respaldo</button>
  <input type="file" id="file" accept=".json" hidden>
  <div class="section"><h3>Información</h3></div>
  <p class="note">Nexo Finance · Versión 3.0 · Moneda USD · Almacenamiento local.</p>
 </div>
</section>

<nav class="tabs">
 <button class="tab active" data-page="home"><span>⌂</span>Inicio</button>
 <button class="tab" data-page="accounts"><span>▣</span>Cuentas</button>
 <button class="tab" data-page="movements"><span>⇄</span>Movimientos</button>
 <button class="tab" data-page="analysis"><span>◒</span>Análisis</button>
 <button class="tab" data-page="planning"><span>◎</span>Planificar</button>
 <button class="tab" data-page="settings"><span>⚙</span>Ajustes</button>
</nav>
</div>

<div class="modal" id="modal">
 <div class="modalbox">
  <div class="modalhead"><h3 id="modalTitle"></h3><button class="close" id="close">×</button></div>
  <div id="modalBody"></div>
 </div>
</div>
`;

document.body.classList.toggle("night",db.theme==="dark");

/* RENDERIZADO */

function row(title,sub,value,cls="") {
 return `<div class="row"><div><strong>${esc(title)}</strong><small>${esc(sub)}</small></div><div class="amount ${cls}">${value}</div></div>`;
}
function render() {
 const m=monthTransactions();
 const inc=sumType(m,"income"), exp=sumType(m,"expense");
 $("#networth").textContent=cash(netWorth());
 $("#available").textContent=cash(totalAccounts());
 $("#free").textContent=cash(freeMoney());
 $("#income").textContent=cash(inc);
 $("#expense").textContent=cash(exp);
 $("#debttotal").textContent=cash(totalDebt());
 $("#reserved").textContent=cash(reserved());
 $("#date").textContent=new Date().toLocaleDateString("es-EC",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

 $("#preview").innerHTML=db.accounts.length
 ?db.accounts.slice(0,5).map(a=>row(a.name,a.type,cash(a.balance))).join("")
 :'<div class="empty">Agrega tu primera cuenta.</div>';

 const recent=[...db.transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
 $("#recent").innerHTML=recent.length?recent.map(t=>row(t.description,t.date,
 (t.type==="income"?"+":t.type==="expense"?"−":"")+cash(t.amount),
 t.type==="income"?"positive":t.type==="expense"?"negative":"")).join("")
 :'<div class="empty">Todavía no hay movimientos.</div>';

 $("#accountTotal").textContent=cash(totalAccounts());
 $("#accountList").innerHTML=db.accounts.length?db.accounts.map(a=>
 `<div class="row"><div><strong>${esc(a.name)}</strong><small>${esc(a.type)}</small></div>
 <div style="text-align:right"><div class="amount">${cash(a.balance)}</div>
 <button class="link" data-edit="${a.id}">Modificar saldo</button></div></div>`
 ).join(""):'<div class="empty">No tienes cuentas registradas.</div>';

 $("#mi").textContent=cash(inc);
 $("#me").textContent=cash(exp);
 $("#movementList").innerHTML=db.transactions.length
 ?[...db.transactions].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>
 row(t.description,`${t.date} · ${t.category} · ${t.method||""}`,
 (t.type==="income"?"+":t.type==="expense"?"−":"")+cash(t.amount),
 t.type==="income"?"positive":t.type==="expense"?"negative":"")).join("")
 :'<div class="empty">No hay movimientos registrados.</div>';

 $("#result").textContent=cash(inc-exp);

 const cats={};
 m.filter(t=>t.type==="expense").forEach(t=>cats[t.category]=(cats[t.category]||0)+t.amount);
 const max=Math.max(1,...Object.values(cats));
 $("#categories").innerHTML=Object.keys(cats).length
 ?Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>
 `<div style="padding:10px 0"><div class="row"><strong>${esc(k)}</strong><b>${cash(v)}</b></div>
 <div class="progress"><span style="width:${v/max*100}%"></span></div></div>`).join("")
 :'<div class="empty">Registra gastos para ver tu análisis.</div>';

 const months={};
 db.transactions.forEach(t=>{
  const k=(t.date||"").slice(0,7);
  if(!k)return;
  months[k] ||= {income:0,expense:0};
  if(t.type==="income"||t.type==="expense")months[k][t.type]+=t.amount;
 });
 $("#months").innerHTML=Object.entries(months).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,12)
 .map(([k,v])=>row(k,`Ingresos ${cash(v.income)} · Gastos ${cash(v.expense)}`,cash(v.income-v.expense))).join("")
 ||'<div class="empty">Aún no existe historial mensual.</div>';

 $("#budgetList").innerHTML=db.budgets.length?db.budgets.map(b=>{
  const spent=m.filter(t=>t.type==="expense"&&t.category===b.category).reduce((s,t)=>s+t.amount,0);
  const pct=Math.min(100,spent/b.amount*100);
  return `<div style="padding:12px 0"><div class="row"><strong>${esc(b.category)}</strong><b>${cash(spent)} / ${cash(b.amount)}</b></div><div class="progress"><span style="width:${pct}%"></span></div></div>`;
 }).join(""):'<div class="empty">No hay presupuestos.</div>';

 $("#goalList").innerHTML=db.goals.length?db.goals.map(g=>{
  const pct=Math.min(100,g.saved/g.target*100);
  return `<div style="padding:12px 0"><div class="row"><strong>${esc(g.name)}</strong><b>${cash(g.saved)} / ${cash(g.target)}</b></div><div class="progress"><span style="width:${pct}%"></span></div><button class="link" data-saving="${g.id}">＋ Agregar ahorro</button></div>`;
 }).join(""):'<div class="empty">No hay metas de ahorro.</div>';

 $("#debtList").innerHTML=db.debts.length?db.debts.map(d=>
 row(d.name,d.type==="payable"?"Debes pagar":"Te deben",cash(d.amount))).join("")
 :'<div class="empty">No hay deudas registradas.</div>';

 $("#commitList").innerHTML=db.commitments.length?db.commitments.map(c=>
 row(c.name,c.date||"Compromiso",cash(c.amount))).join("")
 :'<div class="empty">No hay compromisos registrados.</div>';

 save();
}

/* MODALES Y FORMULARIOS */

function modal(title,html) {
 $("#modalTitle").textContent=title;
 $("#modalBody").innerHTML=html;
 $("#modal").classList.add("open");
}
function closeModal() { $("#modal").classList.remove("open"); }

function options(selected) {
 return db.accounts.map(a=>`<option value="${a.id}" ${a.id===selected?"selected":""}>${esc(a.name)} · ${cash(a.balance)}</option>`).join("");
}

function addAccount() {
 modal("Agregar cuenta",`
 <form class="form" id="accountForm">
 <label>Nombre<input name="name" required placeholder="Banco Pichincha"></label>
 <label>Tipo<select name="type">
 <option value="cash">Efectivo</option><option value="bank">Cuenta bancaria</option>
 <option value="savings">Ahorros</option><option value="other">Otra cuenta</option>
 </select></label>
 <label>Saldo inicial<input name="balance" type="number" min="0" step=".01" value="0" required></label>
 <button class="btn full">Guardar cuenta</button></form>`);
 $("#accountForm").onsubmit=e=>{
  e.preventDefault();const f=new FormData(e.target);
  db.accounts.push({id:id(),name:f.get("name").trim(),type:f.get("type"),balance:Number(f.get("balance"))});
  closeModal();render();
 };
}

function addTransaction(type) {
 if(!db.accounts.length){alert("Primero registra una cuenta.");addAccount();return;}
 const income=type==="income";
 const defaultAccount=pichincha()?.id||db.accounts[0].id;
 modal(income?"Registrar ingreso":"Registrar gasto",`
 <form class="form" id="transactionForm">
 <label>Descripción<input name="description" required placeholder="${income?"Sueldo":"Alimentación"}"></label>
 <label>Valor en dólares<input name="amount" type="number" min=".01" step=".01" required></label>
 <label>Categoría<select name="category">
 ${(income?["Salario","Trabajo","Negocio","Servicios","Extraordinario","Otros"]:["Alimentación","Transporte","Vivienda","Salud","Educación","Compras","Servicios","Entretenimiento","Deudas","Otros"]).map(x=>`<option>${x}</option>`).join("")}
 </select></label>
 <label>Forma de pago<select name="method" id="method">
 <option>Efectivo</option><option>Transferencia</option><option>De Una!</option>${income?"":'<option>Tarjeta de crédito</option>'}
 </select></label>
 <label>Cuenta<select name="account" id="accountSelect">${options(defaultAccount)}</select></label>
 <div class="note" id="paymentInfo">El movimiento afectará la cuenta seleccionada.</div>
 <label>Fecha<input name="date" type="date" value="${today()}" required></label>
 <button class="btn full">Guardar movimiento</button>
 </form>`);

 const method=$("#method"), select=$("#accountSelect"), info=$("#paymentInfo");
 function updateMethod(){
  if(method.value==="De Una!"){
   const p=pichincha();
   if(p){select.value=p.id;select.disabled=true;
    info.textContent="De Una! está vinculado a Banco Pichincha. El pago se descontará de esa cuenta.";
   } else {
    select.disabled=false;
    info.textContent="No encuentro Banco Pichincha. Registra esa cuenta bancaria primero.";
   }
  } else {
   select.disabled=false;
   info.textContent=method.value==="Tarjeta de crédito"
   ?"El gasto se registrará como deuda de tarjeta, no se descontará de tus cuentas."
   :"El movimiento afectará la cuenta seleccionada.";
  }
 }
 method.onchange=updateMethod;updateMethod();

 $("#transactionForm").onsubmit=e=>{
  e.preventDefault();
  const f=new FormData(e.target);
  const amount=Number(f.get("amount"));
  const pay=f.get("method");
  let acc=account(f.get("account"));
  if(pay==="De Una!")acc=pichincha();
  if(!amount||amount<=0){alert("Ingresa un valor válido.");return;}
  if(pay!=="Tarjeta de crédito"&&!acc){alert("No encuentro la cuenta correspondiente.");return;}
  if(!income&&pay!=="Tarjeta de crédito"&&acc.balance<amount){
   if(!confirm("El saldo quedará negativo. ¿Deseas continuar?"))return;
  }
  db.transactions.push({
   id:id(),type,description:f.get("description").trim(),
   amount,category:f.get("category"),date:f.get("date"),
   method:pay,accountId:acc?.id||null
  });
  if(pay==="Tarjeta de crédito"){
   db.debts.push({id:id(),name:"Tarjeta · "+f.get("description"),amount,type:"payable"});
  } else {
   acc.balance += income?amount:-amount;
  }
  closeModal();render();
 };
}

function transfer() {
 if(db.accounts.length<2){alert("Necesitas dos cuentas como mínimo.");return;}
 modal("Transferir dinero",`
 <form class="form" id="transferForm">
 <label>Cuenta de origen<select name="from">${options(db.accounts[0].id)}</select></label>
 <label>Cuenta de destino<select name="to">${options(db.accounts[1].id)}</select></label>
 <label>Valor<input name="amount" type="number" min=".01" step=".01" required></label>
 <label>Fecha<input name="date" type="date" value="${today()}"></label>
 <div class="note">Una transferencia no es un gasto ni un ingreso. Solo cambia el dinero de cuenta.</div>
 <button class="btn full">Confirmar transferencia</button></form>`);
 $("#transferForm").onsubmit=e=>{
  e.preventDefault();const f=new FormData(e.target);
  const from=account(f.get("from")),to=account(f.get("to")),amount=Number(f.get("amount"));
  if(!from||!to||from.id===to.id||amount<=0){alert("Revisa los datos.");return;}
  if(from.balance<amount&&!confirm("La cuenta quedará negativa. ¿Continuar?"))return;
  from.balance-=amount;to.balance+=amount;
  db.transactions.push({id:id(),type:"transfer",description:from.name+" → "+to.name,
   amount,date:f.get("date"),category:"Transferencia",method:"Transferencia"});
  closeModal();render();
 };
}

function simple(kind) {
 const config={
 budget:["Nuevo presupuesto",`<label>Categoría<input name="category" required></label><label>Límite mensual<input name="amount" type="number" min=".01" step=".01" required></label>`],
 goal:["Meta de ahorro",`<label>Nombre<input name="name" required></label><label>Objetivo<input name="target" type="number" min=".01" step=".01" required></label>`],
 debt:["Registrar deuda o cobro",`<label>Concepto<input name="name" required></label><label>Tipo<select name="type"><option value="payable">Dinero que debo</option><option value="receivable">Dinero que me deben</option></select></label><label>Valor pendiente<input name="amount" type="number" min=".01" step=".01" required></label>`],
 commitment:["Compromiso de dinero",`<label>Concepto<input name="name" required></label><label>Valor a reservar<input name="amount" type="number" min=".01" step=".01" required></label><label>Fecha<input name="date" type="date"></label>`]
 };
 const [title,fields]=config[kind];
 modal(title,`<form class="form" id="simpleForm">${fields}<button class="btn full">Guardar</button></form>`);
 $("#simpleForm").onsubmit=e=>{
  e.preventDefault();const f=new FormData(e.target);
  if(kind==="budget")db.budgets.push({id:id(),category:f.get("category"),amount:Number(f.get("amount"))});
  if(kind==="goal")db.goals.push({id:id(),name:f.get("name"),target:Number(f.get("target")),saved:0});
  if(kind==="debt")db.debts.push({id:id(),name:f.get("name"),type:f.get("type"),amount:Number(f.get("amount"))});
  if(kind==="commitment")db.commitments.push({id:id(),name:f.get("name"),amount:Number(f.get("amount")),date:f.get("date")});
  closeModal();render();
 };
}

/* RESPALDO */

function backup() {
 const blob=new Blob([JSON.stringify({app:"Nexo Finance",data:db},null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");
 a.href=url;a.download="nexo-finance-respaldo-"+today()+".json";
 a.click();URL.revokeObjectURL(url);
}
function restore(file) {
 const reader=new FileReader();
 reader.onload=()=>{
  try {
   const parsed=JSON.parse(reader.result);
   const d=parsed.data||parsed;
   if(!Array.isArray(d.accounts)||!Array.isArray(d.transactions))throw Error();
   if(!confirm("El respaldo reemplazará tus datos actuales. ¿Continuar?"))return;
   db={...d};
   db.accounts ||= [];db.transactions ||= [];db.debts ||= [];
   db.budgets ||= [];db.goals ||= [];db.commitments ||= [];
   save();location.reload();
  } catch(e){alert("El archivo no es un respaldo válido.");}
 };
 reader.readAsText(file);
}

/* EVENTOS */

document.addEventListener("click",e=>{
 const page=e.target.closest("[data-page]");
 if(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  $("#"+page.dataset.page).classList.add("active");
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.page===page.dataset.page));
  window.scrollTo(0,0);return;
 }
 const action=e.target.closest("[data-action]");
 if(action){
  const a=action.dataset.action;
  if(a==="account")addAccount();
  if(a==="income"||a==="expense")addTransaction(a);
  if(a==="transfer")transfer();
  if(["budget","goal","debt","commitment"].includes(a))simple(a);
  return;
 }
 const edit=e.target.closest("[data-edit]");
 if(edit){
  const a=account(edit.dataset.edit);
  const value=prompt("Nuevo saldo de "+a.name,a.balance);
  if(value!==null&&Number.isFinite(Number(value))){a.balance=Number(value);render();}
  return;
 }
 const saving=e.target.closest("[data-saving]");
 if(saving){
  const g=db.goals.find(x=>x.id===saving.dataset.saving);
  const value=Number(prompt("¿Cuánto deseas ahorrar?"));
  if(g&&value>0){g.saved+=value;render();}
 }
});

$("#close").onclick=()=>$("#modal").classList.remove("open");
$("#modal").onclick=e=>{if(e.target.id==="modal")$("#modal").classList.remove("open");};

function toggleTheme(){
 db.theme=db.theme==="dark"?"light":"dark";
 document.body.classList.toggle("night",db.theme==="dark");
 save();
}
$("#theme").onclick=toggleTheme;
$("#theme2").onclick=toggleTheme;
$("#backup").onclick=backup;
$("#restore").onclick=()=>$("#file").click();
$("#file").onchange=e=>{if(e.target.files[0])restore(e.target.files[0]);};

render();
save();

})();
