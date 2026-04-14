const _sp=supabase.createClient("https://iodtfnclwwgcczxgbmbq.supabase.co","sb_publishable_uOUPFEp0T_uX85fjqi9xog_6WUS6dKg");
    const DIAS=["Lunes","Martes","Mi\u00E9rcoles","Jueves","Viernes","S\u00E1bado"];
    const CLASES=["Align Flow","Power Flow","Stretch&Release","Aerial Balance","Mega Core","Full Body","Life Align","Reiki","Masaje","Rebozo","Corredores","Padelistas","Reunión Interna"];
    const AGENDA_INTERNAL_MEETING_TYPE='Reunión Interna';
    const MODALIDADES=["Grupales","Privadas","Masajes","Cumplea\u00F1os"];
    const FRECUENCIAS=["1/semana","2/semana","3/semana"];
    const CONTADURIA_PLANES={
      'Planes grupales':[
        {name:'PULSE INTRO', price:48},
        {name:'PULSE BALANCE', price:88},
        {name:'PULSE FLOW', price:120}
      ],
      'Planes semiprivados':[
        {name:'PULSE DUO', price:72},
        {name:'PULSE HARMONIC', price:136},
        {name:'PULSE SYNERGY', price:192}
      ],
      'Planes privados':[
        {name:'PULSE FOCUS', price:96},
        {name:'PULSE ELEVATE', price:184},
        {name:'PULSE ESSENCE', price:264}
      ]
    };
    const CONTADURIA_FIXED_LEVEL_PRICES={
      'privada suelta':30,
      'grupal suelta':15,
      'semiprivada suelta':20,
      'terapia':40,
      'masaje':40,
      'reiki':40,
      'corredores':12,
      'padelistas':12
    };
    const CONTADURIA_BIRTHDAY_TYPES=[
      {name:'Birthday Fit', price:19},
      {name:'Birthday Glow', price:23},
      {name:'Birthday Pulse', price:25}
    ];
    const CONTADURIA_INGRESO_LEVELS=[
      'Planes grupales',
      'Planes semiprivados',
      'Planes privados',
      'Privada suelta',
      'Grupal suelta',
      'Semiprivada suelta',
      'Terapia',
      'Masaje',
      'Reiki',
      'Corredores',
      'Padelistas',
      'Cumpleaños'
    ];
    const CONTADURIA_PAYMENT_METHODS=['pago_movil','zelle','paypal','efectivo','binance','usdt'];
    const CONTADURIA_PAYMENT_LABELS={
      pago_movil:'Pago movil',
      zelle:'Zelle',
      paypal:'PayPal',
      efectivo:'Efectivo',
      binance:'Binance',
      usdt:'USDT',
      sin_metodo:'Sin metodo'
    };
    const CONTADURIA_TABLE='contabilidad_movimientos';
    const WS_ICON_URL="https://i.postimg.cc/9M0NRgcD/Whats-App-svg.webp";
    const CELDA_DB="DB_ENTRY",CELDA_SOLICITUD="SOLICITUD_WEB",CELDA_RESET_META="SYS_WEEK_RESET",CELDA_NOTIF_STATE="SYS_NOTIF_STATE";
    const DEFAULT_COUNTRY='52'; // Mexico country code to make WhatsApp links valid on mobile
    const SOL_SEEN_KEY='sol_seen_count';
    const WEEK_ACTIVE_KEY='week_active_key';
    const BIRTHDAY_INTERVAL_MS=30*60*1000;
    const BIRTHDAY_LAST_SHOWN_KEY='birthday_last_shown_at';
    const WEEK_TRASH_PREFIX='WEEK_TRASH|';
    const WEEK_TRASH_WINDOW_MS=2*60*60*1000;
    let CACHE_ALUMNOS=[],CACHE_HORARIOS=[],CACHE_SOLICITUDES=[];
    let CACHE_CONTADURIA_NAMES=[];
    let ACTIVE_WEEK_KEY='';
    let CLOCK_TIMER=null;
    let LAST_MIN_MARK='';
    let LAST_CAL_KEY='';
    let CACHE_ALUMNOS_IDX={};
    let CACHE_HORARIOS_BY_DIA={};
    let AGENDA_DATA_VERSION=0;
    let BIRTHDAY_TIMER=null;
    const BIRTHDAY_DISMISSED=new Set();
    const NOTIF_DISMISSED=new Set();
    const BIRTHDAY_HANDLED_BY_DAY={};
    let NOTIF_STATE_ROW_ID=null;
    let BIRTHDAY_PROMPT_TIMER=null;
    let BIRTHDAY_FIREWORKS_CTRL=null;
    let CURRENT_NOTIF_SIGNATURE='';
    let VENC_COUNTDOWN_TIMER=null;
    const VENC_WEEK_TOAST_SHOWN=new Set();
    let LAST_SEEN_NOTIF_SIGNATURE='';
    let WEEK_TRASH_CACHE={};

    function classColor(){return 'var(--access-accent-deep, #7f6148)';}
    function isAgendaInternalMeetingType(value){
      return normalizeText(value).toLowerCase()===normalizeText(AGENDA_INTERNAL_MEETING_TYPE).toLowerCase();
    }
    function updateAgendaAlumnoField(dia){
      const typeSelect=document.getElementById(`t-${dia}`);
      const alumnosLabel=document.getElementById(`agenda-n-label-${dia}`);
      const alumnosInput=document.getElementById(`n-${dia}`);
      if(!typeSelect||!alumnosLabel||!alumnosInput) return;
      const isInternal=isAgendaInternalMeetingType(typeSelect.value);
      alumnosLabel.textContent=isInternal?'INVITADO(S) - (Separar por coma)':'ALUMNO(S) - (Separar por coma)';
      alumnosInput.placeholder=isInternal?'Escribe invitado(s)':'Escribe alumno(s)';
    }
    function sanitizeTel(t){
      if(!t)return '';
      let s=(''+t).replace(/\D/g,'').replace(/^00+/,'').replace(/^0+/,'');
      // if number looks local, prepend country code so wa.me works on mobile
      if(DEFAULT_COUNTRY&&s&&!s.startsWith(DEFAULT_COUNTRY)&&s.length<=10)s=DEFAULT_COUNTRY+s;
      return s;
    }
    function normalizeTelForWhatsapp(t){return sanitizeTel(t);}
    function decodeHtmlEntities(txt){const el=document.createElement('textarea');el.innerHTML=txt||'';return el.value||'';}
        function normalizeText(v){
      let s=(v==null?'':String(v));
      const pairs=[
        ['\u00C3\u00A1','\u00E1'],['\u00C3\u00A9','\u00E9'],['\u00C3\u00AD','\u00ED'],['\u00C3\u00B3','\u00F3'],['\u00C3\u00BA','\u00FA'],
        ['\u00C3\u00B1','\u00F1'],['\u00C3\u2018','\u00D1'],['\u00C3\u0081','\u00C1'],['\u00C3\u0089','\u00C9'],['\u00C3\u008D','\u00CD'],
        ['\u00C3\u0093','\u00D3'],['\u00C3\u009A','\u00DA'],['\u00C2\u00BF','\u00BF'],['\u00C2\u00A1','\u00A1'],
        ['\u00E2\u20AC\u201D','\u2014'],['\u00E2\u20AC\u201C','\u2013'],['\u00E2\u20AC\u0153','\u201C'],['\u00E2\u20AC\u009D','\u201D'],
        ['\u00E2\u20AC\u02DC','\u2018'],['\u00E2\u20AC\u2122','\u2019'],['\u00E2\u20AC\u00A6','\u2026'],['\u00C2\u00B7','\u2022']
      ];
      const decodeLatin1Utf8=(text)=>{
        try{
          const bytes=new Uint8Array(Array.from(text,ch=>ch.charCodeAt(0)&255));
          return new TextDecoder('utf-8').decode(bytes);
        }catch(_){
          return text;
        }
      };
      for(const p of pairs){ s=s.split(p[0]).join(p[1]); }
      for(let i=0;i<3;i++){
        if(!/[ÃÂâ]/.test(s)) break;
        const decoded=decodeLatin1Utf8(s);
        if(!decoded||decoded===s) break;
        s=decoded;
        for(const p of pairs){ s=s.split(p[0]).join(p[1]); }
      }
      s=s.replace(/\u00C2(?=[^\w]|$)/g,'');
      s=s.replace(/Â(?=[^\w]|$)/g,'');
      return s;
    }
    function cleanField(v,maxLen=120){
      return normalizeText(v).replace(/[<>`]/g,'').trim().slice(0,maxLen);
    }
    function normalizeDomText(root){
      const base=root||document.body;
      if(!base) return;
      const walker=document.createTreeWalker(base, NodeFilter.SHOW_TEXT);
      let n;
      while((n=walker.nextNode())){
        const fixed=normalizeText(n.nodeValue||'');
        if(fixed!==n.nodeValue) n.nodeValue=fixed;
      }
    }
    function a24h(h){if(!h)return 0;let[t,ap]=h.split(' ');let[hh,mm]=t.split(':').map(Number);if(ap==="PM"&&hh<12)hh+=12;if(ap==="AM"&&hh===12)hh=0;return hh*60+mm;}

    const APP_CHROME_THEMES={
      landing:{
        fill:'#060606',
        bg:'radial-gradient(900px 500px at 80% 8%, rgba(255,255,255,.06), transparent 65%), radial-gradient(700px 420px at 10% 95%, rgba(255,255,255,.04), transparent 65%), #060606'
      },
      public:{
        fill:'#c7beb3',
        bg:'radial-gradient(800px 420px at 12% 10%, rgba(214,204,193,.42), transparent 60%), radial-gradient(720px 420px at 88% 16%, rgba(171,155,139,.28), transparent 62%), linear-gradient(180deg, #c7beb3 0%, #b8ac9e 100%)'
      },
      app:{
        fill:'#c4b9ad',
        bg:'radial-gradient(900px 520px at 0% 0%, rgba(213,203,192,.42), transparent 58%), radial-gradient(760px 480px at 100% 0%, rgba(169,153,137,.28), transparent 62%), linear-gradient(180deg, #c4b9ad 0%, #b3a698 100%)'
      }
    };
    function setAppChromeTheme(mode){
      const theme=APP_CHROME_THEMES[mode]||APP_CHROME_THEMES.landing;
      document.documentElement.style.setProperty('--app-chrome-bg',theme.bg);
      document.documentElement.style.setProperty('--app-chrome-fill',theme.fill);
      const themeMeta=document.querySelector('meta[name="theme-color"]');
      if(themeMeta) themeMeta.setAttribute('content',theme.fill);
    }

    window.onload=async()=>{
      initBokeh();
      bindLandingScrollState();
      const { data:{ session } } = await _sp.auth.getSession();
      setAppChromeTheme(session?'app':'landing');
      session ? startApp() : openLanding();
    };
    function hidePublicScreens(){['landing-section','agenda-publica-section','login-section','app-content'].forEach(id=>document.getElementById(id).style.display='none');}
    function openLanding(){hidePublicScreens();setAppChromeTheme('landing');const landing=document.getElementById('landing-section');landing.style.display='flex';landing.classList.remove('about-open');landing.scrollTop=0;}
    function openLogin(){hidePublicScreens();setAppChromeTheme('public');document.getElementById('login-section').style.display='flex';}
    function openAgendaPublica(){hidePublicScreens();setAppChromeTheme('public');document.getElementById('agenda-publica-section').style.display='flex';}
    function bindLandingScrollState(){
      const landing=document.getElementById('landing-section');
      if(!landing||landing.dataset.aboutBound==='1') return;
      landing.dataset.aboutBound='1';
      landing.addEventListener('scroll',()=>{
        landing.classList.toggle('about-open',landing.scrollTop>120);
      },{passive:true});
    }
    function smoothScrollContainer(el,targetTop,duration=1000){
      const start=el.scrollTop;
      const end=Math.max(0,targetTop);
      const delta=end-start;
      if(Math.abs(delta)<2) return;
      const t0=performance.now();
      const ease=t=>t<0.5?16*t*t*t*t*t:1-Math.pow(-2*t+2,5)/2;
      const step=now=>{
        const p=Math.min(1,(now-t0)/duration);
        el.scrollTop=start+delta*ease(p);
        if(p<1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    function openAboutSection(){
      const landing=document.getElementById('landing-section');
      const target=document.getElementById('about-us-section');
      if(!landing||!target) return;
      if(getComputedStyle(landing).display==='none') openLanding();
      landing.classList.add('about-open');
      const top=target.offsetTop-14;
      setTimeout(()=>smoothScrollContainer(landing,top,1450),35);
    }
    function ensureModalRoot(){
      let root=document.getElementById('app-modal-root');
      if(root) return root;
      root=document.createElement('div');
      root.id='app-modal-root';
      document.body.appendChild(root);
      normalizeDomText(root);
      return root;
    }
    function openModal(title,bodyHtml){
      const root=ensureModalRoot();
      root.innerHTML=`
      <div class="app-modal-backdrop" onclick="if(event.target===this)closeModal()">
        <div class="app-modal-panel" role="dialog" aria-modal="true" aria-label="${title}">
          <button class="app-modal-close" onclick="closeModal()">&times;</button>
          <div class="app-modal-title">${title}</div>
          <div class="app-modal-body">${bodyHtml}</div>
        </div>
      </div>`;
      document.body.classList.add('modal-open');
    }
    function setDatabaseFormUiHidden(hidden){
      const footer=document.querySelector('#app-content .footer-nav');
      if(!footer) return;
      if(hidden) footer.style.setProperty('display','none','important');
      else footer.style.removeProperty('display');
    }
    function closeModal(){
      const root=document.getElementById('app-modal-root');
      const modalType=root?.dataset.modalType||'';
      if(modalType==='db-form') setDatabaseFormUiHidden(false);
      if(root) root.remove();
      document.body.classList.remove('modal-open');
    }

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
      const email=(document.getElementById('adminUser').value||'').trim();
      const password=document.getElementById('adminPass').value||'';
      if(!email||!password){
        alert('Completa correo y password.');
        return;
      }
      const { error } = await _sp.auth.signInWithPassword({ email, password });
      if(error){
        alert(error.message||'Acceso denegado');
        return;
      }
      startApp();
    }
    async function handleLogout(){
      await _sp.auth.signOut();
      location.reload();
    }
    async function startApp(){
      hidePublicScreens();
      setAppChromeTheme('app');
      document.getElementById('app-content').style.display='block';
      const contBtn=document.getElementById('btn-contaduria');
      if(contBtn) contBtn.onclick=openContaduria;
      ACTIVE_WEEK_KEY=localStorage.getItem(WEEK_ACTIVE_KEY)||getWeekStartKey(new Date());
      renderEstructura();
      await ensureWeeklyReset();
      updateWeekIndicators();
      if(CLOCK_TIMER)clearInterval(CLOCK_TIMER);
      CLOCK_TIMER=setInterval(updateWeekIndicators,1000);
      await updateAll();
      switchModulo('modulo-agenda');
      normalizeDomText(document.getElementById('app-content'));
      showBirthdayNotices();
      if(BIRTHDAY_TIMER)clearInterval(BIRTHDAY_TIMER);
      BIRTHDAY_TIMER=setInterval(()=>showBirthdayNotices(),BIRTHDAY_INTERVAL_MS);
    }

    function generarHoras(selected=""){let r="";for(let i=7;i<=21;i++){let h=i>12?i-12:i,ampm=i>=12?"PM":"AM";let t1=`${h}:00 ${ampm}`,t2=`${h}:30 ${ampm}`;r+=`<option ${selected==t1?'selected':''}>${t1}</option><option ${selected==t2?'selected':''}>${t2}</option>`;}return r;}
    function toggleDia(d){const el=document.getElementById(`cont-${d}`),vis=el.style.display==='block';document.querySelectorAll('.dia-content').forEach(c=>c.style.display='none');el.style.display=vis?'none':'block';if(vis){toggleMiniCalendar(false);return;}renderAgendaDay(d);}

    function renderEstructura(){
      document.getElementById('listaDias').innerHTML=`
        <div class="agenda-hero">
          <div class="agenda-hero-main">
            <div class="agenda-hero-topline">
              <div id="current-day-hero" class="agenda-day-hero"></div>
              <button class="btn-cancelar agenda-delete-week-btn" onclick="eliminarSemanaActiva()">ELIMINAR SEMANA</button>
            </div>
            <div id="current-time-hero" class="agenda-time-hero"></div>
          </div>
          <div id="mini-calendar" class="mini-calendar"></div>
        </div>
        <div class="clase-box week-card" style="padding:14px 16px; margin-bottom:14px;">
          <div id="fecha-actual" class="date-main"></div>
          <div class="week-range-row"><div id="week-range" class="date-week"></div><div id="week-status-indicator" class="week-status-indicator" aria-live="polite"></div></div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn-cancelar" style="margin:0; font-size:.56rem; letter-spacing:1px; width:auto; padding:12px 16px;" onclick="goPrevWeek()">VOLVER</button>
            <button class="btn-cancelar" style="margin:0; font-size:.56rem; letter-spacing:1px; width:auto; padding:12px 16px;" onclick="goNextWeek()">SIGUIENTE SEMANA</button>
            <button id="btn-recuperar-semana" class="btn-principal" style="display:none; margin:0; width:auto; padding:12px 16px; font-size:.56rem; letter-spacing:1px;" onclick="recuperarSemanaEliminada()">RECUPERAR SEMANA</button>
          </div>
          <div id="week-trash-note" style="display:none; margin-top:10px; font-size:.62rem; opacity:.68;"></div>
        </div>`+DIAS.map(d=>`
        <div class="dia-item">
          <div class="dia-header" onclick="toggleDia('${d}')"><span style="font-weight:900;font-size:.75rem;letter-spacing:1px">${d.toUpperCase()}</span><span id="badge-${d}" style="font-size:.5rem;opacity:.5;font-weight:800;background:rgba(255,255,255,.1);padding:4px 8px;border-radius:8px">0</span></div>
          <div class="dia-content" id="cont-${d}" style="display:none;padding:0 20px 20px"><div id="clase-form-${d}"></div><button class="btn-principal" id="btn-add-${d}" style="font-size:.55rem;background:#1a1a1c;color:#fff;padding:12px;letter-spacing:1px" onclick="addClasePopup('${d}')">+ CLASE</button><div id="clases-${d}" style="margin-top:15px;"></div></div>
        </div>`).join('');
    }
    function addClasePopup(dia,editId=null,existingData=null){
      const p=existingData?existingData.split('|'):['','','',''];
      const formHtml=`
      <div class="modal-form-shell">
        ${editId?`<button class="btn-cancelar" style="margin:0 0 12px 0;background:#b3261e;color:#fff;padding:12px;font-size:.56rem;border:none;font-weight:900;letter-spacing:1px" onclick="borrar('${editId}')">ELIMINAR CLASE</button>`:''}
        <label>HORA</label><select id="h-${dia}">${generarHoras(p[0])}</select>
        <label>TIPO DE CLASE</label><select id="t-${dia}" onchange="updateAgendaAlumnoField('${dia}')">${CLASES.map(c=>`<option ${p[1]==c?'selected':''}>${c}</option>`).join('')}</select>
        <label>MODALIDAD</label><select id="m-${dia}">${MODALIDADES.map(m=>`<option ${p[2]==m?'selected':''}>${m}</option>`).join('')}</select>
        <label id="agenda-n-label-${dia}">ALUMNO(S) - (Separar por coma)</label><input type="text" id="n-${dia}" value="${p[3]}">
        <button class="btn-principal" style="padding:12px;font-size:.6rem;letter-spacing:1px" onclick="pushClase('${dia}','${editId}')">GUARDAR</button>
        <button class="btn-cancelar" style="padding:10px;font-size:.5rem" onclick="closeModal()">CANCELAR</button>
      </div>`;
      openModal(editId?'Editar clase':'Nueva clase',formHtml);
      updateAgendaAlumnoField(dia);
    }

    async function borrar(id){
      if(!id) return;
      const ok=confirm("\\u00bfEliminar este registro?");
      if(!ok) return;
      const {error}=await _sp.from('horarios').delete().eq('id',id);
      if(error){
        alert('No se pudo eliminar. Intenta nuevamente.');
        return;
      }
      closeModal();
      await updateAll();
    }
            function formatAlumnosAgenda(texto,horaClase,tipoClase){
      if(!texto) return '';
      return texto.split(',').map((nombreRaw,idx)=>{
        const nombreLimpio=normalizeText(nombreRaw).trim();
        if(!nombreLimpio) return '';
        const alumnoDB=CACHE_ALUMNOS_IDX[nombreLimpio.toLowerCase()];
        let linkWs='';
        if(alumnoDB&&alumnoDB.tel){
          const msg=encodeURIComponent(`Buenas tardes ${nombreLimpio}.\nTienes una reservacion para recibir tu clase de ${tipoClase}.\nHorario: ${horaClase}.\nPor favor, confirma tu asistencia.\nPilates Pulse.\nTe esperamos.`);
          linkWs=` <a href="https://wa.me/${alumnoDB.tel}?text=${msg}" target="_blank" rel="noopener"><img src="${WS_ICON_URL}" class="ws-agenda-icon"></a>`;
        }
        return `<div style="margin-bottom:6px;display:flex;align-items:center;gap:8px"><span>${idx+1}- ${nombreLimpio}</span>${linkWs}</div>`;
      }).join('');
    }
function buildAlumnoIndex(){
      const idx={};
      CACHE_ALUMNOS.forEach(a=>{
        const p=a.contenido.split('|').map(normalizeText);
        const name=normalizeText(p[1]||'').trim().toLowerCase();
        if(!name) return;
        const tel=sanitizeTel(p[2]||'');
        idx[name]={ tel: tel&&tel.length>=8?tel:'' };
      });
      CACHE_ALUMNOS_IDX=idx;
    }

    function buildHorariosByDia(){
      const byDia={};
      DIAS.forEach(d=>byDia[d]=[]);
      CACHE_HORARIOS.forEach(item=>{
        if(byDia[item.celda_id]) byDia[item.celda_id].push(item);
      });
      CACHE_HORARIOS_BY_DIA=byDia;
      AGENDA_DATA_VERSION++;
    }

            function renderAgendaDay(dia,force=false){
      const box=document.getElementById(`clases-${dia}`);
      if(!box) return;
      const ver=String(AGENDA_DATA_VERSION);
      if(!force&&box.dataset.ver===ver) return;
      const filtrados=CACHE_HORARIOS_BY_DIA[dia]||[];
      box.innerHTML=filtrados.map(i=>{
        const p=i.contenido.split('|').map(normalizeText);
        const hora=p[0]||'';
        const tipo=p[1]||'';
        const modalidad=p[2]||'';
        const alumnos=formatAlumnosAgenda(p[3]||'',hora,tipo);
        const contenidoSeguro=(i.contenido||'').replace(/'/g,'&#39;');
        return `<div class="clase-box" style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><span style="font-size:.75rem;line-height:1.4;flex:1"><b>${hora}</b> &nbsp;&bull;&nbsp; <span style="color:#417076;font-weight:800">${tipo}</span><br><small style="color:#417076;font-weight:800;letter-spacing:.3px;">${modalidad}</small><div style="margin-top:8px">${alumnos}</div></span><div style="display:flex;gap:10px;align-items:center"><span onclick="addClasePopup('${dia}','${i.id}','${contenidoSeguro}')" style="cursor:pointer;font-size:.9rem;opacity:.72">&#9998;</span><span onclick="borrar('${i.id}')" style="opacity:.35;cursor:pointer;font-weight:900">&#10060;</span></div></div>`;
      }).join('');
      box.dataset.ver=ver;
      normalizeDomText(box);
    }
