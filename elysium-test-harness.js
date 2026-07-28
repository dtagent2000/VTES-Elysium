#!/usr/bin/env node
'use strict';
/* ============================================================
   Elysium — shared test harness
   The single canonical "load the client <script> in Node under
   a compact DOM stub and hand back its functions" helper. Test
   files require() this instead of each embedding their own stub.

   loadClient(htmlPath) -> { serializeGame, restoreGame, buildPub,
     baseView, makeCard, move, clearTable, pubXform, pubInv,
     state, net, conv, l2pub }   (state/net/conv/l2pub are live getters)

   Zero dependencies. If/when harness_faithful.js is folded in, this
   stays the one place the DOM stub lives.
   ============================================================ */
const fs = require('fs');

/* ---------- compact chainable DOM stub ---------- */
function makeStub() {
  const f = function () { return stub; };
  /* v2.6.51: `_t` is a TEST-ONLY seed set for reads. Writes stay no-ops on purpose — the client
     toggles classes constantly during layout(), and making those live would silently change
     behaviour under every long-settled test. Empty by default, so contains() answers false for
     everything exactly as before; a test seeds it (see loadClient's `__stubEl`) to exercise a
     view-mode branch such as l4on()'s 'l4mode'. */
  const classList = { _t:new Set(), add(){}, remove(){}, toggle(){return false;}, contains(c){return this._t.has(c);}, item(){return null;} };
  const stub = new Proxy(f, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return () => 0;
      if (p === Symbol.iterator) return function* () {};
      if (p === 'length') return 0;
      if (typeof p === 'string') {
        if (/(width|Width|height|Height|Top|Left|Right|Bottom|^x$|^y$|scroll|client|offset|page|inner)/.test(p)) return 0;
        if (p === 'style') return makeStub();
        if (p === 'dataset') return {};
        if (p === 'classList') return classList;
        if (['value','textContent','innerHTML','innerText','id','className','src','title','tagName'].includes(p)) return '';
        if (['checked','disabled','hidden'].includes(p)) return false;
        if (p === 'nodeType') return 1;
        if (p === 'children' || p === 'childNodes') return [];
        if (['firstChild','parentNode','nextSibling','previousSibling'].includes(p)) return null;
        if (p === 'getBoundingClientRect') return () => ({ left:0, top:0, right:0, bottom:0, width:0, height:0, x:0, y:0 });
        if (['querySelectorAll','getElementsByClassName','getElementsByTagName'].includes(p)) return () => [];
        if (p === 'getContext') return () => makeStub();
      }
      return stub;
    },
    apply() { return stub; }, set() { return true; }, has() { return true; }
  });
  return stub;
}

function makeEnv() {
  const elementStub = makeStub();
  const documentStub = {
    querySelector: () => elementStub, getElementById: () => elementStub, querySelectorAll: () => [],
    createElement: () => makeStub(), createTextNode: () => makeStub(), createElementNS: () => makeStub(),
    addEventListener: () => {}, removeEventListener: () => {},
    body: makeStub(), documentElement: makeStub(), head: makeStub(),
    fonts: { ready: Promise.resolve(), add: () => {} }, hidden: false, visibilityState: 'visible'
  };
  const localStorageStub = (() => { const s = new Map();
    return { getItem: k => (s.has(k) ? s.get(k) : null), setItem: (k,v) => s.set(k,String(v)), removeItem: k => s.delete(k), clear: () => s.clear() };
  })();
  const windowStub = new Proxy({
    addEventListener: () => {}, removeEventListener: () => {},
    matchMedia: () => ({ matches:false, addListener:()=>{}, addEventListener:()=>{} }),
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
    devicePixelRatio: 1, innerWidth: 1280, innerHeight: 800,
    location: { href:'http://localhost/', hash:'', search:'', protocol:'http:', host:'localhost' },
    AudioContext: function(){ return makeStub(); }, webkitAudioContext: function(){ return makeStub(); },
    navigator: { userAgent:'node', platform:'node', maxTouchPoints:0 }, localStorage: localStorageStub
  }, { get(t,p){ return p in t ? t[p] : makeStub(); }, set(){ return true; } });
  return { documentStub, windowStub, localStorageStub };
}

