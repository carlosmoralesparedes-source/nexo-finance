const KEY='nexo-finance-v1';
const defaultData={accounts:[{id:'cash',name:'Efectivo',type:'Efectivo',balance:0}],transactions:[],theme:'system',budgets:{}};
let data=loadData(),currentType='expense',activeTab='home';
const $=id=>document.getElementById(id);
function loadData(){try{return {...defaultData,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return structuredClone(defaultData)}}
function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function money(n){return new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD'}).format(Number(n)||0)}
function dateLabel(d){return new Date(d+'T12:00:00').toLocaleDateString('es-EC',{day:'2-digit',month:'short'})}
function monthKey(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function monthTransactions(){return data.transactions.filter(t=>t.date.startsWith(monthKey()))}
function totalAccounts(){return data.accounts.reduce((s,a)=>s+Number(a.balance||0),0)}
function applyTheme(){const dark=data.theme==='dark'||(data.theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.body.classList.toggle('dark',dark)}
function render(){
 applyTheme();
 const tx=monthTransactions(),inc=tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),exp=tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
 $('netWorth').textContent=money(totalAccounts());$('available').textContent=money(totalAccounts());
 $('incomeTotal').textContent=money(inc);$('expenseTotal').textContent=money(exp);
 $('monthName').textContent=new Date().toLocaleDateString('es-EC',{month:'long',year:'numeric'});
 const recent=[...data.transactions].sort((a,b)=>b.createdAt-a.createdAt).slice(0,5);
 $('transactionList').innerHTML=recent.length?recent.map(t=>`<div class="transaction"><div class="tx-icon">${t.type==='income'?'↙':iconFor(t.category)}</div><div class="tx-info"><strong>${esc(t.description)}</strong><small>${esc(t.category)} · ${dateLabel(t.date)}</small></div><div class="tx-amount ${t.type==='income'?'':'negative'}">${t.type==='income'?'+':'−'}${money(t.amount)}</div></div>`).join(''):`<div class="empty-state"><div class="empty-icon">↗</div><strong>Aún no hay movimientos</strong><span>Registra tu primer ingreso o gasto.</span></div>`;
 $('accountList').innerHTML=data.accounts.map(a=>`<div class="account"><div class="account-icon">${a.type==='Efectivo'?'◉':a.type==='Ahorros'?'▣':'▤'}</div><div class="account-info"><strong>${esc(a.name)}</strong><small>${esc(a.type)}</small></div><div class="account-balance">${money(a.balance)}</div></div>`).join('');
 fillAccountSelect();
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function iconFor(c){return ({Alimentación:'🍃',Transporte:'↗',Salud:'✚',Hogar:'⌂',Entretenimiento:'☆',Compras:'◇',Educación:'▤',Servicios:'⌁',Otros:'•'})[c]||'•'}
const expenseCats=['Alimentación','Transporte','Hogar','Salud','Entretenimiento','Compras','Educación','Servicios','Otros'];
const incomeCats=['Sueldo','Honorarios','Ventas','Inversiones','Regalos','Otros'];
function fillCategories(){ $('category').innerHTML=(currentType==='income'?incomeCats:expenseCats).map(c=>`<option>${c}</option>`).join('')}
function fillAccountSelect(){$('accountSelect').innerHTML=data.accounts.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}
function open(id){$(id).showModal()}
function close(id){$(id).close()}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>close(b.dataset.close)));
$('addMovementBtn').onclick=()=>{ $('movementForm').reset();$('date').value=new Date().toISOString().slice(0,10);currentType='expense';document.querySelectorAll('.type-btn').forEach(b=>b.classList.toggle('selected',b.dataset.type===currentType));fillCategories();fillAccountSelect();open('movementDialog')};
document.querySelectorAll('.type-btn').forEach(b=>b.onclick=()=>{currentType=b.dataset.type;document.querySelectorAll('.type-btn').forEach(x=>x.classList.toggle('selected',x===b));fillCategories()});
$('movementForm').onsubmit=e=>{e.preventDefault();const amount=Number($('amount').value);if(!Number.isFinite(amount)||amount<=0)return;const account=data.accounts.find(a=>a.id===$('accountSelect').value);if(!account)return;const t={id:crypto.randomUUID(),type:currentType,description:$('description').value.trim(),amount,category:$('category').value,accountId:account.id,date:$('date').value,notes:$('notes').value.trim(),createdAt:Date.now()};account.balance+=currentType==='income'?amount:-amount;data.transactions.push(t);save();close('movementDialog')};
$('addAccountBtn').onclick=()=>{$('accountForm').reset();open('accountDialog')};
$('accountForm').onsubmit=e=>{e.preventDefault();const a={id:crypto.randomUUID(),name:$('accountName').value.trim(),balance:Number($('accountBalance').value)||0,type:$('accountType').value};if(!a.name)return;data.accounts.push(a);save();close('accountDialog')};
$('themeBtn').onclick=()=>{data.theme=data.theme==='dark'?'light':'dark';save()};
$('monthReset').onclick=()=>render();
$('allTransactions').onclick=()=>showTransactions();
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x===b));activeTab=b.dataset.tab;if(activeTab==='transactions')showTransactions();else if(activeTab==='budgets')showBudgets();else if(activeTab==='settings')showSettings();else render()});
function simple(title,html){$('simpleTitle').textContent=title;$('simpleContent').innerHTML=html;open('simpleDialog')}
function showTransactions(){const all=[...data.transactions].sort((a,b)=>b.createdAt-a.createdAt);simple('Todos los movimientos',all.length?all.map(t=>`<div class="transaction"><div class="tx-icon">${t.type==='income'?'↙':iconFor(t.category)}</div><div class="tx-info"><strong>${esc(t.description)}</strong><small>${esc(t.category)} · ${dateLabel(t.date)}</small></div><div class="tx-amount ${t.type==='income'?'':'negative'}">${t.type==='income'?'+':'−'}${money(t.amount)}</div></div>`).join(''):'<p style="color:var(--muted);font-size:13px">Todavía no tienes movimientos.</p>')}
function showBudgets(){const spent={};monthTransactions().filter(t=>t.type==='expense').forEach(t=>spent[t.category]=(spent[t.category]||0)+t.amount);const cats=[...new Set([...expenseCats,...Object.keys(data.budgets)])];simple('Presupuestos',`<p style="font-size:11px;color:var(--muted);margin-bottom:12px">Define límites mensuales por categoría desde la próxima actualización.</p>`+cats.map(c=>`<div class="budget-row"><strong>${c}</strong><small style="float:right">${money(spent[c]||0)} gastados</small><div class="progress"><span style="width:${Math.min(100,(spent[c]||0)/(data.budgets[c]||100)*100)}%"></span></div></div>`).join(''))}
function showSettings(){simple('Ajustes',`<div class="settings-list"><div class="setting-row"><div><strong>Copiar respaldo</strong><small>Descarga tus cuentas y movimientos en un archivo JSON.</small></div><button class="secondary-btn" id="exportBtn">Exportar</button></div><div class="setting-row"><div><strong>Restaurar respaldo</strong><small>Importa un archivo JSON previamente exportado.</small></div><label class="secondary-btn">Importar<input id="importFile" type="file" accept="application/json" hidden></label></div><div class="setting-row"><div><strong>Tema visual</strong><small>Actual: ${data.theme==='system'?'Automático':data.theme==='dark'?'Oscuro':'Claro'}</small></div><button class="secondary-btn" id="themeCycle">Cambiar</button></div><div class="setting-row"><div><strong>Datos locales</strong><small>La información se guarda en este navegador, en este iPhone.</small></div><span>●</span></div><div class="setting-row"><div><strong>Eliminar todos los datos</strong><small>Esta acción no se puede deshacer.</small></div><button class="secondary-btn danger-btn" id="wipeBtn">Borrar</button></div></div>`);
 $('exportBtn').onclick=exportBackup;$('importFile').onchange=importBackup;$('themeCycle').onclick=()=>{data.theme=data.theme==='system'?'light':data.theme==='light'?'dark':'system';save();showSettings()};$('wipeBtn').onclick=()=>{if(confirm('¿Seguro que deseas borrar permanentemente todas tus cuentas y movimientos?')){data=structuredClone(defaultData);save();close('simpleDialog')}};
}
function exportBackup(){const blob=new Blob([JSON.stringify({app:'Nexo Finance',version:1,exportedAt:new Date().toISOString(),data},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='nexo-finance-respaldo-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href)}
function importBackup(e){const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const obj=JSON.parse(r.result);if(!obj.data||!Array.isArray(obj.data.accounts)||!Array.isArray(obj.data.transactions))throw Error();if(confirm('La restauración reemplazará los datos actuales. ¿Continuar?')){data={...defaultData,...obj.data};save();close('simpleDialog')}}catch{alert('El archivo no parece ser un respaldo válido de Nexo Finance.')}};r.readAsText(file)}
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify(data));
render();
