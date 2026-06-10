const fs=require('fs');
const path='index.html';
let text=fs.readFileSync(path,'utf8');
// add third button
text=text.replace(
  '<button class="btn-principal" style="flex:1" onclick="switchContaduriaView(\'ingresos\')">Registro de ingresos</button>\r\n        <button class="btn-cancelar" style="flex:1" onclick="switchContaduriaView(\'egresos\')">Precios fijos y retirar pago</button>',
  '<button class="btn-principal" style="flex:1" onclick="switchContaduriaView(\'ingresos\')">Registro de ingresos</button>\r\n        <button class="btn-cancelar" style="flex:1" onclick="switchContaduriaView(\'egresos\')">Precios fijos y retirar pago</button>\r\n        <button class="btn-cancelar" style="flex:1" onclick="switchContaduriaView(\'info\')">Informacion</button>'
);
// enlarge total input
text=text.replace(
  '<input id="contad-total" type="number" min="0" step="0.01" readonly style="flex:1">',
  '<input id="contad-total" type="number" min="0" step="0.01" readonly style="flex:1;height:52px;font-size:1rem;padding:12px 14px">'
);
// insert info section before Volver
if(!text.includes('contaduria-info')){
  text=text.replace(
    '<button class="back-btn" style="margin-top:16px" onclick="switchModulo(\'modulo-agenda\')">Volver</button>\r\n    </div>\r\n  </div>',
    '<div id="contaduria-info" class="contaduria-shell" style="display:none">\r\n        <h3 style="letter-spacing: 1px; font-size:.85rem; text-transform:uppercase">Informacion</h3>\r\n        <div id="contaduria-info-list"></div>\r\n      </div>\r\n\r\n      <button class="back-btn" style="margin-top:16px" onclick="switchModulo(\'modulo-agenda\')">Volver</button>\r\n    </div>\r\n  </div>'
  );
}
fs.writeFileSync(path,text,'utf8');
