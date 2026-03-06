const _sp=supabase.createClient("https://iodtfnclwwgcczxgbmbq.supabase.co","sb_publishable_uOUPFEp0T_uX85fjqi9xog_6WUS6dKg");
    const DIAS=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
    const CLASES=["Align Flow","Power Flow","Stretch&Release","Aerial Balance","Mega Core","Full Body","Life Align"];
    const MODALIDADES=["Grupales","Privadas","Masajes","Cumpleaños"];
    const FRECUENCIAS=["1/semana","2/semana","3/semana"];
    const WS_ICON_URL="https://i.postimg.cc/9M0NRgcD/Whats-App-svg.webp";
    const CELDA_DB="DB_ENTRY",CELDA_SOLICITUD="SOLICITUD_WEB",CELDA_RESET_META="SYS_WEEK_RESET";
    const DEFAULT_COUNTRY='';
    const SOL_SEEN_KEY='sol_seen_count';
    const WEEK_ACTIVE_KEY='week_active_key';
    const NOTIF_DISMISSED_KEY='notif_dismissed_keys';
    const BIRTHDAY_INTERVAL_MS=2*60*60*1000;
    const BIRTHDAY_LAST_SHOWN_KEY='birthday_last_shown_at';
    let CACHE_ALUMNOS=[],CACHE_HORARIOS=[],CACHE_SOLICITUDES=[];
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
    let BIRTHDAY_PROMPT_TIMER=null;
    let BIRTHDAY_FIREWORKS_CTRL=null;
    let CURRENT_NOTIF_SIGNATURE='';
    let LAST_SEEN_NOTIF_SIGNATURE='';

    function classColor(){return 'var(--celeste)';}
    function sanitizeTel(t){if(!t)return '';let s=(''+t).replace(/\D/g,'').replace(/^00+/,'').replace(/^0+/,'');if(DEFAULT_COUNTRY&&s&&!s.startsWith(DEFAULT_COUNTRY)&&s.length<=9)s=DEFAULT_COUNTRY+s;return s;}
    function normalizeTelForWhatsapp(t){return (''+(t||'')).replace(/[^\d]/g,'');}
    function decodeHtmlEntities(txt){const el=document.createElement('textarea');el.innerHTML=txt||'';return el.value||'';}
    function a24h(h){if(!h)return 0;let[t,ap]=h.split(' ');let[hh,mm]=t.split(':').map(Number);if(ap==="PM"&&hh<12)hh+=12;if(ap==="AM"&&hh===12)hh=0;return hh*60+mm;}

    window.onload=()=>{initBokeh();localStorage.getItem('studio_auth')?startApp():openLanding();};
    function hidePublicScreens(){['landing-section','agenda-publica-section','login-section','app-content'].forEach(id=>document.getElementById(id).style.display='none');}
    function openLanding(){hidePublicScreens();document.getElementById('landing-section').style.display='flex';}
    function openLogin(){hidePublicScreens();document.getElementById('login-section').style.display='flex';}
    function openAgendaPublica(){hidePublicScreens();document.getElementById('agenda-publica-section').style.display='flex';}
    function ensureModalRoot(){
      let root=document.getElementById('app-modal-root');
      if(root) return root;
      root=document.createElement('div');
      root.id='app-modal-root';
      document.body.appendChild(root);
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
    function closeModal(){
      const root=document.getElementById('app-modal-root');
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
      const u=document.getElementById('adminUser').value,p=document.getElementById('adminPass').value;
      const {data}=await _sp.from('usuarios_admin').select('id').eq('usuario',u).eq('password',p).maybeSingle();
      if(data){localStorage.setItem('studio_auth','true');startApp();} else alert("Acceso denegado");
    }
    function handleLogout(){localStorage.removeItem('studio_auth');location.reload();}
    async function startApp(){hydrateDismissedNotifications();hidePublicScreens();document.getElementById('app-content').style.display='block';ACTIVE_WEEK_KEY=localStorage.getItem(WEEK_ACTIVE_KEY)||getWeekStartKey(new Date());renderEstructura();await ensureWeeklyReset();updateWeekIndicators();if(CLOCK_TIMER)clearInterval(CLOCK_TIMER);CLOCK_TIMER=setInterval(updateWeekIndicators,1000);await updateAll();switchModulo('modulo-agenda');showBirthdayNotices();if(BIRTHDAY_TIMER)clearInterval(BIRTHDAY_TIMER);BIRTHDAY_TIMER=setInterval(()=>showBirthdayNotices(),BIRTHDAY_INTERVAL_MS);}

    function generarHoras(selected=""){let r="";for(let i=7;i<=21;i++){let h=i>12?i-12:i,ampm=i>=12?"PM":"AM";let t1=`${h}:00 ${ampm}`,t2=`${h}:30 ${ampm}`;r+=`<option ${selected==t1?'selected':''}>${t1}</option><option ${selected==t2?'selected':''}>${t2}</option>`;}return r;}
    function toggleDia(d){const el=document.getElementById(`cont-${d}`),vis=el.style.display==='block';document.querySelectorAll('.dia-content').forEach(c=>c.style.display='none');el.style.display=vis?'none':'block';if(vis){toggleMiniCalendar(false);return;}renderAgendaDay(d);}

    function renderEstructura(){
      document.getElementById('listaDias').innerHTML=`
        <div class="agenda-hero">
          <div class="agenda-hero-main">
            <div id="current-day-hero" class="agenda-day-hero"></div>
            <div id="current-time-hero" class="agenda-time-hero"></div>
          </div>
          <div id="mini-calendar" class="mini-calendar"></div>
        </div>
        <div class="clase-box week-card" style="padding:14px 16px; margin-bottom:14px;">
          <div id="fecha-actual" class="date-main"></div>
          <div id="week-range" class="date-week"></div>
          <div style="display:flex; gap:8px;">
            <button class="btn-cancelar" style="margin:0; font-size:.56rem; letter-spacing:1px;" onclick="goPrevWeek()">VOLVER</button>
            <button class="btn-cancelar" style="margin:0; font-size:.56rem; letter-spacing:1px;" onclick="goNextWeek()">SIGUIENTE SEMANA</button>
          </div>
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
        <label>HORA</label><select id="h-${dia}">${generarHoras(p[0])}</select>
        <label>TIPO DE CLASE</label><select id="t-${dia}">${CLASES.map(c=>`<option ${p[1]==c?'selected':''}>${c}</option>`).join('')}</select>
        <label>MODALIDAD</label><select id="m-${dia}">${MODALIDADES.map(m=>`<option ${p[2]==m?'selected':''}>${m}</option>`).join('')}</select>
        <label>ALUMNO(S) - (Separar por coma)</label><input type="text" id="n-${dia}" value="${p[3]}">
        <button class="btn-principal" style="padding:12px;font-size:.6rem;letter-spacing:1px" onclick="pushClase('${dia}','${editId}')">GUARDAR</button>
        ${editId?`<button class="btn-cancelar" style="background:var(--danger);color:#fff;padding:10px;font-size:.5rem;border:none" onclick="borrar('${editId}')">ELIMINAR</button>`:''}
        <button class="btn-cancelar" style="padding:10px;font-size:.5rem" onclick="closeModal()">CANCELAR</button>
      </div>`;
      openModal(editId?'Editar clase':'Nueva clase',formHtml);
    }

    function formatAlumnosAgenda(texto,horaClase,tipoClase){
      if(!texto)return '';
      return texto.split(',').map((nombreRaw,i)=>{
        const nombreLimpio=nombreRaw.trim();
        const alumnoDB=CACHE_ALUMNOS_IDX[nombreLimpio.toLowerCase()];
        let linkWs='';
        if(alumnoDB&&alumnoDB.tel){const msg=encodeURIComponent(`Buenas tardes ${nombreLimpio}!!\nTienes una reservación para recibir tu clase de ${tipoClase}\nHorario: ${horaClase}\nPor favor, confirmar asistencia.\nPilates Pulse.\n¡Te esperamos!`);linkWs=`<a href="https://wa.me/${alumnoDB.tel}?text=${msg}" target="_blank"><img src="${WS_ICON_URL}" class="ws-agenda-icon"></a>`;}
        return `<div style="margin-bottom:6px;display:flex;align-items:center"><span>${i+1}-${nombreLimpio}</span>${linkWs}</div>`;
      }).join('');
    }

    function buildAlumnoIndex(){
      const idx={};
      CACHE_ALUMNOS.forEach(a=>{
        const p=a.contenido.split('|');
        const name=(p[1]||'').trim().toLowerCase();
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
        const p=i.contenido.split('|');
        return `<div class="clase-box" style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:.75rem;line-height:1.4"><b>${p[0]}</b> — <span style="color:${classColor(p[1])};font-weight:800">${p[1]}</span><br><small style="color:#ffd36a;font-weight:800;letter-spacing:.3px;">${p[2]}</small><br><div style="margin-top:8px">${formatAlumnosAgenda(p[3],p[0],p[1])}</div></span><div style="display:flex;gap:10px;align-items:center"><span onclick="addClasePopup('${dia}','${i.id}','${i.contenido}')" style="cursor:pointer;font-size:.9rem;opacity:.72">&#9998;</span><span onclick="borrar('${i.id}')" style="opacity:.35;cursor:pointer;font-weight:900">&#10060;</span></div></div>`;
      }).join('');
      box.dataset.ver=ver;
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

    function formatTodayLabel(){
      return new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' });
    }

    function formatHeroDayLabel(){
      return new Date().toLocaleDateString('es-MX', { weekday:'long' }).toUpperCase();
    }

    function formatHeroTimeLabel(){
      return new Date().toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' });
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
      const dayMap = { 1:'Lunes', 2:'Martes', 3:'Miércoles', 4:'Jueves', 5:'Viernes', 6:'Sábado' };
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
      CACHE_ALUMNOS=rows.filter(x=>x.celda_id===CELDA_DB);
      CACHE_SOLICITUDES=rows.filter(x=>x.celda_id===CELDA_SOLICITUD);
      const currentWeekKey = getWeekStartKey(new Date());
      CACHE_HORARIOS=rows
        .filter(x=>x.celda_id!==CELDA_DB&&x.celda_id!==CELDA_SOLICITUD&&x.celda_id!==CELDA_RESET_META&&!String(x.celda_id).startsWith('ARCHIVE_'))
        .map(x=>{
          const rawId = String(x.celda_id||'');
          // Compatibilidad con registros viejos sin semana: solo mostrarlos en semana actual.
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
      if(!CACHE_SOLICITUDES.length){cont.innerHTML=`<p style="text-align:center;opacity:.3;font-size:.7rem;font-style:italic;margin-top:30px">No hay solicitudes aún.</p>`;return;}
      cont.innerHTML=CACHE_SOLICITUDES.slice().sort((a,b)=>new Date((b.contenido.split('|')[6]||'')).getTime()-new Date((a.contenido.split('|')[6]||'')).getTime()).map(s=>{
        const p=s.contenido.split('|'),nombre=p[1]||'Sin nombre',telRaw=p[2]||'',edad=p[3]||'',razon=p[4]||'',salud=p[5]||'',fecha=p[6]?new Date(p[6]).toLocaleString('es-MX'):'Sin fecha',telSan=sanitizeTel(telRaw);
        const ws=telSan.length>=8?`<a class="ws-wrapper" target="_blank" href="https://wa.me/${telSan}"><img src="${WS_ICON_URL}" class="ws-icon"><span class="ws-number">${telRaw}</span></a>`:`<span class="ws-wrapper"><img src="${WS_ICON_URL}" class="ws-icon"><span class="ws-number">${telRaw}</span></span>`;
        return `<div class="clase-box"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><b style="font-size:.85rem">${nombre}</b><br><small style="opacity:.6">Edad: ${edad}</small><br>${ws}</div><small style="opacity:.45;font-size:.62rem;text-align:right">${fecha}</small></div><div style="margin-top:12px;font-size:.75rem;line-height:1.5"><b style="color:var(--celeste)">Razón:</b> ${razon}<br><b style="color:var(--celeste)">Salud:</b> ${salud}</div><button style="margin-top:12px;background:transparent;border:none;color:var(--danger);font-size:.58rem;font-weight:900;cursor:pointer" onclick="borrar('${s.id}')">BORRAR SOLICITUD</button></div>`;
      }).join('');
    }

    function renderCronograma(){
      const container=document.getElementById('render-cronograma');
      container.innerHTML=DIAS.map(dia=>{const clasesDelDia=CACHE_HORARIOS.filter(x=>x.celda_id===dia);return `<div class="crono-row"><div class="crono-dia-label">${dia}</div><div class="crono-list">${clasesDelDia.length>0?clasesDelDia.map(c=>{const p=c.contenido.split('|');return `<div class="crono-task"><div class="crono-task-main"><div style="display:flex;align-items:center;cursor:pointer" onclick="toggleCronoDetail('${c.id}')"><div class="crono-bullet"></div><b>${p[0]}</b>&nbsp;—&nbsp;<span style="color:${classColor(p[1])};font-weight:800">${p[1]}</span></div><span style="cursor:pointer;font-size:1rem;padding:5px;opacity:.78" onclick="addClasePopup('${dia}','${c.id}','${c.contenido}')">&#9998;</span></div><div id="crono-detail-${c.id}" class="crono-detail-box"><b style="color:var(--celeste)">ALUMNOS:</b><br><div style="margin-top:5px;color:#fff">${p[3].split(',').map((n,i)=>`${i+1}-${n.trim()}`).join('<br>')}</div><div style="margin-top:10px;color:#ffd36a;font-weight:800;"><b style="color:#ffd36a">MODALIDAD:</b> ${p[2]}</div></div></div>`;}).join(''):'<div style="opacity:.2;font-size:.7rem;margin-left:18px;font-style:italic">Sin clases</div>'}</div></div>`;}).join('');
    }
    function toggleCronoDetail(id){const el=document.getElementById(`crono-detail-${id}`),v=el.style.display==='block';document.querySelectorAll('.crono-detail-box').forEach(b=>b.style.display='none');el.style.display=v?'none':'block';}
    function checkVencimiento(f){if(!f)return false;const h=new Date(),v=new Date(f+"T23:59:59");return (v-h)/(1000*60*60)<=48;}

    function renderAlumnosList(lista){
      document.getElementById('render-alumnos').innerHTML=lista.map(a=>{
        const p=a.contenido.split('|'),estaVencido=checkVencimiento(p[10]),telSan=sanitizeTel(p[2]||''),hasTel=telSan&&telSan.length>=8;
        return `<div class="clase-box"><b style="font-size:.85rem" class="${estaVencido?'vence-alerta':''}">${p[1]||'SIN NOMBRE'}</b><br>${hasTel?`<a href="https://wa.me/${telSan}" target="_blank" class="ws-wrapper"><img src="${WS_ICON_URL}" class="ws-icon"><span class="ws-number">${p[2]}</span></a>`:`<span class="ws-wrapper"><img src="${WS_ICON_URL}" class="ws-icon"><span class="ws-number">${p[2]}</span></span>`}<br><small style="opacity:.5"><span style="color:${classColor(p[3])};font-weight:800">${p[3]}</span> — ${p[4]}</small><div id="extra-${a.id}" class="ficha-detalles"><p><b>EDAD:</b> ${p[11]} años</p><p><b>TELÉFONO:</b> ${p[2]}</p><p><b style="color:#ffd36a">MODALIDAD:</b> <span style="color:#ffd36a;font-weight:800">${p[5]}</span></p><p><b>VENCIMIENTO:</b> <span class="${estaVencido?'vence-alerta':''}">${p[10]||'N/A'}</span></p><hr style="opacity:.1;margin:10px 0"><p><b>SALUD:</b> ${p[6]||'Ninguna'}</p><p><b>VISITA:</b> ${p[7]||'N/A'}</p><p><b>ORIGEN:</b> ${p[8]||'N/A'}</p><p><b>REFERIDO:</b> ${p[9]}</p><button class="btn-principal" style="padding:10px;font-size:.55rem;margin-top:15px;letter-spacing:1px" onclick="abrirFormNuevoAlumno('${a.id}','${a.contenido}')">EDITAR</button></div><div style="margin-top:15px;display:flex;gap:10px;justify-content:space-between;align-items:center"><button class="nav-btn" style="padding:10px 20px;font-size:.5rem;background:#1a1a1c;border-color:#333;letter-spacing:1px" onclick="toggleExtra('${a.id}')">DETALLES</button><button style="background:transparent;border:none;color:var(--danger);font-size:.55rem;font-weight:900;cursor:pointer;opacity:.8" onclick="borrar('${a.id}')">BORRAR</button></div></div>`;
      }).join('');
    }


    function hydrateDismissedNotifications(){
      NOTIF_DISMISSED.clear();
      try{
        const raw=localStorage.getItem(NOTIF_DISMISSED_KEY)||'[]';
        const arr=JSON.parse(raw);
        if(Array.isArray(arr)) arr.forEach(k=>NOTIF_DISMISSED.add(String(k)));
      }catch{}
    }

    function persistDismissedNotifications(){
      localStorage.setItem(NOTIF_DISMISSED_KEY, JSON.stringify(Array.from(NOTIF_DISMISSED)));
    }

        function processVencimientos(){
      const listaNotif=document.getElementById('lista-notificaciones');
      if(!listaNotif) return;

      const alertas=CACHE_ALUMNOS.filter(a=>checkVencimiento(a.contenido.split('|')[10])&&!NOTIF_DISMISSED.has(`v:${a.id}`));
      const cumplePend=getCumpleanerosHoy().filter(c=>!isBirthdayHandledToday(c.nombre)&&!NOTIF_DISMISSED.has(`c:${(c.nombre||'').trim().toLowerCase()}`));

      document.getElementById('active-dot').style.display=(alertas.length+cumplePend.length)>0?'block':'none';
      CURRENT_NOTIF_SIGNATURE=[
        ...alertas.map(a=>`v:${a.id}`).sort(),
        ...cumplePend.map(c=>`c:${(c.nombre||'').trim().toLowerCase()}`).sort()
      ].join('|');
      updateNotifAttention();

      const htmlCumple=cumplePend.map(c=>{
        const tel=sanitizeTel(c.tel||'');
        const hasWs=tel&&tel.length>=8;
        const ws=hasWs?`<a class="birthday-ws-link" href="https://wa.me/${tel}" target="_blank"><img src="${WS_ICON_URL}" class="ws-icon"></a>`:`<span class="birthday-ws-link" style="opacity:.35"><img src="${WS_ICON_URL}" class="ws-icon"></span>`;
        return `<div class="clase-box birthday-inline" style="border-left:4px solid #ffd36a;display:flex;justify-content:space-between;align-items:center;gap:12px"><div><b style="color:#ffd36a">🎉 Cumpleaños</b><br><small>${c.nombre} está cumpliendo años</small></div>${ws}</div>`;
      }).join('');

      const htmlVence=alertas.map(a=>{
        const p=a.contenido.split('|');
        return `<div class="clase-box" style="border-left:4px solid var(--danger)"><b style="color:var(--danger)">${p[1]}</b><br><small>Vence: <b>${p[10]}</b></small></div>`;
      }).join('');

      const empty=(alertas.length===0&&cumplePend.length===0)?'<p style="text-align:center;opacity:.3;font-size:.7rem;font-style:italic;margin-top:30px">No hay vencimientos ni cumpleaños hoy.</p>':'';
      listaNotif.innerHTML = htmlCumple + htmlVence + empty;
    }

    function updateNotifAttention(){
      const btn=document.getElementById('btn-notif');
      if(!btn) return;
      const viewing=document.getElementById('modulo-notificaciones')?.style.display==='block';
      const hasPending=!!CURRENT_NOTIF_SIGNATURE;
      const shouldShake=hasPending && CURRENT_NOTIF_SIGNATURE!==LAST_SEEN_NOTIF_SIGNATURE && !viewing;
      btn.classList.toggle('notif-shake', shouldShake);
    }

    function clearNotifications(){
      CACHE_ALUMNOS
        .filter(a=>checkVencimiento(a.contenido.split('|')[10]))
        .forEach(a=>NOTIF_DISMISSED.add('v:'+a.id));
      getCumpleanerosHoy()
        .forEach(c=>NOTIF_DISMISSED.add('c:'+(c.nombre||'').trim().toLowerCase()));
      persistDismissedNotifications();
      LAST_SEEN_NOTIF_SIGNATURE='';
      processVencimientos();
    }

    function getCumpleanerosHoy(){
      const now=new Date();
      const md=`${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      return CACHE_ALUMNOS.map(a=>{
        const p=a.contenido.split('|');
        return { nombre:p[1]||'', tel:p[2]||'', nac:p[12]||'' };
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
      setTimeout(()=>ignoreBirthday(nombre), 560);
    }

    function ignoreBirthday(nombre){
      markBirthdayHandledToday(nombre);
      closeBirthdayPrompt(()=>processVencimientos(),'explode');
    }

    function sendBirthdayWhatsapp(nombre,telRaw){
      const nombrePlano=decodeHtmlEntities(nombre||'').trim();
      let tel=normalizeTelForWhatsapp(telRaw||'');

      if((!tel||tel.length<8) && nombrePlano){
        const found=CACHE_ALUMNOS.find(a=>{
          const p=a.contenido.split('|');
          return (p[1]||'').trim().toLowerCase()===nombrePlano.toLowerCase();
        });
        if(found){
          const p=found.contenido.split('|');
          tel=normalizeTelForWhatsapp(p[2]||'');
        }
      }

      if(!tel||tel.length<8){
        alert('Este alumno no tiene un número válido para WhatsApp.');
        return;
      }

      const msg=encodeURIComponent(`¡Feliz cumple, ${nombrePlano||nombre}! 🥂 Gracias por ser parte de la comunidad de Pilates Pulse. Te deseamos un año lleno de equilibrio y buenos momentos. ¡Disfruta mucho tu día! ✨🧘‍♀️`);
      window.open(`https://wa.me/${tel}?text=${msg}`,'_blank','noopener');
      markBirthdayHandledToday(nombrePlano||nombre);
      closeBirthdayPrompt(()=>processVencimientos());
    }

    function openBirthdayPrompt(cumple){
      let root=document.getElementById('birthday-prompt-root');
      if(root) root.remove();
      root=document.createElement('div');
      root.id='birthday-prompt-root';
      root.className='birthday-prompt-root';
      const safeName=(cumple.nombre||'').replace(/'/g,'&#39;');
      const safeTel=(cumple.tel||'').replace(/'/g,'&#39;');
      root.innerHTML=`
      <div class="birthday-prompt-backdrop">
        <div class="birthday-prompt-card">
          <button class="birthday-prompt-close" onclick="closeBirthdayPrompt()">&times;</button>
          <div class="birthday-prompt-title">🎉 Cumpleaños hoy</div>
          <div class="birthday-prompt-sub">${safeName} está cumpliendo años</div>
          <div class="birthday-prompt-actions">
            <button class="btn-principal btn-fuse" style="margin:0" onclick="sendBirthdayWhatsapp('${safeName}','${safeTel}')">Mandar mensaje</button>
            <button class="btn-cancelar btn-fuse btn-ignore" style="margin:0" onclick="triggerIgnoreBirthday(this,'${safeName}')">Eliminar</button>
          </div>
        </div>
      </div>`;
      document.body.appendChild(root);
    }
    function launchBirthdayFireworks(){
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
      const pendientes=getCumpleanerosHoy().filter(c=>!isBirthdayHandledToday(c.nombre));
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

    function abrirFormNuevoAlumno(editId=null,existingData=null){
      const p=existingData?existingData.split('|'):Array(13).fill('');let edades="";for(let i=1;i<=100;i++)edades+=`<option value="${i}">${i}</option>`;
      const formHtml=`<div class="modal-form-shell"><label>Nombre</label><input type="text" id="db-nom" value="${p[1]}"><label>Edad</label><select id="db-edad">${edades}</select><label>Teléfono (formato internacional ej: 549...)</label><input type="text" id="db-tel" value="${p[2]}"><label>Clase</label><select id="db-clase">${CLASES.map(c=>`<option ${p[3]==c?'selected':''}>${c}</option>`).join('')}</select><label>Frecuencia</label><select id="db-frec">${FRECUENCIAS.map(f=>`<option ${p[4]==f?'selected':''}>${f}</option>`).join('')}</select><label>Modalidad</label><select id="db-mod">${MODALIDADES.map(m=>`<option ${p[5]==m?'selected':''}>${m}</option>`).join('')}</select><label>Fecha de nacimiento</label><input type="date" id="db-nac" value="${p[12]||''}"><label>Vencimiento</label><input type="date" id="db-vence" value="${p[10]}"><label>Salud</label><textarea id="db-salud" rows="2">${p[6]}</textarea><label>Visita</label><textarea id="db-visita" rows="2">${p[7]}</textarea><label>Origen</label><textarea id="db-fuente" rows="2">${p[8]}</textarea><label>Referido</label><select id="db-ref"><option ${p[9]=='No'?'selected':''}>No</option><option ${p[9]=='Si'?'selected':''}>Si</option></select><button class="btn-principal" style="letter-spacing:1px" onclick="saveAlumno('${editId}')">GUARDAR</button><button class="btn-cancelar" onclick="cerrarFormAlumno()">CANCELAR</button></div>`;
      openModal(editId?'Editar alumno':'Registrar alumno',formHtml);
      if(editId)document.getElementById('db-edad').value=p[11];
    }

    async function saveAlumno(editId="null"){const d=id=>document.getElementById(id).value;const content=`DB|${d('db-nom')}|${d('db-tel')}|${d('db-clase')}|${d('db-frec')}|${d('db-mod')}|${d('db-salud')}|${d('db-visita')}|${d('db-fuente')}|${d('db-ref')}|${d('db-vence')}|${d('db-edad')}|${d('db-nac')}`;if(editId!=="null")await _sp.from('horarios').update({contenido:content}).eq('id',editId);else await _sp.from('horarios').insert([{celda_id:CELDA_DB,contenido:content}]);cerrarFormAlumno();updateAll();}
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

    async function borrar(id){if(confirm("¿Borrar definitivamente?")){await _sp.from('horarios').delete().eq('id',id);document.getElementById('edit-form-crono').innerHTML='';updateAll();}}












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






























































