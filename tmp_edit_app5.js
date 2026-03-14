const fs=require('fs');
const path='app.js';
let text=fs.readFileSync(path,'utf8');
// add switchContaduriaView function if missing
if(!text.includes('function switchContaduriaView')){
  text=text.replace('    function openContaduria(){\n', "    function openContaduria(){\n" +
    "      switchContaduriaView('ingresos');\n");
  text=text.replace('    function ensureContaduriaData(){\n',
    "    function switchContaduriaView(view){\n" +
    "      const ingresos=document.getElementById('contaduria-ingresos');\n" +
    "      const egresos=document.getElementById('contaduria-egresos');\n" +
    "      const retiro=document.getElementById('contaduria-retiro');\n" +
    "      if(ingresos) ingresos.style.display=view==='ingresos'?'block':'none';\n" +
    "      if(egresos) egresos.style.display=view==='egresos'?'block':'none';\n" +
    "      if(retiro) retiro.style.display=view==='egresos'?'block':'none';\n" +
    "    }\n\n" +
    "    function ensureContaduriaData(){\n");
}
fs.writeFileSync(path,text,'utf8');
