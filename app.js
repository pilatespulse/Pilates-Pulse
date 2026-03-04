const _sp=supabase.createClient("https://iodtfnclwwgcczxgbmbq.supabase.co","sb_publishable_uOUPFEp0T_uX85fjqi9xog_6WUS6dKg");
    const DIAS=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
    const CLASES=["Align Flow","Power Flow","Stretch&Release","Aerial Balance","Mega Core","Life Align"];
    const MODALIDADES=["Grupales","Privadas","Masajes","Cumpleaños"];
    const FRECUENCIAS=["1/semana","2/semana","3/semana"];
    const WS_ICON_URL="https://i.postimg.cc/9M0NRgcD/Whats-App-svg.webp";
    const CELDA_DB="DB_ENTRY",CELDA_SOLICITUD="SOLICITUD_WEB";
    const DEFAULT_COUNTRY='';
    let CACHE_ALUMNOS=[],CACHE_HORARIOS=[],CACHE_SOLICITUDES=[];

    function classColor(){return 'var(--celeste)';}
    function sanitizeTel(t){if(!t)return '';let s=(''+t).replace(/\D/g,'').replace(/^00+/,'').replace(/^0+/,'');if(DEFAULT_COUNTRY&&s&&!s.startsWith(DEFAULT_COUNTRY)&&s.length<=9)s=DEFAULT_COUNTRY+s;return s;}
    function a24h(h){if(!h)return 0;let[t,ap]=h.split(' ');let[hh,mm]=t.split(':').map(Number);if(ap==="PM"&&hh<12)hh+=12;if(ap==="AM"&&hh===12)hh=0;return hh*60+mm;}

    window.onload=()=>{initBokeh();localStorage.getItem('studio_auth')?startApp():openLanding();};
    function hidePublicScreens(){['landing-section','agenda-publica-section','login-section','app-content'].forEach(id=>document.getElementById(id).style.display='none');}
    function openLanding(){hidePublicScreens();document.getElementById('landing-section').style.display='flex';}
    function openLogin(){hidePublicScreens();document.getElementById('login-section').style.display='flex';}
    function openAgendaPublica(){hidePublicScreens();document.getElementById('agenda-publica-section').style.display='flex';}

    function initBokeh(){const c=document.querySelector('.bokeh-container');for(let i=0;i<15;i++){const b=document.createElement('div');b.className='bokeh';const s=Math.random()*150+50;b.style.width=`${s}px`;b.style.height=`${s}px`;b.style.left=`${Math.random()*100}%`;b.style.top=`${Math.random()*100+10}%`;b.style.animationDuration=`${Math.random()*20+15}s`;b.style.animationDelay=`${Math.random()*10}s`;c.appendChild(b);}}

    async function enviarSolicitudAgenda(){
      const nombre=document.getElementById('ag-nombre').value.trim();
      const telefono=document.getElementById('ag-telefono').value.trim();
      const edad=document.getElementById('ag-edad').value.trim();
      const razon=document.getElementById('ag-razon').value.trim();
      const salud=document.getElementById('ag-salud').value.trim();
      if(!nombre||!telefono||!edad||!razon||!salud){alert('Completa todos los campos para enviar tu solicitud.');return;}
      const payload=`REQ|${nombre}|${telefono}|${edad}|${razon}|${salud}|${new Date().toISOString()}`;
      const {error}=await _sp.from('horarios').insert([{celda_id:CELDA_SOLICITUD,contenido:payload}]);
      if(error){alert('No se pudo enviar la solicitud. Intenta nuevamente.');return;}
      alert('Solicitud enviada. Te contactaremos pronto.');
      ['ag-nombre','ag-telefono','ag-edad','ag-razon','ag-salud'].forEach(id=>document.getElementById(id).value='');
      openLanding();
    }

    async function handleLogin(){
      const u=document.getElementById('adminUser').value,p=document.getElementById('adminPass').value;
      const {data}=await _sp.from('usuarios_admin').select('*').eq('usuario',u).eq('password',p).maybeSingle();
      if(data){localStorage.setItem('studio_auth','true');startApp();} else alert("Acceso denegado");
    }
    function handleLogout(){localStorage.removeItem('studio_auth');location.reload();}
    function startApp(){hidePublicScreens();document.getElementById('app-content').style.display='block';renderEstructura();updateAll();}

    function generarHoras(selected=""){let r="";for(let i=7;i<=21;i++){let h=i>12?i-12:i,ampm=i>=12?"PM":"AM";let t1=`${h}:00 ${ampm}`,t2=`${h}:30 ${ampm}`;r+=`<option ${selected==t1?'selected':''}>${t1}</option><option ${selected==t2?'selected':''}>${t2}</option>`;}return r;}
    function toggleDia(d){const el=document.getElementById(`cont-${d}`),vis=el.style.display==='block';document.querySelectorAll('.dia-content').forEach(c=>c.style.display='none');el.style.display=vis?'none':'block';}

    function renderEstructura(){
      document.getElementById('listaDias').innerHTML=DIAS.map(d=>`
        <div class="dia-item">
          <div class="dia-header" onclick="toggleDia('${d}')"><span style="font-weight:900;font-size:.75rem;letter-spacing:1px">${d.toUpperCase()}</span><span id="badge-${d}" style="font-size:.5rem;opacity:.5;font-weight:800;background:rgba(255,255,255,.1);padding:4px 8px;border-radius:8px">0</span></div>
          <div class="dia-content" id="cont-${d}" style="display:none;padding:0 20px 20px"><div id="clase-form-${d}"></div><button class="btn-principal" id="btn-add-${d}" style="font-size:.55rem;background:#1a1a1c;color:#fff;padding:12px;letter-spacing:1px" onclick="addClasePopup('${d}')">+ CLASE</button><div id="clases-${d}" style="margin-top:15px;"></div></div>
        </div>`).join('');
    }

    function addClasePopup(dia,editId=null,existingData=null){
      const p=existingData?existingData.split('|'):['','','',''];
      const isCrono=document.getElementById('modulo-cronograma').style.display==='block';
      const targetDiv=editId?(isCrono?'edit-form-crono':`clase-form-${dia}`):`clase-form-${dia}`;
      document.getElementById(targetDiv).innerHTML=`
      <div style="background:#000;padding:15px;border-radius:20px;margin-bottom:15px;border:1px solid #222;">
        <label>HORA</label><select id="h-${dia}">${generarHoras(p[0])}</select>
        <label>TIPO DE CLASE</label><select id="t-${dia}">${CLASES.map(c=>`<option ${p[1]==c?'selected':''}>${c}</option>`).join('')}</select>
        <label>MODALIDAD</label><select id="m-${dia}">${MODALIDADES.map(m=>`<option ${p[2]==m?'selected':''}>${m}</option>`).join('')}</select>
        <label>ALUMNO(S) - (Separar por coma)</label><input type="text" id="n-${dia}" value="${p[3]}">
        <button class="btn-principal" style="padding:12px;font-size:.6rem;letter-spacing:1px" onclick="pushClase('${dia}','${editId}')">GUARDAR</button>
        ${editId?`<button class="btn-cancelar" style="background:var(--danger);color:#fff;padding:10px;font-size:.5rem;border:none" onclick="borrar('${editId}')">ELIMINAR</button>`:''}
        <button class="btn-cancelar" style="padding:10px;font-size:.5rem" onclick="document.getElementById('${targetDiv}').innerHTML=''">CANCELAR</button>
      </div>`;
      if(editId)window.scrollTo({top:0,behavior:'smooth'});
    }

    function formatAlumnosAgenda(texto,horaClase,tipoClase){
      if(!texto)return '';
      return texto.split(',').map(nombreRaw=>{
        const nombreLimpio=nombreRaw.trim();
        const alumnoDB=CACHE_ALUMNOS.find(a=>a.contenido.split('|')[1].toLowerCase()===nombreLimpio.toLowerCase());
        let linkWs='';
        if(alumnoDB){const telLimpio=sanitizeTel(alumnoDB.contenido.split('|')[2]||'');if(telLimpio.length>=8){const msg=encodeURIComponent(`Buenas tardes ${nombreLimpio}!!\nTienes una reservación para recibir tu clase de ${tipoClase}\nHorario: ${horaClase}\nPor favor, confirmar asistencia.\nPilates Pulse.\n¡Te esperamos!`);linkWs=`<a href="https://wa.me/${telLimpio}?text=${msg}" target="_blank"><img src="${WS_ICON_URL}" class="ws-agenda-icon"></a>`;}}
        return `<div style="margin-bottom:6px;display:flex;align-items:center"><span>• ${nombreLimpio}</span>${linkWs}</div>`;
      }).join('');
    }

    async function pushClase(dia,editId="null"){
      const content=`${document.getElementById('h-'+dia).value}|${document.getElementById('t-'+dia).value}|${document.getElementById('m-'+dia).value}|${document.getElementById('n-'+dia).value}`;
      if(editId!=="null") await _sp.from('horarios').update({contenido:content}).eq('id',editId);
      else await _sp.from('horarios').insert([{celda_id:dia,contenido:content}]);
      document.getElementById('edit-form-crono').innerHTML='';
      document.getElementById(`clase-form-${dia}`).innerHTML='';
      updateAll();
    }

    async function updateAll(){
      const {data}=await _sp.from('horarios').select('*');
      const rows=data||[];
      CACHE_ALUMNOS=rows.filter(x=>x.celda_id===CELDA_DB);
      CACHE_SOLICITUDES=rows.filter(x=>x.celda_id===CELDA_SOLICITUD);
      CACHE_HORARIOS=rows.filter(x=>x.celda_id!==CELDA_DB&&x.celda_id!==CELDA_SOLICITUD).sort((a,b)=>a24h(a.contenido.split('|')[0])-a24h(b.contenido.split('|')[0]));

      DIAS.forEach(d=>{
        const filtrados=CACHE_HORARIOS.filter(x=>x.celda_id===d);
        document.getElementById(`badge-${d}`).innerText=filtrados.length;
        document.getElementById(`clases-${d}`).innerHTML=filtrados.map(i=>{
          const p=i.contenido.split('|');
          return `<div class="clase-box" style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:.75rem;line-height:1.4"><b>${p[0]}</b> — <span style="color:${classColor(p[1])};font-weight:800">${p[1]}</span><br><small style="opacity:.6">${p[2]}</small><br><div style="margin-top:8px">${formatAlumnosAgenda(p[3],p[0],p[1])}</div></span><div style="display:flex;gap:10px;align-items:center"><span onclick="addClasePopup('${d}','${i.id}','${i.contenido}')" style="cursor:pointer;font-size:.8rem;opacity:.5">??</span><span onclick="borrar('${i.id}')" style="opacity:.2;cursor:pointer;font-weight:900">×</span></div></div>`;
        }).join('');
      });
      renderAlumnosList(CACHE_ALUMNOS);processVencimientos();renderCronograma();renderSolicitudes();
    }
    function renderSolicitudes(){
      const cont=document.getElementById('lista-solicitudes');
      if(!CACHE_SOLICITUDES.length){cont.innerHTML=`<p style="text-align:center;opacity:.3;font-size:.7rem;font-style:italic;margin-top:30px">No hay solicitudes aún.</p>`;return;}
      cont.innerHTML=CACHE_SOLICITUDES.slice().sort((a,b)=>new Date((b.contenido.split('|')[6]||'')).getTime()-new Date((a.contenido.split('|')[6]||'')).getTime()).map(s=>{
        const p=s.contenido.split('|'),nombre=p[1]||'Sin nombre',telRaw=p[2]||'',edad=p[3]||'',razon=p[4]||'',salud=p[5]||'',fecha=p[6]?new Date(p[6]).toLocaleString('es-MX'):'Sin fecha',telSan=sanitizeTel(telRaw);
        const ws=telSan.length>=8?`<a class="ws-wrapper" target="_blank" href="https://wa.me/${telSan}"><img src="${WS_ICON_URL}" class="ws-icon"><span class="ws-number">${telRaw}</span></a>`:`<span class="ws-wrapper"><img src="${WS_ICON_URL}" class="ws-icon"><span class="ws-number">${telRaw}</span></span>`;
        return `<div class="clase-box"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><b style="font-size:.85rem">${nombre}</b><br><small style="opacity:.6">Edad: ${edad}</small><br>${ws}</div><small style="opacity:.45;font-size:.62rem;text-align:right">${fecha}</small></div><div style="margin-top:12px;font-size:.75rem;line-height:1.5"><b style="color:var(--celeste)">Razón:</b> ${razon}<br><b style="color:var(--celeste)">Salud:</b> ${salud}</div><button style="margin-top:12px;background:transparent;border:none;color:var(--danger);font-size:.58rem;font-weight:900;cursor:pointer" onclick="borrar('${s.id}')">BORRAR SOLICITUD</button></div>`;
      }).join('');
    }

    function renderCronograma(){
      const container=document.getElementById('render-cronograma');
      container.innerHTML=DIAS.map(dia=>{const clasesDelDia=CACHE_HORARIOS.filter(x=>x.celda_id===dia);return `<div class="crono-row"><div class="crono-dia-label">${dia}</div><div class="crono-list">${clasesDelDia.length>0?clasesDelDia.map(c=>{const p=c.contenido.split('|');return `<div class="crono-task"><div class="crono-task-main"><div style="display:flex;align-items:center;cursor:pointer" onclick="toggleCronoDetail('${c.id}')"><div class="crono-bullet"></div><b>${p[0]}</b>&nbsp;—&nbsp;<span style="color:${classColor(p[1])};font-weight:800">${p[1]}</span></div><span style="cursor:pointer;font-size:1rem;padding:5px;opacity:.7" onclick="addClasePopup('${dia}','${c.id}','${c.contenido}')">??</span></div><div id="crono-detail-${c.id}" class="crono-detail-box"><b style="color:var(--celeste)">ALUMNOS:</b><br><div style="margin-top:5px;color:#fff">${p[3].split(',').map(n=>`• ${n.trim()}`).join('<br>')}</div><div style="margin-top:8px;opacity:.6"><b>MODALIDAD:</b> ${p[2]}</div></div></div>`;}).join(''):'<div style="opacity:.2;font-size:.7rem;margin-left:18px;font-style:italic">Sin clases</div>'}</div></div>`;}).join('');
    }
    function toggleCronoDetail(id){const el=document.getElementById(`crono-detail-${id}`),v=el.style.display==='block';document.querySelectorAll('.crono-detail-box').forEach(b=>b.style.display='none');el.style.display=v?'none':'block';}
    function checkVencimiento(f){if(!f)return false;const h=new Date(),v=new Date(f+"T23:59:59");return (v-h)/(1000*60*60)<=48;}

    function renderAlumnosList(lista){
      document.getElementById('render-alumnos').innerHTML=lista.map(a=>{
        const p=a.contenido.split('|'),estaVencido=checkVencimiento(p[10]),telSan=sanitizeTel(p[2]||''),hasTel=telSan&&telSan.length>=8;
        return `<div class="clase-box"><b style="font-size:.85rem" class="${estaVencido?'vence-alerta':''}">${p[1]||'SIN NOMBRE'}</b><br>${hasTel?`<a href="https://wa.me/${telSan}" target="_blank" class="ws-wrapper"><img src="${WS_ICON_URL}" class="ws-icon"><span class="ws-number">${p[2]}</span></a>`:`<span class="ws-wrapper"><img src="${WS_ICON_URL}" class="ws-icon"><span class="ws-number">${p[2]}</span></span>`}<br><small style="opacity:.5"><span style="color:${classColor(p[3])};font-weight:800">${p[3]}</span> — ${p[4]}</small><div id="extra-${a.id}" class="ficha-detalles"><p><b>EDAD:</b> ${p[11]} años</p><p><b>TELÉFONO:</b> ${p[2]}</p><p><b>MODALIDAD:</b> ${p[5]}</p><p><b>VENCIMIENTO:</b> <span class="${estaVencido?'vence-alerta':''}">${p[10]||'N/A'}</span></p><hr style="opacity:.1;margin:10px 0"><p><b>SALUD:</b> ${p[6]||'Ninguna'}</p><p><b>VISITA:</b> ${p[7]||'N/A'}</p><p><b>ORIGEN:</b> ${p[8]||'N/A'}</p><p><b>REFERIDO:</b> ${p[9]}</p><button class="btn-principal" style="padding:10px;font-size:.55rem;margin-top:15px;letter-spacing:1px" onclick="abrirFormNuevoAlumno('${a.id}','${a.contenido}')">EDITAR</button></div><div style="margin-top:15px;display:flex;gap:10px;justify-content:space-between;align-items:center"><button class="nav-btn" style="padding:10px 20px;font-size:.5rem;background:#1a1a1c;border-color:#333;letter-spacing:1px" onclick="toggleExtra('${a.id}')">DETALLES</button><button style="background:transparent;border:none;color:var(--danger);font-size:.55rem;font-weight:900;cursor:pointer;opacity:.8" onclick="borrar('${a.id}')">BORRAR</button></div></div>`;
      }).join('');
    }

    function processVencimientos(){
      const listaNotif=document.getElementById('lista-notificaciones');
      const alertas=CACHE_ALUMNOS.filter(a=>checkVencimiento(a.contenido.split('|')[10]));
      document.getElementById('active-dot').style.display=alertas.length>0?'block':'none';
      listaNotif.innerHTML=alertas.length===0?`<p style="text-align:center;opacity:.3;font-size:.7rem;font-style:italic;margin-top:30px">No hay vencimientos próximos.</p>`:alertas.map(a=>{const p=a.contenido.split('|');return `<div class="clase-box" style="border-left:4px solid var(--danger)"><b style="color:var(--danger)">${p[1]}</b><br><small>Vence: <b>${p[10]}</b></small></div>`}).join('');
    }

    function filtrarAlumnos(){const q=document.getElementById('buscadorAlumnos').value.toLowerCase();renderAlumnosList(CACHE_ALUMNOS.filter(a=>a.contenido.split('|')[1].toLowerCase().includes(q)));}
    function toggleExtra(id){const el=document.getElementById(`extra-${id}`);el.style.display=el.style.display==='block'?'none':'block';}

    function abrirFormNuevoAlumno(editId=null,existingData=null){
      const p=existingData?existingData.split('|'):Array(12).fill('');let edades="";for(let i=1;i<=100;i++)edades+=`<option value="${i}">${i}</option>`;
      document.getElementById('btn-abrir-registro').style.display='none';
      document.getElementById('form-alumno-nuevo').innerHTML=`<div style="background:#111;padding:20px;border-radius:30px;border:1px solid #222;margin-bottom:20px"><label>Nombre</label><input type="text" id="db-nom" value="${p[1]}"><label>Edad</label><select id="db-edad">${edades}</select><label>Teléfono (formato internacional ej: 549...)</label><input type="text" id="db-tel" value="${p[2]}"><label>Clase</label><select id="db-clase">${CLASES.map(c=>`<option ${p[3]==c?'selected':''}>${c}</option>`).join('')}</select><label>Frecuencia</label><select id="db-frec">${FRECUENCIAS.map(f=>`<option ${p[4]==f?'selected':''}>${f}</option>`).join('')}</select><label>Modalidad</label><select id="db-mod">${MODALIDADES.map(m=>`<option ${p[5]==m?'selected':''}>${m}</option>`).join('')}</select><label>Vencimiento</label><input type="date" id="db-vence" value="${p[10]}"><label>Salud</label><textarea id="db-salud" rows="2">${p[6]}</textarea><label>Visita</label><textarea id="db-visita" rows="2">${p[7]}</textarea><label>Origen</label><textarea id="db-fuente" rows="2">${p[8]}</textarea><label>Referido</label><select id="db-ref"><option ${p[9]=='No'?'selected':''}>No</option><option ${p[9]=='Si'?'selected':''}>Si</option></select><button class="btn-principal" style="letter-spacing:1px" onclick="saveAlumno('${editId}')">GUARDAR</button><button class="btn-cancelar" onclick="cerrarFormAlumno()">CANCELAR</button></div>`;
      if(editId)document.getElementById('db-edad').value=p[11];
    }

    async function saveAlumno(editId="null"){const d=id=>document.getElementById(id).value;const content=`DB|${d('db-nom')}|${d('db-tel')}|${d('db-clase')}|${d('db-frec')}|${d('db-mod')}|${d('db-salud')}|${d('db-visita')}|${d('db-fuente')}|${d('db-ref')}|${d('db-vence')}|${d('db-edad')}`;if(editId!=="null")await _sp.from('horarios').update({contenido:content}).eq('id',editId);else await _sp.from('horarios').insert([{celda_id:CELDA_DB,contenido:content}]);cerrarFormAlumno();updateAll();}
    function cerrarFormAlumno(){document.getElementById('form-alumno-nuevo').innerHTML='';document.getElementById('btn-abrir-registro').style.display='block';}

    function switchModulo(id){
      const modules=['modulo-agenda','modulo-cronograma','modulo-alumnos','modulo-solicitudes','modulo-notificaciones'];
      const btnMap={'modulo-agenda':'btn-agenda','modulo-cronograma':'btn-crono','modulo-alumnos':'btn-db','modulo-solicitudes':'btn-solicitudes','modulo-notificaciones':'btn-notif'};
      modules.forEach(m=>document.getElementById(m).style.display='none');document.getElementById(id).style.display='block';
      document.getElementById('main-brand').style.display=id==='modulo-cronograma'?'none':'flex';
      Object.values(btnMap).forEach(bid=>document.getElementById(bid).classList.remove('active-btn'));
      document.getElementById(btnMap[id]).classList.add('active-btn');
      if(id==='modulo-cronograma')document.getElementById('edit-form-crono').innerHTML='';
    }

    async function borrar(id){if(confirm("¿Borrar definitivamente?")){await _sp.from('horarios').delete().eq('id',id);document.getElementById('edit-form-crono').innerHTML='';updateAll();}}
