const fs=require('fs');
const path='app.js';
let text=fs.readFileSync(path,'utf8');
// add total computation inside loadContaduriaInfo
text=text.replace(
"      const rows=res.data||[];\n      if(!rows.length){ list.textContent='Sin movimientos aun.'; return; }\n      const grouped={};\n",
"      const rows=res.data||[];\n      if(!rows.length){ list.textContent='Sin movimientos aun.'; const t=document.getElementById('contaduria-info-total'); if(t) t.textContent='Total: $0.00'; return; }\n      const grouped={};\n"
);
text=text.replace(
"      CONTADURIA_INFO_CACHE=grouped;\n      const cards=Object.values(grouped).map(item=>{\n",
"      CONTADURIA_INFO_CACHE=grouped;\n      const totalAll=Object.values(grouped).reduce((s,i)=>s+i.total,0);\n      const totalEl=document.getElementById('contaduria-info-total');\n      if(totalEl) totalEl.textContent='Total: $'+totalAll.toFixed(2);\n      const cards=Object.values(grouped).map(item=>{\n"
);
fs.writeFileSync(path,text,'utf8');