async function pushClase(dia,editId="null"){
      const content=`${document.getElementById('h-'+dia).value}|${document.getElementById('t-'+dia).value}|${document.getElementById('m-'+dia).value}|${document.getElementById('n-'+dia).value}`;
      if(editId!=="null") await _sp.from('horarios').update({contenido:content}).eq('id',editId);
      else await _sp.from('horarios').insert([{celda_id:weekCeldaId(dia),contenido:content}]);
      closeModal();
      updateAll();
    }

    
    function getWeekStartKey(dateObj = new Date()) {
      const d = new Date(dateObj);
      d.setHours(0,0,0,0);
      const dayMondayBase = (d.getDay() + 6) % 7; // lunes=0 ... domingo=6
      d.setDate(d.getDate() - dayMondayBase);
      return d.toISOString().slice(0,10);
    }

    function addDaysToWeekKey(weekKey, days){
      const d = new Date(weekKey + 'T00:00:00');
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0,10);
    }

    function weekCeldaId(dia, weekKey = ACTIVE_WEEK_KEY){
      return `WEEK|${weekKey}|${dia}`;
    }

    function parseWeekCeldaId(celdaId){
      const m = /^WEEK\|(\d{4}-\d{2}-\d{2})\|(.+)$/.exec(String(celdaId||''));
      if(!m) return null;
      return { week: m[1], dia: m[2] };
    }

    function getWeekTrashCeldaId(weekKey){
      return `${WEEK_TRASH_PREFIX}${weekKey}`;
    }

    function parseWeekTrashRow(row){
      if(!row || !String(row.celda_id||'').startsWith(WEEK_TRASH_PREFIX)) return null;
      try{
        const data=JSON.parse(row.contenido||'{}');
        const weekKey=data.weekKey||String(row.celda_id).slice(WEEK_TRASH_PREFIX.length);
        const expiresMs=new Date(data.expiresAt||0).getTime();
        if(!weekKey || !Array.isArray(data.rows) || !Number.isFinite(expiresMs) || expiresMs<=0) return null;
        return { rowId: row.id, weekKey, rows: data.rows, deletedAt: data.deletedAt||'', expiresAt: data.expiresAt, expiresMs };
      }catch(_){
        return null;
      }
    }

    function getAgendaRowsForWeek(rows, weekKey){
      const currentWeekKey=getWeekStartKey(new Date());
      return (rows||[]).filter(r=>{
        const rawId=String(r.celda_id||'');
        if(DIAS.includes(rawId)) return weekKey===currentWeekKey;
        const parsed=parseWeekCeldaId(rawId);
        return !!(parsed && parsed.week===weekKey && DIAS.includes(parsed.dia));
      });
    }

    function formatRemainingTrashTime(expiresMs){
      const diff=Math.max(0,expiresMs-Date.now());
      const totalMin=Math.ceil(diff/60000);
      const hours=Math.floor(totalMin/60);
      const mins=totalMin%60;
      if(hours<=0) return `${mins} min`;
      return `${hours}h ${String(mins).padStart(2,'0')}m`;
    }

    function updateWeekTrashUI(){
      const btn=document.getElementById('btn-recuperar-semana');
      const note=document.getElementById('week-trash-note');
      if(!btn||!note) return;
      const trash=WEEK_TRASH_CACHE[ACTIVE_WEEK_KEY];
      if(!trash){
        btn.style.display='none';
        note.style.display='none';
        note.textContent='';
        return;
      }
      btn.style.display='inline-flex';
      btn.textContent=`RECUPERAR SEMANA (${formatRemainingTrashTime(trash.expiresMs)})`;
      note.style.display='block';
      note.textContent='La semana eliminada puede recuperarse durante 2 horas.';
    }
    function formatTodayLabel(){
      return new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' });
    }

    function formatHeroDayLabel(){
      return new Date().toLocaleDateString('es-MX', { weekday:'long' }).toUpperCase();
    }

    function formatHeroTimeLabel(){
      return new Date().toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' });
    }

    function isViewingCurrentWeek(){
      return ACTIVE_WEEK_KEY===getWeekStartKey(new Date());
    }

    function formatWeekRange(weekKey){
      const mon = new Date(weekKey + 'T00:00:00');
      const sat = new Date(weekKey + 'T00:00:00');
      sat.setDate(sat.getDate() + 5);
      const a = mon.toLocaleDateString('es-MX', { day:'2-digit', month:'short' });
      const b = sat.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
      return `Semana: ${a} - ${b}`;
    }
    function getTodayAgendaInfo(){
      const dayMap = { 1:DIAS[0], 2:DIAS[1], 3:DIAS[2], 4:DIAS[3], 5:DIAS[4], 6:DIAS[5] };
      const dia = dayMap[new Date().getDay()] || null;
      const count = dia ? CACHE_HORARIOS.filter(x=>x.celda_id===dia).length : 0;
      return { dia, count, hasAgendaDay: !!dia };
    }

    function bindMiniCalendarInteractions(){
      const miniCalEl = document.getElementById('mini-calendar');
      if(!miniCalEl || miniCalEl.dataset.bound==='1') return;
      miniCalEl.dataset.bound = '1';
      miniCalEl.setAttribute('role','button');
      miniCalEl.setAttribute('tabindex','0');
      miniCalEl.setAttribute('aria-expanded','false');
      miniCalEl.addEventListener('click', ()=>toggleMiniCalendar());
      miniCalEl.addEventListener('keydown', e=>{
        if(e.key==='Enter' || e.key===' '){
          e.preventDefault();
          toggleMiniCalendar();
        }
      });
    }

    function toggleMiniCalendar(forceState=null){
      const miniCalEl = document.getElementById('mini-calendar');
      if(!miniCalEl) return;
      const shouldExpand = forceState===null ? !miniCalEl.classList.contains('expanded') : !!forceState;
      miniCalEl.classList.toggle('expanded', shouldExpand);
      miniCalEl.setAttribute('aria-expanded', shouldExpand?'true':'false');
    }
    function updateWeekIndicators(){
      const now = new Date();
      const todayEl = document.getElementById('fecha-actual');
      const rangeEl = document.getElementById('week-range');
      const dayHeroEl = document.getElementById('current-day-hero');
      const timeHeroEl = document.getElementById('current-time-hero');
      const cronoTodayEl = document.getElementById('crono-fecha-actual');
      const cronoRangeEl = document.getElementById('crono-week-range');
      const weekStatusEl = document.getElementById('week-status-indicator');
      const agendaWeekCard = rangeEl ? rangeEl.closest('.week-card') : null;
      const cronoWeekCard = cronoRangeEl ? cronoRangeEl.closest('.week-card') : null;
      let miniCalEl = document.getElementById('mini-calendar');
      if(!miniCalEl){
        const hero = document.querySelector('.agenda-hero');
        if(hero){
          miniCalEl = document.createElement('div');
          miniCalEl.id = 'mini-calendar';
          miniCalEl.className = 'mini-calendar';
          hero.appendChild(miniCalEl);
        }
      }

      if(todayEl){ todayEl.textContent = ""; todayEl.style.display = "none"; }
      if(rangeEl) rangeEl.textContent = formatWeekRange(ACTIVE_WEEK_KEY);
      if(cronoTodayEl) cronoTodayEl.textContent = formatTodayLabel();
      if(cronoRangeEl) cronoRangeEl.textContent = formatWeekRange(ACTIVE_WEEK_KEY);
      const weekIsCurrent=isViewingCurrentWeek();
      const weekColor=weekIsCurrent ? '#5ee27a' : '#ff6b6b';
      if(rangeEl) rangeEl.style.color=weekColor;
      if(cronoRangeEl) cronoRangeEl.style.color=weekColor;
      [agendaWeekCard, cronoWeekCard].forEach(card=>{
        if(!card) return;
        card.classList.toggle('week-card-outdated', !weekIsCurrent);
      });
      if(weekStatusEl){
        weekStatusEl.textContent=weekIsCurrent ? '\u2713' : '\u2715';
        weekStatusEl.className='week-status-indicator '+(weekIsCurrent ? 'is-current' : 'is-other');
        weekStatusEl.setAttribute('aria-label', weekIsCurrent ? 'Semana actual' : 'Semana distinta');
      }
      updateWeekTrashUI();
      if(dayHeroEl) dayHeroEl.textContent = formatHeroDayLabel();
      bindMiniCalendarInteractions();
      if(miniCalEl){
        const todayInfo = getTodayAgendaInfo();
        const calKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${ACTIVE_WEEK_KEY}-${todayInfo.count}`;
        if(LAST_CAL_KEY !== calKey){
          miniCalEl.innerHTML = buildMiniCalendar(now);
          LAST_CAL_KEY = calKey;
        }
      }

      if(timeHeroEl){
        const minuteMark = now.toISOString().slice(0,16);
        const timeText = formatHeroTimeLabel();
        if(timeHeroEl.textContent !== timeText) timeHeroEl.textContent = timeText;
        if(LAST_MIN_MARK !== minuteMark){
          timeHeroEl.classList.remove('minute-shift');
          void timeHeroEl.offsetWidth;
          timeHeroEl.classList.add('minute-shift');
          LAST_MIN_MARK = minuteMark;
        }
      }
    }

    async function goNextWeek(){
      ACTIVE_WEEK_KEY = addDaysToWeekKey(ACTIVE_WEEK_KEY, 7);
      localStorage.setItem(WEEK_ACTIVE_KEY, ACTIVE_WEEK_KEY);
      updateWeekIndicators();
      await updateAll();
    }

    async function goPrevWeek(){
      ACTIVE_WEEK_KEY = addDaysToWeekKey(ACTIVE_WEEK_KEY, -7);
      localStorage.setItem(WEEK_ACTIVE_KEY, ACTIVE_WEEK_KEY);
      updateWeekIndicators();
      await updateAll();
    }

    async function deleteWeekTrashRow(rowId){
      if(!rowId) return;
      await _sp.from('horarios').delete().eq('id',rowId);
    }

    async function cleanupExpiredWeekTrash(rows){
      const expired=(rows||[])
        .map(parseWeekTrashRow)
        .filter(x=>x && x.expiresMs<=Date.now());
      if(!expired.length) return;
      await _sp.from('horarios').delete().in('id', expired.map(x=>x.rowId));
    }

    async function upsertWeekTrash(weekKey,payload,rows=[]){
      const current=(rows||[]).find(r=>String(r.celda_id||'')===getWeekTrashCeldaId(weekKey));
      const contenido=JSON.stringify(payload);
      if(current?.id){
        await _sp.from('horarios').update({contenido}).eq('id',current.id);
        return;
      }
      await _sp.from('horarios').insert([{celda_id:getWeekTrashCeldaId(weekKey),contenido}]);
    }

    async function eliminarSemanaActiva(){
      const weekKey=ACTIVE_WEEK_KEY;
      const {data,error}=await _sp.from('horarios').select('id,celda_id,contenido');
      if(error){ alert('No se pudo leer la agenda de esta semana.'); return; }
      const rows=data||[];
      const weekRows=getAgendaRowsForWeek(rows,weekKey);
      if(!weekRows.length){
        alert('No hay clases en esta semana para eliminar.');
        return;
      }
      const ok=confirm("\\u00bfEliminar este registro?");
      if(!ok) return;

      const expiresAt=new Date(Date.now()+WEEK_TRASH_WINDOW_MS).toISOString();
      const payload={
        weekKey,
        deletedAt:new Date().toISOString(),
        expiresAt,
        rows:weekRows.map(r=>({celda_id:r.celda_id,contenido:r.contenido}))
      };

      await upsertWeekTrash(weekKey,payload,rows);
      await _sp.from('horarios').delete().in('id',weekRows.map(r=>r.id));
      await updateAll();
      alert('La semana se elimino temporalmente. Puedes recuperarla durante 2 horas.');
    }

    async function recuperarSemanaEliminada(){
      const trash=WEEK_TRASH_CACHE[ACTIVE_WEEK_KEY];
      if(!trash){
        alert('No hay una semana eliminada para recuperar.');
        return;
      }
      if(trash.expiresMs<=Date.now()){
        await deleteWeekTrashRow(trash.rowId);
        await updateAll();
        alert('El tiempo para recuperar esta semana ya vencio.');
        return;
      }

      const {data,error}=await _sp.from('horarios').select('id,celda_id,contenido');
      if(error){ alert('No se pudo preparar la recuperacion de la semana.'); return; }
      const rows=data||[];
      const existentes=getAgendaRowsForWeek(rows,ACTIVE_WEEK_KEY);
      if(existentes.length){
        const reemplazar=confirm('Ya hay clases en esta semana. Si recuperas, se reemplazaran por la version eliminada. \u00bfDeseas continuar?');
        if(!reemplazar) return;
        await _sp.from('horarios').delete().in('id',existentes.map(r=>r.id));
      }

      await _sp.from('horarios').insert(trash.rows.map(r=>({celda_id:r.celda_id,contenido:r.contenido})));
      await deleteWeekTrashRow(trash.rowId);
      await updateAll();
      alert('La semana se recupero correctamente.');
    }
    async function clearAgendaAndCronoRows() {
      const { error } = await _sp.from('horarios').delete().in('celda_id', DIAS);
      if (error) throw error;
    }

    async function saveResetWeekKey(weekKey) {
      const { data: meta } = await _sp.from('horarios').select('id').eq('celda_id', CELDA_RESET_META).limit(1).maybeSingle();
      if (meta?.id) {
        await _sp.from('horarios').update({ contenido: weekKey }).eq('id', meta.id);
      } else {
        await _sp.from('horarios').insert([{ celda_id: CELDA_RESET_META, contenido: weekKey }]);
      }
    }

    async function archiveCurrentWeek(weekKey) {
      const { data: rows } = await _sp.from('horarios').select('celda_id, contenido').in('celda_id', DIAS);
      const list = rows || [];
      if (!list.length) return;
      const payload = list.map(r => ({ celda_id: `ARCHIVE_${weekKey}_${r.celda_id}`, contenido: r.contenido }));
      await _sp.from('horarios').insert(payload);
    }

    async function restoreLatestArchivedWeekIfAgendaEmpty() {
      const { data: active } = await _sp.from('horarios').select('id').in('celda_id', DIAS).limit(1);
      if ((active || []).length > 0) return;

      const { data: archived } = await _sp.from('horarios').select('celda_id, contenido').like('celda_id', 'ARCHIVE_%');
      const rows = archived || [];
      if (!rows.length) return;

      let latestWeek = '';
      const parsed = rows.map(r => {
        const m = /^ARCHIVE_(\d{4}-\d{2}-\d{2})_(.+)$/.exec(r.celda_id || '');
        if (!m) return null;
        const wk = m[1];
        const day = m[2];
        if (wk > latestWeek) latestWeek = wk;
        return { week: wk, day, contenido: r.contenido };
      }).filter(Boolean);

      if (!latestWeek) return;
      const restore = parsed.filter(x => x.week === latestWeek && DIAS.includes(x.day)).map(x => ({ celda_id: x.day, contenido: x.contenido }));
      if (!restore.length) return;

      await _sp.from('horarios').insert(restore);
    }

    async function ensureWeeklyReset() {
      const weekKey = getWeekStartKey(new Date());
      const { data: meta } = await _sp.from('horarios').select('contenido').eq('celda_id', CELDA_RESET_META).limit(1).maybeSingle();
      const lastKey = meta?.contenido || '';
      if (lastKey !== weekKey) await saveResetWeekKey(weekKey);
    }

    async function reiniciarSemana(manual = false) {
      // Compatibilidad: ahora "reiniciar" avanza a una semana nueva sin borrar historial.
      await goNextWeek();
    }
    async function updateAll(){
      const {data}=await _sp.from('horarios').select('id,celda_id,contenido');
      const rows=data||[];
      await cleanupExpiredWeekTrash(rows);
      const {data: freshData}=await _sp.from('horarios').select('id,celda_id,contenido');
      const activeRows=freshData||rows;
      hydrateDismissedNotifications(activeRows);
      WEEK_TRASH_CACHE={};
      activeRows.forEach(r=>{
        const trash=parseWeekTrashRow(r);
        if(trash && trash.expiresMs>Date.now()) WEEK_TRASH_CACHE[trash.weekKey]=trash;
      });
      CACHE_ALUMNOS=activeRows.filter(x=>x.celda_id===CELDA_DB);
      CACHE_SOLICITUDES=activeRows.filter(x=>x.celda_id===CELDA_SOLICITUD);
      const currentWeekKey = getWeekStartKey(new Date());
      CACHE_HORARIOS=activeRows
        .filter(x=>x.celda_id!==CELDA_DB&&x.celda_id!==CELDA_SOLICITUD&&x.celda_id!==CELDA_RESET_META&&x.celda_id!==CELDA_NOTIF_STATE&&!String(x.celda_id).startsWith('ARCHIVE_')&&!String(x.celda_id).startsWith(WEEK_TRASH_PREFIX))
        .map(x=>{
          const rawId = String(x.celda_id||'');
          if (DIAS.includes(rawId) && ACTIVE_WEEK_KEY===currentWeekKey) return { ...x, celda_id: rawId };
          const parsed = parseWeekCeldaId(rawId);
          if (parsed && parsed.week===ACTIVE_WEEK_KEY && DIAS.includes(parsed.dia)) return { ...x, celda_id: parsed.dia };
          return null;
        })
        .filter(Boolean)
        .sort((a,b)=>a24h(a.contenido.split('|')[0])-a24h(b.contenido.split('|')[0]));

      buildAlumnoIndex();
      buildHorariosByDia();

      DIAS.forEach(d=>{
        const filtrados=CACHE_HORARIOS_BY_DIA[d]||[];
        document.getElementById(`badge-${d}`).innerText=filtrados.length;
        const dayContent=document.getElementById(`cont-${d}`);
        if(dayContent&&dayContent.style.display==='block') renderAgendaDay(d,true);
      });
      renderAlumnosList(CACHE_ALUMNOS);processVencimientos();renderCronograma();renderSolicitudes();updateSolicitudesDot();updateWeekIndicators();
      const visible = ['modulo-agenda','modulo-cronograma','modulo-alumnos','modulo-solicitudes','modulo-notificaciones'].map(id=>document.getElementById(id)).find(el=>el && getComputedStyle(el).display!=='none');
      if(visible) animateSequentialLoad(visible);
      normalizeDomText(document.getElementById('app-content'));
    }
    function getSeenSolicitudesCount(){
      const n = parseInt(localStorage.getItem(SOL_SEEN_KEY) || '0', 10);
      return Number.isFinite(n) ? n : 0;
    }

    function updateSolicitudesDot(){
      const dot = document.getElementById('active-dot-solicitudes');
      if(!dot) return;
      let seen = getSeenSolicitudesCount();
      const total = CACHE_SOLICITUDES.length;
      if(seen > total){
        seen = total;
        localStorage.setItem(SOL_SEEN_KEY, String(total));
      }
      dot.style.display = total > seen ? 'block' : 'none';
    }

    function markSolicitudesAsSeen(){
      localStorage.setItem(SOL_SEEN_KEY, String(CACHE_SOLICITUDES.length));
      updateSolicitudesDot();
    }
        function renderSolicitudes(){
      const cont=document.getElementById('lista-solicitudes');
      if(!CACHE_SOLICITUDES.length){
        cont.innerHTML='<p style="text-align:center;opacity:.3;font-size:.7rem;font-style:italic;margin-top:30px">No hay solicitudes aún.</p>';
        return;
      }
      cont.innerHTML=CACHE_SOLICITUDES.slice().sort((a,b)=>new Date((b.contenido.split('|')[6]||'')).getTime()-new Date((a.contenido.split('|')[6]||'')).getTime()).map(s=>{
        const p=s.contenido.split('|').map(normalizeText);
        const nombre=p[1]||'Sin nombre';
        const telRaw=p[2]||'';
        const edad=p[3]||'';
        const razon=p[4]||'';
        const salud=p[5]||'';
        const fecha=p[6]?new Date(p[6]).toLocaleString('es-MX'):'Sin fecha';
        const telSan=sanitizeTel(telRaw);
        const ws=telSan.length>=8
          ? '<a class="ws-wrapper" target="_blank" href="https://wa.me/'+telSan+'"><img src="'+WS_ICON_URL+'" class="ws-icon"><span class="ws-number">'+telRaw+'</span></a>'
          : '<span class="ws-wrapper"><img src="'+WS_ICON_URL+'" class="ws-icon"><span class="ws-number">'+telRaw+'</span></span>';
        return '<div class="clase-box"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><b style="font-size:.85rem">'+nombre+'</b><br><small style="opacity:.6">Edad: '+edad+'</small><br>'+ws+'</div><small style="opacity:.45;font-size:.62rem;text-align:right">'+fecha+'</small></div><div style="margin-top:12px;font-size:.75rem;line-height:1.5"><b style="color:var(--celeste)">Razón:</b> '+razon+'<br><b style="color:var(--celeste)">Salud:</b> '+salud+'</div><button style="margin-top:12px;background:transparent;border:none;color:var(--danger);font-size:.58rem;font-weight:900;cursor:pointer" onclick="borrar(\''+s.id+'\')">BORRAR SOLICITUD</button></div>';
      }).join('');
    }
function renderCronograma(){
      const container=document.getElementById('render-cronograma');
      if(!container) return;
      container.innerHTML=DIAS.map(dia=>{
        const clasesDelDia=(CACHE_HORARIOS_BY_DIA[dia]||[]);
        const htmlClases=clasesDelDia.length
          ? clasesDelDia.map(c=>{
              const p=c.contenido.split('|').map(normalizeText);
              const contenidoSeguro=(c.contenido||'').replace(/'/g,'&#39;');
              const alumnos=(p[3]||'').split(',').map((n,i)=>`${i+1}- ${n.trim()}`).filter(Boolean).join('<br>')||'Sin alumnos';
              return `<div class="crono-task"><div class="crono-task-main"><div style="display:flex;align-items:center;cursor:pointer" onclick="toggleCronoDetail('${c.id}')"><div class="crono-bullet"></div><b>${p[0]||''}</b>&nbsp;&bull;&nbsp;<span style="color:${classColor(p[1])};font-weight:800">${p[1]||''}</span></div><span style="cursor:pointer;font-size:1rem;padding:5px;opacity:.78" onclick="addClasePopup('${dia}','${c.id}','${contenidoSeguro}')">&#9998;</span></div><div id="crono-detail-${c.id}" class="crono-detail-box"><b style="color:var(--access-accent-deep, #7f6148)">ALUMNOS:</b><br><div style="margin-top:5px;color:var(--access-ink, #2f2822)">${alumnos}</div><div style="margin-top:10px;color:#8d5b34;font-weight:800;"><b style="color:#8d5b34">MODALIDAD:</b> ${p[2]||''}</div></div></div>`;
            }).join('')
          : '<div style="opacity:.2;font-size:.7rem;margin-left:18px;font-style:italic">Sin clases</div>';
        return `<div class="crono-row"><div class="crono-dia-label">${dia}</div><div class="crono-list">${htmlClases}</div></div>`;
      }).join('');
      normalizeDomText(container);
    }function toggleCronoDetail(id){const el=document.getElementById(`crono-detail-${id}`),v=el.style.display==='block';document.querySelectorAll('.crono-detail-box').forEach(b=>b.style.display='none');el.style.display=v?'none':'block';}
    function parseVencDate(raw){
      if(!raw) return null;
      const s=String(raw||'').trim();
      if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s+'T00:00:00');
      if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)){
        const y=s.slice(6,10), m=s.slice(3,5), d=s.slice(0,2);
        return new Date(`${y}-${m}-${d}T00:00:00`);
      }
      return null;
    }
    function getVencimientoStatus(raw){
      const target=parseVencDate(raw);
      if(!target) return null;
      const now=new Date();
      const diffMs=target-now;
      const dayMs=24*60*60*1000;
      return {
        target,
        diffMs,
        isOneDay: diffMs>0 && diffMs<=dayMs,
        isOneWeek: diffMs>dayMs && diffMs<=7*dayMs
      };
    }
    function formatCountdown(ms){
      const total=Math.max(0,Math.floor(ms/1000));
      const h=Math.floor(total/3600);
      const m=Math.floor((total%3600)/60);
      const s=total%60;
      const pad=n=>String(n).padStart(2,'0');
      return pad(h)+':'+pad(m)+':'+pad(s);
    }
    function checkVencimiento(f){
      const info=getVencimientoStatus(f);
      return !!(info && info.isOneDay);
    }

    function renderAlumnosList(lista){
      const container=document.getElementById('render-alumnos');
      if(!container) return;
      container.innerHTML=lista.map(a=>{
        const p=a.contenido.split('|').map(normalizeText);
        const estaVencido=checkVencimiento(p[10]);
        const telSan=sanitizeTel(p[2]||'');
        const hasTel=telSan&&telSan.length>=8;
        const telefono=hasTel
          ? `<a href="https://wa.me/${telSan}" target="_blank" class="ws-wrapper"><img src="${WS_ICON_URL}" class="ws-icon"><span class="ws-number">${p[2]||''}</span></a>`
          : `<span class="ws-wrapper"><img src="${WS_ICON_URL}" class="ws-icon"><span class="ws-number">${p[2]||''}</span></span>`;
        const contenidoSeguro=(a.contenido||'').replace(/'/g,'&#39;');
        const actividadFisica=`${p[14]||'N/A'}${p[15]?` - ${p[15]}`:''}`;
        const dolorLesion=`${p[16]||'N/A'}${p[17]?` - ${p[17]}`:''}`;
        const cirugia=`${p[18]||'N/A'}${p[19]?` - ${p[19]}`:''}`;
        const partos=`${p[22]||'N/A'}${p[22]==='Si'&&p[23]?` - ${p[23]}`:''}`;
        return `<div class="clase-box"><b style="font-size:.85rem" class="${estaVencido?'vence-alerta':''}">${p[1]||'SIN NOMBRE'}</b><br>${telefono}<br><small style="opacity:.5"><span style="color:${classColor(p[3])};font-weight:800">${p[3]||''}</span> &bull; ${p[4]||'Sin frecuencia'}</small><div id="extra-${a.id}" style="display:none;margin-top:12px;font-size:.68rem;line-height:1.6"><p><b>PROFESION:</b> ${p[13]||'N/A'}</p><p><b>TELEFONO:</b> ${p[2]||'N/A'}</p><p><b style="color:#ffd36a">MODALIDAD:</b> <span style="color:#ffd36a;font-weight:800">${p[5]||'N/A'}</span></p><p><b>VENCIMIENTO:</b> <span class="${estaVencido?'vence-alerta':''}">${p[10]||'N/A'}</span></p><hr style="opacity:.1;margin:10px 0"><p><b>SALUD:</b> ${p[6]||'Ninguna'}</p><p><b>VISITA:</b> ${p[7]||'N/A'}</p><p><b>ORIGEN:</b> ${p[8]||'N/A'}</p><p><b>REFERIDO:</b> ${p[9]||'N/A'}</p><hr style="opacity:.1;margin:10px 0"><p><b style="color:#9fe4c7">INFORMACION ADICIONAL</b></p><p><b>ACTIVIDAD FISICA:</b> ${actividadFisica}</p><p><b>DOLOR O LESION:</b> ${dolorLesion}</p><p><b>CIRUGIA:</b> ${cirugia}</p><p><b>TENSION:</b> ${p[20]||'N/A'}</p><p><b>EMBARAZO:</b> ${p[21]||'N/A'}</p><p><b>PARTOS O CESAREAS:</b> ${partos}</p><p><b>OBJETIVO:</b> ${p[24]||'N/A'}</p><p><b>OBSERVACIONES:</b> ${p[25]||'N/A'}</p><button class="btn-principal" style="padding:10px;font-size:.55rem;margin-top:15px;letter-spacing:1px" onclick="abrirFormNuevoAlumno('${a.id}','${contenidoSeguro}')">EDITAR</button></div><div style="margin-top:15px;display:flex;gap:10px;justify-content:space-between;align-items:center"><button class="nav-btn" style="padding:10px 20px;font-size:.5rem;background:#1a1a1c;border-color:#333;letter-spacing:1px" onclick="toggleExtra('${a.id}')">DETALLES</button><button style="background:transparent;border:none;color:var(--danger);font-size:.55rem;font-weight:900;cursor:pointer;opacity:.8" onclick="borrar('${a.id}')">BORRAR</button></div></div>`;
      }).join('');
      normalizeDomText(container);
    }
    function getNotifVencKey(id){ return 'v:'+id; }
    function getNotifBirthdayKey(nombre){ return 'c:'+(nombre||'').trim().toLowerCase(); }

    function hydrateDismissedNotifications(rows){
      NOTIF_DISMISSED.clear();
      const row=(rows||[]).find(r=>r.celda_id===CELDA_NOTIF_STATE);
      NOTIF_STATE_ROW_ID=row?.id||null;
      if(!row?.contenido) return;
      try{
        const data=JSON.parse(row.contenido);
        const list=Array.isArray(data)?data:(Array.isArray(data?.dismissed)?data.dismissed:[]);
        list.forEach(k=>NOTIF_DISMISSED.add(String(k)));
      }catch{}
    }

    async function persistDismissedNotifications(){
      const contenido=JSON.stringify({dismissed:Array.from(NOTIF_DISMISSED)});
      if(NOTIF_STATE_ROW_ID){
        await _sp.from('horarios').update({contenido}).eq('id',NOTIF_STATE_ROW_ID);
        return;
      }
      const {data,error}=await _sp.from('horarios').insert([{celda_id:CELDA_NOTIF_STATE,contenido}]).select('id').limit(1);
      if(!error&&data&&data[0]&&data[0].id) NOTIF_STATE_ROW_ID=data[0].id;
    }

        function startVencCountdownTimer(){
      if(VENC_COUNTDOWN_TIMER) return;
      VENC_COUNTDOWN_TIMER=setInterval(updateVencCountdowns,1000);
    }
    function updateVencCountdowns(){
      document.querySelectorAll('.venc-countdown').forEach(el=>{
        const ts=parseInt(el.dataset.target||'0',10);
        if(!ts) return;
        const diff=ts-Date.now();
        el.textContent=formatCountdown(diff);
      });
    }
    function showAgendaVencimientoToast(nombre){
      const agenda=document.getElementById('modulo-agenda');
      if(!agenda || getComputedStyle(agenda).display==='none') return;
      const key=getTodayKey()+'|'+String(nombre||'').trim().toLowerCase();
      if(VENC_WEEK_TOAST_SHOWN.has(key)) return;
      VENC_WEEK_TOAST_SHOWN.add(key);
      let toast=document.getElementById('agenda-venc-toast');
      if(toast) toast.remove();
      toast=document.createElement('div');
      toast.id='agenda-venc-toast';
      toast.style.cssText='position:fixed;left:50%;top:90px;transform:translateX(-50%);z-index:9999;background:rgba(10,10,10,.92);color:#fff;border:1px solid #39d98a;padding:10px 14px;border-radius:14px;font-size:.7rem;font-weight:600;box-shadow:0 10px 24px rgba(0,0,0,.5);';
      toast.textContent=(nombre||'')+' se le acabara el plan en 1 semana';
      document.body.appendChild(toast);
      setTimeout(()=>{ if(toast) toast.remove(); }, 4000);
    }
function processVencimientos(){
      const listaNotif=document.getElementById('lista-notificaciones');
      if(!listaNotif) return;

      const alertas24h=CACHE_ALUMNOS.filter(a=>{
        const p=a.contenido.split('|');
        const info=getVencimientoStatus(p[10]);
        return info && info.isOneDay && !NOTIF_DISMISSED.has(`v:${a.id}`);
      });
      const alertasSemana=CACHE_ALUMNOS.filter(a=>{
        const p=a.contenido.split('|');
        const info=getVencimientoStatus(p[10]);
        return info && info.isOneWeek;
      });
      const cumplePend=getCumpleanerosHoy().filter(c=>!isBirthdayHandledToday(c.nombre)&&!NOTIF_DISMISSED.has(`c:${(c.nombre||'').trim().toLowerCase()}`));

      document.getElementById('active-dot').style.display=(alertas24h.length+cumplePend.length)>0?'block':'none';
      CURRENT_NOTIF_SIGNATURE=[
        ...alertas24h.map(a=>`v:${a.id}`).sort(),
        ...cumplePend.map(c=>`c:${(c.nombre||'').trim().toLowerCase()}`).sort()
      ].join('|');
      updateNotifAttention();

      if(alertasSemana.length){
        const first=alertasSemana[0];
        const p=first.contenido.split('|').map(normalizeText);
        showAgendaVencimientoToast(p[1]||'');
      }

      const htmlCumple=cumplePend.map(c=>{
        const tel=sanitizeTel(c.tel||'');
        const hasWs=tel&&tel.length>=8;
        const safeName=(c.nombre||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
        const safeTel=String(tel||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
        const ws=hasWs
          ? `<a class="birthday-ws-link" href="#" onclick="sendBirthdayWhatsapp('${safeName}','${safeTel}'); return false;"><img src="${WS_ICON_URL}" class="ws-icon"></a>`
          : `<span class="birthday-ws-link" style="opacity:.35"><img src="${WS_ICON_URL}" class="ws-icon"></span>`;
        return `<div class="clase-box birthday-inline" style="border-left:4px solid #ffd36a;display:flex;justify-content:space-between;align-items:center;gap:12px"><div><b style="color:#ffd36a">Nuevo cumplea\u00f1os</b><br><small>${c.nombre} esta cumpliendo a\u00f1os</small></div>${ws}</div>`;
      }).join('');
      const htmlVence=alertas24h.map(a=>{
        const p=a.contenido.split('|').map(normalizeText);
        const info=getVencimientoStatus(p[10]);
        const targetTs=info?info.target.getTime():0;
        const countdown=info?formatCountdown(info.diffMs):'00:00:00';
        const tel=sanitizeTel(p[2]||'');
        const hasWs=tel&&tel.length>=8;
        const safeName=(p[1]||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
        const safeTel=String(tel||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
        const ws=hasWs
          ? `<a class="birthday-ws-link" href="#" onclick="sendVencimientoWhatsapp('${safeName}','${safeTel}'); return false;"><img src="${WS_ICON_URL}" class="ws-icon"></a>`
          : `<span class="birthday-ws-link" style="opacity:.35"><img src="${WS_ICON_URL}" class="ws-icon"></span>`;
        return `<div class="clase-box" style="border-left:4px solid var(--danger);display:flex;justify-content:space-between;align-items:center;gap:12px"><div><b style="color:var(--danger)">${p[1]}</b><br><small>Le vencera su plan en: <b><span class="venc-countdown" data-target="${targetTs}">${countdown}</span></b></small></div>${ws}</div>`;
      }).join('');

      const empty=(alertas24h.length===0&&cumplePend.length===0)
        ? '<p style="text-align:center;opacity:.3;font-size:.7rem;font-style:italic;margin-top:30px">No hay vencimientos ni cumplea\u00f1os hoy.</p>'
        : '';
      listaNotif.innerHTML = htmlCumple + htmlVence + empty;
      normalizeDomText(listaNotif);
      if(alertas24h.length){
        startVencCountdownTimer();
        updateVencCountdowns();
      }
    }
    function updateNotifAttention(){
      const btn=document.getElementById('btn-notif');
      if(!btn) return;
      const viewing=document.getElementById('modulo-notificaciones')?.style.display==='block';
      const hasPending=!!CURRENT_NOTIF_SIGNATURE;
      const shouldShake=hasPending && CURRENT_NOTIF_SIGNATURE!==LAST_SEEN_NOTIF_SIGNATURE && !viewing;
      btn.classList.toggle('notif-shake', shouldShake);
    }

    async function clearNotifications(){
      CACHE_ALUMNOS
        .filter(a=>{const info=getVencimientoStatus(a.contenido.split('|')[10]);return info && info.isOneDay;})
        .forEach(a=>NOTIF_DISMISSED.add(getNotifVencKey(a.id))); 
      getCumpleanerosHoy()
        .forEach(c=>NOTIF_DISMISSED.add(getNotifBirthdayKey(c.nombre))); 
      await persistDismissedNotifications();
      LAST_SEEN_NOTIF_SIGNATURE='';
      processVencimientos();
    }

    function getCumpleanerosHoy(){
      const now=new Date();
      const md=`${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      return CACHE_ALUMNOS.map(a=>{
        const p=a.contenido.split('|').map(normalizeText);
        return { nombre:normalizeText(p[1]||'').trim(), tel:normalizeText(p[2]||''), nac:normalizeText(p[12]||'') };
      }).filter(x=>{
        if(!x.nombre || !x.nac) return false;
        const raw=(x.nac||'').trim();
        if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(5,10)===md;
        if(/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return `${raw.slice(3,5)}-${raw.slice(0,2)}`===md;
        return false;
      });
    }

    function getTodayKey(){
      return new Date().toISOString().slice(0,10);
    }

    function isBirthdayHandledToday(nombre){
      const day=getTodayKey();
      const list=Array.isArray(BIRTHDAY_HANDLED_BY_DAY[day])?BIRTHDAY_HANDLED_BY_DAY[day]:[];
      return list.includes((nombre||'').trim().toLowerCase());
    }

    function markBirthdayHandledToday(nombre){
      const n=(nombre||'').trim().toLowerCase();
      if(!n) return;
      const day=getTodayKey();
      const list=Array.isArray(BIRTHDAY_HANDLED_BY_DAY[day])?BIRTHDAY_HANDLED_BY_DAY[day]:[];
      if(!list.includes(n)) list.push(n);
      BIRTHDAY_HANDLED_BY_DAY[day]=list;
    }

    function shouldShowBirthdayCycle(force=false){
      if(force) return true;
      const last=parseInt(localStorage.getItem(BIRTHDAY_LAST_SHOWN_KEY)||'0',10);
      if(!Number.isFinite(last)||last<=0) return true;
      return (Date.now()-last)>=BIRTHDAY_INTERVAL_MS;
    }

    function markBirthdayCycleNow(){
      localStorage.setItem(BIRTHDAY_LAST_SHOWN_KEY,String(Date.now()));
    }

    function closeBirthdayPrompt(runAfterClose=null,mode='normal'){
      const root=document.getElementById('birthday-prompt-root');
      scheduleBirthdayFireworksStop(2000);
      if(!root){
        if(typeof runAfterClose==='function') runAfterClose();
        return;
      }
      root.classList.remove('birthday-prompt-root-explode','birthday-prompt-root-hide');
      root.classList.add(mode==='explode'?'birthday-prompt-root-explode':'birthday-prompt-root-hide');
      setTimeout(()=>{
        if(root) root.remove();
        if(typeof runAfterClose==='function') runAfterClose();
      }, mode==='explode'?760:640);
    }

    function scheduleBirthdayFireworksStop(ms=2000){
      if(BIRTHDAY_FIREWORKS_CTRL && typeof BIRTHDAY_FIREWORKS_CTRL.stopAfter==='function'){
        BIRTHDAY_FIREWORKS_CTRL.stopAfter(ms);
      }
    }

    function triggerIgnoreBirthday(btn,nombre){
      if(btn && btn.classList.contains('ignore-exploding')) return;
      if(btn) btn.classList.add('ignore-exploding');
      setTimeout(()=>{ ignoreBirthday(nombre); }, 560);
    }

    async function ignoreBirthday(nombre){
      markBirthdayHandledToday(nombre);
      NOTIF_DISMISSED.add(getNotifBirthdayKey(nombre));
      await persistDismissedNotifications();
      closeBirthdayPrompt(()=>processVencimientos(),'explode');
    }

    function buildBirthdayWhatsappMessage(nombre){
      const wave=String.fromCodePoint(0x1F30A);
      const meditate=String.fromCodePoint(0x1F9D8)+String.fromCharCode(0x200D,0x2640,0xFE0F);
      return 'Hola '+(nombre||'')+'. Pilates Pulse te desea un feliz cumplea\u00f1os, gracias por compartir tu energ\u00eda y tu esfuerzo con nosotros. Que este a\u00f1o sigas creciendo con fluidez y control'+wave +  meditate+'\nPilates Pulse.';
    }

    function buildVencimientoWhatsappMessage(nombre){
      return 'Hola, '+(nombre||'')+' es para informarte que tu fecha de vencimiento se acerca, avisanos si seguiras con nosotras! Pilates Pulse.';
    }
    function openWhatsappWithMessage(tel,msg){
      const text=encodeURIComponent(msg||'');
      const webUrl='https://wa.me/'+tel+'?text='+text;
      const appUrl='whatsapp://send?phone='+tel+'&text='+text;
      const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'');
      if(mobile){
        window.location.href=appUrl;
        setTimeout(()=>window.open(webUrl,'_blank','noopener'),700);
        return;
      }
      window.open(webUrl,'_blank','noopener');
    }

    async function sendBirthdayWhatsapp(nombre,telOverride=''){
      const nombrePlano=(nombre||'').trim();
      if(!nombrePlano) return;

      let tel=normalizeTelForWhatsapp(telOverride||'');
      if(!tel){
        const found=CACHE_ALUMNOS.find(a=>{
          const p=a.contenido.split('|').map(normalizeText);
          return (p[1]||'').trim().toLowerCase()===nombrePlano.toLowerCase();
        });
        if(found){
          const p=found.contenido.split('|');
          tel=normalizeTelForWhatsapp(p[2]||'');
        }
      }

      if(!tel||tel.length<8){
        alert('Este alumno no tiene un numero valido para WhatsApp.');
        return;
      }

      const msg=buildBirthdayWhatsappMessage(nombrePlano||nombre);
      openWhatsappWithMessage(tel,msg);
      markBirthdayHandledToday(nombrePlano||nombre);
      NOTIF_DISMISSED.add(getNotifBirthdayKey(nombrePlano||nombre));
      await persistDismissedNotifications();
      closeBirthdayPrompt(()=>processVencimientos());
    }
    async function sendVencimientoWhatsapp(nombre,telOverride=''){
      const nombrePlano=(nombre||'').trim();
      if(!nombrePlano) return;

      let tel=normalizeTelForWhatsapp(telOverride||'');
      if(!tel){
        const found=CACHE_ALUMNOS.find(a=>{
          const p=a.contenido.split('|').map(normalizeText);
          return (p[1]||'').trim().toLowerCase()===nombrePlano.toLowerCase();
        });
        if(found){
          const p=found.contenido.split('|');
          tel=normalizeTelForWhatsapp(p[2]||'');
        }
      }

      if(!tel||tel.length<8){
        alert('Este alumno no tiene un numero valido para WhatsApp.');
        return;
      }

      const msg=buildVencimientoWhatsappMessage(nombrePlano||nombre);
      openWhatsappWithMessage(tel,msg);
    }
    function openBirthdayPrompt(cumple){
      let root=document.getElementById('birthday-prompt-root');
      if(root) root.remove();
      root=document.createElement('div');
      root.id='birthday-prompt-root';
      root.className='birthday-prompt-root';
      const safeName=cleanField(cumple.nombre||'',80);
      const safeTel=cleanField(cumple.tel||'',32);
      root.innerHTML=''
      + '<div class="birthday-prompt-backdrop">'
      +   '<div class="birthday-prompt-card">'
      +     '<button class="birthday-prompt-close" onclick="closeBirthdayPrompt()">&times;</button>'
      +     '<div class="birthday-prompt-title">Nuevo cumplea\u00f1os</div>'
      +     '<div class="birthday-prompt-sub">'+safeName+' esta cumpliendo a\u00f1os</div>'
      +     '<div class="birthday-prompt-actions">'
      +       '<button class="btn-principal btn-fuse" style="margin:0" onclick="sendBirthdayWhatsapp(\''+safeName+'\',\''+safeTel+'\')">Mandar mensaje</button>'
      +       '<button class="btn-cancelar btn-fuse btn-ignore" style="margin:0" onclick="triggerIgnoreBirthday(this,\''+safeName+'\')">Eliminar</button>'
      +     '</div>'
      +   '</div>'
      + '</div>';
      document.body.appendChild(root);
      normalizeDomText(root);
    }function launchBirthdayFireworks(){
      if(BIRTHDAY_FIREWORKS_CTRL && typeof BIRTHDAY_FIREWORKS_CTRL.stopNow==='function'){
        BIRTHDAY_FIREWORKS_CTRL.stopNow();
      }

      let canvas=document.getElementById('birthday-fireworks-canvas');
      if(canvas) canvas.remove();
      canvas=document.createElement('canvas');
      canvas.id='birthday-fireworks-canvas';
      canvas.className='birthday-fireworks-layer';
      document.body.appendChild(canvas);

      const ctx=canvas.getContext('2d');
      if(!ctx){ canvas.remove(); return null; }

      const DPR=Math.max(1,window.devicePixelRatio||1);
      let w=0,h=0,raf=0;
      let active=true;
      let stopping=false;
      let stopAt=Infinity;
      let launchCooldown=0;
      let launchWave=0;
      const rockets=[];
      const sparks=[];
      const colors=['#ff4d4d','#ffae45','#ffe66a','#73ffbc','#73b8ff','#d289ff','#ff74cb','#8bffec'];

      function resize(){
        w=window.innerWidth;
        h=window.innerHeight;
        canvas.width=Math.floor(w*DPR);
        canvas.height=Math.floor(h*DPR);
        ctx.setTransform(DPR,0,0,DPR,0,0);
      }
      resize();
      window.addEventListener('resize',resize,{passive:true});

      function spawnRocket(){
        const sideBias=(launchWave++ % 2)===0 ? 0.22 : 0.78;
        const x=(Math.random()*0.45 + sideBias-0.22) * w;
        rockets.push({
          x:Math.max(20,Math.min(w-20,x)),
          y:h+8,
          vx:(Math.random()-.5)*1.05,
          vy:-(8.0+Math.random()*2.2),
          targetY:h*(0.14+Math.random()*0.34),
          color:colors[(Math.random()*colors.length)|0],
          trail:[]
        });
      }

      function explode(r){
        const rings=2 + ((Math.random()*3)|0);
        for(let ring=0; ring<rings; ring++){
          const count=42 + ((Math.random()*26)|0);
          const base=1.35 + ring*0.95;
          for(let i=0;i<count;i++){
            const a=(Math.PI*2*i)/count + (Math.random()-.5)*0.1;
            const sp=base + Math.random()*2.1;
            sparks.push({
              x:r.x,y:r.y,
              vx:Math.cos(a)*sp,
              vy:Math.sin(a)*sp,
              life:118 + ((Math.random()*58)|0),
              age:0,
              color:r.color,
              twinkle:Math.random()*0.7 + 0.3
            });
          }
        }
      }

      function drawTrail(trail,color){
        for(let i=0;i<trail.length;i++){
          const t=trail[i];
          const k=i/trail.length;
          ctx.globalAlpha=0.022 + k*0.145;
          ctx.fillStyle=color;
          ctx.beginPath();
          ctx.arc(t.x,t.y,1.1 + k*1.55,0,Math.PI*2);
          ctx.fill();
        }
        ctx.globalAlpha=1;
      }

      function tick(ts){
        if(!active) return;
        ctx.globalCompositeOperation='source-over';
        ctx.fillStyle='rgba(0,0,0,0.18)';
        ctx.fillRect(0,0,w,h);

        if(!stopping){
          if(ts>launchCooldown){
            const burst=1 + ((Math.random()*2)|0);
            for(let i=0;i<burst;i++){ if(rockets.length<4) spawnRocket(); }
            launchCooldown=ts + 80 + Math.random()*55;
          }
        }

        for(let i=rockets.length-1;i>=0;i--){
          const r=rockets[i];
          r.trail.push({x:r.x,y:r.y});
          if(r.trail.length>18) r.trail.shift();
          r.x+=r.vx;
          r.y+=r.vy;
          r.vy+=0.042;

          drawTrail(r.trail,r.color);
          ctx.fillStyle=r.color;
          ctx.beginPath();
          ctx.shadowColor=r.color;
          ctx.shadowBlur=10;
          ctx.arc(r.x,r.y,2.05,0,Math.PI*2);
          ctx.fill();
          ctx.shadowBlur=0;

          if(r.y<=r.targetY || r.vy>=-0.95){
            explode(r);
            rockets.splice(i,1);
          }
        }

        for(let i=sparks.length-1;i>=0;i--){
          const p=sparks[i];
          p.age++;
          p.x+=p.vx;
          p.y+=p.vy;
          p.vy+=0.022;
          p.vx*=0.994;
          const lifeT=Math.max(0,1-p.age/p.life);
          const pulse=(0.7 + Math.sin((p.age*0.14)+p.twinkle)*0.3);
          const alpha=lifeT*pulse;
          ctx.globalAlpha=alpha;
          ctx.fillStyle=p.color;
          ctx.beginPath();
          ctx.shadowColor=p.color;
          ctx.shadowBlur=7;
          ctx.arc(p.x,p.y,0.7 + lifeT*1.9,0,Math.PI*2);
          ctx.fill();
          ctx.shadowBlur=0;
          if(p.age>=p.life) sparks.splice(i,1);
        }
        ctx.globalAlpha=1;

        if(stopping && ts>=stopAt && rockets.length===0 && sparks.length===0){
          stopNow();
          return;
        }
        raf=requestAnimationFrame(tick);
      }

      function stopAfter(ms=2000){
        if(!active) return;
        stopping=true;
        stopAt=Math.min(stopAt, performance.now()+Math.max(0,ms));
      }

      function stopNow(){
        if(!active) return;
        active=false;
        cancelAnimationFrame(raf);
        window.removeEventListener('resize',resize);
        if(canvas&&canvas.parentNode) canvas.remove();
        if(BIRTHDAY_FIREWORKS_CTRL&&BIRTHDAY_FIREWORKS_CTRL.stopNow===stopNow) BIRTHDAY_FIREWORKS_CTRL=null;
      }

      raf=requestAnimationFrame(tick);
      BIRTHDAY_FIREWORKS_CTRL={ stopAfter, stopNow };
      return BIRTHDAY_FIREWORKS_CTRL;
    }

    function showBirthdayNotices(force=false){
      const pendientes=getCumpleanerosHoy().filter(c=>!isBirthdayHandledToday(c.nombre)&&!NOTIF_DISMISSED.has(getNotifBirthdayKey(c.nombre)));
      if(!pendientes.length) return;
      if(!shouldShowBirthdayCycle(force)) return;
      markBirthdayCycleNow();

      if(BIRTHDAY_PROMPT_TIMER) clearTimeout(BIRTHDAY_PROMPT_TIMER);
      BIRTHDAY_PROMPT_TIMER=setTimeout(()=>{
        try{ launchBirthdayFireworks(); }catch(e){ console.error('fireworks error',e); }
        openBirthdayPrompt(pendientes[0]);
      }, 900);
    }
    function filtrarAlumnos(){const q=document.getElementById('buscadorAlumnos').value.toLowerCase();renderAlumnosList(CACHE_ALUMNOS.filter(a=>a.contenido.split('|')[1].toLowerCase().includes(q)));}
    function toggleExtra(id){const el=document.getElementById(`extra-${id}`);el.style.display=el.style.display==='block'?'none':'block';}

    function toggleConditionalInput(selectId,wrapId,yesValue='Si'){
      const sel=document.getElementById(selectId);
      const wrap=document.getElementById(wrapId);
      if(!sel||!wrap) return;
      wrap.style.display=sel.value===yesValue?'block':'none';
    }

    function toggleOptionalSection(id){
      const el=document.getElementById(id);
      if(!el) return;
      el.style.display=el.style.display==='none'?'block':'none';
    }

    function abrirFormNuevoAlumno(editId=null,existingData=null){
      const p=existingData?existingData.split('|'):Array(27).fill('');
      const get=(idx,def='')=>typeof p[idx]!=='undefined'?p[idx]:def;

      const nombre=get(1,'');
      const tel=get(2,'');
      const nac=get(12,'');
      const profesion=get(13,'');
      const venc=get(10,'');

      const act=get(14,(get(15,'')?'Si':'No'));
      const actCual=get(15,'');
      const dolor=get(16,(get(17,'')?'Si':'No'));
      const dolorDonde=get(17,'');
      const cirugia=get(18,(get(19,'')?'Si':'No'));
      const cirugiaCual=get(19,'');

      const tensionOps=['Cuello','Espalda alta','Zona lumbar','Caderas','Rodillas','Hombros','Otro'];
      let tension=get(20,'');
      let tensionOtro='';
      if(tension && !tensionOps.includes(tension)){ tensionOtro=tension; tension='Otro'; }

      const embarazo=get(21,'No');
      const partos=get(22,(get(23,'')?'Si':'No'));
      const partosCuantos=get(23,'');

      const objetivoOps=['Mejorar postura','Aumentar flexibilidad','Fortalecer el cuerpo','Disminuir dolor','Recuperación de lesión','Bienestar','Otro'];
      let objetivo=get(24,get(4,''));
      let objetivoOtro='';
      if(objetivo && !objetivoOps.includes(objetivo)){ objetivoOtro=objetivo; objetivo='Otro'; }

      const obs=get(25,get(9,''));
      const aut=get(26,'No')==='Si';

      let nums='';
      for(let i=1;i<=100;i++) nums+=`<option ${String(partosCuantos)===String(i)?'selected':''}>${i}</option>`;

      const formHtml=`<div class="modal-form-shell">
        <label>Nombre completo</label><input type="text" id="db-nom" value="${nombre}">
        <label>Fecha de nacimiento</label><input type="date" id="db-nac" value="${nac}">
        <label>Tel&eacute;fono</label><input type="text" id="db-tel" value="${tel}">
        <label>Profesi&oacute;n / actividad principal</label><input type="text" id="db-prof" value="${profesion}">
        <label>Vencimiento</label><input type="date" id="db-venc" value="${venc}">

        <label>&iquest;Realiza actualmente alguna actividad f&iacute;sica?</label>
        <select id="db-activa" onchange="toggleConditionalInput('db-activa','db-activa-cual-wrap')">
          <option ${act==='No'?'selected':''}>No</option>
          <option ${act==='Si'?'selected':''}>Si</option>
        </select>
        <div id="db-activa-cual-wrap" style="display:none">
          <label>&iquest;Cu&aacute;l?</label><input type="text" id="db-activa-cual" value="${actCual}">
        </div>

        <label>&iquest;Tiene actualmente dolor o alguna lesi&oacute;n?</label>
        <select id="db-dolor" onchange="toggleConditionalInput('db-dolor','db-dolor-donde-wrap')">
          <option ${dolor==='No'?'selected':''}>No</option>
          <option ${dolor==='Si'?'selected':''}>Si</option>
        </select>
        <div id="db-dolor-donde-wrap" style="display:none">
          <label>&iquest;D&oacute;nde?</label><input type="text" id="db-dolor-donde" value="${dolorDonde}">
        </div>

        <label>&iquest;Ha tenido alguna cirug&iacute;a importante?</label>
        <select id="db-cirugia" onchange="toggleConditionalInput('db-cirugia','db-cirugia-cual-wrap')">
          <option ${cirugia==='No'?'selected':''}>No</option>
          <option ${cirugia==='Si'?'selected':''}>Si</option>
        </select>
        <div id="db-cirugia-cual-wrap" style="display:none">
          <label>&iquest;Cu&aacute;l?</label><input type="text" id="db-cirugia-cual" value="${cirugiaCual}">
        </div>

        <label>&iquest;En qu&eacute; parte del cuerpo siente m&aacute;s tensi&oacute;n o molestias habitualmente?</label>
        <select id="db-tension" onchange="toggleConditionalInput('db-tension','db-tension-otro-wrap','Otro')">${tensionOps.map(o=>`<option ${tension===o?'selected':''}>${o}</option>`).join('')}</select>
        <div id="db-tension-otro-wrap" style="display:none">
          <label>Otro (especifique)</label><input type="text" id="db-tension-otro" value="${tensionOtro}">
        </div>

        <button type="button" class="btn-second" style="margin-top:8px" onclick="toggleOptionalSection('db-info-extra')">Informaci&oacute;n adicional</button>
        <div id="db-info-extra" style="display:none;margin-top:8px">
          <label>&iquest;Est&aacute; embarazada?</label>
          <select id="db-embarazo">
            <option ${embarazo==='No'?'selected':''}>No</option>
            <option ${embarazo==='Si'?'selected':''}>Si</option>
          </select>

          <label>&iquest;Ha tenido partos o ces&aacute;reas?</label>
          <select id="db-partos" onchange="toggleConditionalInput('db-partos','db-partos-cuantos-wrap')">
            <option ${partos==='No'?'selected':''}>No</option>
            <option ${partos==='Si'?'selected':''}>Si</option>
          </select>
          <div id="db-partos-cuantos-wrap" style="display:none">
            <label>&iquest;Cu&aacute;ntos?</label><select id="db-partos-cuantos">${nums}</select>
          </div>

          <label>Objetivo principal al venir al estudio</label>
          <select id="db-objetivo" onchange="toggleConditionalInput('db-objetivo','db-objetivo-otro-wrap','Otro')">${objetivoOps.map(o=>`<option ${objetivo===o?'selected':''}>${o}</option>`).join('')}</select>
          <div id="db-objetivo-otro-wrap" style="display:none">
            <label>Otro (especifique)</label><input type="text" id="db-objetivo-otro" value="${objetivoOtro}">
          </div>

          <label>Observaciones</label><textarea id="db-obs" rows="3">${obs}</textarea>
        </div>

        <label style="display:flex;gap:8px;align-items:center;text-transform:none;font-size:.65rem;margin-left:0">
          <input type="checkbox" id="db-aut" ${aut?'checked':''} style="width:auto;margin:0"> Autorizo participar en las clases de Pilates Pulse bajo mi propia responsabilidad.
        </label>

        <button class="btn-principal" style="letter-spacing:1px" onclick="saveAlumno('${editId}')">GUARDAR</button>
        <button class="btn-cancelar" onclick="cerrarFormAlumno()">CANCELAR</button>
      </div>`;

      openModal(editId?'Editar alumno':'Registrar alumno',formHtml);
      const modalRoot=document.getElementById('app-modal-root');
      if(modalRoot) modalRoot.dataset.modalType='db-form';
      setDatabaseFormUiHidden(true);
      toggleConditionalInput('db-activa','db-activa-cual-wrap');
      toggleConditionalInput('db-dolor','db-dolor-donde-wrap');
      toggleConditionalInput('db-cirugia','db-cirugia-cual-wrap');
      toggleConditionalInput('db-tension','db-tension-otro-wrap','Otro');
      toggleConditionalInput('db-partos','db-partos-cuantos-wrap');
      toggleConditionalInput('db-objetivo','db-objetivo-otro-wrap','Otro');
    }

    async function saveAlumno(editId="null"){
      const d=id=>document.getElementById(id)?.value||'';
      const ch=id=>document.getElementById(id)?.checked? 'Si':'No';

      const nombre=d('db-nom').trim();
      const tel=d('db-tel').trim();
      const nac=d('db-nac');
      const profesion=d('db-prof').trim();
      const venc=d('db-venc');
      const actividad=d('db-activa');
      const actividadCual=d('db-activa-cual').trim();
      const dolor=d('db-dolor');
      const dolorDonde=d('db-dolor-donde').trim();
      const cirugia=d('db-cirugia');
      const cirugiaCual=d('db-cirugia-cual').trim();
      const tensionSel=d('db-tension');
      const tensionOtro=d('db-tension-otro').trim();
      const tension=tensionSel==='Otro'?(tensionOtro||'Otro'):tensionSel;
      const embarazo=d('db-embarazo');
      const partos=d('db-partos');
      const partosCuantos=d('db-partos-cuantos');
      const objetivoSel=d('db-objetivo');
      const objetivoOtro=d('db-objetivo-otro').trim();
      const objetivo=objetivoSel==='Otro'?(objetivoOtro||'Otro'):objetivoSel;
      const obs=d('db-obs').trim();
      const autorizo=ch('db-aut');

      const safe=x=>String(x||'').replace(/\|/g,'/');

      const content=[
        'DB',
        safe(nombre),
        safe(tel),
        safe('Registro'),
        safe(objetivo),
        safe(embarazo),
        safe(dolor==='Si'?dolorDonde:''),
        safe(cirugia==='Si'?cirugiaCual:''),
        safe(tension),
        safe(obs),
        safe(venc),
        safe(''),
        safe(nac),
        safe(profesion),
        safe(actividad),
        safe(actividad==='Si'?actividadCual:''),
        safe(dolor),
        safe(dolor==='Si'?dolorDonde:''),
        safe(cirugia),
        safe(cirugia==='Si'?cirugiaCual:''),
        safe(tension),
        safe(embarazo),
        safe(partos),
        safe(partos==='Si'?partosCuantos:''),
        safe(objetivo),
        safe(obs),
        safe(autorizo)
      ].join('|');

      if(editId!=="null") await _sp.from('horarios').update({contenido:content}).eq('id',editId);
      else await _sp.from('horarios').insert([{celda_id:CELDA_DB,contenido:content}]);

      cerrarFormAlumno();
      updateAll();
    }
    function cerrarFormAlumno(){closeModal();}
    function animateSequentialLoad(container){
      if(!container) return;
      const items = Array.from(container.querySelectorAll('.dia-item,.clase-box,.crono-row,.crono-task,.search-container,h3,.crono-header-text')).slice(0,36);
      items.forEach((el,i)=>{
        el.classList.remove('seq-item');
        el.style.animationDelay = (i*85)+'ms';
        void el.offsetWidth;
        el.classList.add('seq-item');
        const done=()=>{el.classList.remove('seq-item');el.style.animationDelay='';el.removeEventListener('animationend',done);};
        el.addEventListener('animationend',done);
      });
    }

    function switchModulo(id){
      const modules=['modulo-agenda','modulo-cronograma','modulo-alumnos','modulo-solicitudes','modulo-notificaciones'];
      const btnMap={'modulo-agenda':'btn-agenda','modulo-cronograma':'btn-crono','modulo-alumnos':'btn-db','modulo-solicitudes':'btn-solicitudes','modulo-notificaciones':'btn-notif'};
      const target=document.getElementById(id);
      if(!target) return;
      setAppChromeTheme('app');
      const cont=document.getElementById('modulo-contaduria');
      if(cont) cont.style.display='none';
      const app=document.getElementById('app-content');
      if(app) app.style.display='block';

      modules.forEach(m=>{const el=document.getElementById(m); if(el) el.style.display='none';});
      target.style.display='block';

      document.getElementById('main-brand').style.display=id==='modulo-cronograma'?'none':'flex';
      Object.values(btnMap).forEach(bid=>document.getElementById(bid).classList.remove('active-btn'));
      document.getElementById(btnMap[id]).classList.add('active-btn');

      if(id==='modulo-cronograma') document.getElementById('edit-form-crono').innerHTML='';
      if(id==='modulo-solicitudes') markSolicitudesAsSeen();
      if(id==='modulo-notificaciones'){
        LAST_SEEN_NOTIF_SIGNATURE=CURRENT_NOTIF_SIGNATURE;
        updateNotifAttention();
      }

      animateSequentialLoad(target);
    }

        function openContaduria(){
      hidePublicScreens();
      setAppChromeTheme('app');
      const cont=document.getElementById('modulo-contaduria');
      if(cont) cont.style.display='block';
      const app=document.getElementById('app-content');
      if(app) app.style.display='none';
      document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active-btn'));
      const btn=document.getElementById('btn-contaduria');
      if(btn) btn.classList.add('active-btn');
      switchContaduriaView('ingresos');
      ensureContaduriaData();
    }

    function setContaduriaTabActive(view){
      const tabs=document.querySelectorAll('.contaduria-tab');
      tabs.forEach(btn=>{
        const isActive=btn.getAttribute('data-view')===view;
        btn.classList.toggle('active', isActive);
      });
    }

    function animateContaduriaShell(el, active){
      if(!el) return;
      if(active){
        el.style.display='block';
        el.classList.remove('contaduria-shell--hidden');
        requestAnimationFrame(()=>el.classList.add('contaduria-shell--active'));
      }else{
        el.classList.remove('contaduria-shell--active');
        el.classList.add('contaduria-shell--hidden');
        setTimeout(()=>{
          if(el.classList.contains('contaduria-shell--hidden')) el.style.display='none';
        },220);
      }
    }

    function switchContaduriaView(view){
      const ingresos=document.getElementById('contaduria-ingresos');
      const egresos=document.getElementById('contaduria-egresos');
      const retiro=document.getElementById('contaduria-retiro');
      const info=document.getElementById('contaduria-info');
      const saldo=document.getElementById('contaduria-saldo');
      setContaduriaTabActive(view);
      const showIngresos=view==='ingresos';
      const showEgresos=view==='egresos';
      const showInfo=view==='info';
      const showSaldo=view==='saldo';
      animateContaduriaShell(ingresos, showIngresos);
      animateContaduriaShell(egresos, showEgresos);
      animateContaduriaShell(retiro, showEgresos);
      animateContaduriaShell(info, showInfo);
      animateContaduriaShell(saldo, showSaldo);
      const infoTotal=document.getElementById('contaduria-info-total');
      if(infoTotal) infoTotal.style.display=showInfo?'block':'none';
      if(showInfo){
        loadContaduriaInfo();
        startContaduriaRateAutoRefresh();
      }
      if(showSaldo){
        loadContaduriaSaldo();
      }
    }

    function ensureContaduriaData(){
      populateContaduriaBirthdayControls();
      handleContaduriaMetodoPagoChange();
      setContaduriaDefaultDate();
      if(!CACHE_ALUMNOS || !CACHE_ALUMNOS.length){
        updateAll().then(()=>{ populateContaduriaAlumnos(); updateContaduriaPlanes(); });
        return;
      }
      populateContaduriaAlumnos();
      updateContaduriaPlanes();
    }

    let CONTADURIA_RATE_TIMER=null;

    function refreshContaduriaInfoIfVisible(){
      const info=document.getElementById('contaduria-info');
      if(info && info.style.display!=='none') loadContaduriaInfo();
      const saldo=document.getElementById('contaduria-saldo');
      if(saldo && saldo.style.display!=='none') loadContaduriaSaldo();
    }

    function startContaduriaRateAutoRefresh(){
      if(CONTADURIA_RATE_TIMER) clearInterval(CONTADURIA_RATE_TIMER);
      CONTADURIA_RATE_TIMER=setInterval(()=>{
        const info=document.getElementById('contaduria-info');
        if(info && info.style.display!=='none') loadContaduriaInfo();
      },25*60*1000);
    }

    function populateContaduriaAlumnos(){
      const select=document.getElementById('contad-alumno');
      if(!select) return;
      const names=(CACHE_ALUMNOS||[]).map(a=>{
        const p=a.contenido.split('|').map(normalizeText);
        return (p[1]||'').trim();
      }).filter(Boolean);
      names.sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
      CACHE_CONTADURIA_NAMES=names;
      renderContaduriaAlumnos(names);
    }

    function renderContaduriaAlumnos(list){
      const select=document.getElementById('contad-alumno');
      if(!select) return;
      const items=(list||[]).map(n=>'<option>'+n+'</option>').join('');
      select.innerHTML='<option value="">Selecciona alumno</option>'+items;
    }

    function buscarAlumnoContaduria(){
      const input=document.getElementById('contad-alumno-search');
      if(!input) return;
      const q=(input.value||'').trim().toLowerCase();
      if(!q){ renderContaduriaAlumnos(CACHE_CONTADURIA_NAMES); return; }
      const filtered=CACHE_CONTADURIA_NAMES.filter(n=>n.toLowerCase().startsWith(q));
      renderContaduriaAlumnos(filtered);
    }

    function toggleContaduriaManualName(){
      if(isContaduriaCustomIngresoActive()) return;
      const el=document.getElementById('contad-alumno-manual');
      if(!el) return;
      el.style.display=el.style.display==='none'?'block':'none';
      if(el.style.display==='block') el.focus();
    }

    function normalizeContaduriaNivelValue(raw){
      return String(raw||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
    }

    function isContaduriaCustomIngresoActive(){
      const wrap=document.getElementById('contad-custom-wrap');
      return !!(wrap && wrap.style.display!=='none');
    }

    function toggleContaduriaCustomIngreso(){
      const active=!isContaduriaCustomIngresoActive();
      const btn=document.getElementById('contad-custom-toggle');
      const label=document.getElementById('contad-nombre-label');
      const normalWrap=document.getElementById('contad-nombre-normal-wrap');
      const manual=document.getElementById('contad-alumno-manual');
      const customWrap=document.getElementById('contad-custom-wrap');
      const customInput=document.getElementById('contad-custom-label');
      const claseBlock=document.getElementById('contad-clase-block');
      const total=document.getElementById('contad-total');
      if(normalWrap) normalWrap.style.display=active?'none':'flex';
      if(manual) manual.style.display='none';
      if(customWrap) customWrap.style.display=active?'block':'none';
      if(claseBlock) claseBlock.style.display=active?'none':'block';
      if(label) label.textContent=active?'Concepto personalizado':'Nombre';
      if(btn){
        btn.textContent=active?'X':'Ingreso personalizado';
        btn.style.color=active?'#ffb3b3':'';
      }
      if(active && total){
        total.value='';
        total.dataset.baseUsd='';
        total.readOnly=false;
      }
      if(active && customInput) customInput.focus();
      if(!active && customInput) customInput.value='';
      updateContaduriaPlanes();
    }

    function populateContaduriaBirthdayControls(){
      const type=document.getElementById('contad-birthday-type');
      const qty=document.getElementById('contad-birthday-qty');
      if(type && !type.dataset.ready){
        type.innerHTML='<option value="">Selecciona tipo</option>'+CONTADURIA_BIRTHDAY_TYPES.map(item=>'<option value="'+item.name+'" data-price="'+item.price+'">'+item.name+' $'+item.price+' por persona</option>').join('');
        type.dataset.ready='1';
      }
      if(qty && !qty.dataset.ready){
        qty.innerHTML=Array.from({length:100},(_,idx)=>'<option value="'+(idx+1)+'">'+(idx+1)+'</option>').join('');
        qty.value='1';
        qty.dataset.ready='1';
      }
    }

    function isContaduriaBirthdayNivel(nivel){
      return normalizeContaduriaNivelValue(nivel)==='cumpleanos';
    }

    function isSueltaNivel(nivel){
      const n=normalizeContaduriaNivelValue(nivel);
      return Object.prototype.hasOwnProperty.call(CONTADURIA_FIXED_LEVEL_PRICES,n);
    }

    function getContaduriaFixedUsd(nivel){
      const n=normalizeContaduriaNivelValue(nivel);
      return CONTADURIA_FIXED_LEVEL_PRICES[n]||0;
    }

    function getContaduriaBirthdayPrice(tipo){
      const selected=CONTADURIA_BIRTHDAY_TYPES.find(item=>item.name===tipo);
      return selected?selected.price:0;
    }

    async function setContaduriaAutoTotalFromUsd(baseUsd){
      const total=document.getElementById('contad-total');
      const metodo=document.getElementById('contad-metodo-pago')?.value||'';
      if(!total) return;
      if(!Number.isFinite(baseUsd) || baseUsd<=0){
        total.value='';
        total.dataset.baseUsd='';
        return;
      }
      total.dataset.baseUsd=String(baseUsd);
      total.readOnly=true;
      if(metodo==='pago_movil'){
        const rate=await fetchEuroVesRate();
        CONTADURIA_LAST_RATE=rate;
        total.value=rate?((Math.round(baseUsd*rate*100)/100).toFixed(2)):'';
        return;
      }
      total.value=String(baseUsd);
    }

    async function updateContaduriaPlanes(){
      const nivel=document.getElementById('contad-plan-nivel');
      const planSelect=document.getElementById('contad-plan-item');
      const planWrap=document.getElementById('contad-plan-wrap');
      const planLabel=document.getElementById('contad-plan-label');
      const typeWrap=document.getElementById('contad-birthday-type-wrap');
      const typeSelect=document.getElementById('contad-birthday-type');
      const qtyWrap=document.getElementById('contad-birthday-qty-wrap');
      const total=document.getElementById('contad-total');
      if(!nivel||!planSelect) return;
      populateContaduriaBirthdayControls();
      if(isContaduriaCustomIngresoActive()){
        if(planWrap) planWrap.style.display='none';
        if(typeWrap) typeWrap.style.display='none';
        if(qtyWrap) qtyWrap.style.display='none';
        if(total){
          total.readOnly=false;
          total.dataset.baseUsd='';
        }
        return;
      }
      const nivelVal=nivel.value;
      if(isContaduriaBirthdayNivel(nivelVal)){
        if(planWrap) planWrap.style.display='none';
        if(typeWrap) typeWrap.style.display='block';
        if(planLabel) planLabel.textContent='Plan';
        if(typeSelect && !typeSelect.innerHTML) populateContaduriaBirthdayControls();
        if(qtyWrap) qtyWrap.style.display=(typeSelect && typeSelect.value)?'block':'none';
        await updateContaduriaTotal();
        return;
      }
      if(typeWrap) typeWrap.style.display='none';
      if(qtyWrap) qtyWrap.style.display='none';
      if(isSueltaNivel(nivelVal)){
        if(planWrap) planWrap.style.display='none';
        planSelect.innerHTML='<option value="">No aplica</option>';
        await updateContaduriaTotal();
        return;
      }
      if(planWrap) planWrap.style.display='block';
      if(planLabel) planLabel.textContent='Plan';
      const list=getContaduriaPlanesByNivel(nivelVal);
      planSelect.innerHTML='<option value="">Selecciona plan</option>'+list.map(p=>'<option value="'+p.name+'" data-price="'+p.price+'">'+p.name+'</option>').join('');
      await updateContaduriaTotal();
    }

    async function updateContaduriaTotal(){
      const planSelect=document.getElementById('contad-plan-item');
      const total=document.getElementById('contad-total');
      const nivel=document.getElementById('contad-plan-nivel');
      if(!total) return;
      if(isContaduriaCustomIngresoActive()){
        total.readOnly=false;
        total.dataset.baseUsd='';
        return;
      }
      const nivelVal=nivel?.value||'';
      if(isContaduriaBirthdayNivel(nivelVal)){
        const type=document.getElementById('contad-birthday-type')?.value||'';
        const qty=parseInt(document.getElementById('contad-birthday-qty')?.value||'1',10)||1;
        const qtyWrap=document.getElementById('contad-birthday-qty-wrap');
        if(qtyWrap) qtyWrap.style.display=type?'block':'none';
        const unitPrice=getContaduriaBirthdayPrice(type);
        if(!unitPrice){
          total.value='';
          total.dataset.baseUsd='';
          total.readOnly=true;
          return;
        }
        await setContaduriaAutoTotalFromUsd(unitPrice*qty);
        return;
      }
      if(isSueltaNivel(nivelVal)){
        await setContaduriaAutoTotalFromUsd(getContaduriaFixedUsd(nivelVal));
        return;
      }
      if(!planSelect) return;
      const opt=planSelect.options[planSelect.selectedIndex];
      if(!opt || !opt.value){
        total.value='';
        total.dataset.baseUsd='';
        total.readOnly=false;
        return;
      }
      const baseUsd=parseFloat(opt.getAttribute('data-price')||'0');
      await setContaduriaAutoTotalFromUsd(baseUsd);
    }

    function handleContaduriaMetodoPagoChange(){
      const metodo=document.getElementById('contad-metodo-pago')?.value||'';
      const label=document.getElementById('contad-total-label');
      if(label){
        label.textContent = metodo==='pago_movil' ? 'Monto (Bs)' : (metodo==='usdt' ? 'Monto (USDT)' : 'Monto (EUR)');
      }
      updateContaduriaTotal();
    }

    function updateEgresoMetodoUI(scope){
      const metodo=document.getElementById(`contad-${scope}-metodo`)?.value||'';
      const labelText=document.getElementById(`contad-${scope}-monto-label-text`);
      const label=document.getElementById(`contad-${scope}-monto-label`);
      const nextText = metodo==='pago_movil' ? 'Monto (Bs)' : (metodo==='usdt' ? 'Monto (USDT)' : (scope==='retiro' ? 'Cantidad (EUR)' : 'Monto (EUR)'));
      if(labelText){
        labelText.textContent = nextText;
      }else if(label && label.childNodes && label.childNodes.length){
        label.childNodes[0].nodeValue = nextText + ' ';
      }
    }

    function handleEgresoMetodoChange(scope){
      updateEgresoMetodoUI(scope);
      const metodo=document.getElementById(`contad-${scope}-metodo`)?.value||'';
      if(!metodo) return;
      openEgresoMontoModal(scope, metodo);
    }

    function openEgresoMontoModal(scope, metodo){
      const inputId = scope==='retiro' ? 'contad-variable-monto' : `contad-${scope}-monto`;
      const inputEl = document.getElementById(inputId);
      const current = inputEl ? (inputEl.value||'') : '';
      const label = metodo==='pago_movil' ? 'Monto (Bs)' : (metodo==='usdt' ? 'Monto (USDT)' : (scope==='retiro' ? 'Cantidad (EUR)' : 'Monto (EUR)'));
      const bodyHtml =
        '<div class="modal-form-shell">'+
          '<label>'+label+'</label>'+
          '<input id="egreso-modal-amount" type="number" min="0" step="0.01" value="'+current+'">'+
          '<div style="display:flex;gap:10px;margin-top:14px">'+
            '<button class="btn-principal" onclick="applyEgresoMonto(\''+inputId+'\')">Guardar</button>'+
            '<button class="btn-cancelar" onclick="closeModal()">Cancelar</button>'+
          '</div>'+
        '</div>';
      openModal('Monto', bodyHtml);
    }

    function applyEgresoMonto(targetId){
      const modalInput=document.getElementById('egreso-modal-amount');
      const target=document.getElementById(targetId);
      if(modalInput && target){
        const raw=modalInput.value||'';
        const parsed=parseMontoInput(raw);
        if(Number.isFinite(parsed)){
          target.value=String(parsed);
        }else{
          target.value=raw;
        }
      }
      closeModal();
    }

    async function buildEgresoMeta(metodo,totalInput){
      let montoUsd=totalInput;
      let montoVes=0;
      let montoEur=0;
      let moneda='EUR';
      const rate=await fetchEuroVesRate();
      if(metodo==='pago_movil'){
        montoVes=totalInput;
        montoEur=rate? (montoVes/rate):0;
        montoUsd=montoEur;
        moneda='VES';
      }else{
        montoUsd=totalInput;
        montoEur=totalInput;
        montoVes=rate? (montoUsd*rate):0;
        moneda=metodo==='usdt'?'USDT':'EUR';
      }
      const metaExtra='metodo='+metodo+'|ves='+montoVes.toFixed(2)+'|eur='+montoEur.toFixed(4)+'|moneda='+moneda;
      return {montoUsd,metaExtra};
    }
    function setContaduriaDefaultDate(){
      const input=document.getElementById('contad-fecha-pago');
      if(input && !input.value){
        input.value=new Date().toISOString().slice(0,10);
      }
    }
    function toggleContaduriaTotalEditable(){
      const total=document.getElementById('contad-total');
      if(!total) return;
      total.readOnly=!total.readOnly;
      if(total.readOnly) updateContaduriaTotal();
      else total.focus();
    }

    function getContaduriaNombre(){
      const custom=document.getElementById('contad-custom-label');
      if(isContaduriaCustomIngresoActive()){
        return custom?custom.value.trim():'';
      }
      const manual=document.getElementById('contad-alumno-manual');
      const select=document.getElementById('contad-alumno');
      const manualName=(manual&&manual.style.display!=='none')?manual.value.trim():'';
      return manualName || (select?select.value.trim():'');
    }

    async function registrarIngresoContaduria(){
      if(CONTADURIA_INGRESO_SAVING) return;
      const btn=document.getElementById('contad-registrar-ingreso');
      CONTADURIA_INGRESO_SAVING=true;
      if(btn){ btn.disabled=true; }
      const customMode=isContaduriaCustomIngresoActive();
      const nombre=getContaduriaNombre();
      const nivelRaw=document.getElementById('contad-plan-nivel')?.value||'';
      const birthdayType=document.getElementById('contad-birthday-type')?.value||'';
      const birthdayQty=parseInt(document.getElementById('contad-birthday-qty')?.value||'1',10)||1;
      const nivel=customMode?'Ingreso personalizado':(nivelRaw||'');
      const plan=isContaduriaBirthdayNivel(nivelRaw)?birthdayType:(isSueltaNivel(nivelRaw)?'':(document.getElementById('contad-plan-item')?.value||''));
      const metodo=document.getElementById('contad-metodo-pago')?.value||'';
      const fechaPago=document.getElementById('contad-fecha-pago')?.value||'';
      const totalInput=parseMontoInput(document.getElementById('contad-total')?.value||'');
      const birthdayMode=isContaduriaBirthdayNivel(nivelRaw);
      const requiresPlan=!customMode && !birthdayMode && !isSueltaNivel(nivelRaw);
      if(!fechaPago){ alert('Selecciona la fecha de pago.'); if(btn){btn.disabled=false;} CONTADURIA_INGRESO_SAVING=false; return; }
      if(customMode){
        if(!nombre||!Number.isFinite(totalInput)||totalInput<=0){
          alert('En ingreso personalizado solo debes completar concepto, monto y fecha.');
          if(btn){btn.disabled=false;}
          CONTADURIA_INGRESO_SAVING=false;
          return;
        }
      }else if(!nombre||!nivel||!metodo||!Number.isFinite(totalInput)||totalInput<=0 || (requiresPlan && !plan) || (birthdayMode && (!birthdayType || !birthdayQty))){
        alert('Completa todos los campos.');
        if(btn){btn.disabled=false;}
        CONTADURIA_INGRESO_SAVING=false;
        return;
      }
      const dedupKey=[nombre,nivel,plan,metodo,fechaPago,totalInput].join('|');
      const nowTs=Date.now();
      if(dedupKey===CONTADURIA_LAST_INGRESO_KEY && (nowTs-CONTADURIA_LAST_INGRESO_TS)<2000){
        if(btn){btn.disabled=false;}
        CONTADURIA_INGRESO_SAVING=false;
        return;
      }
      CONTADURIA_LAST_INGRESO_KEY=dedupKey;
      CONTADURIA_LAST_INGRESO_TS=nowTs;
      let montoUsd=totalInput;
      let montoVes=0;
      let montoEur=0;
      let moneda='EUR';
      if(metodo==='pago_movil'){
        const rate=await fetchEuroVesRate();
        CONTADURIA_LAST_RATE=rate;
        montoVes=totalInput;
        montoEur=rate? (montoVes/rate):0;
        montoUsd=montoEur;
        moneda='VES';
      }else{
        montoEur=totalInput;
        moneda=metodo==='usdt'?'USDT':'EUR';
      }
      const fechaIso=new Date(fechaPago+'T00:00:00').toISOString();
      const metaExtra = metodo==='pago_movil'
        ? 'metodo='+metodo+'|ves='+montoVes.toFixed(2)+'|eur='+montoEur.toFixed(4)+'|moneda=VES'
        : 'metodo='+(metodo||'sin_metodo')+'|moneda='+moneda;
      const categoria=customMode?'personalizado':'clase';
      const payload={tipo:'ingreso',estudiante:nombre,plan_nivel:nivel,plan:plan,persona:metaExtra,categoria:categoria,monto:montoUsd,fecha:fechaIso};
      const dup=await _sp.from(CONTADURIA_TABLE)
        .select('id')
        .eq('tipo','ingreso')
        .eq('estudiante',nombre)
        .eq('plan_nivel',nivel)
        .eq('plan',plan)
        .eq('monto',montoUsd)
        .eq('fecha',fechaIso)
        .limit(1);
      if(dup.data && dup.data.length){
        if(btn){btn.disabled=false;}
        CONTADURIA_INGRESO_SAVING=false;
        alert('Este ingreso ya fue registrado.');
        return;
      }
      const res=await _sp.from(CONTADURIA_TABLE).insert([payload]);
      if(res.error){ alert('No se pudo registrar el ingreso: '+(res.error.message||JSON.stringify(res.error))); if(btn){btn.disabled=false;} CONTADURIA_INGRESO_SAVING=false; return; }
      alert('Ingreso registrado.');
      switchContaduriaView('info');
      if(btn){btn.disabled=false;}
      CONTADURIA_INGRESO_SAVING=false;
    }
    function parseMontoInput(raw){
      const s=String(raw||'').trim();
      if(!s) return NaN;
      let cleaned=s.replace(/[^0-9.,-]/g,'');
      if(!cleaned) return NaN;
      const hasComma=cleaned.indexOf(',')>=0;
      const hasDot=cleaned.indexOf('.')>=0;
      if(hasComma && hasDot){
        cleaned=cleaned.split('.').join('').replace(',', '.');
      }else if(hasComma && !hasDot){
        cleaned=cleaned.replace(',', '.');
      }
      return parseFloat(cleaned);
    }
    async function registrarPagoTatiana(){
      const fecha=document.getElementById('contad-tatiana-fecha')?.value||'';
      const metodo=document.getElementById('contad-tatiana-metodo')?.value||'';
      const monto=parseMontoInput(document.getElementById('contad-tatiana-monto')?.value||'');
      if(!fecha||!metodo||!Number.isFinite(monto)||monto<=0){ alert('Completa fecha, metodo y monto.'); return; }
      const fechaIso=new Date(fecha+'T00:00:00').toISOString();
      const meta=await buildEgresoMeta(metodo,monto);
      const payload={tipo:'egreso',estudiante:null,plan_nivel:null,plan:null,persona:'Tatiana',categoria:'sueldo|'+meta.metaExtra,monto:meta.montoUsd,fecha:fechaIso};
      const res=await _sp.from(CONTADURIA_TABLE).insert([payload]);
      if(res.error){ alert('No se pudo registrar el pago.'); return; }
      alert('Pago registrado.');
      switchContaduriaView('info');
    }

    async function registrarPagoSuelto(){
      const razon=document.getElementById('contad-suelto-razon')?.value.trim()||'';
      const fecha=document.getElementById('contad-suelto-fecha')?.value||'';
      const metodo=document.getElementById('contad-suelto-metodo')?.value||'';
      const monto=parseMontoInput(document.getElementById('contad-suelto-monto')?.value||'');
      if(!razon||!fecha||!metodo||!Number.isFinite(monto)||monto<=0){ alert('Completa razon, fecha, metodo y monto.'); return; }
      const fechaIso=new Date(fecha+'T00:00:00').toISOString();
      const meta=await buildEgresoMeta(metodo,monto);
      const payload={tipo:'egreso',estudiante:null,plan_nivel:null,plan:null,persona:razon,categoria:'gasto_suelto|'+meta.metaExtra,monto:meta.montoUsd,fecha:fechaIso};
      const res=await _sp.from(CONTADURIA_TABLE).insert([payload]);
      if(res.error){ alert('No se pudo registrar el pago.'); return; }
      alert('Pago registrado.');
      switchContaduriaView('info');
    }

    let CONTADURIA_INFO_CACHE={};
    let CONTADURIA_MONTH_CURSOR=null;
    let CONTADURIA_LAST_RATE=null;
    let CONTADURIA_LAST_INGRESO_KEY="";
    let CONTADURIA_LAST_INGRESO_TS=0;
    let CONTADURIA_INGRESO_SAVING=false;
    let CONTADURIA_INGRESOS_BY_ID={};
    let CONTADURIA_EGRESOS_BY_ID={};
    let CONTADURIA_SALDO_ACTIVE='EUR';
    let CONTADURIA_VES_RATE_CACHE={rate:null,ts:0};
    const CONTADURIA_VES_RATE_FALLBACK=510;

    async function fetchEuroVesRate(){
      const now=Date.now();
      if(CONTADURIA_VES_RATE_CACHE.rate && (now-CONTADURIA_VES_RATE_CACHE.ts)<10*60*1000){
        return CONTADURIA_VES_RATE_CACHE.rate;
      }
      try{
        const res=await fetch('https://ve.dolarapi.com/v1/euros/oficial',{cache:'no-store'});
        if(!res.ok) throw new Error('rate fetch failed: '+res.status);
        const data=await res.json();
        let rate=Number(data?.promedio ?? data?.venta ?? data?.compra ?? data?.tasa ?? data?.valor ?? data?.rate);
        if(!Number.isFinite(rate)){
          const txt=String(data?.tasa||data?.valor||'');
          const match=txt.match(/([0-9]+[.,][0-9]+)/);
          if(match){
            rate=Number(match[1].replace('.','').replace(',','.'));
          }
        }
        if(Number.isFinite(rate) && rate>0){
          CONTADURIA_VES_RATE_CACHE={rate,ts:now};
          return rate;
        }
        console.error('Tasa EUR/VES invalida', data);
      }catch(err){
        console.error('Error al obtener tasa EUR/VES', err);
      }
      return CONTADURIA_VES_RATE_FALLBACK;
    }

    function formatVes(n){
      try{
        return new Intl.NumberFormat('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
      }catch(_){
        return (Math.round(n*100)/100).toFixed(2);
      }
    }

    function parseContaduriaCategoria(raw){
      const base=(raw||'').toString();
      const parts=base.split('|');
      const out={categoriaBase:parts[0]||'clase', metodo:'', montoVes:0, montoEur:0, moneda:''};
      parts.slice(1).forEach(p=>{
        const kv=p.split('=');
        const k=(kv[0]||'').trim().toLowerCase();
        const v=(kv[1]||'').trim();
        if(!k) return;
        if(k==='metodo') out.metodo=v;
        if(k==='ves') out.montoVes=parseFloat(v)||0;
        if(k==='eur') out.montoEur=parseFloat(v)||0;
        if(k==='moneda') out.moneda=v.toUpperCase();
      });
      return out;
    }

    function normalizeMetodoValue(raw){
      const base=String(raw||'');
      if(!base) return '';
      const v=base.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if(!v) return '';
      if(v.includes('pago') && (v.includes('movil') || v.includes('m?vil') || v.includes('movil') || v.includes('pago_movil'))) return 'pago_movil';
      if(v.includes('pago') || v.includes('movil') || v.includes('pago_movil')) return 'pago_movil';
      if(v.includes('zelle')) return 'zelle';
      if(v.includes('paypal')) return 'paypal';
      if(v.includes('efectivo') || v.includes('cash')) return 'efectivo';
      if(v.includes('binance')) return 'binance';
      if(v.includes('usdt')) return 'usdt';
      return v;
    }

    function extractMetodoFromRaw(raw){
      const base=String(raw||'');
      if(!base) return '';
      const direct=normalizeMetodoValue(base);
      if(direct) return direct;
      const m=base.match(/metodos*[:=]s*([a-zA-Z_-]+)/i);
      if(m && m[1]){
        const norm=normalizeMetodoValue(m[1]);
        if(norm) return norm;
      }
      return '';
    }

            function getIngresoMeta(item){
      const personaRaw=String(item?.persona||'');
      const catRaw=String(item?.categoria||'');
      const metaPersona=parseContaduriaCategoria(personaRaw);
      const metaCategoria=parseContaduriaCategoria(catRaw);
      const merged={...metaCategoria, ...metaPersona};
      const metodo=merged.metodo || extractMetodoFromRaw(personaRaw) || extractMetodoFromRaw(catRaw);
      if(metodo) merged.metodo=metodo;
      return merged;
    }

    function isContaduriaEliminado(item){
      const cat=String(item?.categoria||'').toLowerCase();
      return cat.includes('eliminado') || cat.includes('deleted');
    }


    function getContaduriaMonthCursor(){
      if(!CONTADURIA_MONTH_CURSOR){
        const now=new Date();
        CONTADURIA_MONTH_CURSOR=new Date(now.getFullYear(), now.getMonth(), 1);
      }
      return CONTADURIA_MONTH_CURSOR;
    }
    function formatContaduriaMonthTitle(date){
      const months=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
      return 'CONTADURIA DE '+months[date.getMonth()]+' '+date.getFullYear();
    }
    function updateContaduriaMonthTitle(){
      const el=document.getElementById('contaduria-month-title');
      if(!el) return;
      const d=getContaduriaMonthCursor();
      el.textContent=formatContaduriaMonthTitle(d);
      updateContaduriaMonthNav();
    }
    function updateContaduriaMonthNav(){
      const prevBtn=document.getElementById('contaduria-prev-month');
      const nextBtn=document.getElementById('contaduria-next-month');
      if(!prevBtn && !nextBtn) return;
      const base=getContaduriaMonthCursor();
      const prev=new Date(base.getFullYear(), base.getMonth()-1, 1);
      const next=new Date(base.getFullYear(), base.getMonth()+1, 1);
      const months=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
      if(prevBtn) prevBtn.textContent=months[prev.getMonth()];
      if(nextBtn) nextBtn.textContent=months[next.getMonth()];
    }
    function moveContaduriaMonth(delta){
      const base=getContaduriaMonthCursor();
      CONTADURIA_MONTH_CURSOR=new Date(base.getFullYear(), base.getMonth()+delta, 1);
      loadContaduriaInfo();
    }
    async function printContaduriaMonth(){
      if(!CONTADURIA_INFO_CACHE.rowsMonth){
        await loadContaduriaInfo();
      }
      const rowsMonth=CONTADURIA_INFO_CACHE.rowsMonth||[];
      const monthCursor=getContaduriaMonthCursor();
      const title=formatContaduriaMonthTitle(monthCursor);
      const ingresos=rowsMonth.filter(r=>r.tipo==='ingreso');
      const egresos=rowsMonth.filter(r=>r.tipo==='egreso');
      const rate=CONTADURIA_LAST_RATE || await fetchEuroVesRate();

      const ingresosUsd=ingresos.reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
      const egresosUsd=egresos.reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
      const ingresosBs=rate?ingresos.reduce((s,r)=>{const meta=getIngresoMeta(r); if(meta.moneda==='VES' || meta.metodo==='pago_movil' || (meta.montoVes||0)>0) return s+(meta.montoVes||0); return s+(parseFloat(r.monto)||0)*rate;},0):0;
      const egresosBs=rate?egresos.reduce((s,r)=>{const meta=parseContaduriaCategoria(r.categoria); if(meta.moneda==='VES' || meta.metodo==='pago_movil' || (meta.montoVes||0)>0) return s+(meta.montoVes||0); return s+(parseFloat(r.monto)||0)*rate;},0):0;

      const ingresoRows=ingresos.map(r=>{
        const meta=getIngresoMeta(r);
        const fecha=r.fecha?new Date(r.fecha).toLocaleDateString('es-VE'):'Sin fecha';
        const nombre=(r.estudiante||'N/A');
        const clase=(r.plan_nivel||'');
        const plan=(r.plan||'');
        const currency=getContaduriaCurrency(meta, String(r.persona||'')+'|'+String(r.categoria||''));
        const montoPrimario=getContaduriaCurrencyAmount(r,meta,currency,rate);
        const montoLabel=formatContaduriaCurrencyValue(currency,montoPrimario);
        const bs=rate?(meta.montoVes||0)>0?formatVes(meta.montoVes||0):formatVes((parseFloat(r.monto)||0)*rate):'N/D';
        return `<tr><td>${fecha}</td><td>${nombre}</td><td>${clase}</td><td>${plan}</td><td>${montoLabel}</td><td>${bs}</td></tr>`;
      }).join('');

      const egresoRows=egresos.map(r=>{
        const meta=parseContaduriaCategoria(r.categoria);
        const fecha=r.fecha?new Date(r.fecha).toLocaleDateString('es-VE'):'Sin fecha';
        const persona=(r.persona||'N/A');
        const categoria=(meta.categoriaBase||'egreso');
        const currency=getContaduriaCurrency(meta, String(r.categoria||'')+'|'+String(r.persona||''));
        const montoPrimario=getContaduriaCurrencyAmount(r,meta,currency,rate);
        const montoLabel=formatContaduriaCurrencyValue(currency,montoPrimario);
        const bs=rate?(meta.montoVes||0)>0?formatVes(meta.montoVes||0):formatVes((parseFloat(r.monto)||0)*rate):'N/D';
        return `<tr><td>${fecha}</td><td>${persona}</td><td>${categoria}</td><td>${montoLabel}</td><td>${bs}</td></tr>`;
      }).join('');

      const win=window.open('', '_blank', 'width=920,height=720');
      if(!win){ alert('No se pudo abrir la ventana de impresion.'); return; }
      win.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body{font-family:Arial, sans-serif;color:#111;padding:24px;}
              h1{font-size:22px;margin:0 0 12px 0;}
              h2{font-size:16px;margin:18px 0 8px 0;}
              .totals{margin-top:8px;font-size:14px;}
              table{width:100%;border-collapse:collapse;margin-top:6px;}
              th,td{border:1px solid #ddd;padding:6px;font-size:12px;text-align:left;}
              th{background:#f3f3f3;}
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div class="totals">
              <div><b>Ingresos (EUR):</b> EUR ${ingresosUsd.toFixed(2)} &nbsp; | &nbsp; <b>Ingresos (Bs):</b> ${rate?formatVes(ingresosBs):'N/D'} Bs.</div>
              <div><b>Egresos (EUR):</b> EUR ${egresosUsd.toFixed(2)} &nbsp; | &nbsp; <b>Egresos (Bs):</b> ${rate?formatVes(egresosBs):'N/D'} Bs.</div>
            </div>
            <h2>Clases (Ingresos)</h2>
            <table>
              <thead><tr><th>Fecha</th><th>Alumno</th><th>Clase</th><th>Plan</th><th>Monto</th><th>Bs</th></tr></thead>
              <tbody>${ingresoRows || '<tr><td colspan="6">Sin ingresos</td></tr>'}</tbody>
            </table>
            <h2>Egresos</h2>
            <table>
              <thead><tr><th>Fecha</th><th>Persona</th><th>Categoria</th><th>Monto</th><th>Bs</th></tr></thead>
              <tbody>${egresoRows || '<tr><td colspan="5">Sin egresos</td></tr>'}</tbody>
            </table>
          </body>
        </html>
      `);
      win.document.close();
      win.focus();
      win.print();
    }
    async function loadContaduriaInfo(){
      const list=document.getElementById('contaduria-info-list');
      const totalEl=document.getElementById('contaduria-info-total');
      if(!list) return;
      const res=await _sp.from(CONTADURIA_TABLE)
        .select('id,estudiante,plan,plan_nivel,monto,tipo,persona,categoria,fecha')
        .order('id',{ascending:false}).limit(600);
      if(res.error){ list.textContent='No se pudo cargar la informacion.'; if(totalEl) totalEl.textContent='Total: EUR 0.00'; return; }
      const rows=res.data||[];
      const rowsFinal = rows.filter(r=>!isContaduriaEliminado(r));
      CONTADURIA_INFO_CACHE.rows=rowsFinal;
      const monthCursor=getContaduriaMonthCursor();
      const monthKey=monthCursor.getFullYear()+'-'+String(monthCursor.getMonth()+1).padStart(2,'0');
      const rowsMonth=rowsFinal.filter(r=>{
        const raw=String(r.fecha||'');
        return raw.slice(0,7)===monthKey;
      });
      CONTADURIA_INFO_CACHE.rowsMonth=rowsMonth;
      updateContaduriaMonthTitle();
      let ingresos=rowsMonth.filter(r=>r.tipo==='ingreso');
      const egresos=rowsMonth.filter(r=>r.tipo==='egreso');
      const totalIngresos=ingresos.reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
      const totalEgresos=egresos.reduce((s,r)=>s+(parseFloat(r.monto)||0),0);

      const rowsToDate=rowsFinal.filter(r=>{
        const raw=String(r.fecha||'');
        return raw.slice(0,7)<=monthKey;
      });
      const ingresosToDate=rowsToDate.filter(r=>r.tipo==='ingreso');
      const egresosToDate=rowsToDate.filter(r=>r.tipo==='egreso');
      const totalIngresosToDate=ingresosToDate.reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
      const totalEgresosToDate=egresosToDate.reduce((s,r)=>s+(parseFloat(r.monto)||0),0);
      const totalActivo=totalIngresosToDate-totalEgresosToDate;

      if(totalEl){
        const rate=await fetchEuroVesRate();
        CONTADURIA_LAST_RATE=rate;
        const tasaLabel=rate?formatVes(rate):'N/D';
        const tasaBox=document.getElementById('contaduria-tasa-box');
        const monthIncomeEl=document.getElementById('contaduria-month-income');

        const ingresosBs=rate?ingresos.reduce((s,r)=>{const meta=getIngresoMeta(r); if(meta.moneda==='VES' || meta.metodo==='pago_movil' || (meta.montoVes||0)>0) return s+(meta.montoVes||0); return s+(parseFloat(r.monto)||0)*rate;},0):0;
        const egresosBs=rate?egresos.reduce((s,r)=>{const meta=parseContaduriaCategoria(r.categoria); if(meta.moneda==='VES' || meta.metodo==='pago_movil' || (meta.montoVes||0)>0) return s+(meta.montoVes||0); return s+(parseFloat(r.monto)||0)*rate;},0):0;
        const ingresosBsToDate=rate?ingresosToDate.reduce((s,r)=>{const meta=getIngresoMeta(r); if(meta.moneda==='VES' || meta.metodo==='pago_movil' || (meta.montoVes||0)>0) return s+(meta.montoVes||0); return s+(parseFloat(r.monto)||0)*rate;},0):0;
        const egresosBsToDate=rate?egresosToDate.reduce((s,r)=>{const meta=parseContaduriaCategoria(r.categoria); if(meta.moneda==='VES' || meta.metodo==='pago_movil' || (meta.montoVes||0)>0) return s+(meta.montoVes||0); return s+(parseFloat(r.monto)||0)*rate;},0):0;

        const bsActivo=rate?formatVes(ingresosBsToDate-egresosBsToDate):'N/D';
        const bsIngresos=rate?formatVes(ingresosBs):'N/D';
        const bsEgresos=rate?formatVes(egresosBs):'N/D';

        if(monthIncomeEl){
          const ingresosUsdLabel='EUR '+totalIngresos.toFixed(2);
          const ingresosBsLabel=rate?formatVes(ingresosBs):'N/D';
          monthIncomeEl.innerHTML='<div style="font-size:.65rem;opacity:.7;letter-spacing:1px">INGRESOS DEL MES</div>'+
            '<div style="font-size:1.1rem;font-weight:900">'+ingresosUsdLabel+'</div>'+
            '<div style="font-size:.75rem;opacity:.75">'+ingresosBsLabel+' Bs.</div>';
        }
        if(tasaBox){
          tasaBox.innerHTML='<div class="conta-rate-label">Tasa del dia</div><div class="conta-rate-value">'+tasaLabel+'</div><div class="conta-rate-sub">EUR/VES</div>';
        }
        totalEl.innerHTML=
          '<div class="conta-total-row">'+
            '<span class="conta-total-activo">Total activo: EUR '+totalActivo.toFixed(2)+'</span> '+
            '<span class="conta-total-breakdown"><span class="conta-total-ingresos">Ingresos mes: EUR '+totalIngresos.toFixed(2)+'</span> | Egresos mes: EUR '+totalEgresos.toFixed(2)+'</span>'+
          '</div>'+
          '<div class="conta-total-row conta-total-ves">'+
            '<span class="conta-total-activo">Total activo: '+bsActivo+' Bs.</span> '+
            '<span class="conta-total-breakdown"><span class="conta-total-ingresos">Ingresos mes: '+bsIngresos+' Bs.</span> | Egresos mes: '+bsEgresos+' Bs.</span>'+
          '</div>';
      }
      const rateForCards=CONTADURIA_LAST_RATE||0;
      CONTADURIA_INGRESOS_BY_ID={};
      ingresos.forEach(item=>{ CONTADURIA_INGRESOS_BY_ID[item.id]=item; });
      CONTADURIA_EGRESOS_BY_ID={};
      egresos.forEach(item=>{ CONTADURIA_EGRESOS_BY_ID[item.id]=item; });
      const ingresoCards=ingresos.map(item=>{
        const meta=getIngresoMeta(item);
        const nombre=(item.estudiante||'N/A').trim();
        const currency=getContaduriaCurrency(meta, String(item.persona||'')+'|'+String(item.categoria||''));
        const montoValue=getContaduriaCurrencyAmount(item,meta,currency,rateForCards);
        const montoLabel=formatContaduriaCurrencyValue(currency,montoValue);
        const metodo=getContaduriaMetodoLabel(meta.metodo || item.persona || item.categoria);
        const fecha=item.fecha?new Date(item.fecha).toLocaleDateString('es-VE'):'Sin fecha';
        const eurRef=(meta.montoEur||0)>0?(meta.montoEur||0):(rateForCards&&currency==='VES'?(montoValue/rateForCards):0);
        const eurLine=currency==='VES' ? '<div style="opacity:.7;font-size:.62rem;margin-top:4px">EUR: '+eurRef.toFixed(2)+'</div>' : '';
        return '<div class="clase-box contaduria-ingreso-card" onclick="openIngresoDetalle('+item.id+')" style="margin-bottom:10px;cursor:pointer">'+
          '<div class="contaduria-ingreso-main">'+
            '<div style="font-size:.75rem;font-weight:700">'+nombre+'</div>'+
            '<div style="margin-top:6px;font-weight:800">'+montoLabel+'</div>'+
            eurLine+
          '</div>'+
          '<div class="contaduria-ingreso-actions">'+
            '<div class="contaduria-ingreso-meta">'+
              '<div style="font-size:.74rem;font-weight:800;line-height:1.1;color:#f0e3b2">'+metodo+'</div>'+
              '<div style="margin-top:4px;font-size:.7rem;opacity:.78;line-height:1.1">'+fecha+'</div>'+
            '</div>'+
            '<button class="btn-cancelar contaduria-ingreso-btn" onclick="event.stopPropagation();openIngresoEditor('+item.id+')" title="Editar">Editar</button>'+
            '<button class="btn-cancelar contaduria-ingreso-btn contaduria-ingreso-btn--icon" onclick="event.stopPropagation();eliminarIngresoContaduria('+item.id+')" title="Eliminar">X</button>'+
          '</div>'+
        '</div>';
      }).join('');
      const sueldos=egresos.filter(e=>parseContaduriaCategoria(e.categoria).categoriaBase.toLowerCase()==='sueldo');
      const gastosSueltos=egresos.filter(e=>parseContaduriaCategoria(e.categoria).categoriaBase.toLowerCase()==='gasto_suelto');
      const sueldosCards=sueldos.map(item=>{
        const quien=(item.persona||'Sueldo').trim();
        const meta=parseContaduriaCategoria(item.categoria);
        const currency=getContaduriaCurrency(meta, String(item.categoria||'')+'|'+String(item.persona||''));
        const montoValue=getContaduriaCurrencyAmount(item,meta,currency,rateForCards);
        const montoLabel='- '+formatContaduriaCurrencyValue(currency,montoValue);
        const metodo=getContaduriaMetodoLabel(meta.metodo || item.categoria || item.persona);
        const fecha=item.fecha?new Date(item.fecha).toLocaleDateString('es-VE'):'Sin fecha';
        return '<div class="clase-box" onclick="openEgresoDetalle('+item.id+')" style="margin-bottom:10px;display:flex;justify-content:space-between;gap:12px;align-items:center;cursor:pointer">'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-size:.75rem;font-weight:700">'+quien+'</div>'+
            '<div style="margin-top:6px;font-weight:800;color:#ffb3b3">'+montoLabel+'</div>'+
          '</div>'+
          '<div style="display:flex;gap:8px;align-items:center">'+
            '<div style="min-width:112px;padding:9px 10px;border-radius:12px;background:rgba(255,179,179,.06);border:1px solid rgba(255,179,179,.16);box-shadow:inset 0 0 0 1px rgba(255,255,255,.02)">'+
              '<div style="font-size:.74rem;font-weight:800;line-height:1.1;color:#ffd3d3">'+metodo+'</div>'+
              '<div style="margin-top:6px;font-size:.72rem;opacity:.78;line-height:1.1">'+fecha+'</div>'+
            '</div>'+
            '<button class="btn-cancelar" style="padding:8px 10px" onclick="event.stopPropagation();eliminarEgresoContaduria('+item.id+')" title="Eliminar">X</button>'+
          '</div>'+
        '</div>';
      }).join('');
      const gastosCards=gastosSueltos.map(item=>{
        const razon=(item.persona||'Gasto suelto').trim();
        const meta=parseContaduriaCategoria(item.categoria);
        const currency=getContaduriaCurrency(meta, String(item.categoria||'')+'|'+String(item.persona||''));
        const montoValue=getContaduriaCurrencyAmount(item,meta,currency,rateForCards);
        const montoLabel='- '+formatContaduriaCurrencyValue(currency,montoValue);
        const metodo=getContaduriaMetodoLabel(meta.metodo || item.categoria || item.persona);
        const fecha=item.fecha?new Date(item.fecha).toLocaleDateString('es-VE'):'Sin fecha';
        return '<div class="clase-box" onclick="openEgresoDetalle('+item.id+')" style="margin-bottom:10px;display:flex;justify-content:space-between;gap:12px;align-items:center;cursor:pointer">'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-size:.75rem;font-weight:700">'+razon+'</div>'+
            '<div style="margin-top:6px;font-weight:800;color:#ffb3b3">'+montoLabel+'</div>'+
          '</div>'+
          '<div style="display:flex;gap:8px;align-items:center">'+
            '<div style="min-width:112px;padding:9px 10px;border-radius:12px;background:rgba(255,179,179,.06);border:1px solid rgba(255,179,179,.16);box-shadow:inset 0 0 0 1px rgba(255,255,255,.02)">'+
              '<div style="font-size:.74rem;font-weight:800;line-height:1.1;color:#ffd3d3">'+metodo+'</div>'+
              '<div style="margin-top:6px;font-size:.72rem;opacity:.78;line-height:1.1">'+fecha+'</div>'+
            '</div>'+
            '<button class="btn-cancelar" style="padding:8px 10px" onclick="event.stopPropagation();eliminarEgresoContaduria('+item.id+')" title="Eliminar">X</button>'+
          '</div>'+
        '</div>';
      }).join('');
      list.innerHTML=
        '<div class="contaduria-info-section">'+
          '<div class="contaduria-info-title contaduria-info-title--income">Ingresos</div>'+
          '<button class="btn-cancelar" style="padding:8px 10px;margin:6px 0 10px;width:auto" onclick="vaciarIngresosContaduria()">Vaciar registro</button>'+
          (ingresoCards||'<div style="opacity:.65;font-size:.72rem">Sin ingresos registrados.</div>')+
        '</div>'+
        '<div class="contaduria-info-section" style="margin-top:16px">'+
          '<div class="contaduria-info-title contaduria-info-title--expense">Sueldos</div>'+
          '<button class="btn-cancelar" style="padding:8px 10px;margin:6px 0 10px;width:auto" onclick="vaciarEgresosContaduria()">Vaciar registro</button>'+
          (sueldosCards||'<div style="opacity:.65;font-size:.72rem">Sin sueldos registrados.</div>')+
        '</div>'+
        '<div class="contaduria-info-section" style="margin-top:16px">'+
          '<div class="contaduria-info-title contaduria-info-title--expense">Gastos sueltos</div>'+
          (gastosCards||'<div style="opacity:.65;font-size:.72rem">Sin gastos sueltos registrados.</div>')+
        '</div>';
    }

    function getContaduriaCurrency(meta, rawFallback){
      const metodo=normalizeMetodoValue((meta&&meta.metodo)?meta.metodo:extractMetodoFromRaw(rawFallback));
      if(metodo==='pago_movil' || (meta&&meta.moneda==='VES') || ((meta&&meta.montoVes)||0)>0) return 'VES';
      if(metodo==='usdt' || (meta&&meta.moneda==='USDT')) return 'USDT';
      return 'EUR';
    }

    function getContaduriaCurrencyAmount(row, meta, currency, rate){
      if(currency==='VES'){
        const ves=(meta&&meta.montoVes)?Number(meta.montoVes):0;
        if(Number.isFinite(ves) && ves>0) return ves;
        const base=Number(parseFloat(row?.monto)||0);
        if(Number.isFinite(base) && Number.isFinite(rate) && rate>0) return base*rate;
        return 0;
      }
      return Number(parseFloat(row?.monto)||0);
    }

    function formatContaduriaCurrencyValue(currency, amount){
      const val=Number(amount)||0;
      if(currency==='VES') return formatVes(val)+' Bs.';
      if(currency==='USDT') return val.toFixed(2)+' USDT';
      return 'EUR '+val.toFixed(2);
    }

    function buildContaduriaSaldoMovements(rows, rate){
      const out={EUR:[],USDT:[],VES:[]};
      (rows||[]).forEach(row=>{
        if(row.tipo==='ingreso'){
          const meta=getIngresoMeta(row);
          const currency=getContaduriaCurrency(meta, String(row.persona||'')+'|'+String(row.categoria||''));
          const amount=getContaduriaCurrencyAmount(row,meta,currency,rate);
          const baseName=(row.estudiante||'Ingreso').trim()||'Ingreso';
          const level=(row.plan_nivel||'').trim();
          const concept=level? (baseName+' - '+level) : baseName;
          out[currency].push({
            id:row.id,
            type:'ingreso',
            amount:amount,
            concept:concept,
            dateLabel:row.fecha?new Date(row.fecha).toLocaleDateString('es-VE'):'Sin fecha'
          });
          return;
        }
        if(row.tipo==='egreso'){
          const meta=parseContaduriaCategoria(row.categoria);
          const currency=getContaduriaCurrency(meta, String(row.categoria||'')+'|'+String(row.persona||''));
          const amount=getContaduriaCurrencyAmount(row,meta,currency,rate);
          const cat=(meta.categoriaBase||'egreso').replace(/_/g,' ');
          const person=(row.persona||'Egreso').trim()||'Egreso';
          out[currency].push({
            id:row.id,
            type:'egreso',
            amount:amount,
            concept:person+' - '+cat,
            dateLabel:row.fecha?new Date(row.fecha).toLocaleDateString('es-VE'):'Sin fecha'
          });
        }
      });
      return out;
    }

    function renderContaduriaSaldoDetail(movementsByCurrency, currency){
      const detail=document.getElementById('contaduria-saldo-detail');
      if(!detail) return;
      const list=(movementsByCurrency&&movementsByCurrency[currency])?movementsByCurrency[currency]:[];
      const ingresos=list.filter(item=>item.type==='ingreso');
      const egresos=list.filter(item=>item.type==='egreso');
      const block=(title,items,isExpense)=>{
        if(!items.length){
          return '<div class="conta-saldo-empty">Sin '+(isExpense?'gastos':'ingresos')+' en esta moneda.</div>';
        }
        return items.map(item=>{
          const amountText=formatContaduriaCurrencyValue(currency,item.amount);
          const amountClass=isExpense?'conta-saldo-item-amount conta-saldo-item-amount--expense':'conta-saldo-item-amount';
          const prefix=isExpense?'- ':'+ ';
          return '<div class="conta-saldo-item">'+
            '<div class="conta-saldo-item-main">'+
              '<div class="conta-saldo-item-concept">'+item.concept+'</div>'+
              '<div class="conta-saldo-item-date">'+item.dateLabel+'</div>'+
            '</div>'+
            '<div class="'+amountClass+'">'+prefix+amountText+'</div>'+
          '</div>';
        }).join('');
      };
      detail.innerHTML=
        '<div class="conta-saldo-detail-title">Movimientos '+(currency==='VES'?'BS':currency)+'</div>'+
        '<div class="conta-saldo-detail-group">'+
          '<div class="conta-saldo-detail-sub">Ingresos</div>'+
          block('Ingresos', ingresos, false)+
        '</div>'+
        '<div class="conta-saldo-detail-group">'+
          '<div class="conta-saldo-detail-sub">Gastos</div>'+
          block('Gastos', egresos, true)+
        '</div>';
    }

    function openContaduriaSaldoCurrency(currency){
      CONTADURIA_SALDO_ACTIVE=currency;
      const buttons=document.querySelectorAll('.conta-saldo-card');
      buttons.forEach(btn=>{
        const active=btn.getAttribute('data-currency')===currency;
        btn.classList.toggle('active',active);
      });
      renderContaduriaSaldoDetail(CONTADURIA_INFO_CACHE.saldoMovements||{EUR:[],USDT:[],VES:[]}, currency);
    }

    async function loadContaduriaSaldo(){
      const grid=document.getElementById('contaduria-saldo-grid');
      const detail=document.getElementById('contaduria-saldo-detail');
      if(!grid || !detail) return;
      if(!CONTADURIA_INFO_CACHE.rows){
        await loadContaduriaInfo();
      }
      const rows=CONTADURIA_INFO_CACHE.rows||[];
      const rate=CONTADURIA_LAST_RATE || await fetchEuroVesRate();
      CONTADURIA_LAST_RATE=rate;
      const movementsByCurrency=buildContaduriaSaldoMovements(rows, rate);
      CONTADURIA_INFO_CACHE.saldoMovements=movementsByCurrency;

      const currencies=['USDT','EUR','VES'];
      const balances={EUR:0,USDT:0,VES:0};
      const incomes={EUR:0,USDT:0,VES:0};
      const expenses={EUR:0,USDT:0,VES:0};
      currencies.forEach(cur=>{
        const list=movementsByCurrency[cur]||[];
        list.forEach(item=>{
          if(item.type==='ingreso'){
            incomes[cur]+=item.amount;
            balances[cur]+=item.amount;
          }else{
            expenses[cur]+=item.amount;
            balances[cur]-=item.amount;
          }
        });
      });
      grid.innerHTML=
        '<div class="conta-saldo-grid">'+
          currencies.map(cur=>{
            const label=(cur==='VES'?'BS':cur);
            const activeClass=CONTADURIA_SALDO_ACTIVE===cur?' active':'';
            return '<button type="button" class="conta-saldo-card'+activeClass+'" data-currency="'+cur+'" onclick="openContaduriaSaldoCurrency(\''+cur+'\')">'+
              '<div class="conta-saldo-card-label">'+label+'</div>'+
              '<div class="conta-saldo-card-amount">'+formatContaduriaCurrencyValue(cur, balances[cur])+'</div>'+
              '<div class="conta-saldo-card-meta">Ingreso: '+formatContaduriaCurrencyValue(cur, incomes[cur])+'</div>'+
              '<div class="conta-saldo-card-meta">Gasto: '+formatContaduriaCurrencyValue(cur, expenses[cur])+'</div>'+
            '</button>';
          }).join('')+
        '</div>';
      if(!currencies.includes(CONTADURIA_SALDO_ACTIVE)) CONTADURIA_SALDO_ACTIVE='EUR';
      openContaduriaSaldoCurrency(CONTADURIA_SALDO_ACTIVE);
    }

    function buildContaduriaNivelOptions(selected){
      const niveles=CONTADURIA_INGRESO_LEVELS;
      const selectedNorm=normalizeContaduriaNivelValue(selected);
      return '<option value="">Selecciona clase</option>'+niveles.map(n=>'<option '+(normalizeContaduriaNivelValue(n)===selectedNorm?'selected':'')+'>'+n+'</option>').join('');
    }

    function getContaduriaPlanesByNivel(nivel){
      const raw=String(nivel||'').trim();
      if(!raw) return [];
      if(CONTADURIA_PLANES[raw]) return CONTADURIA_PLANES[raw];
      const match=Object.keys(CONTADURIA_PLANES).find(key=>key.toLowerCase()===raw.toLowerCase());
      return match ? CONTADURIA_PLANES[match] : [];
    }

    function buildContaduriaPlanOptions(nivel,selected){
      if(isContaduriaBirthdayNivel(nivel)){
        return '<option value="">Selecciona tipo</option>'+CONTADURIA_BIRTHDAY_TYPES.map(item=>'<option value="'+item.name+'" data-price="'+item.price+'" '+(item.name===selected?'selected':'')+'>'+item.name+'</option>').join('');
      }
      if(isSueltaNivel(nivel)){
        return '<option value="">No aplica</option>';
      }
      const list=getContaduriaPlanesByNivel(nivel);
      return '<option value="">Selecciona plan</option>'+list.map(p=>'<option value="'+p.name+'" data-price="'+p.price+'" '+(p.name===selected?'selected':'')+'>'+p.name+'</option>').join('');
    }

        function getContaduriaMetodoLabel(metodo){
      if(!metodo) return 'Sin metodo';
      const norm=normalizeMetodoValue(metodo);
      if(CONTADURIA_PAYMENT_LABELS[norm]) return CONTADURIA_PAYMENT_LABELS[norm];
      return metodo;
    }

    function openIngresoDetalle(id){
      const item=CONTADURIA_INGRESOS_BY_ID[id];
      if(!item){ alert('No se encontro el ingreso.'); return; }
      const meta=getIngresoMeta(item);
      const nombre=(item.estudiante||'N/A').trim();
      const nivel=(item.plan_nivel||'').trim();
      const plan=(item.plan||'').trim();
      const fecha=item.fecha?new Date(item.fecha).toLocaleDateString('es-VE'):'Sin fecha';
      const metodo=getContaduriaMetodoLabel(meta.metodo || item?.persona || item?.categoria);
      const isSuelta=isSueltaNivel(nivel);
      const detailLabel=isContaduriaBirthdayNivel(nivel)?'Tipo':'Plan';
      const planLine=(!isSuelta && plan)?`<div class="contaduria-detail-chip"><span>${detailLabel}</span><strong>${plan}</strong></div>`:'';
      const bodyHtml=
        `<div class="modal-form-shell contaduria-detail-modal">
          <div class="contaduria-detail-name">${nombre}</div>
          <div class="contaduria-detail-chip"><span>Clase</span><strong>${nivel||'Sin clase'}</strong></div>
          ${planLine}
          <div class="contaduria-detail-grid">
            <div class="contaduria-detail-item">
              <span>Fecha</span>
              <strong>${fecha}</strong>
            </div>
            <div class="contaduria-detail-item">
              <span>Metodo</span>
              <strong>${metodo}</strong>
            </div>
          </div>
        </div>`;
      openModal('Detalle de ingreso', bodyHtml);
    }

    function openEgresoDetalle(id){
      const item=CONTADURIA_EGRESOS_BY_ID[id];
      if(!item){ alert('No se encontro el egreso.'); return; }
      const meta=parseContaduriaCategoria(item.categoria);
      const persona=(item.persona||'Egreso').trim();
      const categoria=(meta.categoriaBase||'egreso').trim();
      const fecha=item.fecha?new Date(item.fecha).toLocaleDateString('es-VE'):'Sin fecha';
      const metodo=getContaduriaMetodoLabel(meta.metodo || item?.categoria || item?.persona);
      const currency=getContaduriaCurrency(meta, String(item.categoria||'')+'|'+String(item.persona||''));
      const montoPrimario=getContaduriaCurrencyAmount(item,meta,currency,CONTADURIA_LAST_RATE||0);
      const montoLabel=formatContaduriaCurrencyValue(currency,montoPrimario);
      let montoVes=meta.montoVes||0;
      const montoVesLabel=montoVes?formatVes(montoVes):'...';
      const bsId=`egreso-bs-${id}`;
      const bodyHtml=
        `<div class="modal-form-shell contaduria-detail-modal">
          <div style="font-weight:800;font-size:.95rem;margin-bottom:8px">${persona}</div>
          <div style="font-size:.9rem;opacity:.9">Categoria: ${categoria}</div>
          <div style="font-size:.9rem;opacity:.9">Fecha: ${fecha}</div>
          <div style="font-size:.9rem;opacity:.9">Metodo: ${metodo}</div>
          <div style="font-size:1rem;margin-top:12px"><b>Monto:</b> ${montoLabel}</div>
          <div id="${bsId}" style="font-size:1rem;margin-top:8px"><b>Monto Bs:</b> ${montoVesLabel} Bs.</div>
        </div>`;
      openModal('Detalle de egreso', bodyHtml);
      if(!montoVes){
        fetchEuroVesRate().then(rate=>{
          const el=document.getElementById(bsId);
          if(!el) return;
          const val=rate?formatVes(parseFloat(item.monto||0)*rate):'N/D';
          el.innerHTML = '<b>Monto Bs:</b> '+val+' Bs.';
        });
      }
    }
    function openIngresoEditor(id){
      const item=CONTADURIA_INGRESOS_BY_ID[id];
      if(!item){ alert('No se encontro el ingreso.'); return; }
      const nivel=item.plan_nivel||'';
      const plan=item.plan||'';
      const monto=(parseFloat(item.monto)||0).toFixed(2);
      const bodyHtml=
        '<div class="modal-form-shell contaduria-edit-modal">'+
          '<label>Clase</label>'+
          '<select id="edit-ingreso-nivel" onchange="updateIngresoEditorPlan()">'+buildContaduriaNivelOptions(nivel)+'</select>'+
          '<div id="edit-ingreso-plan-wrap">'+
            '<label id="edit-ingreso-plan-label">Plan</label>'+
            '<select id="edit-ingreso-plan">'+buildContaduriaPlanOptions(nivel,plan)+'</select>'+
          '</div>'+
          '<label>Total</label>'+
          '<input id="edit-ingreso-total" type="number" min="0" step="0.01" value="'+monto+'">'+
          '<div style="display:flex;gap:10px;margin-top:14px">'+
            '<button class="btn-principal" onclick="saveIngresoEditor('+id+')">Guardar cambios</button>'+
            '<button class="btn-cancelar" onclick="closeModal()">Cancelar</button>'+
          '</div>'+
        '</div>';
      openModal('Editar ingreso', bodyHtml);
      updateIngresoEditorPlan();
    }

    function updateIngresoEditorPlan(){
      const nivel=document.getElementById('edit-ingreso-nivel')?.value||'';
      const plan=document.getElementById('edit-ingreso-plan');
      const planWrap=document.getElementById('edit-ingreso-plan-wrap');
      const planLabel=document.getElementById('edit-ingreso-plan-label');
      if(!plan) return;
      if(planWrap) planWrap.style.display=isSueltaNivel(nivel)?'none':'block';
      if(planLabel) planLabel.textContent=isContaduriaBirthdayNivel(nivel)?'Tipo':'Plan';
      plan.innerHTML=buildContaduriaPlanOptions(nivel,'');
    }

    async function saveIngresoEditor(id){
      const nivel=document.getElementById('edit-ingreso-nivel')?.value||'';
      const plan=document.getElementById('edit-ingreso-plan')?.value||'';
      const total=parseFloat(document.getElementById('edit-ingreso-total')?.value||'0');
      const birthdayMode=isContaduriaBirthdayNivel(nivel);
      const requiresPlan=!birthdayMode && !isSueltaNivel(nivel);
      if(!nivel||!Number.isFinite(total)||total<=0||(requiresPlan&&!plan)||(birthdayMode&&!plan)){
        alert('Completa clase, plan y total valido.');
        return;
      }
      const res=await _sp.from(CONTADURIA_TABLE).update({plan_nivel:nivel,plan:plan,monto:total}).eq('id', id);
      if(res.error){ alert('No se pudo actualizar.'); return; }
      closeModal();
      loadContaduriaInfo();
    }

        async function eliminarIngresoContaduria(id){
      const ok=confirm('Estas seguro de esto?');
      if(!ok) return;
      const res=await _sp.from(CONTADURIA_TABLE).delete().eq('id', id);
      if(res.error){
        // Fallback: marcar como eliminado si delete no esta permitido
        const item=CONTADURIA_INGRESOS_BY_ID[id];
        if(item){
          const base=String(item.categoria||'clase');
          const next=base.includes('eliminado')?base:(base+'|estado=eliminado');
          const res2=await _sp.from(CONTADURIA_TABLE).update({categoria:next}).eq('id', id);
          if(!res2.error){
            loadContaduriaInfo();
            return;
          }
        }
        alert('No se pudo eliminar: '+(res.error.message||JSON.stringify(res.error)));
        return;
      }
      loadContaduriaInfo();
    }

        async function eliminarEgresoContaduria(id){
      const ok=confirm('Estas seguro de esto?');
      if(!ok) return;
      const res=await _sp.from(CONTADURIA_TABLE).delete().eq('id', id);
      if(res.error){
        // Fallback: marcar como eliminado si delete no esta permitido
        const item=(await _sp.from(CONTADURIA_TABLE).select('categoria').eq('id', id).maybeSingle()).data;
        if(item){
          const base=String(item.categoria||'egreso');
          const next=base.includes('eliminado')?base:(base+'|estado=eliminado');
          const res2=await _sp.from(CONTADURIA_TABLE).update({categoria:next}).eq('id', id);
          if(!res2.error){
            loadContaduriaInfo();
            return;
          }
        }
        alert('No se pudo eliminar: '+(res.error.message||JSON.stringify(res.error)));
        return;
      }
      loadContaduriaInfo();
    }
async function vaciarIngresosContaduria(){
      const ok=confirm('Estas seguro de esto?');
      if(!ok) return;
      const res=await _sp.from(CONTADURIA_TABLE).delete().eq('tipo','ingreso');
      if(res.error){ alert('No se pudo vaciar el registro.'); return; }
      loadContaduriaInfo();
    }

    async function vaciarEgresosContaduria(){
      const ok=confirm('Estas seguro de esto?');
      if(!ok) return;
      const res=await _sp.from(CONTADURIA_TABLE).delete().eq('tipo','egreso');
      if(res.error){ alert('No se pudo vaciar el registro.'); return; }
      loadContaduriaInfo();
    }

    async function retirarPagoVariable(){
      const persona=document.getElementById('contad-persona-variable')?.value||'';
      const fecha=document.getElementById('contad-variable-fecha')?.value||'';
      const metodo=document.getElementById('contad-retiro-metodo')?.value||'';
      const montoRaw=document.getElementById('contad-variable-monto')?.value||'';
      const monto=parseMontoInput(montoRaw);
      if(!persona||!fecha||!metodo||!Number.isFinite(monto)||monto<=0){
        alert('Selecciona persona, fecha, metodo y cantidad valida.');
        return;
      }
      const fechaIso=new Date(fecha+'T00:00:00').toISOString();
      const meta=await buildEgresoMeta(metodo,monto);
      const payload={tipo:'egreso',persona:persona,categoria:'sueldo|'+meta.metaExtra,monto:meta.montoUsd,fecha:fechaIso};
      const res=await _sp.from(CONTADURIA_TABLE).insert([payload]);
      if(res.error){ alert('No se pudo registrar el retiro.'); return; }
      alert('Retiro registrado.');
      refreshContaduriaInfoIfVisible();
    }

function buildMiniCalendar(dateObj){
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const weekDays = ['D','L','M','X','J','V','S'];
  const y = dateObj.getFullYear();
  const m = dateObj.getMonth();
  const d = dateObj.getDate();
  const first = new Date(y, m, 1);
  const firstDay = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayInfo = getTodayAgendaInfo();
  const classLabel = todayInfo.count===1 ? 'clase' : 'clases';
  const dayLabel = dateObj.toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' });

  let cells = '';
  for(let i=0;i<firstDay;i++) cells += '<span class="mini-cal-cell empty"></span>';
  for(let day=1; day<=daysInMonth; day++){
    const active = day===d ? ' active' : '';
    cells += `<span class="mini-cal-cell${active}">${day}</span>`;
  }

  return `
    <div class="mini-cal-topline">${dayLabel}</div>
    <div class="mini-cal-summary">Hoy: <b>${todayInfo.count}</b> ${classLabel}</div>
    <div class="mini-cal-expand-hint">Toca para ver detalle</div>
    <div class="mini-cal-details">
      <div class="mini-cal-week">${weekDays.map(w=>`<span>${w}</span>`).join('')}</div>
      <div class="mini-cal-grid">${cells}</div>
      <div class="mini-cal-daynote">${todayInfo.hasAgendaDay ? `Día activo: ${todayInfo.dia}` : 'Hoy no hay agenda (domingo)'}</div>
    </div>`;
}

























































