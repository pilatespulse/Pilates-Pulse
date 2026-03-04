const _sp = supabase.createClient("https://iodtfnclwwgcczxgbmbq.supabase.co", "sb_publishable_uOUPFEp0T_uX85fjqi9xog_6WUS6dKg");

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const CLASES = ["Align Flow", "Power Flow", "Stretch&Release", "Aerial Balance", "Mega Core", "Life Align"];
const MODALIDADES = ["Grupales", "Privadas", "Masajes", "Cumpleaños"];
const FRECUENCIAS = ["1/semana", "2/semana", "3/semana"];
const WS_ICON_URL = "https://i.postimg.cc/9M0NRgcD/Whats-App-svg.webp";

let CACHE_ALUMNOS = [];
let CACHE_HORARIOS = [];

window.onload = () => {
    initBokeh();
    if (localStorage.getItem('studio_auth')) {
        startApp();
    } else {
        document.getElementById('login-section').style.display = 'flex';
    }
};

function initBokeh() {
    const container = document.querySelector('.bokeh-container');
    for (let i = 0; i < 15; i++) {
        const bokeh = document.createElement('div');
        bokeh.className = 'bokeh';
        const size = Math.random() * 150 + 50;
        bokeh.style.width = size + 'px';
        bokeh.style.height = size + 'px';
        bokeh.style.left = Math.random() * 100 + '%';
        bokeh.style.top = (Math.random() * 100 + 10) + '%';
        bokeh.style.animationDuration = (Math.random() * 20 + 15) + 's';
        bokeh.style.animationDelay = (Math.random() * 10) + 's';
        container.appendChild(bokeh);
    }
}

async function handleLogin() {
    const u = document.getElementById('adminUser').value;
    const p = document.getElementById('adminPass').value;
    const { data, error } = await _sp.from('usuarios_admin').select('*').eq('usuario', u).eq('password', p).maybeSingle();
    
    if (data) { 
        localStorage.setItem('studio_auth', 'true');
        startApp(); 
    } else {
        alert("Acceso denegado");
    }
}

function handleLogout() {
    localStorage.removeItem('studio_auth');
    location.reload();
}

function startApp() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    renderEstructura();
    updateAll();
}

async function updateAll() {
    const { data } = await _sp.from('horarios').select('*');
    CACHE_ALUMNOS = data.filter(x => x.celda_id === 'DB_ENTRY');
    CACHE_HORARIOS = data.filter(x => x.celda_id !== 'DB_ENTRY').sort((a,b) => {
        return a24h(a.contenido.split('|')[0]) - a24h(b.contenido.split('|')[0]);
    });
    
    renderAgenda();
    renderAlumnosList(CACHE_ALUMNOS);
    processVencimientos();
    renderCronograma();
}

function a24h(t) {
    if(!t) return 0;
    let [h, m] = t.split(':');
    let ampm = m.slice(-2).toLowerCase();
    h = parseInt(h);
    m = parseInt(m.slice(0,2));
    if(ampm === 'pm' && h < 12) h += 12;
    if(ampm === 'am' && h === 12) h = 0;
    return h * 60 + m;
}

function renderEstructura() {
    const container = document.getElementById('listaDias');
    container.innerHTML = DIAS.map(d => `
        <div class="dia-section" id="sec-${d}">
            <div class="dia-header" onclick="toggleDia('${d}')">${d} <span>▼</span></div>
            <div class="dia-clases" id="cont-${d}" style="display:none"></div>
        </div>
    `).join('');
}

