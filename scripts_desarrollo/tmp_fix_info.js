const fs=require('fs');
const path='app.js';
let text=fs.readFileSync(path,'utf8');
const start=text.indexOf('    async function loadContaduriaInfo');
const end=text.indexOf('    async function retirarPagoVariable');
if(start===-1||end===-1||end<=start) throw new Error('markers not found');
const insert=
"    async function loadContaduriaInfo(){\n"+
"      const list=document.getElementById('contaduria-info-list');\n"+
"      if(!list) return;\n"+
"      const res=await _sp.from(CONTADURIA_TABLE)\n"+
"        .select('estudiante,plan,plan_nivel,monto,persona,tipo,fecha')\n"+
"        .order('fecha',{ascending:false}).limit(50);\n"+
"      if(res.error){ list.textContent='No se pudo cargar la informacion.'; return; }\n"+
"      const rows=res.data||[];\n"+
"      if(!rows.length){ list.textContent='Sin movimientos aun.'; return; }\n"+
"      list.innerHTML=rows.map(r=>{\n"+
"        const nombre=r.estudiante||r.persona||'N/A';\n"+
"        const plan=r.plan||r.plan_nivel||'';\n"+
"        const monto=Number(r.monto||0).toFixed(2);\n"+
"        return '<div class=\"clase-box\" style=\"margin-bottom:10px\">'+\n"+
"          '<div style=\"font-size:.75rem;font-weight:700\">'+nombre+'</div>'+\n"+
"          '<div style=\"opacity:.75;font-size:.7rem\">'+(plan||'Sin plan')+'</div>'+\n"+
"          '<div style=\"margin-top:6px;font-weight:800\">$'+monto+'</div>'+\n"+
"        '</div>';\n"+
"      }).join('');\n"+
"    }\n\n";
text=text.slice(0,start)+insert+text.slice(end);
fs.writeFileSync(path,text,'utf8');
