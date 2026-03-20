// Z2M Panel — panel_custom Web Component
// v1.0.1
// Copiar a /config/www/z2m-panel.js
// Registrar en configuration.yaml como panel_custom

// Formatea una fecha como tiempo relativo: "hace 5 min", "hace 3 días", etc.
function timeAgo(date) {
  if (!date) return null;
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60)       return 'hace un momento';
  if (secs < 3600)     return `hace ${Math.floor(secs/60)} min`;
  if (secs < 86400)    return `hace ${Math.floor(secs/3600)} h`;
  if (secs < 86400*7)  return `hace ${Math.floor(secs/86400)} días`;
  if (secs < 86400*30) return `hace ${Math.floor(secs/86400/7)} sem`;
  return `hace ${Math.floor(secs/86400/30)} meses`;
}

// Clasifica la antigüedad para colorear
function ageClass(date) {
  if (!date) return 'age-unknown';
  const days = (Date.now() - date.getTime()) / 86400000;
  if (days < 1)   return 'age-fresh';
  if (days < 7)   return 'age-ok';
  if (days < 30)  return 'age-warn';
  return 'age-old';
}

// Bridge ID se detecta automáticamente buscando el dispositivo Z2M Bridge
// No hay que hardcodearlo — funciona en cualquier instancia de HA
let BRIDGE_ID = null;
const VER = 'v1.0.1';

// Cache busting: detecta si hay una versión más nueva del archivo en disco
// (ocurre tras una actualización de HACS) y fuerza una recarga sin caché.
// Usa sessionStorage para evitar bucles infinitos.
async function checkForUpdate() {
  try {
    const r = await fetch('/local/community/z2m-panel/z2m-panel.js', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    const text = await r.text();
    const m = text.match(/const VER\s*=\s*['"]([^'"]+)['"]/);
    if (m && m[1] !== VER) {
      const key = 'z2m-cache-reloaded-' + m[1];
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        // eslint-disable-next-line no-restricted-globals
        location.reload(true);
      }
    }
  } catch(e) {}
}

const imgUrl = m => m
  ? `https://www.zigbee2mqtt.io/images/devices/${m.replace(/\//g, '_')}.png`
  : null;
const imgFallback = m => m
  ? `https://www.zigbee2mqtt.io/images/devices/${m.replace(/\//g, '_')}.jpg`
  : null;