/* ---------- load a client HTML, return the functions under test ---------- */
function loadClient(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/) || html.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('Could not find a <script> block in ' + htmlPath);
  const src = m[1];
  const env = makeEnv();
  // exposes are appended IN the script's scope, so they close over the live module state
  const expose = `
;return {
  serializeGame, restoreGame, buildPub, baseView, makeCard, move, place, attach, clearTable, pubXform, pubInv,
  dbg: (typeof dbg!=='undefined'?dbg:undefined), elysiumDbg: (typeof elysiumDbg!=='undefined'?elysiumDbg:undefined),
  mpOnMsg: (typeof mpOnMsg!=='undefined'?mpOnMsg:undefined), MP_HANDLERS: (typeof MP_HANDLERS!=='undefined'?MP_HANDLERS:undefined),
  processCardData: (typeof processCardData!=='undefined'?processCardData:undefined), norm: (typeof norm!=='undefined'?norm:undefined),
  parseDeck: (typeof parseDeck!=='undefined'?parseDeck:undefined),
  get pendingRevealDrop(){ return (typeof pendingRevealDrop!=='undefined')?pendingRevealDrop:undefined; },   // v2.6.51: the pile-drag handoff the online park path reads — settable so revealed() can be driven end to end
  set pendingRevealDrop(v){ pendingRevealDrop = v; },
  freeReadySpot: (typeof freeReadySpot!=='undefined'?freeReadySpot:undefined),          // v2.6.51: pile-park bounce
  occupiedFeltBoxes: (typeof occupiedFeltBoxes!=='undefined'?occupiedFeltBoxes:undefined),
  helperPolicyFor: (typeof helperPolicyFor!=='undefined'?helperPolicyFor:undefined),    // v2.6.51: the three create-time Helpers modes
  hx: (typeof hx!=='undefined'?hx:undefined),
  setHelperAllOn: (v)=>{ if(typeof helperAllOn!=='undefined') helperAllOn = !!v; },   // v2.6.51: session-only hotseat flag; a setter (not the raw binding) so a test can prove it never reaches the persisted helper object
  CW: (typeof CW!=='undefined'?CW:undefined), CH: (typeof CH!=='undefined'?CH:undefined),
  get HELPER_DEFS(){ return (typeof HELPER_DEFS!=='undefined')?HELPER_DEFS:undefined; },
  get helper(){ return (typeof helper!=='undefined')?helper:undefined; },
  cleanAddr: (typeof cleanAddr!=='undefined'?cleanAddr:undefined),                             // v2.6.54: the ws-vs-wss / :8123 rule
  tutNextReady: (typeof tutNextReady!=='undefined'?tutNextReady:undefined),
  get TUT_ORDER(){ return (typeof TUT_ORDER!=='undefined')?TUT_ORDER:undefined; },
  get TUT_ADVANCED(){ return (typeof TUT_ADVANCED!=='undefined')?TUT_ADVANCED:undefined; },
  get TUT_SECTIONS(){ return (typeof TUT_SECTIONS!=='undefined')?TUT_SECTIONS:undefined; },   // v2.6.52: the chapters themselves, so a test can walk every step's target
  tutDemoLobby: (typeof tutDemoLobby!=='undefined'?tutDemoLobby:undefined),                   // v2.6.52: host vs guest demo fixture (it calls renderLobby, which sets net.isHost)
  tutDemoLobbyTeardown: (typeof tutDemoLobbyTeardown!=='undefined'?tutDemoLobbyTeardown:undefined),
  get state(){ return state; }, get net(){ return net; }, get conv(){ return conv; }, get l2pub(){ return l2pub; },
  get cardInfo(){ return (typeof cardInfo!=='undefined')?cardInfo:undefined; },
  get cardImageNames(){ return (typeof cardImageNames!=='undefined')?cardImageNames:undefined; },
  get precons(){ return (typeof precons!=='undefined')?precons:undefined; },
  get catalog(){ return (typeof catalog!=='undefined')?catalog:undefined; }
};`;
  const factory = new Function(
    'document','window','localStorage','navigator','requestAnimationFrame','cancelAnimationFrame',
    'AudioContext','webkitAudioContext','getComputedStyle','matchMedia','location',
    src + expose);
  const api = factory(
    env.documentStub, env.windowStub, env.localStorageStub, env.windowStub.navigator,
    () => 0, () => {}, env.windowStub.AudioContext, env.windowStub.webkitAudioContext,
    () => makeStub(), env.windowStub.matchMedia, env.windowStub.location);   // v2.6.54: the address logic reads `location.protocol`
  // v2.6.51: the SHARED element stub every $() lookup resolves to — including #board. Tests seed
  // api.__stubEl.classList._t to turn a view mode on (e.g. 'l4mode' for the Classic free board).
  try { Object.defineProperty(api, '__stubEl', { value: env.documentStub.getElementById(), enumerable:false }); } catch (e) {}
  return api;
}

