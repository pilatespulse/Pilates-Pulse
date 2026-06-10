const fs=require('fs');
const path='app.js';
let text=fs.readFileSync(path,'utf8');
const start=text.indexOf('    async function loadContaduriaInfo');
const end=text.indexOf('    async function retirarPagoVariable');
if(start===-1||end===-1||end<=start) throw new Error('markers not found');
const insert=
"    let CONTADURIA_INFO_CACHE={};\n\n"+
"    async function loadContaduriaInfo(){\n"+
"      const list=document.getElementById('contaduria-info-list');\n"+
"      if(!list) return;\n"+
"      const res=await _sp.from(CONTADURIA_TABLE)\n"+
"        .select('id,estudiante,plan,plan_nivel,monto,tipo')\n"+
"        .eq('tipo','ingreso')\n"+
"        .order('id',{ascending:false}).limit(200);\n"+
"      if(res.error){ list.textContent='No se pudo cargar la informacion.'; return; }\n"+
"      const rows=res.data||[];\n"+
"      if(!rows.length){ list.textContent='Sin movimientos aun.'; return; }\n"+
"      const grouped={};\n"+
"      rows.forEach(r=>{\n"+
"        const nombre=(r.estudiante||'N/A').trim();\n"+
"        const plan=(r.plan||r.plan_nivel||'Sin plan').trim();\n"+
"        const key=nombre+'||'+plan;\n"+
"        if(!grouped[key]) grouped[key]={nombre,plan,total:0,ids:[]};\n"+
"        grouped[key].total+=parseFloat(r.monto)||0;\n"+
"        grouped[key].ids.push(r.id);\n"+
"      });\n"+
"      CONTADURIA_INFO_CACHE=grouped;\n"+
"      const cards=Object.values(grouped).map(item=>{\n"+
"        const monto=item.total.toFixed(2);\n"+
"        return '<div class=\"clase-box\" style=\"margin-bottom:10px;display:flex;justify-content:space-between;gap:12px;align-items:center\">'+\n"+
"          '<div>'+\n"+
"            '<div style=\"font-size:.75rem;font-weight:700\">'+item.nombre+'</div>'+\n"+
"            '<div style=\"opacity:.75;font-size:.7rem\">'+item.plan+'</div>'+\n"+
"            '<div style=\"margin-top:6px;font-weight:800\">$'+monto+'</div>'+\n"+
"          '</div>'+\n"+
"          '<div style=\"display:flex;gap:8px;align-items:center\">'+\n"+
"            '<button class=\"btn-cancelar\" style=\"padding:8px 10px\" onclick=\"editarInfoContaduria(\\\"'+item.nombre+'\\\",\\\"'+item.plan+'\\\")\">&#9998;</button>'+\n"+
"            '<button class=\"btn-cancelar\" style=\"padding:8px 10px\" onclick=\"eliminarInfoContaduria(\\\"'+item.nombre+'\\\",\\\"'+item.plan+'\\\")\">&#10060;</button>'+\n"+
"          '</div>'+\n"+
"        '</div>';\n"+
"      }).join('');\n"+
"      list.innerHTML=cards;\n"+
"    }\n\n"+
"    async function editarInfoContaduria(nombre,plan){\n"+
"      const key=nombre+'||'+plan;\n"+
"      const item=CONTADURIA_INFO_CACHE[key];\n"+
"      if(!item) return;\n"+
"      const nuevo=prompt('Nuevo total para '+nombre+' - '+plan, item.total.toFixed(2));\n"+
"      if(nuevo===null) return;\n"+
"      const nuevoNum=parseFloat(nuevo);\n"+
"      if(!Number.isFinite(nuevoNum)){ alert('Monto invalido'); return; }\n"+
"      const delta=nuevoNum-item.total;\n"+
"      if(Math.abs(delta) < 0.01){ return; }\n"+
"      const payload={tipo:'ingreso',estudiante:nombre,plan:plan,plan_nivel:null,persona:null,categoria:'ajuste',monto:delta,fecha:new Date().toISOString()};\n"+
"      const res=await _sp.from(CONTADURIA_TABLE).insert([payload]);\n"+
"      if(res.error){ alert('No se pudo ajustar.'); return; }\n"+
"      loadContaduriaInfo();\n"+
"    }\n\n"+
"    async function eliminarInfoContaduria(nombre,plan){\n"+
"      const key=nombre+'||'+plan;\n"+
"      const item=CONTADURIA_INFO_CACHE[key];\n"+
"      if(!item) return;\n"+
"      const ok=confirm('Eliminar todos los ingresos de '+nombre+' en '+plan+'?');\n"+
"      if(!ok) return;\n"+
"      const res=await _sp.from(CONTADURIA_TABLE).delete().in('id', item.ids);\n"+
"      if(res.error){ alert('No se pudo eliminar.'); return; }\n"+
"      loadContaduriaInfo();\n"+
"    }\n\n";
text=text.slice(0,start)+insert+text.slice(end);
fs.writeFileSync(path,text,'utf8');