const CSS = `
:host {
  display: block;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
}
:host([theme="dark"]), :host {
  --bg:#000;--bg2:#1c1c1e;--bg3:#2c2c2e;--bg4:#3a3a3c;
  --sep:rgba(255,255,255,.08);--text:#fff;--text2:rgba(255,255,255,.6);--text3:rgba(255,255,255,.3);
  --tint:#0a84ff;--tint-bg:rgba(10,132,255,.15);
  --green:#30d158;--green-bg:rgba(48,209,88,.15);
  --yellow:#ffd60a;--yellow-bg:rgba(255,214,10,.15);
  --red:#ff453a;--red-bg:rgba(255,69,58,.15);
  --orange:#ff9f0a;--orange-bg:rgba(255,159,10,.15);
  --purple:#bf5af2;
  --blur:blur(20px) saturate(180%);
  --rc:16px;--rsm:10px;--rp:20px;
  --shadow:0 2px 20px rgba(0,0,0,.4);
}
:host([theme="light"]) {
  --bg:#f2f2f7;--bg2:#fff;--bg3:#f2f2f7;--bg4:#e5e5ea;
  --sep:rgba(0,0,0,.08);--text:#000;--text2:rgba(0,0,0,.55);--text3:rgba(0,0,0,.25);
  --tint:#007aff;--tint-bg:rgba(0,122,255,.10);
  --green:#34c759;--green-bg:rgba(52,199,89,.12);
  --yellow:#ff9500;--yellow-bg:rgba(255,149,0,.12);
  --red:#ff3b30;--red-bg:rgba(255,59,48,.12);
  --orange:#ff9500;--orange-bg:rgba(255,149,0,.12);
  --purple:#af52de;
  --shadow:0 2px 12px rgba(0,0,0,.10);
}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
#root{background:var(--bg);color:var(--text);min-height:100vh;transition:background .3s,color .3s}
#navbar{position:sticky;top:0;z-index:100;background:rgba(0,0,0,.72);
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);
  border-bottom:.5px solid var(--sep);padding:0 14px 0 8px;height:52px;
  display:flex;align-items:center;justify-content:space-between;transition:background .3s}
:host([theme="light"]) #navbar{background:rgba(242,242,247,.88)}
.nav-left{display:flex;align-items:center;gap:6px}

/* Botón atrás — solo visible en móvil/tablet (sin sidebar de HA) */
.back-btn{
  width:34px;height:34px;border-radius:50%;border:none;
  background:transparent;color:var(--tint);
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-size:20px;transition:all .15s;
  flex-shrink:0;padding:0;line-height:1;
}
.back-btn:hover{background:var(--tint-bg);}
.back-btn:active{transform:scale(.88);}

/* HA muestra sidebar a partir de 870px — ocultar botón atrás en esos casos */
@media(min-width:870px){
  .back-btn{display:none;}
}

/* Título de cabecera */
.nav-title-wrap{display:flex;flex-direction:column;gap:1px;}
.nav-title-main{
  font-size:.92rem;font-weight:700;color:var(--text);
  letter-spacing:-.01em;line-height:1.1;
}
.nav-title-sub{
  font-size:.62rem;color:var(--text3);
  display:flex;align-items:center;gap:5px;
}
.bridge-dot{width:8px;height:8px;border-radius:50%;background:var(--text3);transition:background .3s;flex-shrink:0}
.bridge-dot.on{background:var(--green);box-shadow:0 0 6px var(--green);animation:pulse 2s infinite}
.bridge-dot.off{background:var(--red)}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.nav-status{font-size:.75rem;font-weight:500;color:var(--text2)}
.nav-ver{font-size:.65rem;color:var(--text3);margin-left:2px}
.nav-right{display:flex;align-items:center;gap:8px}
.theme-toggle{width:44px;height:26px;border-radius:13px;background:var(--bg4);border:none;
  cursor:pointer;display:flex;align-items:center;padding:3px;transition:background .25s}
.knob{width:20px;height:20px;border-radius:50%;background:var(--bg2);
  box-shadow:0 1px 4px rgba(0,0,0,.35);transition:transform .25s cubic-bezier(.4,0,.2,1);
  display:flex;align-items:center;justify-content:center;font-size:11px;line-height:1}
:host([theme="light"]) .knob{transform:translateX(18px)}
.nav-btn{width:32px;height:32px;border-radius:50%;border:none;background:var(--bg3);
  color:var(--text2);display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-size:15px;transition:all .15s}
.nav-btn:hover{background:var(--bg4);color:var(--text)}
.nav-btn:active{transform:scale(.92)}
.pair-btn{display:flex;align-items:center;gap:5px;padding:6px 14px;border-radius:var(--rp);
  border:none;background:var(--tint);color:#fff;font-family:inherit;font-size:.78rem;
  font-weight:600;cursor:pointer;min-width:90px;justify-content:center;
  transition:background .45s cubic-bezier(.4,0,.2,1),box-shadow .45s,transform .15s,opacity .15s}
.pair-btn:hover{opacity:.88}
.pair-btn:active{transform:scale(.95)}
.pair-btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
/* ── PERMIT-BAR: píldora azul fija en el pie (no mueve el layout) ── */
#permit-bar{
  display:flex;visibility:hidden;opacity:0;pointer-events:none;
  position:fixed;bottom:22px;left:50%;transform:translateX(-50%);
  z-index:200;
  background:rgba(0,18,52,.92);
  border:1px solid rgba(10,132,255,.55);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border-radius:50px;padding:10px 22px;
  align-items:center;gap:14px;
  white-space:nowrap;
  box-shadow:0 6px 32px rgba(0,0,0,.5),0 0 0 1px rgba(10,132,255,.2),0 0 24px rgba(10,132,255,.18);
}
:host([theme="light"]) #permit-bar{
  background:rgba(232,243,255,.96);
  border-color:rgba(0,122,255,.45);
  box-shadow:0 4px 20px rgba(0,0,0,.10),0 0 0 1px rgba(0,122,255,.15);}
#permit-bar.on{visibility:visible;opacity:1;pointer-events:auto;animation:pillIn .3s cubic-bezier(.34,1.56,.64,1);}
@keyframes pillIn{from{opacity:0;transform:translateX(-50%) translateY(12px) scale(.92)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
@keyframes pillOut{from{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}to{opacity:0;transform:translateX(-50%) translateY(14px) scale(.88)}}
#permit-bar.leaving{visibility:visible;pointer-events:none;animation:pillOut .32s cubic-bezier(.4,0,.2,1) forwards;}
/* Suprimir animaciones/transiciones al restaurar estado inicial (recarga) */
.z2m-no-anim{transition:none!important;animation:none!important;}
.permit-icon{font-size:1.3rem;line-height:1;flex-shrink:0;}
.permit-content{display:flex;flex-direction:column;gap:2px;align-items:center;}
.permit-title{font-size:.82rem;font-weight:700;color:var(--tint);line-height:1.1;}
:host([theme="light"]) .permit-title{color:#004db3;}
.permit-sub{font-size:.67rem;font-weight:400;color:rgba(10,132,255,.7);line-height:1.2;}
:host([theme="light"]) .permit-sub{color:rgba(0,77,179,.6);}
#permit-cd{font-size:.9rem;font-weight:700;color:var(--tint);
  font-variant-numeric:tabular-nums;min-width:34px;text-align:right;margin-left:2px;}
:host([theme="light"]) #permit-cd{color:#004db3;}
main{padding:18px 14px;max-width:1200px;margin:0 auto}
.sec-hdr{display:flex;align-items:center;justify-content:space-between;padding:0 4px;margin-bottom:8px}
.sec-lbl{font-size:.7rem;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--text2)}
.badge{font-size:.68rem;font-weight:700;background:var(--yellow);color:#000;padding:1px 7px;border-radius:10px}
#new-section{display:none;margin-bottom:26px}
#new-section.on{display:block}
.new-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
.new-card{background:var(--bg2);border-radius:var(--rc);padding:14px;
  border:1px solid rgba(255,214,10,.18);animation:fadeUp .3s ease both;
  cursor:pointer;transition:transform .15s,box-shadow .15s}
.new-card:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,.25)}
:host([theme="light"]) .new-card{border-color:rgba(255,149,0,.18)}
.new-top{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.new-thumb{width:48px;height:48px;border-radius:12px;flex-shrink:0;background:var(--yellow-bg);
  display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden}
.new-thumb img{width:100%;height:100%;object-fit:contain;padding:5px}
.new-meta{flex:1;min-width:0}
.new-label{font-size:.68rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  color:var(--yellow);margin-bottom:2px}
:host([theme="light"]) .new-label{color:var(--orange)}
.new-ieee{font-size:.68rem;color:var(--text3);overflow:hidden;text-overflow:ellipsis;
  white-space:nowrap;margin-bottom:2px;font-variant-numeric:tabular-nums}
.new-model{font-size:.76rem;color:var(--text2)}
.btn-assign{width:100%;padding:10px;background:var(--tint);color:#fff;border:none;
  border-radius:var(--rsm);font-family:inherit;font-size:.85rem;font-weight:600;
  cursor:pointer;transition:opacity .15s;margin-top:2px}
.btn-assign:hover{opacity:.88}
.btn-assign:active{opacity:.7}
.search-bar{position:relative;margin-bottom:12px}
.search-ico{position:absolute;left:12px;top:50%;transform:translateY(-50%);
  color:var(--text3);font-size:13px;pointer-events:none}
.search-input{width:100%;background:var(--bg2);border:none;border-radius:var(--rsm);
  padding:10px 12px 10px 34px;color:var(--text);font-family:inherit;font-size:.88rem;
  outline:none;transition:background .15s;box-shadow:var(--shadow)}
:host([theme="light"]) .search-input{box-shadow:0 1px 6px rgba(0,0,0,.07)}
.search-input:focus{background:var(--bg3)}
.search-input::placeholder{color:var(--text3)}
.pills-wrap{display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;
  padding-bottom:4px;margin-bottom:14px;scrollbar-width:none}
.pills-wrap::-webkit-scrollbar{display:none}
.pill{padding:6px 14px;border-radius:var(--rp);border:none;background:var(--bg2);
  color:var(--text2);font-family:inherit;font-size:.78rem;font-weight:500;
  cursor:pointer;white-space:nowrap;transition:all .15s;flex-shrink:0;box-shadow:var(--shadow)}
:host([theme="light"]) .pill{box-shadow:0 1px 4px rgba(0,0,0,.07)}
.pill:hover{color:var(--text)}
.pill:active{transform:scale(.95)}
.pill.on{background:var(--tint);color:#fff}
.toolbar-foot{display:flex;align-items:center;justify-content:space-between;padding:0 2px;margin-bottom:12px}
.stats{font-size:.72rem;color:var(--text3)}
#dev-container{contain:layout;}
.dev-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
.dev-card{background:var(--bg2);border-radius:var(--rc);padding:14px;
  transition:transform .15s,box-shadow .15s;box-shadow:var(--shadow);animation:fadeUp .25s ease both;cursor:pointer}
:host([theme="light"]) .dev-card{box-shadow:0 1px 8px rgba(0,0,0,.08)}
.dev-card:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,.25)}
:host([theme="light"]) .dev-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.12)}
.dev-head{display:flex;align-items:flex-start;gap:11px;margin-bottom:10px}
.dev-thumb{width:50px;height:50px;border-radius:13px;flex-shrink:0;background:var(--bg3);
  display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden}
.dev-thumb img{width:100%;height:100%;object-fit:contain;padding:5px}
.dev-info{flex:1;min-width:0}
.dev-name{font-size:.9rem;font-weight:600;color:var(--text);overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap;margin-bottom:2px}
.dev-model{font-size:.69rem;color:var(--text3);overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap;margin-bottom:1px}
.dev-vendor{font-size:.65rem;color:var(--text3)}
.dev-lq{display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0}
.lq-bars{display:flex;align-items:flex-end;gap:2px;height:14px}

/* Last seen */
.dev-lastseen{
  font-size:.62rem;color:var(--text3);
  display:flex;align-items:center;gap:3px;
  white-space:nowrap;
}
.dev-lastseen.age-fresh{color:var(--green)}
.dev-lastseen.age-ok   {color:var(--text3)}
.dev-lastseen.age-warn {color:var(--yellow)}
.dev-lastseen.age-old  {color:var(--red)}
.dev-lastseen.age-unknown{color:var(--red)}
.lq-bar{width:3px;background:var(--bg4);border-radius:2px}
.lq-bar.on{background:var(--green)}.lq-bar.on.med{background:var(--yellow)}.lq-bar.on.bad{background:var(--red)}
.lq-val{font-size:.6rem;color:var(--text3);font-variant-numeric:tabular-nums}
.dev-tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
.tag{font-size:.63rem;font-weight:600;padding:3px 8px;border-radius:6px;letter-spacing:.02em}
.tag.sw{background:var(--tint-bg);color:var(--tint)}
.tag.sen{background:rgba(175,82,222,.12);color:var(--purple)}
.tag.li{background:var(--yellow-bg);color:var(--yellow)}
.tag.cov{background:var(--green-bg);color:var(--green)}
.tag.btn{background:var(--orange-bg);color:var(--orange)}
.tag.oth{background:var(--bg3);color:var(--text3)}
.tag.area{background:var(--tint-bg);color:var(--tint);opacity:.7}
.dev-foot{display:flex;align-items:center;justify-content:space-between}
.dev-actions{display:flex;gap:6px}
.act-btn{width:30px;height:30px;border-radius:8px;border:none;background:var(--bg3);
  color:var(--text2);display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-size:13px;transition:all .15s}
.act-btn:hover{background:var(--bg4);color:var(--text)}
.act-btn.del:hover{background:var(--red-bg);color:var(--red)}
.act-btn:active{transform:scale(.90)}
.dev-batt{font-size:.66rem;color:var(--text3);display:flex;align-items:center;gap:3px}
.dev-batt.low{color:var(--red)}.dev-batt.med{color:var(--yellow)}.dev-batt.ok{color:var(--green)}
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  z-index:200;align-items:flex-end;justify-content:center}
.overlay.on{display:flex}
.sheet{background:var(--bg2);width:100%;max-width:480px;border-radius:20px 20px 0 0;
  padding:8px 0 34px;animation:slideSheet .3s cubic-bezier(.4,0,.2,1);max-height:90vh;overflow-y:auto}
.sheet-handle{width:36px;height:4px;border-radius:2px;background:var(--bg4);margin:0 auto 16px}
.sheet-body{padding:0 20px}
.sheet h3{font-size:1rem;font-weight:700;margin-bottom:4px}
.sheet p{font-size:.81rem;color:var(--text2);margin-bottom:18px;line-height:1.5}
.field label{display:block;font-size:.7rem;font-weight:600;color:var(--text2);
  text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px}
.ios-input{width:100%;background:var(--bg3);border:none;border-radius:var(--rsm);
  padding:9px 12px;color:var(--text);font-family:inherit;font-size:.87rem;
  outline:none;transition:background .15s}
.ios-input:focus{background:var(--bg4)}
.ios-input::placeholder{color:var(--text3)}
.sheet-actions{display:flex;flex-direction:column;gap:8px;margin-top:20px}
.ios-btn{width:100%;padding:14px;border:none;border-radius:var(--rsm);
  font-family:inherit;font-size:.93rem;font-weight:600;cursor:pointer;transition:opacity .15s}
.ios-btn:active{opacity:.72}
.ios-btn.primary{background:var(--tint);color:#fff}
.ios-btn.danger{background:var(--red-bg);color:var(--red)}
.ios-btn.cancel{background:var(--bg3);color:var(--text2)}
.loading{display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:260px;gap:14px;color:var(--text3)}
.spinner{width:28px;height:28px;border:2.5px solid var(--bg4);border-top-color:var(--tint);
  border-radius:50%;animation:spin .7s linear infinite}
.empty{text-align:center;padding:60px 20px;color:var(--text3)}
.empty .ico{font-size:3rem;margin-bottom:10px;opacity:.2}
.empty p{font-size:.84rem}
.toast{position:fixed;top:62px;left:50%;transform:translateX(-50%);
  background:var(--bg3);color:var(--text);border-radius:var(--rp);
  padding:10px 20px;font-size:.84rem;font-weight:500;z-index:9999;
  animation:fadeDown .25s ease;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.35)}
.toast.ok{background:var(--green);color:#fff}
.toast.err{background:var(--red);color:#fff}
/* ── POPUP DE ENTIDADES ── */
/* ── CONTROLES INTERACTIVOS DEL POPUP ── */
.ent-row-ctrl{display:flex;align-items:center;justify-content:flex-end;flex-shrink:0;gap:6px}

/* Toggle iOS */
.ent-toggle{
  width:48px;height:28px;border-radius:14px;border:none;
  background:var(--bg4);cursor:pointer;position:relative;
  display:flex;align-items:center;padding:2px;
  transition:background .25s;flex-shrink:0;
}
.ent-toggle.on{background:var(--green)}
.ent-toggle-knob{
  width:24px;height:24px;border-radius:50%;background:#fff;
  box-shadow:0 1px 4px rgba(0,0,0,.3);
  transition:transform .25s cubic-bezier(.4,0,.2,1);
}
.ent-toggle.on .ent-toggle-knob{transform:translateX(20px)}
.ent-toggle:disabled{opacity:.4;cursor:not-allowed}

/* Botones de acción */
.ent-action-btn{
  padding:5px 10px;border-radius:8px;border:none;
  background:var(--bg3);color:var(--text2);
  font-family:inherit;font-size:.75rem;font-weight:600;
  cursor:pointer;transition:all .15s;
}
.ent-action-btn:hover{background:var(--tint-bg);color:var(--tint)}
.ent-action-btn:active{transform:scale(.93)}

/* Select */
.ent-select{
  background:var(--bg3);border:none;border-radius:8px;
  padding:5px 8px;color:var(--text);font-family:inherit;
  font-size:.75rem;outline:none;cursor:pointer;max-width:130px;
}

/* Slider */
.ent-slider{
  width:80px;height:4px;accent-color:var(--tint);cursor:pointer;
}

@keyframes popIn{
  0%  {opacity:0;transform:translateY(12px) scale(.96);}
  70% {transform:translateY(-2px) scale(1.01);}
  100%{opacity:1;transform:translateY(0) scale(1);}
}
.ent-popup{
  position:fixed;inset:0;z-index:400;
  display:flex;align-items:flex-end;justify-content:center;
  background:rgba(0,0,0,.55);backdrop-filter:blur(8px);
  -webkit-backdrop-filter:blur(8px);
}
.ent-sheet{
  background:var(--bg2);width:100%;max-width:560px;
  border-radius:20px 20px 0 0;padding:8px 0 40px;
  max-height:80vh;overflow-y:auto;
  animation:popIn .3s cubic-bezier(.34,1.56,.64,1);
}
.ent-handle{width:36px;height:4px;border-radius:2px;background:var(--bg4);margin:0 auto 16px}
.ent-header{padding:0 20px 14px;border-bottom:.5px solid var(--sep);display:flex;align-items:center;gap:12px}
.ent-header-thumb{
  width:44px;height:44px;border-radius:12px;flex-shrink:0;
  background:var(--bg3);display:flex;align-items:center;justify-content:center;
  font-size:20px;overflow:hidden;
}
.ent-header-thumb img{width:100%;height:100%;object-fit:contain;padding:4px}
.ent-header-info{flex:1;min-width:0}
.ent-header-name{font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ent-header-model{font-size:.72rem;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ent-list{padding:8px 0}
.ent-row{
  display:flex;align-items:center;padding:10px 20px;gap:12px;
  transition:background .12s;cursor:default;
}
.ent-row:hover{background:var(--bg3)}
.ent-row-icon{
  width:34px;height:34px;border-radius:9px;flex-shrink:0;
  background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:16px;
}
.ent-row-body{flex:1;min-width:0}
.ent-row-name{font-size:.83rem;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ent-row-id{font-size:.65rem;color:var(--text3);font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ent-row-state{
  font-size:.78rem;font-weight:600;font-family:monospace;
  color:var(--text2);flex-shrink:0;text-align:right;
}
.ent-row-state.on{color:var(--green)}
.ent-row-state.off{color:var(--text3)}
.ent-section-title{
  font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
  color:var(--text3);padding:10px 20px 4px;font-family:monospace;
}

@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeDown{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes slideSheet{from{transform:translateY(100%)}to{transform:translateY(0)}}

/* ── NUEVO DISPOSITIVO DETECTADO ── */
@keyframes newDevIn{
  0%  {opacity:0;transform:translateY(-120%) scale(.9);}
  60% {transform:translateY(6%) scale(1.02);}
  100%{opacity:1;transform:translateY(0) scale(1);}
}
@keyframes newDevOut{
  0%  {opacity:1;transform:translateY(0) scale(1);}
  100%{opacity:0;transform:translateY(-60%) scale(.92);}
}
@keyframes glow{
  0%,100%{box-shadow:0 0 18px rgba(255,214,10,.4),0 8px 32px rgba(0,0,0,.5);}
  50%    {box-shadow:0 0 40px rgba(255,214,10,.8),0 8px 40px rgba(0,0,0,.6);}
}
@keyframes scanline{
  0%  {background-position:0 -100%;}
  100%{background-position:0 200%;}
}
@keyframes pulse-ring{
  0%  {transform:scale(1);opacity:.8;}
  100%{transform:scale(2.2);opacity:0;}
}
@keyframes float{
  0%,100%{transform:translateY(0);}
  50%    {transform:translateY(-4px);}
}

#new-device-alert{
  position:fixed;top:72px;left:50%;transform:translateX(-50%);
  z-index:500;width:calc(100% - 32px);max-width:480px;
  background:linear-gradient(135deg,#1a1500 0%,#2a2000 50%,#1a1500 100%);
  border:1px solid rgba(255,214,10,.45);border-radius:20px;
  overflow:hidden;cursor:pointer;
  animation:newDevIn .5s cubic-bezier(.34,1.56,.64,1) both, glow 2s ease-in-out infinite;
  display:none;
}
#new-device-alert.visible{display:block;}
#new-device-alert.leaving{animation:newDevOut .35s ease forwards;}

/* Barra de progreso en la parte superior */
#new-device-alert .alert-progress{
  height:3px;
  background:linear-gradient(90deg,var(--yellow),#ff9f0a,var(--yellow));
  background-size:200% 100%;
  animation:scanline 1.5s linear infinite;
  transform-origin:left;
}

#new-device-alert .alert-inner{
  display:flex;align-items:center;gap:14px;padding:16px 18px;
  position:relative;
}

/* Icono con anillos pulsantes */
#new-device-alert .alert-icon-wrap{
  position:relative;flex-shrink:0;width:52px;height:52px;
}
#new-device-alert .alert-icon-wrap .ring{
  position:absolute;inset:0;border-radius:50%;
  border:2px solid rgba(255,214,10,.5);
  animation:pulse-ring 1.6s ease-out infinite;
}
#new-device-alert .alert-icon-wrap .ring:nth-child(2){animation-delay:.5s;}
#new-device-alert .alert-icon-wrap .ring:nth-child(3){animation-delay:1s;}
#new-device-alert .alert-thumb{
  width:52px;height:52px;border-radius:14px;
  background:rgba(255,214,10,.15);border:1.5px solid rgba(255,214,10,.4);
  display:flex;align-items:center;justify-content:center;
  font-size:24px;overflow:hidden;position:relative;z-index:1;
  animation:float 2.5s ease-in-out infinite;
}
#new-device-alert .alert-thumb img{
  width:100%;height:100%;object-fit:contain;padding:5px;
}

#new-device-alert .alert-body{flex:1;min-width:0;}
#new-device-alert .alert-tag{
  font-size:.6rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;
  color:rgba(255,214,10,.7);margin-bottom:3px;
}
#new-device-alert .alert-title{
  font-size:.95rem;font-weight:700;color:#fff;margin-bottom:2px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
#new-device-alert .alert-sub{
  font-size:.72rem;color:rgba(255,255,255,.5);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}

#new-device-alert .alert-cta{
  flex-shrink:0;padding:8px 14px;background:var(--yellow);color:#0a0800;
  border:none;border-radius:10px;font-family:inherit;font-size:.78rem;
  font-weight:700;cursor:pointer;transition:all .15s;white-space:nowrap;
}
#new-device-alert .alert-cta:hover{background:#fcd34d;transform:scale(1.05);}

/* Partículas decorativas */
#new-device-alert .alert-particles{
  position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:20px;
}
#new-device-alert .particle{
  position:absolute;width:3px;height:3px;border-radius:50%;
  background:rgba(255,214,10,.6);
}

/* Cards de nuevo dispositivo — animación de entrada mejorada */
.new-card{
  animation:newCardIn .45s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes newCardIn{
  0%  {opacity:0;transform:scale(.85) translateY(-12px);}
  70% {transform:scale(1.02) translateY(0);}
  100%{opacity:1;transform:scale(1) translateY(0);}
}

/* Animación de fade en dev-cards escalonada */
.dev-card{
  animation:fadeUp .3s ease both;
}

::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:2px}
@media(max-width:500px){main{padding:14px 10px}#navbar{padding:0 12px}}

/* ── RADAR DE PAIRING (estilo sonar — lento y dramático) ── */
@keyframes radarRing{
  0%  {transform:translate(-50%,-50%) scale(0);opacity:.75;}
  40% {opacity:.55;}
  100%{transform:translate(-50%,-50%) scale(1);opacity:0;}
}
#pair-ripple{
  visibility:hidden;opacity:0;
  position:fixed;inset:0;pointer-events:none;
  z-index:1;overflow:hidden;contain:layout style;
  transition:opacity .45s ease, visibility 0s .45s;
}
#pair-ripple.on{
  visibility:visible;opacity:1;
  transition:opacity .45s ease, visibility 0s 0s;
}
.pr-ring{
  position:absolute;
  top:calc(100% - 42px);left:50%;
  width:340vmax;height:340vmax;
  border-radius:50%;
  border:100px solid rgba(10,132,255,.55);
  transform:translate(-50%,-50%) scale(0);
  animation:radarRing 5s ease-out infinite;
  animation-play-state:paused;
  will-change:transform,opacity;
}
#pair-ripple.on .pr-ring,#pair-ripple.hiding .pr-ring{animation-play-state:running;}
.pr-ring:nth-child(1){animation-delay:0s;}
.pr-ring:nth-child(2){animation-delay:1.67s;border-color:rgba(10,132,255,.38);}
.pr-ring:nth-child(3){animation-delay:3.33s;border-color:rgba(10,132,255,.22);}
:host([theme="light"]) .pr-ring{border-color:rgba(0,122,255,.55);}
:host([theme="light"]) .pr-ring:nth-child(2){border-color:rgba(0,122,255,.38);}
:host([theme="light"]) .pr-ring:nth-child(3){border-color:rgba(0,122,255,.22);}

/* ── PAIR BUTTON pairing state ── */
/* overflow:hidden contiene el ::after dentro del botón — evita repaint de página y scrollbar */
.pair-btn{position:relative;overflow:hidden;}
.pair-btn.pairing{background:var(--red)!important;transition:background .4s ease;}
.pair-btn.pairing::after{
  content:'';position:absolute;inset:0;border-radius:var(--rp);
  background:rgba(255,255,255,.35);
  animation:pairPulse 1.5s ease-out infinite;pointer-events:none;
}
@keyframes pairPulse{0%{transform:scale(0);opacity:.7;}100%{transform:scale(1.5);opacity:0;}}

/* ── FADE OUT para eliminar cards ── */
@keyframes cardFadeOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.9)}}
.card-removing{animation:cardFadeOut .25s ease forwards;pointer-events:none;}

/* ── TOAST DE JOINING ── */
#joining-toast{
  display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
  background:var(--yellow-bg);border:1px solid rgba(255,214,10,.3);
  color:var(--yellow);border-radius:var(--rp);
  padding:10px 18px;font-size:.84rem;font-weight:600;z-index:9998;
  animation:fadeUp .25s ease;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.35);
  display:none;align-items:center;gap:8px;
}
#joining-toast.on{display:flex;}
.joining-spinner{width:14px;height:14px;border:2px solid rgba(255,214,10,.3);
  border-top-color:var(--yellow);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}

/* ── CONFETTI ── */
#confetti-wrap{
  position:fixed;inset:0;pointer-events:none;z-index:499;
  display:none;overflow:hidden;
}
#confetti-wrap.on{display:block;}
.confetti-piece{
  position:absolute;top:0;border-radius:2px;will-change:transform;
  animation:confettiFall var(--dur,2s) var(--delay,0s) ease-in both;
}
@keyframes confettiFall{
  0%  {transform:translateX(0) translateY(-20px) rotate(0deg);opacity:1;}
  80% {opacity:.9;}
  100%{transform:translateX(var(--dx,0px)) translateY(105vh) rotate(var(--rot,360deg));opacity:0;}
}
`;


