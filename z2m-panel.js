// Z2M Panel — panel_custom Web Component
// v2.1.1
// Copiar a /config/www/z2m-panel.js
// Registrar en configuration.yaml como panel_custom

// Bridge ID se detecta automáticamente buscando el dispositivo Z2M Bridge
// No hay que hardcodearlo — funciona en cualquier instancia de HA
let BRIDGE_ID = null;
const VER = 'v2.1.1';

// Cache busting: invalida la caché del navegador automáticamente
// Añade ?v=VERSION a la URL del script en el configuration.yaml de forma efectiva
// registrando el recurso como lovelace resource con versión
(function bustCache() {
  try {
    const scripts = document.querySelectorAll('script[src*="z2m-panel"]');
    scripts.forEach(s => {
      const url = new URL(s.src, location.href);
      if (!url.searchParams.has('v') || url.searchParams.get('v') !== VER) {
        // La URL no tiene la versión correcta — forzamos recarga con la correcta
        // almacenando en sessionStorage para evitar bucle infinito
        const reloadKey = 'z2m-panel-reloaded-' + VER;
        if (!sessionStorage.getItem(reloadKey)) {
          sessionStorage.setItem(reloadKey, '1');
          const newUrl = url.href.split('?')[0] + '?v=' + VER;
          const newScript = document.createElement('script');
          newScript.src = newUrl;
          document.head.appendChild(newScript);
        }
      }
    });
  } catch(e) {}
})();

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

/* Botón atrás */
.back-btn{
  width:34px;height:34px;border-radius:50%;border:none;
  background:transparent;color:var(--tint);
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-size:20px;transition:all .15s;
  flex-shrink:0;padding:0;line-height:1;
}
.back-btn:hover{background:var(--tint-bg);}
.back-btn:active{transform:scale(.88);}

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
  font-weight:600;cursor:pointer;transition:all .15s}
.pair-btn:hover{opacity:.88}
.pair-btn:active{transform:scale(.95)}
.pair-btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
#permit-bar{display:none;background:var(--yellow-bg);
  border-bottom:.5px solid rgba(255,214,10,.2);padding:10px 18px;
  align-items:center;justify-content:space-between;gap:12px}
#permit-bar.on{display:flex}
.permit-lbl{display:flex;align-items:center;gap:7px;font-size:.8rem;font-weight:500;color:var(--yellow)}
#permit-cd{font-size:.88rem;font-weight:600;color:var(--yellow);
  font-variant-numeric:tabular-nums;min-width:36px;text-align:right}
.stop-btn{padding:5px 12px;border-radius:var(--rp);border:none;background:var(--red-bg);
  color:var(--red);font-family:inherit;font-size:.76rem;font-weight:600;cursor:pointer;transition:all .15s}
.stop-btn:hover{background:var(--red);color:#fff}
main{padding:18px 14px;max-width:1200px;margin:0 auto}
.sec-hdr{display:flex;align-items:center;justify-content:space-between;padding:0 4px;margin-bottom:8px}
.sec-lbl{font-size:.7rem;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--text2)}
.badge{font-size:.68rem;font-weight:700;background:var(--yellow);color:#000;padding:1px 7px;border-radius:10px}
#new-section{display:none;margin-bottom:26px}
#new-section.on{display:block}
.new-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
.new-card{background:var(--bg2);border-radius:var(--rc);padding:14px;
  border:1px solid rgba(255,214,10,.18);animation:fadeUp .3s ease both}
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
.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
  background:var(--bg3);color:var(--text);border-radius:var(--rp);
  padding:10px 20px;font-size:.84rem;font-weight:500;z-index:9999;
  animation:fadeUp .25s ease;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.35)}
