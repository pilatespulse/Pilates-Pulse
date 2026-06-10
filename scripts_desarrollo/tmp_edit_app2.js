const fs = require('fs');
const path = 'app.js';
let text = fs.readFileSync(path, 'utf8');
const marker = 'function buildMiniCalendar';
if (!text.includes(marker)) throw new Error('marker not found');
const insert = "\n\n    function openContaduria(){\n" +
"      hidePublicScreens();\n" +
"      const cont=document.getElementById('modulo-contaduria');\n" +
"      if(cont) cont.style.display='block';\n" +
"      const app=document.getElementById('app-content');\n" +
"      if(app) app.style.display='none';\n" +
"      document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active-btn'));\n" +
"      const btn=document.getElementById('btn-contaduria');\n" +
"      if(btn) btn.classList.add('active-btn');\n" +
"      ensureContaduriaData();\n" +
"    }\n\n" +
"    function ensureContaduriaData(){\n" +
"      if(!CACHE_ALUMNOS || !CACHE_ALUMNOS.length){\n" +
"        updateAll().then(()=>{ populateContaduriaAlumnos(); updateContaduriaPlanes(); });\n" +
"        return;\n" +
"      }\n" +
"      populateContaduriaAlumnos();\n" +
"      updateContaduriaPlanes();\n" +
"    }\n\n" +
"    function populateContaduriaAlumnos(){\n" +
"      const select=document.getElementById('contad-alumno');\n" +
"      if(!select) return;\n" +
"      const names=(CACHE_ALUMNOS||[]).map(a=>{\n" +
"        const p=a.contenido.split('|').map(normalizeText);\n" +
"        return (p[1]||'').trim();\n" +
"      }).filter(Boolean);\n" +
"      names.sort((a,b)=>a.localeCompare(b,'es', {sensitivity:'base'}));\n" +
"      select.innerHTML=names.map(n=>'<option>'+n+'</option>').join('');\n" +
"    }\n\n" +
"    function buscarAlumnoContaduria(){\n" +
"      const input=document.getElementById('contad-alumno-search');\n" +
"      const select=document.getElementById('contad-alumno');\n" +
"      if(!input||!select) return;\n" +
"      const q=(input.value||'').trim().toLowerCase();\n" +
"      if(!q) return;\n" +
"      const opts=Array.from(select.options);\n" +
"      const found=opts.find(o=>o.value.toLowerCase().includes(q));\n" +
"      if(found){ select.value=found.value; }\n" +
"    }\n\n" +
"    function toggleContaduriaManualName(){\n" +
"      const el=document.getElementById('contad-alumno-manual');\n" +
"      if(!el) return;\n" +
"      el.style.display=el.style.display==='none'?'block':'none';\n" +
"      if(el.style.display==='block') el.focus();\n" +
"    }\n\n" +
"    function updateContaduriaPlanes(){\n" +
"      const nivel=document.getElementById('contad-plan-nivel');\n" +
"      const planSelect=document.getElementById('contad-plan-item');\n" +
"      if(!nivel||!planSelect) return;\n" +
"      const list=CONTADURIA_PLANES[nivel.value]||[];\n" +
"      planSelect.innerHTML=list.map(p=>'<option value=\"'+p.name+'\" data-price=\"'+p.price+'\">'+p.name+'</option>').join('');\n" +
"      updateContaduriaTotal();\n" +
"    }\n\n" +
"    function updateContaduriaTotal(){\n" +
"      const planSelect=document.getElementById('contad-plan-item');\n" +
"      const total=document.getElementById('contad-total');\n" +
"      if(!planSelect||!total) return;\n" +
"      const opt=planSelect.options[planSelect.selectedIndex];\n" +
"      if(!opt) return;\n" +
"      if(total.readOnly){\n" +
"        total.value=opt.getAttribute('data-price')||'';\n" +
"      }\n" +
"    }\n\n" +
"    function toggleContaduriaTotalEditable(){\n" +
"      const total=document.getElementById('contad-total');\n" +
"      if(!total) return;\n" +
"      total.readOnly=!total.readOnly;\n" +
"      if(total.readOnly) updateContaduriaTotal();\n" +
"      else total.focus();\n" +
"    }\n\n" +
"    function getContaduriaNombre(){\n" +
"      const manual=document.getElementById('contad-alumno-manual');\n" +
"      const select=document.getElementById('contad-alumno');\n" +
"      const manualName=(manual&&manual.style.display!=='none')?manual.value.trim():'';\n" +
"      return manualName || (select?select.value.trim():'');\n" +
"    }\n\n" +
"    async function registrarIngresoContaduria(){\n" +
"      const nombre=getContaduriaNombre();\n" +
"      const nivel=document.getElementById('contad-plan-nivel')?.value||'';\n" +
"      const plan=document.getElementById('contad-plan-item')?.value||'';\n" +
"      const total=parseFloat(document.getElementById('contad-total')?.value||'0');\n" +
"      if(!nombre||!nivel||!plan||!total){ alert('Completa todos los campos.'); return; }\n" +
"      const payload={tipo:'ingreso',estudiante:nombre,plan_nivel:nivel,plan,persona:null,categoria:'clase',monto:total,fecha:new Date().toISOString()};\n" +
"      const res=await _sp.from(CONTADURIA_TABLE).insert([payload]);\n" +
"      if(res.error){ alert('No se pudo registrar el ingreso.'); return; }\n" +
"      alert('Ingreso registrado.');\n" +
"    }\n\n" +
"    async function registrarPagoTatiana(){\n" +
"      const payload={tipo:'egreso',estudiante:null,plan_nivel:null,plan:null,persona:'Tatiana',categoria:'fijo',monto:225,fecha:new Date().toISOString()};\n" +
"      const res=await _sp.from(CONTADURIA_TABLE).insert([payload]);\n" +
"      if(res.error){ alert('No se pudo registrar el pago.'); return; }\n" +
"      alert('Pago quincenal registrado.');\n" +
"    }\n\n" +
"    async function retirarPagoVariable(){\n" +
"      const persona=document.getElementById('contad-persona-variable')?.value||'';\n" +
"      const inicio=document.getElementById('contad-variable-inicio')?.value||'';\n" +
"      const fin=document.getElementById('contad-variable-fin')?.value||'';\n" +
"      const result=document.getElementById('contad-variable-result');\n" +
"      if(!persona||!inicio||!fin){ alert('Selecciona persona e intervalo.'); return; }\n" +
"      const res=await _sp.from(CONTADURIA_TABLE).select('monto,fecha').eq('tipo','ingreso').gte('fecha',inicio).lte('fecha',fin);\n" +
"      if(res.error){ alert('No se pudo calcular el pago.'); return; }\n" +
"      const total=(res.data||[]).reduce((s,r)=>s+(parseFloat(r.monto)||0),0);\n" +
"      const share=total/2;\n" +
"      const payload={tipo:'egreso',persona,categoria:'variable',monto:share,fecha:new Date().toISOString()};\n" +
"      const res2=await _sp.from(CONTADURIA_TABLE).insert([payload]);\n" +
"      if(res2.error){ alert('No se pudo registrar el retiro.'); return; }\n" +
"      if(result){ result.textContent='Total periodo: $'+total.toFixed(2)+'. Pago para '+persona+': $'+share.toFixed(2)+'.'; }\n" +
"      alert('Retiro registrado.');\n" +
"    }\n\n";
text = text.replace(marker, insert + marker);
fs.writeFileSync(path, text, 'utf8');