function toggleDia(d) {
    const el = document.getElementById(`cont-${d}`);
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function renderAgenda() {
    DIAS.forEach(d => {
        const cont = document.getElementById(`cont-${d}`);
        const clasesDia = CACHE_HORARIOS.filter(h => h.dia === d);
        
        cont.innerHTML = clasesDia.map(c => {
            const [hora, tipo, mod] = c.contenido.split('|');
            const alumnosEnClase = CACHE_ALUMNOS.filter(a => a.notas === c.id.toString());
            
            return `
                <div class="clase-box">
                    <div class="clase-row">
                        <div>
                            <div class="hora">${hora}</div>
                            <div class="tipo-clase">${tipo}</div>
                            <div class="modalidad">${mod}</div>
                        </div>
                    </div>
                    <div class="alumnos-lista">
                        ${alumnosEnClase.map(a => `<div class="alumno-pill">${a.alumno_nombre}</div>`).join('')}
                    </div>
                </div>
            `;
        }).join('');
    });
}

function renderAlumnosList(arr) {
    const cont = document.getElementById('render-alumnos');
    cont.innerHTML = arr.map(a => {
        const diasRestantes = Math.ceil((new Date(a.vencimiento) - new Date()) / (1000*60*60*24));
        const claseAsignada = CACHE_HORARIOS.find(h => h.id.toString() === a.notas);
        const infoClase = claseAsignada ? `${claseAsignada.dia} - ${claseAsignada.contenido.split('|')[0]}` : 'Sin clase';

        return `
            <div class="alumno-card-db">
                <div class="db-info">
                    <div>
                        <div class="db-nombre">${a.alumno_nombre}</div>
                        <div class="db-detalle">${a.modalidad} | ${a.frecuencia}</div>
                        <div class="db-detalle">${infoClase}</div>
                        <div class="db-detalle ${diasRestantes < 3 ? 'vencido' : ''}">Vence: ${a.vencimiento} (${diasRestantes}d)</div>
                    </div>
                    <div class="ws-btn" onclick="window.open('https://wa.me/${a.telefono}')">
                        <img src="${WS_ICON_URL}">
                    </div>
                </div>
                <button onclick="eliminarAlumno('${a.id}')" style="background:none; border:none; color:var(--danger); font-size:0.5rem; margin-top:10px; cursor:pointer">ELIMINAR ALUMNO</button>
            </div>
        `;
    }).join('');
}

function processVencimientos() {
    const hoy = new Date();
    const vencidos = CACHE_ALUMNOS.filter(a => new Date(a.vencimiento) <= hoy);
    const dot = document.getElementById('active-dot');
    dot.style.display = vencidos.length > 0 ? 'inline-block' : 'none';
    
    document.getElementById('lista-notificaciones').innerHTML = vencidos.length ? vencidos.map(a => `
        <div class="alumno-card-db" style="border-color: var(--danger)">
            <div class="db-info">
                <div>
                    <div class="db-nombre">${a.alumno_nombre}</div>
                    <div class="vencido" style="font-size:0.6rem">MEMBRESÍA VENCIDA</div>
                </div>
                <div class="ws-btn" onclick="window.open('https://wa.me/${a.telefono}')">
                    <img src="${WS_ICON_URL}">
                </div>
            </div>
        </div>
    `).join('') : '<div style="text-align:center; opacity:0.3; font-size:0.7rem;">No hay vencimientos hoy</div>';
}

function renderCronograma() {
    const cont = document.getElementById('render-cronograma');
    cont.innerHTML = DIAS.map(d => {
        const clases = CACHE_HORARIOS.filter(h => h.dia === d);
        if(!clases.length) return '';
        return `
            <div style="margin-bottom:40px;">
                <div style="font-family:var(--font-fancy); font-size:1.5rem; margin-bottom:20px; color:var(--celeste)">${d}</div>
                ${clases.map(c => {
                    const [h, t, m] = c.contenido.split('|');
                    return `
                        <div class="crono-card" onclick="editCrono('${c.id}')">
                            <div class="crono-hora">${h}</div>
                            <div class="crono-clase">${t}</div>
                            <div style="font-size:0.5rem; opacity:0.4; letter-spacing:1px;">${m}</div>
                        </div>
                    `;
                }).join('')}
                <button class="btn-principal" style="padding:10px; font-size:0.5rem;" onclick="abrirFormCrono('${d}')">+ AÑADIR CLASE AL ${d.toUpperCase()}</button>
            </div>
        `;
    }).join('');
}

function abrirFormNuevoAlumno() {
    const cont = document.getElementById('form-alumno-nuevo');
    cont.innerHTML = `
        <div class="form-container">
            <input type="text" id="new-nom" placeholder="Nombre completo">
            <input type="text" id="new-tel" placeholder="Teléfono (ej: 58412...)">
            <select id="new-mod">${MODALIDADES.map(m => `<option>${m}</option>`).join('')}</select>
            <select id="new-frec">${FRECUENCIAS.map(f => `<option>${f}</option>`).join('')}</select>
            <input type="date" id="new-venc">
            <select id="new-clase">
                <option value="">Asignar a una clase...</option>
                ${CACHE_HORARIOS.map(h => `<option value="${h.id}">${h.dia} - ${h.contenido.split('|')[0]} (${h.contenido.split('|')[1]})</option>`).join('')}
            </select>
            <button class="btn-principal" onclick="saveAlumno()" style="padding:15px; font-size:0.7rem;">GUARDAR ALUMNO</button>
            <button onclick="document.getElementById('form-alumno-nuevo').innerHTML=''" style="width:100%; background:none; border:none; color:#555; margin-top:10px;">Cancelar</button>
        </div>
    `;
}

async function saveAlumno() {
    const obj = {
        celda_id: 'DB_ENTRY',
        alumno_nombre: document.getElementById('new-nom').value,
        telefono: document.getElementById('new-tel').value,
        modalidad: document.getElementById('new-mod').value,
        frecuencia: document.getElementById('new-frec').value,
        vencimiento: document.getElementById('new-venc').value,
        notas: document.getElementById('new-clase').value
    };
    await _sp.from('horarios').insert([obj]);
    updateAll();
    document.getElementById('form-alumno-nuevo').innerHTML = '';
}

async function eliminarAlumno(id) {
    if(confirm("¿Eliminar alumno?")) {
        await _sp.from('horarios').delete().eq('id', id);
        updateAll();
    }
}

function abrirFormCrono(dia) {
    const cont = document.getElementById('edit-form-crono');
    cont.innerHTML = `
        <div class="form-container">
            <h4 style="font-size:0.6rem; margin-bottom:10px;">NUEVA CLASE - ${dia.toUpperCase()}</h4>
            <input type="text" id="c-hora" placeholder="Ej: 08:00am">
            <select id="c-tipo">${CLASES.map(c => `<option>${c}</option>`).join('')}</select>
            <select id="c-mod">${MODALIDADES.map(m => `<option>${m}</option>`).join('')}</select>
            <button class="btn-principal" onclick="pushClase('${dia}')" style="padding:15px; font-size:0.7rem;">CREAR CLASE</button>
        </div>
    `;
    window.scrollTo(0,0);
}

async function pushClase(dia) {
    const h = document.getElementById('c-hora').value;
    const t = document.getElementById('c-tipo').value;
    const m = document.getElementById('c-mod').value;
    await _sp.from('horarios').insert([{
        dia: dia,
        celda_id: 'CLASE_' + Date.now(),
        contenido: `${h}|${t}|${m}`
    }]);
    document.getElementById('edit-form-crono').innerHTML = '';
    updateAll();
}

async function editCrono(id) {
    const c = CACHE_HORARIOS.find(x => x.id.toString() === id);
    const [h, t, m] = c.contenido.split('|');
    const cont = document.getElementById('edit-form-crono');
    cont.innerHTML = `
        <div class="form-container" style="border-color:var(--celeste)">
            <h4 style="font-size:0.6rem; margin-bottom:10px;">EDITAR CLASE</h4>
            <input type="text" id="e-hora" value="${h}">
            <select id="e-tipo">${CLASES.map(x => `<option ${x===t?'selected':''}>${x}</option>`).join('')}</select>
            <select id="e-mod">${MODALIDADES.map(x => `<option ${x===m?'selected':''}>${x}</option>`).join('')}</select>
            <button class="btn-principal" onclick="updateClase('${id}')" style="padding:15px; font-size:0.7rem;">ACTUALIZAR</button>
            <button onclick="borrar('${id}')" style="width:100%; background:none; border:none; color:var(--danger); margin-top:10px; font-size:0.6rem;">ELIMINAR CLASE COMPLETAMENTE</button>
        </div>
    `;
    window.scrollTo(0,0);
}

async function updateClase(id) {
    const h = document.getElementById('e-hora').value;
    const t = document.getElementById('e-tipo').value;
    const m = document.getElementById('e-mod').value;
    await _sp.from('horarios').update({ contenido: `${h}|${t}|${m}` }).eq('id', id);
    document.getElementById('edit-form-crono').innerHTML = '';
    updateAll();
}

async function borrar(id) { 
    if(confirm("¿Borrar definitivamente?")) { 
        await _sp.from('horarios').delete().eq('id', id);
        document.getElementById('edit-form-crono').innerHTML = '';
        updateAll(); 
    }
}

function filtrarAlumnos() {
    const val = document.getElementById('buscadorAlumnos').value.toLowerCase();
    const filtrados = CACHE_ALUMNOS.filter(a => a.alumno_nombre.toLowerCase().includes(val));
    renderAlumnosList(filtrados);
}

function switchModulo(id) {
    document.getElementById('modulo-agenda').style.display = id === 'modulo-agenda' ? 'block' : 'none';
    document.getElementById('modulo-cronograma').style.display = id === 'modulo-cronograma' ? 'block' : 'none';
    document.getElementById('modulo-alumnos').style.display = id === 'modulo-alumnos' ? 'block' : 'none';
    document.getElementById('modulo-notificaciones').style.display = id === 'modulo-notificaciones' ? 'block' : 'none';
    document.getElementById('main-brand').style.display = id === 'modulo-cronograma' ? 'none' : 'flex';
    document.getElementById('btn-agenda').classList.toggle('active-btn', id === 'modulo-agenda');
    document.getElementById('btn-crono').classList.toggle('active-btn', id === 'modulo-cronograma');
    document.getElementById('btn-db').classList.toggle('active-btn', id === 'modulo-alumnos');
    document.getElementById('btn-notif').classList.toggle('active-btn', id === 'modulo-notificaciones');
    if(id === 'modulo-cronograma') {
        document.getElementById('edit-form-crono').innerHTML = '';
    }
}
