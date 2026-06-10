const fs=require('fs');
const path='index.html';
let text=fs.readFileSync(path,'utf8');
if(!text.includes('contaduria-info-total')){
  text=text.replace(
    '<div id="contaduria-info" class="contaduria-shell" style="display:none">\r\n        <h3 style="letter-spacing: 1px; font-size:.85rem; text-transform:uppercase">Informacion</h3>\r\n        <div id="contaduria-info-list"></div>\r\n      </div>\r\n\r\n      <button class="back-btn" style="margin-top:16px" onclick="switchModulo(\'modulo-agenda\')">Volver</button>',
    '<div id="contaduria-info" class="contaduria-shell" style="display:none">\r\n        <h3 style="letter-spacing: 1px; font-size:.85rem; text-transform:uppercase">Informacion</h3>\r\n        <div id="contaduria-info-list"></div>\r\n      </div>\r\n\r\n      <div id="contaduria-info-total" style="margin-top:10px;color:#73b8ff;font-weight:800">Total: $0.00</div>\r\n      <button class="back-btn" style="margin-top:16px" onclick="switchModulo(\'modulo-agenda\')">Volver</button>'
  );
}
fs.writeFileSync(path,text,'utf8');
