const fs=require('fs');
const path='app.js';
let text=fs.readFileSync(path,'utf8');
const re=/async function loadContaduriaInfo[\s\S]*?async function editarInfoContaduria/;
const replacement=
"async function loadContaduriaInfo(){\n"+
"      const list=document.getElementById('contaduria-info-list');\n"+
"      const totalEl=document.getElementById('contaduria-info-total');\n"+
"      if(!list) return;\n"+
"      const res=await _sp.from(CONTADURIA_TABLE)\n"+
"        .select('id,estudiante,plan,plan_nivel,monto,tipo')\n"+
"        .eq('tipo','ingreso')\n"+
"        .order('id',{ascending:false}).limit(200);\n"+
"      if(res.error){ list.textContent='No se pudo cargar la informacion.'; if(totalEl) totalEl.textContent='Total: $0.00'; return; }\n"+
"      const rows=res.data||[];\n"+
"      if(!rows.length){ list.textContent='Sin movimientos aun.'; if(totalEl) totalEl.textContent='Total: $0.00'; return; }\n"+
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
"      const totalAll=Object.values(grouped).reduce((s,i)=>s+i.total,0);\n"+
"      if(totalEl) totalEl.textContent='Total: $'+totalAll.toFixed(2);\n"+
"      const cards=Object.values(grouped).map(item=>{\n"+
"        const monto=item.total.toFixed(2);\n"+
"        return '<div class=\"clase-box\" style=\"margin-bottom:10px;display:flex;justify-content:space-between;gap:12px;align-items:center\">'+\n"+
"          '<div>'+\n"+
"            '<div style=\"font-size:.75rem;font-weight:700\">'+item.nombre+'</div>'+\n"+
"            '<div style=\"opacity:.75;font-size:.7rem\">'+item.plan+'</div>'+\n"+
"            '<div style=\"margin-top:6px;font-weight:800\">$'+monto+'</div>'+\n"+
"          '</div>'+\n"+
"          '<div style=\"display:flex;gap:8px;align-items:center\">'+\n"+
"            '<button class=\"btn-cancelar\" style=\"padding:8px 10px\" onclick=\\\"editarInfoContaduria(\\\"'+item.nombre+'\\\",\\\"'+item.plan+'\\\")\\\">&#9998;</button>'+\n"+
"            '<button class=\"btn-cancelar\" style=\"padding:8px 10px\" onclick=\\\"eliminarInfoContaduria(\\\"'+item.nombre+'\\\",\\\"'+item.plan+'\\\")\\\">&#10060;</button>'+\n"+
"          '</div>'+\n"+
"        '</div>';\n"+
"      }).join('');\n"+
"      list.innerHTML=cards;\n"+
"    }\n\n"+
"    async function editarInfoContaduria";
if(!re.test(text)) throw new Error('pattern not found');
text=text.replace(re,replacement);
fs.writeFileSync(path,text,'utf8');
