const fs=require('fs');
const path='app.js';
let text=fs.readFileSync(path,'utf8');
const freqLine="    const FRECUENCIAS=[\"1/semana\",\"2/semana\",\"3/semana\"];\r\n";
if(!text.includes(freqLine)) throw new Error('FRECUENCIAS anchor not found');
if(!text.includes('CONTADURIA_PLANES')){
  const contaduriaConsts = freqLine +
"    const CONTADURIA_PLANES={\r\n"+
"      'Planes grupales':[\r\n"+
"        {name:'PULSE INTRO', price:48},\r\n"+
"        {name:'PULSE BALANCE', price:88},\r\n"+
"        {name:'PULSE FLOW', price:120}\r\n"+
"      ],\r\n"+
"      'Planes semiprivados':[\r\n"+
"        {name:'PULSE DUO', price:72},\r\n"+
"        {name:'PULSE HARMONIC', price:136},\r\n"+
"        {name:'PULSE SYNERGY', price:192}\r\n"+
"      ],\r\n"+
"      'Planes privados':[\r\n"+
"        {name:'PULSE FOCUS', price:96},\r\n"+
"        {name:'PULSE ELEVATE', price:184},\r\n"+
"        {name:'PULSE ESSENCE', price:264}\r\n"+
"      ]\r\n"+
"    };\r\n"+
"    const CONTADURIA_TABLE='contabilidad_movimientos';\r\n";
  text=text.replace(freqLine, contaduriaConsts);
}
const cacheLine="    let CACHE_ALUMNOS=[],CACHE_HORARIOS=[],CACHE_SOLICITUDES=[];\r\n";
if(text.includes(cacheLine) && !text.includes('CACHE_CONTADURIA_NAMES')){
  text=text.replace(cacheLine, cacheLine+"    let CACHE_CONTADURIA_NAMES=[];\r\n");
}
const switchNeedle="      const target=document.getElementById(id);\r\n      if(!target) return;\r\n\r\n";
if(text.includes(switchNeedle)){
  text=text.replace(switchNeedle,
    "      const target=document.getElementById(id);\r\n      if(!target) return;\r\n      const cont=document.getElementById('modulo-contaduria');\r\n      if(cont) cont.style.display='none';\r\n      const app=document.getElementById('app-content');\r\n      if(app) app.style.display='block';\r\n\r\n"
  );
}
const marker='function buildMiniCalendar';
const markerIdx=text.indexOf(marker);
if(markerIdx===-1) throw new Error('marker not found');
if(!text.includes('function openContaduria')){
  const insert=
"    function openContaduria(){\r\n"+
"      hidePublicScreens();\r\n"+
"      const cont=document.getElementById('modulo-contaduria');\r\n"+
"      if(cont) cont.style.display='block';\r\n"+
"      const app=document.getElementById('app-content');\r\n"+
"      if(app) app.style.display='none';\r\n"+
"      document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active-btn'));\r\n"+
"      const btn=document.getElementById('btn-contaduria');\r\n"+
"      if(btn) btn.classList.add('active-btn');\r\n"+
"      switchContaduriaView('ingresos');\r\n"+
"      ensureContaduriaData();\r\n"+
"    }\r\n\r\n"+
"    function switchContaduriaView(view){\r\n"+
"      const ingresos=document.getElementById('contaduria-ingresos');\r\n"+
"      const egresos=document.getElementById('contaduria-egresos');\r\n"+
"      const retiro=document.getElementById('contaduria-retiro');\r\n"+
"      const info=document.getElementById('contaduria-info');\r\n"+
"      if(ingresos) ingresos.style.display=view==='ingresos'?'block':'none';\r\n"+
"      if(egresos) egresos.style.display=view==='egresos'?'block':'none';\r\n"+
"      if(retiro) retiro.style.display=view==='egresos'?'block':'none';\r\n"+
"      if(info) info.style.display=view==='info'?'block':'none';\r\n"+
"      if(view==='info') loadContaduriaInfo();\r\n"+
"    }\r\n\r\n"+
"    function ensureContaduriaData(){\r\n"+
"      if(!CACHE_ALUMNOS || !CACHE_ALUMNOS.length){\r\n"+
"        updateAll().then(()=>{ populateContaduriaAlumnos(); updateContaduriaPlanes(); });\r\n"+
"        return;\r\n"+
"      }\r\n"+
"      populateContaduriaAlumnos();\r\n"+
"      updateContaduriaPlanes();\r\n"+
"    }\r\n\r\n"+
"    function populateContaduriaAlumnos(){\r\n"+
"      const select=document.getElementById('contad-alumno');\r\n"+
"      if(!select) return;\r\n"+
"      const names=(CACHE_ALUMNOS||[]).map(a=>{\r\n"+
"        const p=a.contenido.split('|').map(normalizeText);\r\n"+
"        return (p[1]||'').trim();\r\n"+
"      }).filter(Boolean);\r\n"+
"      names.sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));\r\n"+
"      CACHE_CONTADURIA_NAMES=names;\r\n"+
"      renderContaduriaAlumnos(names);\r\n"+
"    }\r\n\r\n"+
"    function renderContaduriaAlumnos(list){\r\n"+
"      const select=document.getElementById('contad-alumno');\r\n"+
"      if(!select) return;\r\n"+
"      const items=(list||[]).map(n=>'<option>'+n+'</option>').join('');\r\n"+
"      select.innerHTML='<option value=\"\">Selecciona alumno</option>'+items;\r\n"+
"    }\r\n\r\n"+
"    function buscarAlumnoContaduria(){\r\n"+
"      const input=document.getElementById('contad-alumno-search');\r\n"+
"      if(!input) return;\r\n"+
"      const q=(input.value||'').trim().toLowerCase();\r\n"+
"      if(!q){ renderContaduriaAlumnos(CACHE_CONTADURIA_NAMES); return; }\r\n"+
"      const filtered=CACHE_CONTADURIA_NAMES.filter(n=>n.toLowerCase().startsWith(q));\r\n"+
"      renderContaduriaAlumnos(filtered);\r\n"+
"    }\r\n\r\n"+
"    function toggleContaduriaManualName(){\r\n"+
"      const el=document.getElementById('contad-alumno-manual');\r\n"+
"      if(!el) return;\r\n"+
"      el.style.display=el.style.display==='none'?'block':'none';\r\n"+
"      if(el.style.display==='block') el.focus();\r\n"+
"    }\r\n\r\n"+
"    function updateContaduriaPlanes(){\r\n"+
"      const nivel=document.getElementById('contad-plan-nivel');\r\n"+
"      const planSelect=document.getElementById('contad-plan-item');\r\n"+
"      if(!nivel||!planSelect) return;\r\n"+
"      const list=CONTADURIA_PLANES[nivel.value]||[];\r\n"+
"      planSelect.innerHTML='<option value=\"\">Selecciona plan</option>'+list.map(p=>'<option value=\"'+p.name+'\" data-price=\"'+p.price+'\">'+p.name+'</option>').join('');\r\n"+
"      updateContaduriaTotal();\r\n"+
"    }\r\n\r\n"+
"    function updateContaduriaTotal(){\r\n"+
"      const planSelect=document.getElementById('contad-plan-item');\r\n"+
"      const total=document.getElementById('contad-total');\r\n"+
"      if(!planSelect||!total) return;\r\n"+
"      const opt=planSelect.options[planSelect.selectedIndex];\r\n"+
"      if(!opt || !opt.value){ total.value=''; return; }\r\n"+
"      if(total.readOnly){\r\n"+
"        total.value=opt.getAttribute('data-price')||'';\r\n"+
"      }\r\n"+
"    }\r\n\r\n"+
"    function toggleContaduriaTotalEditable(){\r\n"+
"      const total=document.getElementById('contad-total');\r\n"+
"      if(!total) return;\r\n"+
"      total.readOnly=!total.readOnly;\r\n"+
"      if(total.readOnly) updateContaduriaTotal();\r\n"+
"      else total.focus();\r\n"+
"    }\r\n\r\n"+
"    function getContaduriaNombre(){\r\n"+
"      const manual=document.getElementById('contad-alumno-manual');\r\n"+
"      const select=document.getElementById('contad-alumno');\r\n"+
"      const manualName=(manual&&manual.style.display!=='none')?manual.value.trim():'';\r\n"+
"      return manualName || (select?select.value.trim():'');\r\n"+
"    }\r\n\r\n"+
"    async function registrarIngresoContaduria(){\r\n"+
"      const nombre=getContaduriaNombre();\r\n"+
"      const nivel=document.getElementById('contad-plan-nivel')?.value||'';\r\n"+
"      const plan=document.getElementById('contad-plan-item')?.value||'';\r\n"+
"      const total=parseFloat(document.getElementById('contad-total')?.value||'0');\r\n"+
"      if(!nombre||!nivel||!plan||!total){ alert('Completa todos los campos.'); return; }\r\n"+
"      const payload={tipo:'ingreso',estudiante:nombre,plan_nivel:nivel,plan:plan,persona:null,categoria:'clase',monto:total,fecha:new Date().toISOString()};\r\n"+
"      const res=await _sp.from(CONTADURIA_TABLE).insert([payload]);\r\n"+
"      if(res.error){ alert('No se pudo registrar el ingreso. Verifica la tabla en Supabase.'); return; }\r\n"+
"      alert('Ingreso registrado.');\r\n"+
"    }\r\n\r\n"+
"    async function registrarPagoTatiana(){\r\n"+
"      const payload={tipo:'egreso',estudiante:null,plan_nivel:null,plan:null,persona:'Tatiana',categoria:'fijo',monto:225,fecha:new Date().toISOString()};\r\n"+
"      const res=await _sp.from(CONTADURIA_TABLE).insert([payload]);\r\n"+
"      if(res.error){ alert('No se pudo registrar el pago.'); return; }\r\n"+
"      alert('Pago quincenal registrado.');\r\n"+
"    }\r\n\r\n"+
"    let CONTADURIA_INFO_CACHE={};\r\n\r\n"+
"    async function loadContaduriaInfo(){\r\n"+
"      const list=document.getElementById('contaduria-info-list');\r\n"+
"      const totalEl=document.getElementById('contaduria-info-total');\r\n"+
"      if(!list) return;\r\n"+
"      const res=await _sp.from(CONTADURIA_TABLE)\r\n"+
"        .select('id,estudiante,plan,plan_nivel,monto,tipo')\r\n"+
"        .eq('tipo','ingreso')\r\n"+
"        .order('id',{ascending:false}).limit(200);\r\n"+
"      if(res.error){ list.textContent='No se pudo cargar la informacion.'; if(totalEl) totalEl.textContent='Total: $0.00'; return; }\r\n"+
"      const rows=res.data||[];\r\n"+
"      if(!rows.length){ list.textContent='Sin movimientos aun.'; if(totalEl) totalEl.textContent='Total: $0.00'; return; }\r\n"+
"      const grouped={};\r\n"+
"      rows.forEach(r=>{\r\n"+
"        const nombre=(r.estudiante||'N/A').trim();\r\n"+
"        const plan=(r.plan||r.plan_nivel||'Sin plan').trim();\r\n"+
"        const key=nombre+'||'+plan;\r\n"+
"        if(!grouped[key]) grouped[key]={nombre,plan,total:0,ids:[]};\r\n"+
"        grouped[key].total+=parseFloat(r.monto)||0;\r\n"+
"        grouped[key].ids.push(r.id);\r\n"+
"      });\r\n"+
"      CONTADURIA_INFO_CACHE=grouped;\r\n"+
"      const totalAll=Object.values(grouped).reduce((s,i)=>s+i.total,0);\r\n"+
"      if(totalEl) totalEl.textContent='Total: $'+totalAll.toFixed(2);\r\n"+
"      const cards=Object.values(grouped).map(item=>{\r\n"+
"        const monto=item.total.toFixed(2);\r\n"+
"        return '<div class=\"clase-box\" style=\"margin-bottom:10px;display:flex;justify-content:space-between;gap:12px;align-items:center\">'+\r\n"+
"          '<div>'+\r\n"+
"            '<div style=\"font-size:.75rem;font-weight:700\">'+item.nombre+'</div>'+\r\n"+
"            '<div style=\"opacity:.75;font-size:.7rem\">'+item.plan+'</div>'+\r\n"+
"            '<div style=\"margin-top:6px;font-weight:800\">$'+monto+'</div>'+\r\n"+
"          '</div>'+\r\n"+
"          '<div style=\"display:flex;gap:8px;align-items:center\">'+\r\n"+
"            '<button class=\"btn-cancelar\" style=\"padding:8px 10px\" onclick=\\\"editarInfoContaduria(\\\"'+item.nombre+'\\\",\\\"'+item.plan+'\\\")\\\">&#9998;</button>'+\r\n"+
"            '<button class=\"btn-cancelar\" style=\"padding:8px 10px\" onclick=\\\"eliminarInfoContaduria(\\\"'+item.nombre+'\\\",\\\"'+item.plan+'\\\")\\\">&#10060;</button>'+\r\n"+
"          '</div>'+\r\n"+
"        '</div>';\r\n"+
"      }).join('');\r\n"+
"      list.innerHTML=cards;\r\n"+
"    }\r\n\r\n"+
"    async function editarInfoContaduria(nombre,plan){\r\n"+
"      const key=nombre+'||'+plan;\r\n"+
"      const item=CONTADURIA_INFO_CACHE[key];\r\n"+
"      if(!item) return;\r\n"+
"      const nuevo=prompt('Nuevo total para '+nombre+' - '+plan, item.total.toFixed(2));\r\n"+
"      if(nuevo===null) return;\r\n"+
"      const nuevoNum=parseFloat(nuevo);\r\n"+
"      if(!Number.isFinite(nuevoNum)){ alert('Monto invalido'); return; }\r\n"+
"      const delta=nuevoNum-item.total;\r\n"+
"      if(Math.abs(delta) < 0.01){ return; }\r\n"+
"      const payload={tipo:'ingreso',estudiante:nombre,plan:plan,plan_nivel:null,persona:null,categoria:'ajuste',monto:delta,fecha:new Date().toISOString()};\r\n"+
"      const res=await _sp.from(CONTADURIA_TABLE).insert([payload]);\r\n"+
"      if(res.error){ alert('No se pudo ajustar.'); return; }\r\n"+
"      loadContaduriaInfo();\r\n"+
"    }\r\n\r\n"+
"    async function eliminarInfoContaduria(nombre,plan){\r\n"+
"      const key=nombre+'||'+plan;\r\n"+
"      const item=CONTADURIA_INFO_CACHE[key];\r\n"+
"      if(!item) return;\r\n"+
"      const ok=confirm('Eliminar todos los ingresos de '+nombre+' en '+plan+'?');\r\n"+
"      if(!ok) return;\r\n"+
"      const res=await _sp.from(CONTADURIA_TABLE).delete().in('id', item.ids);\r\n"+
"      if(res.error){ alert('No se pudo eliminar.'); return; }\r\n"+
"      loadContaduriaInfo();\r\n"+
"    }\r\n\r\n"+
"    async function retirarPagoVariable(){\r\n"+
"      const persona=document.getElementById('contad-persona-variable')?.value||'';\r\n"+
"      const inicio=document.getElementById('contad-variable-inicio')?.value||'';\r\n"+
"      const fin=document.getElementById('contad-variable-fin')?.value||'';\r\n"+
"      const result=document.getElementById('contad-variable-result');\r\n"+
"      if(!persona||!inicio||!fin){ alert('Selecciona persona e intervalo.'); return; }\r\n"+
"      const res=await _sp.from(CONTADURIA_TABLE).select('monto,fecha').eq('tipo','ingreso').gte('fecha',inicio).lte('fecha',fin);\r\n"+
"      if(res.error){ alert('No se pudo calcular el pago.'); return; }\r\n"+
"      const total=(res.data||[]).reduce((s,r)=>s+(parseFloat(r.monto)||0),0);\r\n"+
"      const share=total/2;\r\n"+
"      const payload={tipo:'egreso',persona:persona,categoria:'variable',monto:share,fecha:new Date().toISOString()};\r\n"+
"      const res2=await _sp.from(CONTADURIA_TABLE).insert([payload]);\r\n"+
"      if(res2.error){ alert('No se pudo registrar el retiro.'); return; }\r\n"+
"      if(result){ result.textContent='Total periodo: $'+total.toFixed(2)+'. Pago para '+persona+': $'+share.toFixed(2)+'.'; }\r\n"+
"      alert('Retiro registrado.');\r\n"+
"    }\r\n\r\n";
  text=text.slice(0,markerIdx)+insert+text.slice(markerIdx);
}
fs.writeFileSync(path,text,'utf8');