/* ---------- load the SERVER (no port bind), return handle + room state ---------- */
function loadServer(serverPath) {
  let src = fs.readFileSync(serverPath, 'utf8').replace(/^#![^\n]*\n/, '');   // strip hashbang (illegal inside new Function)
  const httpStub = { createServer: () => ({ listen(){}, on(){}, close(){} }) };
  const fsStub = {
    readFileSync: (...a) => { try { return fs.readFileSync(...a); } catch (e) { return '{}'; } },
    writeFileSync(){}, existsSync: () => false, readdirSync: () => [], mkdirSync(){}, unlinkSync(){},
    writeFile(pth, d, cb){ if (typeof cb === 'function') cb(null); },   // srv-2.6.18 H1-d: the async persistence path must succeed as a no-op under the harness
    rename(a, b, cb){ if (typeof cb === 'function') cb(null); }, renameSync(){},
    statSync: () => ({ isFile: () => false, isDirectory: () => false, size: 0, mtimeMs: 0 })
  };
  const realReq = require;
  const req = (name) => name === 'http' ? httpStub : (name === 'fs' ? fsStub : realReq(name));
  const expose = `
;return {
  handle: (typeof handle!=='undefined'?handle:undefined),
  rooms:  (typeof rooms!=='undefined'?rooms:undefined),
  GAME_HANDLERS: (typeof GAME_HANDLERS!=='undefined'?GAME_HANDLERS:undefined),
  ipFails: (typeof ipFails!=='undefined'?ipFails:undefined),
  FAIL_MAX: (typeof FAIL_MAX!=='undefined'?FAIL_MAX:undefined),
  CFG: (typeof CFG!=='undefined'?CFG:undefined),
  deriveIp: (typeof deriveIp!=='undefined'?deriveIp:undefined),
  buildRoomList: (typeof buildRoomList!=='undefined'?buildRoomList:undefined),
  saves: (typeof saves!=='undefined'?saves:undefined),
  buildSave: (typeof buildSave!=='undefined'?buildSave:undefined),
  sweepSaves: (typeof sweepSaves!=='undefined'?sweepSaves:undefined),
  GAME_HANDLERS_saveMatch: (typeof GAME_HANDLERS!=='undefined'?GAME_HANDLERS.saveMatch:undefined),
  MAX_WATCHERS: (typeof MAX_WATCHERS!=='undefined'?MAX_WATCHERS:undefined),
  SAVES_PER_GROUP: (typeof SAVES_PER_GROUP!=='undefined'?SAVES_PER_GROUP:undefined),
  SAVE_TTL_MS: (typeof SAVE_TTL_MS!=='undefined'?SAVE_TTL_MS:undefined),
  MAX_CONN_TOTAL: (typeof MAX_CONN_TOTAL!=='undefined'?MAX_CONN_TOTAL:undefined),
  originOk: (typeof originOk!=='undefined'?originOk:undefined),
  RESERVED_POPULATED: (typeof RESERVED_POPULATED!=='undefined'?RESERVED_POPULATED:undefined),
  MAX_ROOMS: (typeof MAX_ROOMS!=='undefined'?MAX_ROOMS:undefined)
};`;
  const factory = new Function('require', 'module', 'exports', '__dirname', '__filename', src + expose);
  const mod = { exports: {} };
  return factory(req, mod, mod.exports, '/tmp', '/tmp/elysium-server.js');
}

module.exports = { loadClient, loadServer, makeStub, makeEnv };
