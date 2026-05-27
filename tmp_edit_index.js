const fs = require('fs');
const path = 'index.html';
let text = fs.readFileSync(path, 'utf8');
if (!text.includes('modulo-contaduria')) {
  const buttonLine = "        <button class=\"nav-btn\" id=\"btn-contaduria\" onclick=\"openContaduria()\">CONTADURIA</button>\r\n";
  if (!text.includes(buttonLine)) {
    text = text.replace(
      "        <button class=\"nav-btn\" id=\"btn-notif\" onclick=\"switchModulo('modulo-notificaciones')\">NOTIF.<div class=\"dot-notif\" id=\"active-dot\"></div></button>\r\n",
      "        <button class=\"nav-btn\" id=\"btn-notif\" onclick=\"switchModulo('modulo-notificaciones')\">NOTIF.<div class=\"dot-notif\" id=\"active-dot\"></div></button>\r\n" + buttonLine
    );
  }

  const insert = "  <div id=\"modulo-contaduria\" style=\"display:none;\">\r\n" +
    "    <div class=\"branding-container\" style=\"padding-top:0\">\r\n" +
    "      <div class=\"logo-pulse-circle\" style=\"width:60px;height:60px\"><img src=\"https://i.postimg.cc/Xqs2VjT0/image.png\" alt=\"Pilates Pulse\"></div>\r\n" +
    "      <div class=\"brand-text\" style=\"font-size:.9rem\">CONTADURIA</div>\r\n" +
    "    </div>\r\n" +
    "    <div style=\"padding:0 16px 16px\">\r\n" +
    "      <div class=\"contaduria-shell\" style=\"margin-bottom:24px\">\r\n" +
    "        <h3 style=\"letter-spacing: 1px; font-size:.85rem; text-transform:uppercase\">Registro de ingresos</h3>\r\n" +
    "        <label>Nombre</label>\r\n" +
    "        <div style=\"display:flex;gap:8px;flex-wrap:wrap;align-items:center\">\r\n" +
    "          <select id=\"contad-alumno\" style=\"flex:1;min-width:200px\"></select>\r\n" +
    "          <input id=\"contad-alumno-search\" type=\"search\" placeholder=\"Buscar...\" style=\"flex:0 0 150px\">\r\n" +
    "          <button class=\"btn-cancelar\" style=\"flex:0 0 auto\" onclick=\"buscarAlumnoContaduria()\">Buscar</button>\r\n" +
    "          <button class=\"btn-cancelar\" style=\"flex:0 0 auto\" onclick=\"toggleContaduriaManualName()\" title=\"Escribir manualmente\">&#9998;</button>\r\n" +
    "        </div>\r\n" +
    "        <input id=\"contad-alumno-manual\" type=\"text\" placeholder=\"Escribe un nombre\" style=\"display:none;margin-top:8px;\">\r\n\r\n" +
    "        <label style=\"margin-top:16px\">Clase</label>\r\n" +
    "        <select id=\"contad-plan-nivel\" onchange=\"updateContaduriaPlanes()\">\r\n" +
    "          <option>Planes grupales</option>\r\n" +
    "          <option>Planes semiprivados</option>\r\n" +
    "          <option>Planes privados</option>\r\n" +
    "        </select>\r\n\r\n" +
    "        <label style=\"margin-top:16px\">Plan</label>\r\n" +
    "        <div style=\"display:flex;gap:8px;align-items:center\">\r\n" +
    "          <select id=\"contad-plan-item\" onchange=\"updateContaduriaTotal()\" style=\"flex:1\"></select>\r\n" +
    "        </div>\r\n\r\n" +
    "        <label style=\"margin-top:16px\">Total</label>\r\n" +
    "        <div style=\"display:flex;gap:8px;align-items:center\">\r\n" +
    "          <input id=\"contad-total\" type=\"number\" min=\"0\" step=\"0.01\" readonly style=\"flex:1\">\r\n" +
    "          <button class=\"btn-cancelar\" onclick=\"toggleContaduriaTotalEditable()\" title=\"Editar monto\">&#9998;</button>\r\n" +
    "        </div>\r\n\r\n" +
    "        <button class=\"btn-principal\" style=\"margin-top:20px\" onclick=\"registrarIngresoContaduria()\">Registrar ingreso</button>\r\n" +
    "      </div>\r\n\r\n" +
    "      <div class=\"contaduria-shell\" style=\"margin-bottom:24px\">\r\n" +
    "        <h3 style=\"letter-spacing: 1px; font-size:.85rem; text-transform:uppercase\">Precios fijos</h3>\r\n" +
    "        <p>Tatiana: $450 mensuales (quincenas de $225).</p>\r\n" +
    "        <button class=\"btn-cancelar\" onclick=\"registrarPagoTatiana()\">Registrar quincena</button>\r\n" +
    "      </div>\r\n\r\n" +
    "      <div class=\"contaduria-shell\">\r\n" +
    "        <h3 style=\"letter-spacing: 1px; font-size:.85rem; text-transform:uppercase\">Retirar pago</h3>\r\n" +
    "        <label>Persona</label>\r\n" +
    "        <select id=\"contad-persona-variable\">\r\n" +
    "          <option>Isabel</option>\r\n" +
    "          <option>Dalia</option>\r\n" +
    "        </select>\r\n" +
    "        <div style=\"display:flex;gap:8px;flex-wrap:wrap;margin-top:8px\">\r\n" +
    "          <label style=\"flex:1\">Inicio <input type=\"date\" id=\"contad-variable-inicio\"></label>\r\n" +
    "          <label style=\"flex:1\">Fin <input type=\"date\" id=\"contad-variable-fin\"></label>\r\n" +
    "        </div>\r\n" +
    "        <button class=\"btn-principal\" style=\"margin-top:12px\" onclick=\"retirarPagoVariable()\">Retirar pago</button>\r\n" +
    "        <div id=\"contad-variable-result\" style=\"margin-top:10px; font-size:.75rem; opacity:.75\"></div>\r\n" +
    "      </div>\r\n\r\n" +
    "      <button class=\"back-btn\" style=\"margin-top:16px\" onclick=\"switchModulo('modulo-agenda')\">Volver</button>\r\n" +
    "    </div>\r\n" +
    "  </div>\r\n";

  const anchor = "  <script src=\"app.js\"></script>\r\n</body>\r\n</html>";
  if (!text.includes(anchor)) throw new Error('anchor not found');
  text = text.replace(anchor, insert + anchor);
  fs.writeFileSync(path, text, 'utf8');
}
