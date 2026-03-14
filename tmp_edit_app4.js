const fs=require('fs');
const path='app.js';
let text=fs.readFileSync(path,'utf8');
// add cache var if missing
if(!text.includes('let CACHE_CONTADURIA_NAMES')){
  text=text.replace('    let CACHE_ALUMNOS=[],CACHE_HORARIOS=[],CACHE_SOLICITUDES=[];\n', '    let CACHE_ALUMNOS=[],CACHE_HORARIOS=[],CACHE_SOLICITUDES=[];\n    let CACHE_CONTADURIA_NAMES=[];\n');
}
// replace populateContaduriaAlumnos
text=text.replace(/function populateContaduriaAlumnos\([\s\S]*?\n    }\n\n    function buscarAlumnoContaduria\(/, function(match){
  return "function populateContaduriaAlumnos(){\n" +
    "      const select=document.getElementById('contad-alumno');\n" +
    "      if(!select) return;\n" +
    "      const names=(CACHE_ALUMNOS||[]).map(a=>{\n" +
    "        const p=a.contenido.split('|').map(normalizeText);\n" +
    "        return (p[1]||'').trim();\n" +
    "      }).filter(Boolean);\n" +
    "      names.sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));\n" +
    "      CACHE_CONTADURIA_NAMES=names;\n" +
    "      renderContaduriaAlumnos(names);\n" +
    "    }\n\n" +
    "    function renderContaduriaAlumnos(list){\n" +
    "      const select=document.getElementById('contad-alumno');\n" +
    "      if(!select) return;\n" +
    "      select.innerHTML=(list||[]).map(n=>'<option>'+n+'</option>').join('');\n" +
    "    }\n\n" +
    "    function buscarAlumnoContaduria("; 
});
// replace buscarAlumnoContaduria body
text=text.replace(/function buscarAlumnoContaduria\([\s\S]*?\n    }\n\n    function toggleContaduriaManualName\(/, function(match){
  return "function buscarAlumnoContaduria(){\n" +
    "      const input=document.getElementById('contad-alumno-search');\n" +
    "      if(!input) return;\n" +
    "      const q=(input.value||'').trim().toLowerCase();\n" +
    "      if(!q){ renderContaduriaAlumnos(CACHE_CONTADURIA_NAMES); return; }\n" +
    "      const filtered=CACHE_CONTADURIA_NAMES.filter(n=>n.toLowerCase().startsWith(q));\n" +
    "      renderContaduriaAlumnos(filtered);\n" +
    "    }\n\n" +
    "    function toggleContaduriaManualName(";
});
fs.writeFileSync(path,text,'utf8');