const HTML = `
<div id="root">
  <div id="navbar">
    <div class="nav-left">
      <button class="back-btn" id="btn-back" title="Volver a Home Assistant">‹</button>
      <div class="nav-title-wrap">
        <span class="nav-title-main">Zigbee2MQTT</span>
        <span class="nav-title-sub">
          <div class="bridge-dot" id="dot"></div>
          <span id="bridge-txt">Conectando…</span>
          <span style="opacity:.4">·</span>
          <span>${VER}</span>
        </span>
      </div>
    </div>
    <div class="nav-right">
      <button class="theme-toggle" id="theme-btn" title="Cambiar tema">
        <div class="knob" id="theme-knob">🌙</div>
      </button>
      <button class="nav-btn" id="btn-reload" title="Recargar">↻</button>
      <button class="pair-btn" id="btn-pair">📡 Buscar</button>
    </div>
  </div>
  <div id="pair-ripple"><div class="pr-ring"></div><div class="pr-ring"></div><div class="pr-ring"></div></div>
  <div id="joining-toast"><div class="joining-spinner"></div><span id="joining-txt">Dispositivo detectado…</span></div>
  <div id="permit-bar">
    <div class="permit-icon">📡</div>
    <div class="permit-content">
      <div class="permit-title">Buscando dispositivos</div>
      <div class="permit-sub">Pon el dispositivo en modo pairing</div>
    </div>
    <span id="permit-cd">—</span>
  </div>
  <div id="confetti-wrap" aria-hidden="true"></div>
  <main>
    <div id="new-section">
      <div class="sec-hdr">
        <span class="sec-lbl">Sin nombre</span>
        <span class="badge" id="new-badge">0</span>
      </div>
      <div class="new-grid" id="new-grid"></div>
      <div style="height:24px"></div>
    </div>
    <div class="search-bar">
      <span class="search-ico">🔍</span>
      <input class="search-input" id="q" type="search" placeholder="Buscar dispositivo…">
    </div>
    <div class="pills-wrap" id="pills"></div>
    <div class="toolbar-foot">
      <span class="sec-lbl">Dispositivos</span>
      <span class="stats" id="stats">—</span>
    </div>
    <div id="dev-container">
      <div class="loading"><div class="spinner"></div><span>Cargando…</span></div>
    </div>
  </main>
  <!-- POPUP ENTIDADES -->
  <div class="ent-popup" id="ent-popup" style="display:none" onclick="this.style.display='none'">
    <div class="ent-sheet" onclick="event.stopPropagation()">
      <div class="ent-handle"></div>
      <div class="ent-header">
        <div class="ent-header-thumb" id="ent-thumb"></div>
        <div class="ent-header-info">
          <div class="ent-header-name" id="ent-name"></div>
          <div class="ent-header-model" id="ent-model"></div>
        </div>
        <button class="act-btn" id="ent-rename-btn" title="Renombrar">✏️</button>
        <button class="act-btn del" id="ent-delete-btn" title="Eliminar">🗑️</button>
      </div>
      <div class="ent-list" id="ent-list"></div>
    </div>
  </div>

  <!-- ALERTA NUEVO DISPOSITIVO -->
  <div id="new-device-alert" role="alert" aria-live="assertive">
    <div class="alert-progress"></div>
    <div class="alert-particles" id="alert-particles"></div>
    <div class="alert-inner">
      <div class="alert-icon-wrap">
        <div class="ring"></div>
        <div class="ring"></div>
        <div class="ring"></div>
        <div class="alert-thumb" id="alert-thumb">📡</div>
      </div>
      <div class="alert-body">
        <div class="alert-tag">¡Viva! 🎉 ¡Se ha emparejado!</div>
        <div class="alert-title" id="alert-title">Dispositivo sin nombre</div>
        <div class="alert-sub" id="alert-sub">Toca para asignar nombre</div>
      </div>
      <button class="alert-cta" id="alert-cta">Nombrar</button>
    </div>
  </div>

  <div class="overlay" id="m-rename">
    <div class="sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-body">
        <h3 id="m-rename-title">Renombrar</h3>
        <p id="m-rename-sub"></p>
        <div class="field">
          <label>Nombre</label>
          <input class="ios-input" id="m-rename-inp" type="text" placeholder="Ej: Sensor puerta cocina">
        </div>
        <div class="sheet-actions">
          <button class="ios-btn primary" id="btn-rename-ok">Guardar</button>
          <button class="ios-btn cancel" id="btn-rename-cancel">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
  <div class="overlay" id="m-delete">
    <div class="sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-body">
        <h3>Eliminar dispositivo</h3>
        <p id="m-delete-sub"></p>
        <div class="sheet-actions">
          <button class="ios-btn danger" id="btn-delete-ok">Eliminar</button>
          <button class="ios-btn cancel" id="btn-delete-cancel">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</div>
`;

