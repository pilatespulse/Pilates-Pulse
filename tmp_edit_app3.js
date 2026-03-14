const fs = require('fs');
const path = 'app.js';
let text = fs.readFileSync(path, 'utf8');
const needle = "      const target=document.getElementById(id);\r\n      if(!target) return;\r\n\r\n";
if(!text.includes(needle)) throw new Error('needle not found');
const insert = "      const target=document.getElementById(id);\r\n      if(!target) return;\r\n      const cont=document.getElementById('modulo-contaduria');\r\n      if(cont) cont.style.display='none';\r\n      const app=document.getElementById('app-content');\r\n      if(app) app.style.display='block';\r\n\r\n";
text = text.replace(needle, insert);
fs.writeFileSync(path, text, 'utf8');
