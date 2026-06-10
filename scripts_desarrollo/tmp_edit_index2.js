const fs=require('fs');
const path='index.html';
let text=fs.readFileSync(path,'utf8');
const old=`        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">\r\n          <select id="contad-alumno" style="flex:1;min-width:200px"></select>\r\n          <input id="contad-alumno-search" type="search" placeholder="Buscar..." style="flex:0 0 150px">\r\n          <button class="btn-cancelar" style="flex:0 0 auto" onclick="buscarAlumnoContaduria()">Buscar</button>\r\n          <button class="btn-cancelar" style="flex:0 0 auto" onclick="toggleContaduriaManualName()" title="Escribir manualmente">&#9998;</button>\r\n        </div>`;
const neu=`        <div style="display:flex;gap:8px;align-items:center">\r\n          <select id="contad-alumno" style="flex:1;min-width:200px"></select>\r\n          <input id="contad-alumno-search" type="search" placeholder="Buscar..." style="flex:0 0 160px" oninput="buscarAlumnoContaduria()">\r\n          <button class="btn-cancelar" style="flex:0 0 42px;padding:10px" onclick="buscarAlumnoContaduria()" title="Buscar">&#128269;</button>\r\n          <button class="btn-cancelar" style="flex:0 0 42px;padding:10px" onclick="toggleContaduriaManualName()" title="Escribir manualmente">&#9998;</button>\r\n        </div>`;
if(!text.includes(old)) throw new Error('block not found');
text=text.replace(old,neu);
fs.writeFileSync(path,text,'utf8');