class Z2MPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._devices = [];
    this._filter = 'all';
    this._pairTimer = null;
    this._renameFrom = null;
    this._deleteName = null;
    this._deleteDevice = null;
    this._pairActive = false;
    this._loaded = false;
    this._alertTimer = null;
    this._eventWs = null;  // WebSocket para eventos en tiempo real de Z2M
    this._popupWs = null;  // WebSocket para estados en tiempo real del popup
    this._mqttStateWs = null;  // WebSocket persistente para LQ/last_seen en tiempo real
    this._bridgeRestartTime = null;  // Tiempo del último reinicio de HA (para filtrar last_seen)
    this._prePairUnnamed = new Set();  // IDs sin nombre existentes ANTES de empezar a buscar
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._loaded) {
      this._loaded = true;
      this._render();
      // Restaurar estado de pairing ANTES de que _load() resuelva — evita cualquier flash
      if (sessionStorage.getItem('z2m-pairing') === '1') {
        this._pairActive = true; // evita que _showPairBanner() haga cambios DOM después
        const pb = this._$('btn-pair');
        pb.textContent = '⏹ Detener';
        pb.classList.add('pairing');
        pb.disabled = false;
        // Mostrar permit-bar y pair-ripple sin animación de entrada
        const bar    = this._$('permit-bar');
        const ripple = this._$('pair-ripple');
        bar.classList.add('z2m-no-anim', 'on');
        ripple.classList.add('z2m-no-anim', 'on');
        requestAnimationFrame(() => {
          bar.classList.remove('z2m-no-anim');
          ripple.classList.remove('z2m-no-anim');
        });
      }
      this._initTheme();
      this._bindEvents();
      this._load();
      this._startEventListener();
      this._startMqttStateListener();
      checkForUpdate();
    }
  }

  _render() {
    this.shadowRoot.innerHTML = `<style>${CSS}</style>${HTML}`;
  }

  _$ = id => this.shadowRoot.getElementById(id);

  // ── TEMA ──────────────────────────────────────────────────────
  _initTheme() {
    const saved = localStorage.getItem('z2m-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this._applyTheme(saved ? saved : (prefersDark ? 'dark' : 'light'));

    this._$('theme-btn').addEventListener('click', () => {
      const current = this.getAttribute('theme') || 'dark';
      this._applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  _applyTheme(t) {
    this.setAttribute('theme', t);
    localStorage.setItem('z2m-theme', t);
    const k = this._$('theme-knob');
    if (k) k.textContent = t === 'light' ? '☀️' : '🌙';
  }

  // ── EVENTOS ───────────────────────────────────────────────────
  _bindEvents() {
    this._$('btn-reload').addEventListener('click', () => this._load(true));
    this._$('btn-back').addEventListener('click', () => {
      // Navegar de vuelta al dashboard por defecto de HA
      try {
        // Intentar usar la API de navegación de HA si está disponible
        const p = window.parent;
        if (p && p.history) { p.history.back(); return; }
        // Fallback: navegar al root de HA
        if (p && p.location) { p.location.href = '/'; return; }
      } catch(e) {}
      window.history.back();
    });
    this._$('btn-pair').addEventListener('click', () => {
      if (this._pairActive) this._stopPair();
      else this._startPair();
    });
    this._$('q').addEventListener('input', () => this._applyFilters());

    // Pills
    const pillData = [
      ['all','Todos'],['switch','Interruptores'],['sensor','Sensores'],
      ['light','Luces'],['cover','Estores'],['button','Botones'],['other','Otros']
    ];
    const pillsWrap = this._$('pills');
    pillData.forEach(([f, label]) => {
      const b = document.createElement('button');
      b.className = 'pill' + (f === 'all' ? ' on' : '');
      b.textContent = label;
      b.addEventListener('click', () => {
        this._filter = f;
        pillsWrap.querySelectorAll('.pill').forEach(p => p.classList.remove('on'));
        b.classList.add('on');
        this._applyFilters();
      });
      pillsWrap.appendChild(b);
    });

    // Modales
    this._$('btn-rename-ok').addEventListener('click', () => this._doRename());
    this._$('btn-rename-cancel').addEventListener('click', () => this._closeModal('m-rename'));
    this._$('btn-delete-ok').addEventListener('click', () => this._doDelete());
    this._$('btn-delete-cancel').addEventListener('click', () => this._closeModal('m-delete'));
    this._$('m-rename-inp').addEventListener('keydown', e => { if (e.key === 'Enter') this._doRename(); });

    // Cerrar al pulsar fuera
    ['m-rename','m-delete'].forEach(id => {
      this._$(id).addEventListener('click', e => {
        if (e.target === this._$(id)) this._closeModal(id);
      });
    });
  }

  // ── API HELPERS ───────────────────────────────────────────────
  get _token() { return this._hass.auth.data.access_token; }
  get _haUrl()  { return this._hass.auth.data.hassUrl || ''; }
  get _hdrs()   { return { 'Authorization': `Bearer ${this._token}`, 'Content-Type': 'application/json' }; }

  _wsCall(type, extra = {}) {
    const wsUrl = this._haUrl.replace(/^http/, 'ws') + '/api/websocket';
    return new Promise((ok, fail) => {
      const ws = new WebSocket(wsUrl);
      let id = 1;
      const t = setTimeout(() => { ws.close(); fail(new Error('Timeout')); }, 12000);
      ws.onmessage = ev => {
        const m = JSON.parse(ev.data);
        if (m.type === 'auth_required') ws.send(JSON.stringify({ type: 'auth', access_token: this._token }));
        else if (m.type === 'auth_ok')  ws.send(JSON.stringify({ id, type, ...extra }));
        else if (m.type === 'result' && m.id === id) { clearTimeout(t); ws.close(); ok(m); }
        else if (m.type === 'auth_invalid') { clearTimeout(t); ws.close(); fail(new Error('Auth inválida')); }
      };
      ws.onerror = () => { clearTimeout(t); fail(new Error('WS error')); };
    });
  }

  async _mqttPub(topic, payload) {
    const r = await fetch(`${this._haUrl}/api/services/mqtt/publish`, {
      method: 'POST', headers: this._hdrs,
      body: JSON.stringify({ topic, payload: JSON.stringify(payload) })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  }

  // ── TIPO Y EMOJI ──────────────────────────────────────────────
  _guessType(d) {
    const dom = (d.ents || []).map(e => e.entity_id.split('.')[0]);
    const m = (d.model || '').toLowerCase();
    if (dom.includes('cover')) return 'cover';
    if (dom.includes('light')) return 'light';
    if (['button','remote','knob','styrbar','scene switch','smart knob'].some(k => m.includes(k))) return 'button';
    if (dom.includes('binary_sensor')) return 'sensor';
    if (dom.includes('sensor') && !dom.includes('switch')) return 'sensor';
    if (dom.includes('switch')) return 'switch';
    return 'other';
  }

  _tLabel(t) { return {switch:'Interruptor',sensor:'Sensor',light:'Luz',cover:'Estor',button:'Botón',other:'Otro'}[t]||'Otro'; }
  _tTag(t)   { return {switch:'sw',sensor:'sen',light:'li',cover:'cov',button:'btn',other:'oth'}[t]||'oth'; }

  _emo(m) {
    m = (m || '').toLowerCase();
    if (m.includes('cover')||m.includes('motor')) return '🪟';
    if (m.includes('knob'))   return '🎛️';
    if (m.includes('styrbar')||m.includes('remote')) return '🕹️';
    if (m.includes('button')||m.includes('scene switch')) return '🔘';
    if (m.includes('plug'))   return '🔌';
    if (m.includes('contact')||m.includes('door')) return '🚪';
    if (m.includes('temperature')||m.includes('humidity')) return '🌡️';
    if (m.includes('motion')||m.includes('presence')||m.includes('occupancy')) return '👁️';
    if (m.includes('vibration')) return '📳';
    if (m.includes('water')||m.includes('leak')) return '💧';
    if (m.includes('rgb')||m.includes('light')) return '💡';
    if (m.includes('repeater')) return '📶';
    if (m.includes('energy')||m.includes('monitor')||m.includes('1p+n')) return '⚡';
    if (m.includes('ir')) return '📡';
    return '📦';
  }

  _thumbEl(model, modelId) {
    // modelId es el ID real de Z2M (ej: "TS011F"), model es el nombre descriptivo
    const imgModel = modelId || model;
    const url = imgUrl(imgModel);
    const fb  = this._emo(model);
    const urlFb = imgFallback(imgModel);
    if (!url) return document.createTextNode(fb);
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;padding:5px';
    img.onerror = () => {
      const fb2 = urlFb;
      if (!img.dataset.tried) {
        img.dataset.tried = '1';
        img.src = fb2;
      } else {
        img.replaceWith(document.createTextNode(fb));
      }
    };
    return img;
  }

  // ── DETECTAR BRIDGE ID ────────────────────────────────────────
  async _detectBridgeId() {
    if (BRIDGE_ID) return BRIDGE_ID;
    // Busca en el device registry el dispositivo que sea el bridge de Z2M
    const ws = await this._wsCall('config/device_registry/list');
    if (!ws?.result) return null;
    const bridge = ws.result.find(d =>
      d.manufacturer === 'Zigbee2MQTT' &&
      d.model === 'Bridge' &&
      d.via_device_id === null
    );
    BRIDGE_ID = bridge?.id || null;
    console.log('[Z2M Panel] Bridge ID detectado:', BRIDGE_ID);
    return BRIDGE_ID;
  }

  // ── LOAD ──────────────────────────────────────────────────────
  // Obtiene la lista real de dispositivos Z2M desde el topic MQTT del bridge
  // Esto da el model ID real (ej: "TS011F") en vez del nombre descriptivo de HA
  // Obtiene datos de Z2M: modelos, last_seen real, y linkquality desde mensajes MQTT retenidos.
  // IMPORTANTE: los mensajes retenidos (zigbee2mqtt/+) llegan ANTES que bridge/devices,
  // por eso se almacenan en pendingStates y se procesan cuando llega bridge/devices.
  async _getZ2MDevices() {
    const empty = { models: {}, lastSeen: {}, lq: {}, friendlyToIeee: {} };
    try {
      const wsUrl = this._haUrl.replace(/^http/, 'ws') + '/api/websocket';
      return await new Promise(ok => {
        const ws = new WebSocket(wsUrl);
        const models = {};           // ieee → model_id
        const lastSeen = {};         // ieee → Date
        const lqMap = {};            // ieee → linkquality
        const friendlyToIeee = {};   // friendly_name → ieee
        const pendingStates = {};    // friendly_name → payload (llegan antes que bridge/devices)
        let resolveTimer = null;

        const done = () => {
          if (resolveTimer) clearTimeout(resolveTimer);
          try { ws.close(); } catch(e) {}
          ok({ models, lastSeen, lq: lqMap, friendlyToIeee });
        };

        const applyState = (friendlyName, state) => {
          const ieee = friendlyToIeee[friendlyName];
          if (!ieee) return;
          if (typeof state.linkquality === 'number') lqMap[ieee] = state.linkquality;
          // last_seen del mensaje individual (si Z2M lo incluye con advanced.last_seen != disable)
          if (state.last_seen) {
            const d = new Date(state.last_seen);
            if (!isNaN(d.getTime())) lastSeen[ieee] = d;
          }
        };

        const globalTimeout = setTimeout(done, 8000);

        ws.onmessage = ev => {
          const m = JSON.parse(ev.data);
          if (m.type === 'auth_required') {
            ws.send(JSON.stringify({ type: 'auth', access_token: this._token }));
          } else if (m.type === 'auth_ok') {
            // Suscribirse a bridge/devices
            ws.send(JSON.stringify({ id: 1, type: 'mqtt/subscribe', topic: 'zigbee2mqtt/bridge/devices' }));
            // Suscribirse a estados individuales (mensajes retenidos con lq y last_seen)
            ws.send(JSON.stringify({ id: 2, type: 'mqtt/subscribe', topic: 'zigbee2mqtt/+' }));
            setTimeout(() => {
              ws.send(JSON.stringify({
                id: 3, type: 'call_service', domain: 'mqtt', service: 'publish',
                service_data: { topic: 'zigbee2mqtt/bridge/request/devices', payload: '' }
              }));
            }, 200);
          } else if (m.type === 'event' && m.event) {
            const topic = m.event.topic || '';

            if (topic === 'zigbee2mqtt/bridge/devices') {
              try {
                const devices = JSON.parse(m.event.payload);
                devices.forEach(d => {
                  if (!d.ieee_address) return;
                  const ieee = d.ieee_address;
                  if (d.definition?.model) {
                    models[ieee] = d.definition.model;
                    models['zigbee2mqtt_' + ieee] = d.definition.model;
                  }
                  // last_seen de bridge/devices (si Z2M lo expone)
                  if (d.last_seen) {
                    const t = new Date(d.last_seen);
                    if (!isNaN(t.getTime())) lastSeen[ieee] = t;
                  }
                  if (d.friendly_name) {
                    friendlyToIeee[d.friendly_name] = ieee;
                    // Procesar estados ya recibidos (llegaron antes que bridge/devices)
                    if (pendingStates[d.friendly_name]) {
                      applyState(d.friendly_name, pendingStates[d.friendly_name]);
                      delete pendingStates[d.friendly_name];
                    }
                  }
                });
                // Esperar un poco más para mensajes retenidos que aún puedan llegar
                clearTimeout(globalTimeout);
                resolveTimer = setTimeout(done, 1500);
              } catch(e) { done(); }

            } else if (topic.startsWith('zigbee2mqtt/') && !topic.startsWith('zigbee2mqtt/bridge')) {
              const friendlyName = topic.slice('zigbee2mqtt/'.length);
              try {
                const state = JSON.parse(m.event.payload);
                if (friendlyToIeee[friendlyName]) {
                  // bridge/devices ya llegó, podemos mapear directamente
                  applyState(friendlyName, state);
                } else {
                  // bridge/devices aún no llegó, guardar para procesar después
                  pendingStates[friendlyName] = state;
                }
              } catch(e) {}
            }
          }
        };
        ws.onerror = () => done();
      });
    } catch(e) { return empty; }
  }

  async _load(showSpinner = false) {
    if (this._loadInProgress) return;
    this._loadInProgress = true;
    // Solo mostrar spinner si no hay grid aún (primera carga) o si se pide explícitamente
    const hasGrid = !!this.shadowRoot.getElementById('dev-grid');
    if (!hasGrid || showSpinner) {
      this._$('dev-container').innerHTML = '<div class="loading"><div class="spinner"></div><span>Cargando…</span></div>';
    }
    try {
      const [statesR, wsDevs, wsEnts, z2mData] = await Promise.all([
        fetch(`${this._haUrl}/api/states`, { headers: this._hdrs }).then(r => r.json()),
        this._wsCall('config/device_registry/list'),
        this._wsCall('config/entity_registry/list'),
        this._getZ2MDevices(),
      ]);

      if (!wsDevs?.result) throw new Error('No se pudo obtener el registro');

      const allEnts = wsEnts?.result || [];
      const sm = Object.fromEntries(statesR.map(s => [s.entity_id, s]));

      const conn = sm['binary_sensor.zigbee2mqtt_bridge_connection_state'];
      const perm = sm['switch.zigbee2mqtt_bridge_permit_join'];
      const ptim = sm['sensor.zigbee2mqtt_bridge_permit_join_timeout'];

      // Guardar hora del último reinicio de HA/bridge para filtrar last_seen falsos
      if (conn?.last_changed) this._bridgeRestartTime = new Date(conn.last_changed);

      this._updateBridge(conn?.state === 'on');

      // Detectar bridge ID si no está disponible aún
      if (!BRIDGE_ID) await this._detectBridgeId();
      const z2m = wsDevs.result.filter(d => d.via_device_id === BRIDGE_ID);

      this._devices = z2m.map(d => {
        const ents    = allEnts.filter(e => e.device_id === d.id);
        const bE      = ents.find(e => /(battery|batt)$/.test(e.entity_id) && !e.entity_id.includes('low'));
        const b       = bE ? parseInt(sm[bE.entity_id]?.state) : null;
        const ieee    = d.identifiers?.find(i => i[0] === 'mqtt')?.[1] || d.name;

        // Modelo real de Z2M (bridge/devices), fallback al de HA
        const realModel = z2mData.models[ieee] || null;

        // Linkquality: primero desde MQTT retenido, luego desde entidad HA
        let lq = z2mData.lq[ieee] !== undefined ? z2mData.lq[ieee] : null;
        if (lq === null) {
          const lqE = ents.find(e => e.entity_id.includes('linkquality'));
          const lqState = lqE ? sm[lqE.entity_id] : null;
          lq = lqState && lqState.state !== 'unavailable' ? parseInt(lqState.state) : null;
        }

        // last_seen: preferir el de Z2M (no se resetea con HA), fallback a HA last_changed
        let lastSeen = z2mData.lastSeen[ieee] || null;
        if (!lastSeen) {
          ents.forEach(e => {
            if (e.disabled_by) return;
            const s = sm[e.entity_id];
            if (!s) return;
            const t = new Date(s.last_changed);
            if (!lastSeen || t > lastSeen) lastSeen = t;
          });
        }

        const dev = {
          id: d.id, name: d.name_by_user || d.name, ieee,
          model: d.model,
          modelId: realModel,
          vendor: d.manufacturer, area: d.area_id,
          lq: isNaN(lq) ? null : lq,
          batt: isNaN(b) ? null : b,
          lastSeen, ents,
        };
        dev.type = this._guessType(dev);
        return dev;
      });

      // Guardar mapa friendly_name→ieee y ieee→device para el listener MQTT en tiempo real
      this._friendlyToIeee = z2mData.friendlyToIeee || {};
      this._devsByIeee = {};
      this._devices.forEach(d => { this._devsByIeee[d.ieee] = d; });

      // Permit-join: ahora que _devices ya está actualizado, capturar snapshot correcto
      if (perm?.state === 'on') {
        const rem = parseInt(ptim?.state);
        const realRem = Number.isFinite(rem) && rem > 0 ? rem : null;
        if (!this._pairActive) {
          this._showPairBanner(realRem ?? 60);
        } else if (realRem !== null) {
          const cdEl = this._$('permit-cd');
          const shown = cdEl ? parseInt(cdEl.textContent) : NaN;
          if (!Number.isFinite(shown) || Math.abs(shown - realRem) > 8) {
            this._showPairBanner(realRem);
          }
        }
      } else if (sessionStorage.getItem('z2m-pairing') === '1') {
        // El escaneo terminó entre recargas — limpiar estado residual
        sessionStorage.removeItem('z2m-pairing');
        if (!this._pairActive) {
          const pb = this._$('btn-pair');
          pb.textContent = '📡 Buscar';
          pb.classList.remove('pairing');
        }
      }

      this._renderAll();
    } catch(e) {
      console.error(e);
      this._$('dev-container').innerHTML = `<div class="empty"><div class="ico">⚠️</div><p>${e.message}</p></div>`;
    } finally {
      this._loadInProgress = false;
    }
  }

  _isIEEE(n) { return /^0x[0-9a-f]{16}$/i.test(n); }

  _updateBridge(on) {
    this._$('dot').className = 'bridge-dot ' + (on ? 'on' : 'off');
    this._$('bridge-txt').textContent = on ? 'Bridge online' : 'Bridge offline';
  }

  // ── RENDER ────────────────────────────────────────────────────
  _renderAll() { this._renderNew(); this._renderDevices(); }

  // Sección de dispositivos sin nombre — actualización suave (sin destruir el DOM)
  _renderNew() {
    const nd  = this._devices.filter(d => this._isIEEE(d.name));
    const sec = this._$('new-section');
    this._$('new-badge').textContent = nd.length;
    if (!nd.length) { sec.classList.remove('on'); return; }
    sec.classList.add('on');

    const grid = this._$('new-grid');
    const existing = new Set([...grid.querySelectorAll('.new-card')].map(c => c.id));
    const current  = new Set(nd.map(d => `nc-${d.id}`));

    // Eliminar los que ya no están
    existing.forEach(id => {
      if (!current.has(id)) {
        const el = this.shadowRoot.getElementById(id);
        if (el) el.remove();
      }
    });

    // Añadir los nuevos
    let newCardAdded = false;
    nd.forEach(d => {
      if (existing.has(`nc-${d.id}`)) return; // ya existe
      newCardAdded = true;
      const card = document.createElement('div');
      card.className = 'new-card';
      card.id = `nc-${d.id}`;
      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'new-thumb';
      thumbDiv.appendChild(this._thumbEl(d.model, d.modelId));
      card.innerHTML = `
        <div class="new-top">
          <div class="new-meta">
            <div class="new-label">Dispositivo sin nombre</div>
            <div class="new-ieee">${d.ieee}</div>
            <div class="new-model">${d.vendor || ''} ${d.model || 'Modelo desconocido'}</div>
          </div>
        </div>
        <button class="btn-assign">✏️ Asignar nombre</button>`;
      card.querySelector('.new-top').insertBefore(thumbDiv, card.querySelector('.new-meta'));
      card.querySelector('.btn-assign').addEventListener('click', (e) => { e.stopPropagation(); this._openAssign(d.name); });
      card.addEventListener('click', () => this._openEntPopup(d));
      grid.appendChild(card);
    });
    // Confetti solo si apareció un dispositivo que NO existía antes de empezar a buscar
    if (newCardAdded && this._pairActive) {
      const trulyNew = nd.some(d => !existing.has(`nc-${d.id}`) && !this._prePairUnnamed.has(d.id));
      if (trulyNew) this._spawnConfetti();
    }
  }

  // Grid principal — actualización suave: patch en los existentes, añade los nuevos, elimina los borrados
  _renderDevices() {
    const named = this._devices.filter(d => !this._isIEEE(d.name));
    const container = this._$('dev-container');

    if (!named.length) {
      container.innerHTML = '<div class="empty"><div class="ico">📭</div><p>No hay dispositivos con nombre</p></div>';
      return;
    }

    let grid = this.shadowRoot.getElementById('dev-grid');
    const firstRender = !grid;

    if (firstRender) {
      // Primera carga: construir el grid FUERA del DOM para evitar reflows escalonados
      grid = document.createElement('div');
      grid.className = 'dev-grid';
      grid.id = 'dev-grid';
    } else {
      // Cargas posteriores: eliminar tarjetas que ya no existen
      const currentIds = new Set(named.map(d => d.id));
      grid.querySelectorAll('.dev-card').forEach(card => {
        const id = card.id.replace('dc-', '');
        if (!currentIds.has(id)) {
          card.classList.add('card-removing');
          setTimeout(() => card.remove(), 260);
        }
      });
    }

    // Actualizar existentes o crear nuevas
    named.forEach((d, i) => {
      const existing = this.shadowRoot.getElementById(`dc-${d.id}`);
      if (existing) {
        this._patchCard(d, existing);
      } else {
        const newCard = this._makeCard(d);
        newCard.style.animationDelay = `${Math.min(i, 12) * 0.03}s`;
        grid.appendChild(newCard);
      }
    });

    // Primera carga: un único replaceChildren atómico (sin spinner→vacío→grid)
    if (firstRender) container.replaceChildren(grid);

    this._applyFilters();
  }

  // Actualiza las partes variables de una tarjeta sin recrearla
  _patchCard(d, card) {
    card.dataset.type  = d.type;
    card.dataset.name  = d.name.toLowerCase();
    const nameEl = card.querySelector('.dev-name');
    if (nameEl) { nameEl.textContent = d.name; nameEl.title = d.name; }
    const lqEl = card.querySelector('.dev-lq');
    if (lqEl) lqEl.innerHTML = this._renderLQ(d.lq);
    const statusEl = card.querySelector('.dev-status');
    if (statusEl) statusEl.innerHTML = this._statusHtml(d);
    const typeTag = card.querySelector('.dev-tags .tag:first-child');
    if (typeTag) { typeTag.className = `tag ${this._tTag(d.type)}`; typeTag.textContent = this._tLabel(d.type); }
  }

  _statusHtml(d) {
    const battHtml = (d.batt !== null && !isNaN(d.batt))
      ? `<div class="dev-batt ${d.batt < 20 ? 'low' : d.batt < 50 ? 'med' : 'ok'}">${d.batt < 20 ? '🪫' : '🔋'} ${d.batt}%</div>`
      : '';
    const lastSeenHtml = d.lastSeen
      ? `<div class="dev-lastseen ${ageClass(d.lastSeen)}">🕐 ${timeAgo(d.lastSeen)}</div>`
      : `<div class="dev-lastseen age-unknown">⚠️ última conexión desconocida</div>`;
    return battHtml + lastSeenHtml;
  }

  _makeCard(d) {
    const card = document.createElement('div');
    card.className = 'dev-card';
    card.id = `dc-${d.id}`;
    card.dataset.type = d.type;
    card.dataset.name = d.name.toLowerCase();

    const thumbDiv = document.createElement('div');
    thumbDiv.className = 'dev-thumb';
    thumbDiv.appendChild(this._thumbEl(d.model, d.modelId));

    card.innerHTML = `
      <div class="dev-head">
        <div class="dev-info">
          <div class="dev-name" title="${d.name}">${d.name}</div>
          <div class="dev-model" title="${d.model || ''}">${d.model || '—'}</div>
          <div class="dev-vendor">${d.vendor || '—'}</div>
        </div>
        <div class="dev-lq">${this._renderLQ(d.lq)}</div>
      </div>
      <div class="dev-tags">
        <span class="tag ${this._tTag(d.type)}">${this._tLabel(d.type)}</span>
        ${d.area ? `<span class="tag area">${d.area}</span>` : ''}
      </div>
      <div class="dev-foot">
        <div class="dev-actions">
          <button class="act-btn" title="Renombrar">✏️</button>
          <button class="act-btn del" title="Eliminar">🗑️</button>
        </div>
        <div class="dev-status" style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
          ${this._statusHtml(d)}
        </div>
      </div>`;

    card.querySelector('.dev-head').insertBefore(thumbDiv, card.querySelector('.dev-info'));
    card.querySelector('.act-btn').addEventListener('click', (e) => { e.stopPropagation(); this._openRename(d.name); });
    card.querySelector('.act-btn.del').addEventListener('click', (e) => { e.stopPropagation(); this._openDelete(d); });
    card.addEventListener('click', () => this._openEntPopup(d));
    return card;
  }

  _renderLQ(lq) {
    const h = [4,7,10,14];
    if (lq === null || isNaN(lq))
      return `<div class="lq-bars">${h.map(hh => `<div class="lq-bar" style="height:${hh}px"></div>`).join('')}</div><div class="lq-val">—</div>`;
    const pct = Math.round((lq / 255) * 100);
    const cls = pct < 30 ? 'bad' : pct < 60 ? 'med' : '';
    const f   = Math.round((pct / 100) * 4);
    return `<div class="lq-bars">${h.map((hh,i) => `<div class="lq-bar${i < f ? ' on ' + cls : ''}" style="height:${hh}px"></div>`).join('')}</div><div class="lq-val">${pct}%</div>`;
  }

  // ── FILTROS ───────────────────────────────────────────────────
  _applyFilters() {
    const q = (this._$('q')?.value || '').toLowerCase();
    const cards = this.shadowRoot.querySelectorAll('.dev-card');
    let vis = 0;
    cards.forEach(c => {
      const ok = (this._filter === 'all' || c.dataset.type === this._filter)
              && (!q || c.dataset.name.includes(q));
      c.style.display = ok ? '' : 'none';
      if (ok) vis++;
    });
    this._$('stats').textContent = `${vis} dispositivo${vis !== 1 ? 's' : ''}`;
  }

  // ── PERMIT JOIN ───────────────────────────────────────────────
  async _startPair() {
    this._$('btn-pair').disabled = true;
    try {
      await fetch(`${this._haUrl}/api/services/switch/turn_on`, {
        method: 'POST', headers: this._hdrs,
        body: JSON.stringify({ entity_id: 'switch.zigbee2mqtt_bridge_permit_join' })
      });
      this._showPairBanner(254);
    } catch {
      this._toast('err', 'Error al activar emparejamiento');
      this._$('btn-pair').disabled = false;
    }
  }

  async _stopPair() {
    await fetch(`${this._haUrl}/api/services/switch/turn_off`, {
      method: 'POST', headers: this._hdrs,
      body: JSON.stringify({ entity_id: 'switch.zigbee2mqtt_bridge_permit_join' })
    });
    this._hidePairBanner();
  }

  _showPairBanner(secs) {
    const firstActivation = !this._pairActive;
    this._pairActive = true;
    // Solo tocar el DOM de UI en la primera activación para evitar parpadeos
    if (firstActivation) {
      sessionStorage.setItem('z2m-pairing', '1');
      // Capturar snapshot de dispositivos sin nombre ya existentes ANTES de buscar
      this._prePairUnnamed = new Set(this._devices.filter(d => this._isIEEE(d.name)).map(d => d.id));
      this._$('permit-bar').classList.remove('leaving');
      this._$('permit-bar').classList.add('on');
      // Reiniciar las animaciones de los anillos desde cero, sin forzar reflow
      const ripple = this._$('pair-ripple');
      ripple.classList.remove('hiding');
      ripple.querySelectorAll('.pr-ring').forEach(r => { r.style.animationName = 'none'; });
      requestAnimationFrame(() => {
        ripple.querySelectorAll('.pr-ring').forEach(r => { r.style.animationName = ''; });
        ripple.classList.add('on');
      });
      const pb = this._$('btn-pair');
      pb.textContent = '⏹ Detener';
      pb.classList.add('pairing');
      pb.disabled = false;
    }
    let rem = Number.isFinite(secs) && secs > 0 ? secs : 60;
    clearInterval(this._pairTimer);
    this._$('permit-cd').textContent = rem + 's';
    this._pairTimer = setInterval(() => {
      rem--;
      this._$('permit-cd').textContent = rem + 's';
      if (rem <= 0) { this._hidePairBanner(); this._load(); }
    }, 1000);
  }

  _hidePairBanner() {
    this._pairActive = false;
    this._prePairUnnamed = new Set();
    sessionStorage.removeItem('z2m-pairing');
    const bar = this._$('permit-bar');
    if (bar) {
      bar.classList.add('leaving');
      setTimeout(() => bar.classList.remove('on', 'leaving'), 350);
    }
    const ripple = this._$('pair-ripple');
    ripple.classList.remove('on');
    ripple.classList.add('hiding');
    setTimeout(() => ripple.classList.remove('hiding'), 460);
    const pb = this._$('btn-pair');
    pb.textContent = '📡 Buscar';
    pb.classList.remove('pairing');
    pb.disabled = false;
    clearInterval(this._pairTimer);
    this._pairTimer = null;
  }

  // ── RENAME ────────────────────────────────────────────────────
  _openAssign(currentName) {
    this._renameFrom = currentName;
    this._$('m-rename-title').textContent = 'Asignar nombre';
    this._$('m-rename-sub').textContent = `Dispositivo: ${currentName}`;
    this._$('m-rename-inp').value = '';
    this._$('m-rename').classList.add('on');
    setTimeout(() => this._$('m-rename-inp').focus(), 80);
  }

  _openRename(currentName) {
    this._renameFrom = currentName;
    this._$('m-rename-title').textContent = 'Renombrar';
    this._$('m-rename-sub').textContent = `Renombrando: ${currentName}`;
    const inp = this._$('m-rename-inp');
    inp.value = currentName;
    this._$('m-rename').classList.add('on');
    setTimeout(() => { inp.focus(); inp.select(); }, 80);
  }

  async _doRename() {
    const n = this._$('m-rename-inp').value.trim();
    if (!n || !this._renameFrom) return;
    const inp = this._$('m-rename-inp');

    // Check duplicados
    const existing = this._devices.map(d => d.name.toLowerCase());
    if (existing.includes(n.toLowerCase()) && n.toLowerCase() !== this._renameFrom.toLowerCase()) {
      inp.style.outline = '2px solid var(--red)';
      inp.style.background = 'var(--red-bg)';
      this._toast('err', 'Ya existe un dispositivo con ese nombre');
      setTimeout(() => { inp.style.outline = ''; inp.style.background = ''; }, 2000);
      return;
    }

    this._closeModal('m-rename');
    try {
      await this._mqttPub('zigbee2mqtt/bridge/request/device/rename', { from: this._renameFrom, to: n });
      this._toast('ok', `✅ Renombrado como "${n}"`);
      setTimeout(() => this._load(), 1800);
    } catch { this._toast('err', 'Error al renombrar'); }
  }

  // ── DELETE ────────────────────────────────────────────────────
  _openDelete(device) {
    // Acepta tanto el objeto dispositivo como un nombre string (compatibilidad)
    if (typeof device === 'string') device = { name: device, ieee: device };
    this._deleteDevice = device;
    this._deleteName = device.name; // compatibilidad
    this._$('m-delete-sub').textContent = `¿Seguro que quieres eliminar "${device.name}"? Tendrás que volver a emparejarlo.`;
    this._$('m-delete').classList.add('on');
  }

  async _doDelete() {
    const dev = this._deleteDevice;
    if (!dev) return;
    this._closeModal('m-delete');
    const isIeee = dev.ieee && /^0x[0-9a-f]{16}$/i.test(dev.ieee);
    const id = isIeee ? dev.ieee : dev.name;
    try {
      await this._mqttPub('zigbee2mqtt/bridge/request/device/remove', { id, force: true });
      this._toast('ok', `🗑️ "${dev.name}" eliminado`);
      // Eliminar la tarjeta del DOM sin recargar toda la página
      const card = this.shadowRoot.getElementById(`dc-${dev.id}`);
      if (card) {
        card.classList.add('card-removing');
        setTimeout(() => { card.remove(); this._applyFilters(); }, 260);
      }
      this._devices = this._devices.filter(d => d.id !== dev.id);
      this._deleteDevice = null;
    } catch { this._toast('err', 'Error al eliminar'); }
  }

  // ── ESCUCHA DE EVENTOS EN TIEMPO REAL ────────────────────────
  _startEventListener() {
    // Conectar al WS de HA y suscribirse al topic de eventos de Z2M
    const wsUrl = this._haUrl.replace(/^http/, 'ws') + '/api/websocket';
    if (this._eventWs) { try { this._eventWs.close(); } catch(e){} }

    const ws = new WebSocket(wsUrl);
    this._eventWs = ws;
    let subId = 10;

    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.type === 'auth_required') {
        ws.send(JSON.stringify({ type: 'auth', access_token: this._token }));
      } else if (m.type === 'auth_ok') {
        // Eventos Z2M (device_joined, interview, etc.)
        ws.send(JSON.stringify({ id: subId++, type: 'mqtt/subscribe', topic: 'zigbee2mqtt/bridge/events' }));
        // Cambios en el registro de dispositivos de HA (nuevo dispositivo añadido por Z2M)
        ws.send(JSON.stringify({ id: subId++, type: 'subscribe_events', event_type: 'device_registry_updated' }));

      } else if (m.type === 'event') {
        // Evento del registro de HA — recarga suave para capturar nuevos dispositivos
        if (m.event?.event_type === 'device_registry_updated') {
          const action = m.event.data?.action;
          if (action === 'create' || action === 'remove') {
            setTimeout(() => this._load(), 800);
          }
        }

        const topic = m.event?.topic || '';
        if (topic === 'zigbee2mqtt/bridge/events') {
          try {
            const payload = JSON.parse(m.event.payload);
            const d = payload.data || {};
            const ieee = d.ieee_address || '';

            if (payload.type === 'device_joined') {
              this._showJoiningToast(`📡 ${ieee} — identificando…`);
              setTimeout(() => this._load(), 1200);

            } else if (payload.type === 'device_interview_started') {
              this._showJoiningToast(`🔍 Entrevistando dispositivo ${ieee}…`);

            } else if (payload.type === 'device_interview_successful') {
              this._hideJoiningToast();
              const model = d.supported ? (d.definition?.model || null) : null;
              const vendor = d.definition?.vendor || d.manufacturer || '';
              const desc = d.definition?.description || d.model_id || 'Dispositivo desconocido';
              this._showNewDeviceAlert(ieee, model, vendor, desc);
              // Reintentos para dar tiempo a que HA registre el dispositivo
              [1500, 4000, 8000].forEach(delay => setTimeout(() => this._load(), delay));

            } else if (payload.type === 'device_interview_failed') {
              this._hideJoiningToast();
              this._toast('err', `❌ Error identificando ${ieee}`);
              setTimeout(() => this._load(), 1500);
            }
          } catch(e) {}
        }
      }
    };
    ws.onerror = () => {};
    ws.onclose = () => {
      if (this._eventWs === ws) {
        setTimeout(() => { if (this._loaded) this._startEventListener(); }, 5000);
      }
    };
  }

  _showJoiningToast(msg) {
    const el = this._$('joining-toast');
    if (!el) return;
    this._$('joining-txt').textContent = msg;
    el.classList.add('on');
  }

  _hideJoiningToast() {
    const el = this._$('joining-toast');
    if (el) el.classList.remove('on');
  }

  _showNewDeviceAlert(ieee, modelId, vendor, desc) {
    const alert = this._$('new-device-alert');
    const thumb = this._$('alert-thumb');
    const title = this._$('alert-title');
    const sub   = this._$('alert-sub');
    const cta   = this._$('alert-cta');

    // Cancelar timer anterior
    if (this._alertTimer) { clearTimeout(this._alertTimer); this._alertTimer = null; }
    alert.classList.remove('leaving');

    // Contenido
    title.textContent = ieee;
    sub.textContent = `${vendor} ${desc}`.trim() || 'Modelo desconocido';

    // Imagen
    thumb.innerHTML = '';
    if (modelId) {
      const img = document.createElement('img');
      img.src = imgUrl(modelId);
      img.alt = '';
      img.style.cssText = 'width:100%;height:100%;object-fit:contain;padding:5px';
      img.onerror = () => {
        img.src = imgFallback(modelId);
        img.onerror = () => { thumb.textContent = '📡'; };
      };
      thumb.appendChild(img);
    } else {
      thumb.textContent = '📡';
    }

    // Partículas en el alert y confetti en pantalla
    this._spawnParticles();
    this._spawnConfetti();

    // Mostrar
    alert.classList.add('visible');
    alert.style.display = 'block';

    // Acción del botón: abre el sheet de asignar nombre
    cta.onclick = () => {
      this._dismissAlert();
      this._openAssign(ieee);
    };
    alert.onclick = (e) => {
      if (e.target !== cta) { this._dismissAlert(); this._openAssign(ieee); }
    };

    // Auto-dismiss después de 12 segundos
    this._alertTimer = setTimeout(() => this._dismissAlert(), 12000);
  }

  _dismissAlert() {
    const alert = this._$('new-device-alert');
    if (!alert) return;
    alert.classList.add('leaving');
    if (this._alertTimer) { clearTimeout(this._alertTimer); this._alertTimer = null; }
    setTimeout(() => {
      alert.classList.remove('visible', 'leaving');
      alert.style.display = 'none';
    }, 350);
    const wrap = this._$('confetti-wrap');
    if (wrap) wrap.classList.remove('on');
  }

  _spawnParticles() {
    const container = this._$('alert-particles');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['rgba(255,214,10,.8)','rgba(255,159,10,.7)','rgba(255,255,255,.5)'];
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const size = 2 + Math.random() * 4;
      const delay = Math.random() * 1.5;
      const dur = 1.5 + Math.random() * 2;
      p.style.cssText = [
        'left:' + x + '%',
        'top:' + y + '%',
        'width:' + size + 'px',
        'height:' + size + 'px',
        'background:' + colors[Math.floor(Math.random() * colors.length)],
        'animation:pulse-ring ' + dur + 's ' + delay + 's ease-out infinite',
        'border-radius:50%',
      ].join(';');
      container.appendChild(p);
    }
  }

  _spawnConfetti() {
    const wrap = this._$('confetti-wrap');
    if (!wrap) return;
    wrap.innerHTML = '';
    const colors = ['#ff453a','#ff9f0a','#ffd60a','#30d158','#0a84ff','#bf5af2','#ff375f','#4ecdc4','#fff'];
    for (let i = 0; i < 100; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const x = 5 + Math.random() * 90;
      const dx = (Math.random() - 0.5) * 360;
      const dur = (1.6 + Math.random() * 2.2).toFixed(2);
      const delay = (Math.random() * 1.4).toFixed(2);
      const rot = Math.round((Math.random() - 0.5) * 900);
      const w = 5 + Math.random() * 8;
      const h = (w * (0.4 + Math.random() * 0.8)).toFixed(1);
      p.style.cssText = `left:${x}%;width:${w.toFixed(1)}px;height:${h}px;background:${color};--dur:${dur}s;--delay:${delay}s;--dx:${Math.round(dx)}px;--rot:${rot}deg`;
      wrap.appendChild(p);
    }
    wrap.classList.add('on');
    setTimeout(() => { wrap.classList.remove('on'); setTimeout(() => { wrap.innerHTML = ''; }, 100); }, 4500);
  }

  // ── POPUP DE ENTIDADES INTERACTIVO ──────────────────────────
  async _openEntPopup(d) {
    const popup   = this._$('ent-popup');
    const thumb   = this._$('ent-thumb');
    const nameEl  = this._$('ent-name');
    const modelEl = this._$('ent-model');
    const list    = this._$('ent-list');
    const renBtn  = this._$('ent-rename-btn');
    const delBtn  = this._$('ent-delete-btn');

    nameEl.textContent  = d.name;
    const lsPopup = timeAgo(d.lastSeen);
    modelEl.textContent = [`${d.vendor || ''} ${d.model || ''}`.trim() || d.ieee,
      lsPopup ? `· ${lsPopup}` : ''].filter(Boolean).join(' ');
    thumb.innerHTML = '';
    thumb.appendChild(this._thumbEl(d.model, d.modelId));

    renBtn.onclick = (e) => { e.stopPropagation(); popup.style.display='none'; this._isIEEE(d.name) ? this._openAssign(d.name) : this._openRename(d.name); };
    delBtn.onclick = (e) => { e.stopPropagation(); popup.style.display='none'; this._openDelete(d); };

    list.innerHTML = '<div class="loading" style="min-height:100px"><div class="spinner"></div></div>';
    popup.style.display = 'flex';

    // Obtener estados actuales
    let stateMap = {};
    try {
      const resp = await fetch(`${this._haUrl}/api/states`, { headers: this._hdrs });
      const all  = await resp.json();
      all.forEach(s => { stateMap[s.entity_id] = s; });
    } catch(e) {}

    list.innerHTML = '';
    if (!d.ents || !d.ents.length) {
      list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3);font-size:.82rem">Sin entidades</div>';
      return;
    }

    const domainIcon = {
      switch:'🔌', light:'💡', sensor:'📊', binary_sensor:'🔔',
      select:'📋', number:'🔢', button:'🔘', cover:'🪟',
      lock:'🔒', text:'📝', update:'⬆️', climate:'🌡️',
    };

    // Solo entidades no deshabilitadas
    const activeEnts = d.ents.filter(e => !e.disabled_by);

    // Agrupar por dominio
    const byDomain = {};
    activeEnts.forEach(e => {
      const dom = e.entity_id.split('.')[0];
      if (!byDomain[dom]) byDomain[dom] = [];
      byDomain[dom].push(e);
    });

    const _domOrder = ['light','switch','cover','climate','binary_sensor','sensor','select','number','button'];
    Object.entries(byDomain)
      .sort(([a],[b]) => { const ai=_domOrder.indexOf(a),bi=_domOrder.indexOf(b); return (ai<0?99:ai)-(bi<0?99:bi); })
      .forEach(([domain, ents]) => {
      const secTitle = document.createElement('div');
      secTitle.className = 'ent-section-title';
      secTitle.textContent = domain;
      list.appendChild(secTitle);

      ents.forEach(e => {
        const state    = stateMap[e.entity_id];
        const stateVal = state ? state.state : '—';
        const unit     = state?.attributes?.unit_of_measurement || '';
        const attrs    = state?.attributes || {};
        const isOn     = stateVal === 'on';
        const isOff    = stateVal === 'off';
        const isNA     = stateVal === 'unavailable' || stateVal === 'unknown';

        const row = document.createElement('div');
        row.className = 'ent-row';
        row.id = `erow-${e.entity_id.replace(/\./g,'_')}`;

        const icon = document.createElement('div');
        icon.className = 'ent-row-icon';
        icon.textContent = domainIcon[domain] || '⚙️';

        const body = document.createElement('div');
        body.className = 'ent-row-body';
        body.innerHTML = `
          <div class="ent-row-name">${e.name || e.entity_id.split('.').pop()}</div>
          <div class="ent-row-id">${e.entity_id}</div>`;

        const ctrl = document.createElement('div');
        ctrl.className = 'ent-row-ctrl';
        ctrl.id = `ctrl-${e.entity_id.replace(/\./g,'_')}`;

        // Renderizar control según dominio
        if (domain === 'switch' || domain === 'light' || domain === 'input_boolean') {
          // Toggle iOS
          const tog = document.createElement('button');
          tog.className = `ent-toggle ${isOn ? 'on' : ''}`;
          tog.disabled = isNA;
          tog.innerHTML = '<div class="ent-toggle-knob"></div>';
          tog.onclick = async () => {
            const action = tog.classList.contains('on') ? 'turn_off' : 'turn_on';
            tog.disabled = true;
            try {
              await fetch(`${this._haUrl}/api/services/${domain}/${action}`, {
                method: 'POST', headers: this._hdrs,
                body: JSON.stringify({ entity_id: e.entity_id })
              });
              tog.classList.toggle('on');
            } catch(err) {}
            setTimeout(() => { tog.disabled = false; }, 800);
          };
          ctrl.appendChild(tog);

        } else if (domain === 'cover') {
          // Botones subir/parar/bajar
          const btns = document.createElement('div');
          btns.style.cssText = 'display:flex;gap:5px';
          [['▲','open_cover'],['■','stop_cover'],['▼','close_cover']].forEach(([lbl, svc]) => {
            const b = document.createElement('button');
            b.className = 'ent-action-btn';
            b.textContent = lbl;
            b.onclick = () => fetch(`${this._haUrl}/api/services/cover/${svc}`,
              { method:'POST', headers:this._hdrs, body:JSON.stringify({entity_id:e.entity_id}) });
            btns.appendChild(b);
          });
          ctrl.appendChild(btns);

        } else if (domain === 'button') {
          const b = document.createElement('button');
          b.className = 'ent-action-btn';
          b.textContent = 'Pulsar';
          b.onclick = () => fetch(`${this._haUrl}/api/services/button/press`,
            { method:'POST', headers:this._hdrs, body:JSON.stringify({entity_id:e.entity_id}) });
          ctrl.appendChild(b);

        } else if (domain === 'select' && attrs.options) {
          const sel = document.createElement('select');
          sel.className = 'ent-select';
          attrs.options.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt; o.textContent = opt;
            if (opt === stateVal) o.selected = true;
            sel.appendChild(o);
          });
          sel.onchange = () => fetch(`${this._haUrl}/api/services/select/select_option`,
            { method:'POST', headers:this._hdrs,
              body:JSON.stringify({entity_id:e.entity_id, option:sel.value}) });
          ctrl.appendChild(sel);

        } else if (domain === 'number') {
          const min  = attrs.min ?? 0;
          const max  = attrs.max ?? 100;
          const step = attrs.step ?? 1;
          const wrap = document.createElement('div');
          wrap.style.cssText = 'display:flex;align-items:center;gap:6px';
          const inp = document.createElement('input');
          inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step;
          inp.value = stateVal;
          inp.className = 'ent-slider';
          const val = document.createElement('span');
          val.className = 'ent-row-state';
          val.textContent = `${stateVal}${unit ? ' '+unit : ''}`;
          inp.oninput = () => { val.textContent = `${inp.value}${unit ? ' '+unit : ''}`; };
          inp.onchange = () => fetch(`${this._haUrl}/api/services/number/set_value`,
            { method:'POST', headers:this._hdrs,
              body:JSON.stringify({entity_id:e.entity_id, value:parseFloat(inp.value)}) });
          wrap.appendChild(inp); wrap.appendChild(val);
          ctrl.appendChild(wrap);

        } else {
          // Solo lectura — mostrar valor
          const valEl = document.createElement('div');
          valEl.className = `ent-row-state ${isOn?'on':isOff?'off':''}`;
          valEl.textContent = isNA ? '—' : (unit ? `${stateVal} ${unit}` : stateVal);
          ctrl.appendChild(valEl);
        }

        row.appendChild(icon);
        row.appendChild(body);
        row.appendChild(ctrl);
        list.appendChild(row);
      });
    });

    // ── Opción convertir switch ↔ luz ──────────────────────────
    if (d.type === 'switch' || d.type === 'light') {
      const targetType  = d.type === 'switch' ? 'light' : 'switch';
      const targetLabel = targetType === 'light' ? 'Luz 💡' : 'Interruptor 🔌';
      const currentLabel = d.type === 'light' ? 'Luz 💡' : 'Interruptor 🔌';

      const cfgTitle = document.createElement('div');
      cfgTitle.className = 'ent-section-title';
      cfgTitle.textContent = 'CONFIGURACIÓN';
      list.appendChild(cfgTitle);

      const cfgRow = document.createElement('div');
      cfgRow.className = 'ent-row';

      const cfgIcon = document.createElement('div');
      cfgIcon.className = 'ent-row-icon';
      cfgIcon.textContent = '⚙️';

      const cfgBody = document.createElement('div');
      cfgBody.className = 'ent-row-body';
      cfgBody.innerHTML = `
        <div class="ent-row-name">Tipo de dispositivo</div>
        <div class="ent-row-id">Ahora: ${currentLabel}</div>`;

      const cfgCtrl = document.createElement('div');
      cfgCtrl.className = 'ent-row-ctrl';
      const cvtBtn = document.createElement('button');
      cvtBtn.className = 'ent-action-btn';
      cvtBtn.textContent = `→ ${targetLabel}`;
      cvtBtn.onclick = async () => {
        cvtBtn.disabled = true;
        cvtBtn.textContent = '…';
        try {
          const id = d.ieee && /^0x[0-9a-f]{16}$/i.test(d.ieee) ? d.ieee : d.name;
          await this._mqttPub('zigbee2mqtt/bridge/request/device/options', { id, options: { type: targetType } });
          this._toast('ok', `✅ Convertido a ${targetLabel} — recargando…`);
          popup.style.display = 'none';
          setTimeout(() => this._load(), 2500);
        } catch {
          this._toast('err', 'Error al convertir tipo');
          cvtBtn.disabled = false;
          cvtBtn.textContent = `→ ${targetLabel}`;
        }
      };
      cfgCtrl.appendChild(cvtBtn);
      cfgRow.appendChild(cfgIcon);
      cfgRow.appendChild(cfgBody);
      cfgRow.appendChild(cfgCtrl);
      list.appendChild(cfgRow);
    }

    // Suscribir a cambios de estado en tiempo real via WS
    this._subscribePopupStates(activeEnts.map(e => e.entity_id));
  }

  // Suscripción a cambios de estado mientras el popup está abierto
  _subscribePopupStates(entityIds) {
    // Cerrar suscripción anterior si existe
    if (this._popupWs) { try { this._popupWs.close(); } catch(e){} this._popupWs = null; }

    const wsUrl = this._haUrl.replace(/^http/, 'ws') + '/api/websocket';
    const ws = new WebSocket(wsUrl);
    this._popupWs = ws;
    let subId = 20;

    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.type === 'auth_required') {
        ws.send(JSON.stringify({ type: 'auth', access_token: this._token }));
      } else if (m.type === 'auth_ok') {
        // Suscribir a cambios de estado de las entidades del popup
        ws.send(JSON.stringify({
          id: subId, type: 'subscribe_entities',
          entity_ids: entityIds
        }));
      } else if (m.type === 'event' && m.event) {
        // Actualizar controles con el nuevo estado
        const changes = m.event.a || m.event.c || {};
        Object.entries(changes).forEach(([entityId, change]) => {
          const newState = change.s !== undefined ? change.s :
                             (change['+'] && change['+'].s !== undefined ? change['+'].s : undefined);
          if (newState === undefined) return;
          const ctrlId = `ctrl-${entityId.replace(/\./g,'_')}`;
          const ctrl = this.shadowRoot.getElementById(ctrlId);
          if (!ctrl) return;

          const domain = entityId.split('.')[0];
          if (domain === 'switch' || domain === 'light' || domain === 'input_boolean') {
            const tog = ctrl.querySelector('.ent-toggle');
            if (tog) tog.classList.toggle('on', newState === 'on');
          } else {
            const valEl = ctrl.querySelector('.ent-row-state');
            if (valEl) {
              valEl.textContent = newState;
              valEl.className = `ent-row-state ${newState==='on'?'on':newState==='off'?'off':''}`;
            }
          }
        });
      }
    };
    ws.onerror = () => {};

    // Cerrar WS cuando se cierra el popup
    const popup = this._$('ent-popup');
    const observer = new MutationObserver(() => {
      if (popup.style.display === 'none') {
        try { ws.close(); } catch(e) {}
        this._popupWs = null;
        observer.disconnect();
      }
    });
    observer.observe(popup, { attributes: true, attributeFilter: ['style'] });
  }

  // ── DETECTOR DE REINICIO DE HA ────────────────────────────────
  // Devuelve true si la fecha está dentro de los 90s del último reinicio de HA/bridge
  _isRestartTime(date) {
    if (!this._bridgeRestartTime) return false;
    return Math.abs(date.getTime() - this._bridgeRestartTime.getTime()) < 90000;
  }

  // ── LISTENER MQTT PERSISTENTE (LQ + last_seen en tiempo real) ─
  _startMqttStateListener() {
    if (this._mqttStateWs) { try { this._mqttStateWs.close(); } catch(e){} }
    const wsUrl = this._haUrl.replace(/^http/, 'ws') + '/api/websocket';
    const ws = new WebSocket(wsUrl);
    this._mqttStateWs = ws;

    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.type === 'auth_required') {
        ws.send(JSON.stringify({ type: 'auth', access_token: this._token }));
      } else if (m.type === 'auth_ok') {
        ws.send(JSON.stringify({ id: 30, type: 'mqtt/subscribe', topic: 'zigbee2mqtt/+' }));
      } else if (m.type === 'event' && m.event) {
        const topic = m.event.topic || '';
        if (!topic.startsWith('zigbee2mqtt/') || topic.startsWith('zigbee2mqtt/bridge')) return;
        const friendlyName = topic.slice('zigbee2mqtt/'.length);
        try {
          const state = JSON.parse(m.event.payload);
          // Usar el mapa friendly→ieee→device para una coincidencia fiable
          const ieee = this._friendlyToIeee?.[friendlyName];
          const dev = ieee ? this._devsByIeee?.[ieee]
                           : this._devices.find(d => d.name === friendlyName);
          if (!dev) return;
          let changed = false;
          if (typeof state.linkquality === 'number') {
            dev.lq = state.linkquality;
            changed = true;
          }
          if (state.last_seen) {
            const t = new Date(state.last_seen);
            if (!isNaN(t.getTime()) && !this._isRestartTime(t)) {
              dev.lastSeen = t;
              changed = true;
            }
          }
          if (changed) {
            const card = this.shadowRoot.getElementById(`dc-${dev.id}`);
            if (card) this._patchCard(dev, card);
          }
        } catch(e) {}
      }
    };
    ws.onerror = () => {};
    ws.onclose = () => {
      if (this._mqttStateWs === ws) {
        setTimeout(() => { if (this._loaded) this._startMqttStateListener(); }, 5000);
      }
    };
  }

  // ── MODAL Y TOAST ─────────────────────────────────────────────
  _closeModal(id) { this._$(id).classList.remove('on'); }

  _toast(type, msg) {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    this.shadowRoot.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }
}

if (!customElements.get('z2m-panel')) {
  customElements.define('z2m-panel', Z2MPanel);
}
