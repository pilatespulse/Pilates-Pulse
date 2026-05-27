const fs=require('fs');
const path='index.html';
let text=fs.readFileSync(path,'utf8');
// insert the two buttons and wrap sections
text=text.replace(
  '<div style="padding:0 16px 16px">\r\n      <div class="contaduria-shell" style="margin-bottom:24px">',
  '<div style="padding:0 16px 16px">\r\n      <div style="display:flex;gap:10px;margin-bottom:18px">\r\n        <button class="btn-principal" style="flex:1" onclick="switchContaduriaView(\'ingresos\')">Registro de ingresos</button>\r\n        <button class="btn-cancelar" style="flex:1" onclick="switchContaduriaView(\'egresos\')">Precios fijos y retirar pago</button>\r\n      </div>\r\n\r\n      <div id="contaduria-ingresos" class="contaduria-shell" style="margin-bottom:24px">'
);
text=text.replace(
  '<div class="contaduria-shell" style="margin-bottom:24px">\r\n        <h3 style="letter-spacing: 1px; font-size:.85rem; text-transform:uppercase">Precios fijos</h3>',
  '<div id="contaduria-egresos" class="contaduria-shell" style="margin-bottom:24px;display:none">\r\n        <h3 style="letter-spacing: 1px; font-size:.85rem; text-transform:uppercase">Precios fijos</h3>'
);
text=text.replace(
  '<div class="contaduria-shell">\r\n        <h3 style="letter-spacing: 1px; font-size:.85rem; text-transform:uppercase">Retirar pago</h3>',
  '<div id="contaduria-retiro" class="contaduria-shell" style="display:none">\r\n        <h3 style="letter-spacing: 1px; font-size:.85rem; text-transform:uppercase">Retirar pago</h3>'
);
fs.writeFileSync(path,text,'utf8');
