const fs=require('fs');
const path='app.js';
let text=fs.readFileSync(path,'utf8');
// update switchContaduriaView to include info
text=text.replace(
  "function switchContaduriaView(view){\n      const ingresos=document.getElementById('contaduria-ingresos');\n      const egresos=document.getElementById('contaduria-egresos');\n      const retiro=document.getElementById('contaduria-retiro');\n      if(ingresos) ingresos.style.display=view==='ingresos'?'block':'none';\n      if(egresos) egresos.style.display=view==='egresos'?'block':'none';\n      if(retiro) retiro.style.display=view==='egresos'?'block':'none';\n    }",
  "function switchContaduriaView(view){\n      const ingresos=document.getElementById('contaduria-ingresos');\n      const egresos=document.getElementById('contaduria-egresos');\n      const retiro=document.getElementById('contaduria-retiro');\n      const info=document.getElementById('contaduria-info');\n      if(ingresos) ingresos.style.display=view==='ingresos'?'block':'none';\n      if(egresos) egresos.style.display=view==='egresos'?'block':'none';\n      if(retiro) retiro.style.display=view==='egresos'?'block':'none';\n      if(info) info.style.display=view==='info'?'block':'none';\n      if(view==='info') loadContaduriaInfo();\n    }"
);
// render list with placeholder and cache
text=text.replace(
  "select.innerHTML=(list||[]).map(n=>'<option>'+n+'</option>').join('');",
  "const items=(list||[]).map(n=>'<option>'+n+'</option>').join('');\n      select.innerHTML='<option value=\"\">Selecciona alumno</option>'+items;"
);
// search by prefix and show all if empty already ok
// update updateContaduriaTotal to clear if no selection
text=text.replace(
  "      if(!opt) return;\n      if(total.readOnly){\n        total.value=opt.getAttribute('data-price')||'';\n      }",
  "      if(!opt || !opt.value){ total.value=''; return; }\n      if(total.readOnly){\n        total.value=opt.getAttribute('data-price')||'';\n      }"
);
// ensure plan select starts empty
text=text.replace(
  "      const list=CONTADURIA_PLANES[nivel.value]||[];\n      planSelect.innerHTML=list.map(p=>'<option value=\"'+p.name+'\" data-price=\"'+p.price+'\">'+p.name+'</option>').join('');",
  "      const list=CONTADURIA_PLANES[nivel.value]||[];\n      planSelect.innerHTML='<option value=\"\">Selecciona plan</option>'+list.map(p=>'<option value=\"'+p.name+'\" data-price=\"'+p.price+'\">'+p.name+'</option>').join('');"
);
// add info loader if missing
if(!text.includes('function loadContaduriaInfo')){
  text=text.replace('    async function retirarPagoVariable(){\n',
    "    async function loadContaduriaInfo(){\n" +
    "      const list=document.getElementById('contaduria-info-list');\n" +
    "      if(!list) return;\n" +
    "      const res=await _sp.from(CONTADURIA_TABLE).select('estudiante,plan,plan_nivel,monto,persona,tipo,fecha').order('fecha',{ascending:false}).limit(50);\n" +
    "      if(res.error){ list.textContent='No se pudo cargar la informacion.'; return; }\n" +
    "      const rows=res.data||[];\n" +
    "      if(!rows.length){ list.textContent='Sin movimientos aun.'; return; }\n" +
    "      list.innerHTML=rows.map(r=>{\n" +
    "        const nombre=r.estudiante||r.persona||'N/A';\n" +
    "        const plan=r.plan||r.plan_nivel||'';\n" +
    "        const monto=Number(r.monto||0).toFixed(2);\n" +
    "        return '<div class=\"clase-box\" style=\"margin-bottom:10px\">'+\n" +
    "          '<div style=\"font-size:.75rem;font-weight:700\">'+nombre+'</div>'+\n" +
    "          '<div style=\"opacity:.75;font-size:.7rem\">'+(plan||'Sin plan')+'</div>'+\n" +
    "          '<div style=\"margin-top:6px;font-weight:800\">$'+monto+'</div>'+\n" +
    "        '</div>';\n" +
    "      }).join('');\n" +
    "    }\n\n" +
    "    async function retirarPagoVariable(){\n"
  );
}
// improve ingreso error message
text=text.replace(
  "      if(res.error){ alert('No se pudo registrar el ingreso.'); return; }",
  "      if(res.error){ alert('No se pudo registrar el ingreso. Verifica la tabla en Supabase.'); return; }"
);
fs.writeFileSync(path,text,'utf8');
