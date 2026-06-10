const fs=require('fs');
const path='app.js';
let text=fs.readFileSync(path,'utf8');
const start=text.indexOf('    async function loadContaduriaInfo');
const end=text.indexOf('    async function editarInfoContaduria');
if(start===-1||end===-1||end<=start) throw new Error('markers not found');
const lines=[
"    async function loadContaduriaInfo(){",
"      const list=document.getElementById('contaduria-info-list');",
"      const totalEl=document.getElementById('contaduria-info-total');",
"      if(!list) return;",
"      const res=await _sp.from(CONTADURIA_TABLE)",
"        .select('id,estudiante,plan,plan_nivel,monto,tipo')",
"        .eq('tipo','ingreso')",
"        .order('id',{ascending:false}).limit(200);",
"      if(res.error){ list.textContent='No se pudo cargar la informacion.'; if(totalEl) totalEl.textContent='Total: $0.00'; return; }",
"      const rows=res.data||[];",
"      if(!rows.length){ list.textContent='Sin movimientos aun.'; if(totalEl) totalEl.textContent='Total: $0.00'; return; }",
"      const grouped={};",
"      rows.forEach(r=>{",
"        const nombre=(r.estudiante||'N/A').trim();",
"        const plan=(r.plan||r.plan_nivel||'Sin plan').trim();",
"        const key=nombre+'||'+plan;",
"        if(!grouped[key]) grouped[key]={nombre,plan,total:0,ids:[]};",
"        grouped[key].total+=parseFloat(r.monto)||0;",
"        grouped[key].ids.push(r.id);",
"      });",
"      CONTADURIA_INFO_CACHE=grouped;",
"      const totalAll=Object.values(grouped).reduce((s,i)=>s+i.total,0);",
"      if(totalEl) totalEl.textContent='Total: $'+totalAll.toFixed(2);",
"      const cards=Object.values(grouped).map(item=>{",
"        const monto=item.total.toFixed(2);",
"        return '<div class=\"clase-box\" style=\"margin-bottom:10px;display:flex;justify-content:space-between;gap:12px;align-items:center\">'+",
"          '<div>'+",
"            '<div style=\"font-size:.75rem;font-weight:700\">'+item.nombre+'</div>'+",
"            '<div style=\"opacity:.75;font-size:.7rem\">'+item.plan+'</div>'+",
"            '<div style=\"margin-top:6px;font-weight:800\">$'+monto+'</div>'+",
"          '</div>'+",
"          '<div style=\"display:flex;gap:8px;align-items:center\">'+",
"            '<button class=\"btn-cancelar\" style=\"padding:8px 10px\" onclick=\\\"editarInfoContaduria(\\\"'+item.nombre+'\\\",\\\"'+item.plan+'\\\")\\\">&#9998;</button>'+",
"            '<button class=\"btn-cancelar\" style=\"padding:8px 10px\" onclick=\\\"eliminarInfoContaduria(\\\"'+item.nombre+'\\\",\\\"'+item.plan+'\\\")\\\">&#10060;</button>'+",
"          '</div>'+",
"        '</div>';",
"      }).join('');",
"      list.innerHTML=cards;",
"    }",
""
];
const insert=lines.join('\n');
text=text.slice(0,start)+insert+text.slice(end);
fs.writeFileSync(path,text,'utf8');
