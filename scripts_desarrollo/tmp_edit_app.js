const fs = require('fs');
const path = 'app.js';
let text = fs.readFileSync(path, 'utf8');
const needle = "    const FRECUENCIAS=[\"1/semana\",\"2/semana\",\"3/semana\"];\r\n";
if (!text.includes(needle)) throw new Error('needle not found');
const insert = needle +
"    const CONTADURIA_PLANES={\r\n" +
"      'Planes grupales':[\r\n" +
"        {name:'PULSE INTRO', price:48},\r\n" +
"        {name:'PULSE BALANCE', price:88},\r\n" +
"        {name:'PULSE FLOW', price:120}\r\n" +
"      ],\r\n" +
"      'Planes semiprivados':[\r\n" +
"        {name:'PULSE DUO', price:72},\r\n" +
"        {name:'PULSE HARMONIC', price:136},\r\n" +
"        {name:'PULSE SYNERGY', price:192}\r\n" +
"      ],\r\n" +
"      'Planes privados':[\r\n" +
"        {name:'PULSE FOCUS', price:96},\r\n" +
"        {name:'PULSE ELEVATE', price:184},\r\n" +
"        {name:'PULSE ESSENCE', price:264}\r\n" +
"      ]\r\n" +
"    };\r\n" +
"    const CONTADURIA_TABLE='contabilidad_movimientos';\r\n";
text = text.replace(needle, insert);
fs.writeFileSync(path, text, 'utf8');