.toast.ok{background:var(--green);color:#fff}
.toast.err{background:var(--red);color:#fff}
/* ── POPUP DE ENTIDADES ── */
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
  <div id="permit-bar">
    <div class="permit-lbl">📡 Pon el dispositivo en modo pairing</div>
    <div style="display:flex;align-items:center;gap:10px">
      <span id="permit-cd">—</span>
      <button class="stop-btn" id="btn-stop">Detener</button>
    </div>
  </div>
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
        <div class="alert-tag">⚡ Nuevo dispositivo detectado</div>
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
    this._loaded = false;
    this._alertTimer = null;
    this._eventWs = null;  // WebSocket para eventos en tiempo real de Z2M
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._loaded) {
      this._loaded = true;
      this._render();
      this._initTheme();
      this._bindEvents();
      this._load();
      this._startEventListener();
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
    this._$('btn-reload').addEventListener('click', () => this._load());
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
    this._$('btn-pair').addEventListener('click', () => this._startPair());
    this._$('btn-stop').addEventListener('click', () => this._stopPair());
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
  async _getZ2MDevices() {
    try {
      // Suscribimos al topic zigbee2mqtt/bridge/devices via WS de HA
      const wsUrl = this._haUrl.replace(/^http/, 'ws') + '/api/websocket';
      return await new Promise((ok, fail) => {
        const ws = new WebSocket(wsUrl);
        let subId = 1, msgId = 2;
        const t = setTimeout(() => { ws.close(); ok({}); }, 6000);
        ws.onmessage = ev => {
          const m = JSON.parse(ev.data);
          if (m.type === 'auth_required') {
            ws.send(JSON.stringify({ type: 'auth', access_token: this._token }));
          } else if (m.type === 'auth_ok') {
            // Suscribir al topic zigbee2mqtt/bridge/devices
            ws.send(JSON.stringify({
              id: subId, type: 'mqtt/subscribe', topic: 'zigbee2mqtt/bridge/devices'
            }));
            // También publicamos un request para que Z2M republique
            setTimeout(() => {
              ws.send(JSON.stringify({
                id: msgId, type: 'call_service',
                domain: 'mqtt', service: 'publish',
                service_data: { topic: 'zigbee2mqtt/bridge/request/devices', payload: '' }
              }));
            }, 200);
          } else if (m.type === 'event' && m.event && m.event.topic === 'zigbee2mqtt/bridge/devices') {
            try {
              const devices = JSON.parse(m.event.payload);
              clearTimeout(t); ws.close();
              // Construir mapa ieee_address → model real
              const map = {};
              devices.forEach(d => {
                if (d.ieee_address && d.definition && d.definition.model) {
                  // Guardar con y sin prefijo "zigbee2mqtt_" para cubrir ambos formatos
                  map[d.ieee_address] = d.definition.model;
                  map['zigbee2mqtt_' + d.ieee_address] = d.definition.model;
                }
              });
              console.log('[Z2M Panel] bridge/devices recibido, devices:', devices.length);
              console.log('[Z2M Panel] Primeros 3 model IDs:', devices.slice(0,3).map(d=>({ieee:d.ieee_address,model:d.definition?.model})));
              ok(map);
            } catch(e) { console.error('[Z2M Panel] Error parseando bridge/devices:', e); clearTimeout(t); ws.close(); ok({}); }
          }
        };
        ws.onerror = (e) => { console.error('[Z2M Panel] WS error en _getZ2MDevices:', e); clearTimeout(t); ok({}); };
      });
    } catch(e) { return {}; }
  }

  async _load() {
    this._$('dev-container').innerHTML = '<div class="loading"><div class="spinner"></div><span>Cargando…</span></div>';
    try {
      const [statesR, wsDevs, wsEnts, z2mModelMap] = await Promise.all([
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

      this._updateBridge(conn?.state === 'on');
      if (perm?.state === 'on' && !this._pairTimer) this._showPairBanner(parseInt(ptim?.state || '60'));

      // Detectar bridge ID si no está disponible aún
      if (!BRIDGE_ID) await this._detectBridgeId();
      const z2m = wsDevs.result.filter(d => d.via_device_id === BRIDGE_ID);

      this._devices = z2m.map(d => {
        const ents    = allEnts.filter(e => e.device_id === d.id);
        // Buscar entidad linkquality — puede tener prefijo 0x o nombre amigable
      const lqE     = ents.find(e => e.entity_id.includes('linkquality')) ||
                      ents.find(e => (e.original_name || '').toLowerCase().includes('linkquality'));
        const bE      = ents.find(e => /(battery|batt)$/.test(e.entity_id) && !e.entity_id.includes('low'));
        const lqState = lqE ? sm[lqE.entity_id] : null;
      const lq      = lqState && lqState.state !== 'unavailable' ? parseInt(lqState.state) : null;
        const b       = bE  ? parseInt(sm[bE.entity_id]?.state)  : null;
        const ieee    = d.identifiers?.find(i => i[0] === 'mqtt')?.[1] || d.name;
        // Usar el model ID real de Z2M si está disponible, sino el de HA
        const realModel = z2mModelMap[ieee] || null;
        // modelId obtenido de bridge/devices (puede ser null si Z2M no respondió)
        const dev = {
          id: d.id, name: d.name_by_user || d.name, ieee,
          model: d.model,        // nombre descriptivo de HA (para mostrar)
          modelId: realModel,    // model ID real de Z2M (para imagen)
          vendor: d.manufacturer, area: d.area_id,
          lq: isNaN(lq) ? null : lq,
          batt: isNaN(b) ? null : b, ents,
        };
        dev.type = this._guessType(dev);
        return dev;
      });

      this._renderAll();
    } catch(e) {
      console.error(e);
      this._$('dev-container').innerHTML = `<div class="empty"><div class="ico">⚠️</div><p>${e.message}</p></div>`;
    }
  }

  _isIEEE(n) { return /^0x[0-9a-f]{16}$/i.test(n); }

  _updateBridge(on) {
    this._$('dot').className = 'bridge-dot ' + (on ? 'on' : 'off');
    this._$('bridge-txt').textContent = on ? 'Bridge online' : 'Bridge offline';
  }

  // ── RENDER ────────────────────────────────────────────────────
  _renderAll() { this._renderNew(); this._renderDevices(); }

  _renderNew() {
    const nd  = this._devices.filter(d => this._isIEEE(d.name));
    const sec = this._$('new-section');
    this._$('new-badge').textContent = nd.length;
    if (!nd.length) { sec.classList.remove('on'); return; }
    sec.classList.add('on');

    const grid = this._$('new-grid');
    grid.innerHTML = '';
    nd.forEach(d => {
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

      // Insertar thumb antes del meta
      card.querySelector('.new-top').insertBefore(thumbDiv, card.querySelector('.new-meta'));
      card.querySelector('.btn-assign').addEventListener('click', () => this._openAssign(d.name));
      grid.appendChild(card);
    });
  }

  _renderDevices() {
    const named = this._devices.filter(d => !this._isIEEE(d.name));
    const container = this._$('dev-container');
    if (!named.length) {
      container.innerHTML = '<div class="empty"><div class="ico">📭</div><p>No hay dispositivos con nombre</p></div>';
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'dev-grid';
    grid.id = 'dev-grid';
    named.forEach(d => grid.appendChild(this._makeCard(d)));
    container.innerHTML = '';
    container.appendChild(grid);
    this._applyFilters();
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

    const battHtml = (d.batt !== null && !isNaN(d.batt))
      ? `<div class="dev-batt ${d.batt < 20 ? 'low' : d.batt < 50 ? 'med' : 'ok'}">${d.batt < 20 ? '🪫' : '🔋'} ${d.batt}%</div>`
      : '';

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
        ${battHtml}
      </div>`;

    card.querySelector('.dev-head').insertBefore(thumbDiv, card.querySelector('.dev-info'));
    card.querySelector('.act-btn').addEventListener('click', (e) => { e.stopPropagation(); this._openRename(d.name); });
    card.querySelector('.act-btn.del').addEventListener('click', (e) => { e.stopPropagation(); this._openDelete(d.name); });
    // Click en la tarjeta abre el popup de entidades
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
      this._toast('ok', '📡 Buscando ~4 min');
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
    this._toast('ok', 'Emparejamiento desactivado');
  }

  _showPairBanner(secs) {
    this._$('permit-bar').classList.add('on');
    this._$('btn-pair').disabled = true;
    let rem = secs;
    clearInterval(this._pairTimer);
    this._$('permit-cd').textContent = rem + 's';
    this._pairTimer = setInterval(() => {
      rem--;
      this._$('permit-cd').textContent = rem + 's';
      if (rem <= 0) { this._hidePairBanner(); this._load(); }
    }, 1000);
  }

  _hidePairBanner() {
    this._$('permit-bar').classList.remove('on');
    this._$('btn-pair').disabled = false;
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
  _openDelete(name) {
    this._deleteName = name;
    this._$('m-delete-sub').textContent = `¿Seguro que quieres eliminar "${name}"? Tendrás que volver a emparejarlo.`;
    this._$('m-delete').classList.add('on');
  }

  async _doDelete() {
    if (!this._deleteName) return;
    this._closeModal('m-delete');
    try {
      await this._mqttPub('zigbee2mqtt/bridge/request/device/remove', { id: this._deleteName });
      this._toast('ok', `🗑️ "${this._deleteName}" eliminado`);
      setTimeout(() => this._load(), 1800);
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
        // Suscribir al topic de eventos del bridge Z2M
        ws.send(JSON.stringify({
          id: subId, type: 'mqtt/subscribe',
          topic: 'zigbee2mqtt/bridge/events'
        }));
      } else if (m.type === 'event' && m.event) {
        const topic = m.event.topic || '';
        if (topic === 'zigbee2mqtt/bridge/events') {
          try {
            const payload = JSON.parse(m.event.payload);
            // device_joined: llega cuando un dispositivo se une
            // device_interview_successful: cuando Z2M lo identifica
            if (payload.type === 'device_joined' || payload.type === 'device_interview_successful') {
              const d = payload.data;
              const ieee = d.ieee_address || '';
              const model = d.supported ? (d.definition?.model || null) : null;
              const vendor = d.definition?.vendor || d.manufacturer || '';
              const desc = d.definition?.description || d.model_id || 'Dispositivo desconocido';
              this._showNewDeviceAlert(ieee, model, vendor, desc);
              // Recargar la lista después de un momento para que aparezca en la sección
              setTimeout(() => this._load(), 1500);
            }
          } catch(e) {}
        }
      }
    };
    ws.onerror = () => {};
    ws.onclose = () => {
      // Reconectar si se cierra inesperadamente (excepto si fue intencional)
      if (this._eventWs === ws) {
        setTimeout(() => { if (this._loaded) this._startEventListener(); }, 5000);
      }
    };
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

    // Partículas
    this._spawnParticles();

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

  // ── POPUP DE ENTIDADES ───────────────────────────────────────
  async _openEntPopup(d) {
    const popup   = this._$('ent-popup');
    const thumb   = this._$('ent-thumb');
    const nameEl  = this._$('ent-name');
    const modelEl = this._$('ent-model');
    const list    = this._$('ent-list');
    const renBtn  = this._$('ent-rename-btn');
    const delBtn  = this._$('ent-delete-btn');

    // Cabecera
    nameEl.textContent  = d.name;
    modelEl.textContent = `${d.vendor || ''} ${d.model || ''}`.trim() || d.ieee;
    thumb.innerHTML = '';
    thumb.appendChild(this._thumbEl(d.model, d.modelId));

    renBtn.onclick = (e) => { e.stopPropagation(); popup.style.display='none'; this._openRename(d.name); };
    delBtn.onclick = (e) => { e.stopPropagation(); popup.style.display='none'; this._openDelete(d.name); };

    // Entidades — obtener estados actuales
    list.innerHTML = '<div class="ent-section-title">Entidades</div>';

    if (!d.ents || !d.ents.length) {
      list.innerHTML += '<div style="padding:20px;text-align:center;color:var(--text3);font-size:.82rem">Sin entidades disponibles</div>';
    } else {
      // Obtener estados en paralelo
      const entityIds = d.ents.map(e => e.entity_id);
      let stateMap = {};
      try {
        const resp = await fetch(`${this._haUrl}/api/states`, { headers: this._hdrs });
        const all  = await resp.json();
        all.forEach(s => { stateMap[s.entity_id] = s; });
      } catch(e) {}

      const domainIcon = {
        switch:'🔌', light:'💡', sensor:'📊', binary_sensor:'🔔',
        select:'📋', number:'🔢', button:'🔘', cover:'🪟',
        lock:'🔒', text:'📝', update:'⬆️', climate:'🌡️',
      };

      // Agrupar por dominio
      const byDomain = {};
      d.ents.forEach(e => {
        const domain = e.entity_id.split('.')[0];
        if (!byDomain[domain]) byDomain[domain] = [];
        byDomain[domain].push(e);
      });

      Object.entries(byDomain).forEach(([domain, ents]) => {
        const secTitle = document.createElement('div');
        secTitle.className = 'ent-section-title';
        secTitle.textContent = domain;
        list.appendChild(secTitle);

        ents.forEach(e => {
          const state = stateMap[e.entity_id];
          const stateVal = state ? state.state : '—';
          const unit = state?.attributes?.unit_of_measurement || '';
          const isOn  = stateVal === 'on';
          const isOff = stateVal === 'off';
          const displayVal = unit ? `${stateVal} ${unit}` : stateVal;

          const row = document.createElement('div');
          row.className = 'ent-row';
          row.innerHTML = `
            <div class="ent-row-icon">${domainIcon[domain] || '⚙️'}</div>
            <div class="ent-row-body">
              <div class="ent-row-name">${e.name || e.entity_id.split('.').pop()}</div>
              <div class="ent-row-id">${e.entity_id}</div>
            </div>
            <div class="ent-row-state ${isOn?'on':isOff?'off':''}">${displayVal}</div>`;
          list.appendChild(row);
        });
      });
    }

    popup.style.display = 'flex';
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

customElements.define('z2m-panel', Z2MPanel);
