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
  const classList = { _t:new Set(), add(){}, remove(){}, toggle(){return false;}, contains(c){return this._t.has(c);}, item(){return null;}, get length(){ return this._t.size; }, [Symbol.iterator]: function*(){ yield* this._t; } };   // v2.6.72: iterable (startHotseat's UI chain spreads a classList) -- yields the seeded test set, empty by default
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
    _ids: {},                                                           // v2.6.110: inject a named element for tests that need $() to resolve a specific id (e.g. the debug gate's dropdown)
    querySelector: (sel) => { if(sel && sel[0]==='#'){ const id=sel.slice(1); if(id in documentStub._ids) return documentStub._ids[id]; } return elementStub; },
    getElementById: (id) => (id in documentStub._ids) ? documentStub._ids[id] : elementStub,
    querySelectorAll: () => [],
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
  }, { get(t,p){ return p in t ? t[p] : makeStub(); }, set(t,p,v){ t[p]=v; return true; } });   // v2.6.64: writes persist like a real window (was: discarded) -- the boot flag window.__elysiumBooted must be readable back
  return { documentStub, windowStub, localStorageStub };
}

/* ---------- load a client HTML, return the functions under test ---------- */
function loadClient(htmlPath, opts) {   // v2.6.74: opts.storage = {key:value} seeds localStorage BEFORE the client boots (a stored pre-flag install, a 'not fresh' visit); opts.location overrides the location stub (the first-run rule reads protocol + host)
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/) || html.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('Could not find a <script> block in ' + htmlPath);
  const src = m[1];
  const env = makeEnv();
  if (opts && opts.storage) for (const k of Object.keys(opts.storage)) env.localStorageStub.setItem(k, opts.storage[k]);
  if (opts && opts.location) env.windowStub.location = Object.assign({}, env.windowStub.location, opts.location);
  // exposes are appended IN the script's scope, so they close over the live module state
  const expose = `
;return {
  serializeGame, restoreGame, buildPub, baseView, makeCard, move, place, attach, clearTable, pubXform, pubInv,
  dbg: (typeof dbg!=='undefined'?dbg:undefined), elysiumDbg: (typeof elysiumDbg!=='undefined'?elysiumDbg:undefined),
  mpOnMsg: (typeof mpOnMsg!=='undefined'?mpOnMsg:undefined), MP_HANDLERS: (typeof MP_HANDLERS!=='undefined'?MP_HANDLERS:undefined),
  processCardData: (typeof processCardData!=='undefined'?processCardData:undefined), norm: (typeof norm!=='undefined'?norm:undefined),
  parseDeck: (typeof parseDeck!=='undefined'?parseDeck:undefined),
  deckTotals: (typeof deckTotals!=='undefined'?deckTotals:undefined),                        // v2.6.55: B-53 import guards
  deckSanityText: (typeof deckSanityText!=='undefined'?deckSanityText:undefined),
  deckOverwriteText: (typeof deckOverwriteText!=='undefined'?deckOverwriteText:undefined),
  deckLegalText: (typeof deckLegalText!=='undefined'?deckLegalText:undefined),          // v2.6.55 amend: tournament hard gate
  deckUnknownNames: (typeof deckUnknownNames!=='undefined'?deckUnknownNames:undefined),   // v2.6.57: the unknown-name gate (RESTORED 11 Aug -- the project-snapshot harness lagged the suite; the suite's own line-717 guard caught it)
  deckUnknownText: (typeof deckUnknownText!=='undefined'?deckUnknownText:undefined),
  deckUnknownNames: (typeof deckUnknownNames!=='undefined'?deckUnknownNames:undefined),  // v2.6.57: the unknown-name gate (RESTORED 8 Aug -- the project harness snapshot missed the 2.6.57 delivery; the suite's own line-715 guard caught the drift)
  deckUnknownText: (typeof deckUnknownText!=='undefined'?deckUnknownText:undefined),      // v2.6.57: its message composer (same restoration)
  hotBridge: (typeof hotBridge!=='undefined'?hotBridge:undefined),                        // v2.6.59 (HB2b): the hotseat bot bridge core
  hotRunBotTurns: (typeof hotRunBotTurns!=='undefined'?hotRunBotTurns:undefined),        // v2.6.60 (HB2c): the \u25b6 sweep -- every bot seat's turn once, seat order
  hotNextHuman: (typeof hotNextHuman!=='undefined'?hotNextHuman:undefined),              // v2.6.72: circle-order next human
  offlineReady: (typeof offlineReady!=='undefined'?offlineReady:undefined),              // v2.6.72: the offline Start readiness gate
  startHotseat: (typeof startHotseat!=='undefined'?startHotseat:undefined),
  get offlineCfg(){ return (typeof offlineCfg!=='undefined')?offlineCfg:undefined; },
  set offlineCfg(v){ offlineCfg = v; },
  storeDeck: (typeof storeDeck!=='undefined'?storeDeck:undefined),
  phaseLeaveOK: (typeof phaseLeaveOK!=='undefined'?phaseLeaveOK:undefined),              // v2.6.70: the phase-leave gates -- the Map-method regression guard drives them
  tutDeckRank: (typeof tutDeckRank!=='undefined'?tutDeckRank:undefined),
  tutEnd: (typeof tutEnd!=='undefined'?tutEnd:undefined),                                       // v2.6.74: the tutorial's one teardown -- the Lite lift must drop here
  uiMode: (typeof uiMode!=='undefined'?uiMode:undefined),                                       // v2.6.74: the Lite/Full interface mode family
  uiLite: (typeof uiLite!=='undefined'?uiLite:undefined),
  openTutorial: (typeof openTutorial!=='undefined'?openTutorial:undefined),                     // v2.6.75: opening the tutorial in Lite switches to Full
  uiSetMode: (typeof uiSetMode!=='undefined'?uiSetMode:undefined),
  uiProfileSwap: (typeof uiProfileSwap!=='undefined'?uiProfileSwap:undefined),
  uiProfPick: (typeof uiProfPick!=='undefined'?uiProfPick:undefined),
  uiFirstRunMode: (typeof uiFirstRunMode!=='undefined'?uiFirstRunMode:undefined),
  applyUiMode: (typeof applyUiMode!=='undefined'?applyUiMode:undefined),
  mpLiteAddr: (typeof mpLiteAddr!=='undefined'?mpLiteAddr:undefined),
  tableIdle: (typeof tableIdle!=='undefined'?tableIdle:undefined),                            // v2.6.79: the lobby chrome rule
  syncIdleUI: (typeof syncIdleUI!=='undefined'?syncIdleUI:undefined),
  roomIsLiteShaped: (typeof roomIsLiteShaped!=='undefined'?roomIsLiteShaped:undefined),        // v2.6.78: the room-list shape family
  roomTags: (typeof roomTags!=='undefined'?roomTags:undefined),
  roomFullNote: (typeof roomFullNote!=='undefined'?roomFullNote:undefined),
  roomListOrder: (typeof roomListOrder!=='undefined'?roomListOrder:undefined),
  setAdvToggle: (typeof setAdvToggle!=='undefined'?setAdvToggle:undefined),
  get ACTIONS(){ return (typeof ACTIONS!=='undefined')?ACTIONS:undefined; },                         // v2.6.88: the shortcut table                   // v2.6.86: the Settings Advanced fold
  modeHelpToggle: (typeof modeHelpToggle!=='undefined'?modeHelpToggle:undefined),               // v2.6.77: the ? explainer
  get modeHelpOpen(){ return (typeof _modeHelpOpen!=='undefined')?_modeHelpOpen:undefined; },
  vtesStale: (typeof vtesStale!=='undefined'?vtesStale:undefined),                             // v2.6.76: the weekly-freshness rule
  vtesCached: (typeof vtesCached!=='undefined'?vtesCached:undefined),
  loadCardDB: (typeof loadCardDB!=='undefined'?loadCardDB:undefined),
  get VTES_MAX_AGE_MS(){ return (typeof VTES_MAX_AGE_MS!=='undefined')?VTES_MAX_AGE_MS:undefined; },
  get cardDBLoading(){ return (typeof cardDBLoading!=='undefined')?cardDBLoading:undefined; },
  mpSetFlavor: (typeof mpSetFlavor!=='undefined'?mpSetFlavor:undefined),
  mpFold: (typeof mpFold!=='undefined'?mpFold:undefined),                                       // v2.6.80: the folds + the referee row
  mpRefSync: (typeof mpRefSync!=='undefined'?mpRefSync:undefined),
  get UI_PRESET(){ return (typeof UI_PRESET!=='undefined')?UI_PRESET:undefined; },
  settingsDefaults: (typeof settingsDefaults!=='undefined'?settingsDefaults:undefined),           // v2.6.91: the Settings header family (mode tag + Reset)
  settingsProfile: (typeof settingsProfile!=='undefined'?settingsProfile:undefined),
  settingsDiff: (typeof settingsDiff!=='undefined'?settingsDiff:undefined),
  settingsIsCustom: (typeof settingsIsCustom!=='undefined'?settingsIsCustom:undefined),
  settingsApplyProfile: (typeof settingsApplyProfile!=='undefined'?settingsApplyProfile:undefined),
  settingsResetBlocked: (typeof settingsResetBlocked!=='undefined'?settingsResetBlocked:undefined),
  settingsResetWhy: (typeof settingsResetWhy!=='undefined'?settingsResetWhy:undefined),
  settingsHeadSync: (typeof settingsHeadSync!=='undefined'?settingsHeadSync:undefined),
  get SETTINGS_CONV_KEYS(){ return (typeof SETTINGS_CONV_KEYS!=='undefined')?SETTINGS_CONV_KEYS:undefined; },
  get CONV_DEFAULTS(){ return (typeof CONV_DEFAULTS!=='undefined')?CONV_DEFAULTS:undefined; },
  get keyBinds(){ return (typeof keyBinds!=='undefined')?keyBinds:undefined; },
  keyDispatch: (typeof keyDispatch!=='undefined'?keyDispatch:undefined),                       // v2.6.118: the extracted global keymap handler -- tests drive it with a plain {key,target} event
  keyBindsReconcile: (typeof keyBindsReconcile!=='undefined'?keyBindsReconcile:undefined),     // v2.6.118: stored-binding vs newcomer-default reconciliation
  rebuildKeymap: (typeof rebuildKeymap!=='undefined'?rebuildKeymap:undefined),
  phaseNext: (typeof phaseNext!=='undefined'?phaseNext:undefined),                             // v2.6.118: the phase cycle
  chatFocus: (typeof chatFocus!=='undefined'?chatFocus:undefined),
  chatVisible: (typeof chatVisible!=='undefined'?chatVisible:undefined),
  chatFocusWanted: (typeof chatFocusWanted!=='undefined'?chatFocusWanted:undefined),           // v2.6.119: the focus-aware Enter gate
  sayTextClass: (typeof sayTextClass!=='undefined'?sayTextClass:undefined),                     // v2.6.120: the per-tier text recipe
  cycleView: (typeof cycleView!=='undefined'?cycleView:undefined),
  toggleActiveHome: (typeof toggleActiveHome!=='undefined'?toggleActiveHome:undefined),
  get MOUSE_FIXED(){ return (typeof MOUSE_FIXED!=='undefined')?MOUSE_FIXED:undefined; },
  get brightVal(){ return (typeof brightVal!=='undefined')?brightVal:undefined; },
  get uiBrightVal(){ return (typeof uiBrightVal!=='undefined')?uiBrightVal:undefined; },
  get autoSaveMode(){ return (typeof autoSaveMode!=='undefined')?autoSaveMode:undefined; },
  renderOfflineSeats: (typeof renderOfflineSeats!=='undefined'?renderOfflineSeats:undefined),       // v2.6.93: the bot lock test needs to re-render seats
  syncOffTournament: (typeof syncOffTournament!=='undefined'?syncOffTournament:undefined),
  get localTable(){ return (typeof localTable!=='undefined')?localTable:undefined; },                 // v2.6.95: settable -- the hotseat bus gates on it
  set localTable(v){ if(typeof localTable!=='undefined') localTable=v; },
  hotFanOut: (typeof hotFanOut!=='undefined'?hotFanOut:undefined),
  netBotWhy: (typeof netBotWhy!=='undefined'?netBotWhy:undefined),                                     // v2.6.99: online bots from the lobby
  netBotName: (typeof netBotName!=='undefined'?netBotName:undefined),
  netBotCount: (typeof netBotCount!=='undefined'?netBotCount:undefined),
  netBotDial: (typeof netBotDial!=='undefined'?netBotDial:undefined),
  netBotsTeardown: (typeof netBotsTeardown!=='undefined'?netBotsTeardown:undefined),
  netBotHelperLock: (typeof netBotHelperLock!=='undefined'?netBotHelperLock:undefined),           // v2.6.100
  netBotHelperUnlock: (typeof netBotHelperUnlock!=='undefined'?netBotHelperUnlock:undefined),
  mpLeave: (typeof mpLeave!=='undefined'?mpLeave:undefined),                                     // v2.6.104: the leave ordering (policy back before the door)
  mpCanCloseRoom: (typeof mpCanCloseRoom!=='undefined'?mpCanCloseRoom:undefined),                 // v2.6.105: CLOSE TABLE
  mpCloseRoom: (typeof mpCloseRoom!=='undefined'?mpCloseRoom:undefined),
  get SAY(){ return (typeof SAY!=='undefined')?SAY:undefined; },                                 // v2.6.106: the quick-phrase INDEX table (protocol SS12.1)
  isBoardChrome: (typeof isBoardChrome!=='undefined'?isBoardChrome:undefined),                   // v2.6.103: the one board-gesture exclusion rule
  get BOARD_CHROME(){ return (typeof BOARD_CHROME!=='undefined')?BOARD_CHROME:undefined; },
  helperPolicyFor: (typeof helperPolicyFor!=='undefined'?helperPolicyFor:undefined),             // v2.6.103: the bot helper lock must send THIS shape
  get netBots(){ return (typeof netBots!=='undefined')?netBots:undefined; },
  hotPushBoardNow: (typeof hotPushBoardNow!=='undefined'?hotPushBoardNow:undefined),                    // v2.6.98: the board on the bus
  hotSchedulePushBoard: (typeof hotSchedulePushBoard!=='undefined'?hotSchedulePushBoard:undefined),
  hostSetPoolHot: (typeof hostSetPoolHot!=='undefined'?hostSetPoolHot:undefined),
  hostOustHot: (typeof hostOustHot!=='undefined'?hostOustHot:undefined),                               // v2.6.97: the referee verbs on a bot seat
  hotBotSeat: (typeof hotBotSeat!=='undefined'?hotBotSeat:undefined),
  hotCtrl: (typeof hotCtrl!=='undefined'?hotCtrl:undefined),                                       // v2.6.126: bot-card controls at a hotseat (bot-project handover, 22 Sep)
  ctrlOptimistic: (typeof ctrlOptimistic!=='undefined'?ctrlOptimistic:undefined),
  openHelp: (typeof openHelp!=='undefined'?openHelp:undefined),                                     // v2.6.127: Help inside the client
  helpStandalone: (typeof helpStandalone!=='undefined'?helpStandalone:undefined),
  helpCurrent: ()=>(typeof _helpCur!=='undefined'?_helpCur:undefined),
  get HELP_DOCS(){ return (typeof HELP_DOCS!=='undefined')?HELP_DOCS:undefined; },
  hotForcePass: (typeof hotForcePass!=='undefined'?hotForcePass:undefined),                           // v2.6.122: THE PARITY ROUND (bot-project spec, 21 Sep)
  hotAwaitPass: (typeof hotAwaitPass!=='undefined'?hotAwaitPass:undefined),
  get hotPassWaiter(){ return (typeof hotPassWaiter!=='undefined')?hotPassWaiter:undefined; },
  hotTallySend: (typeof hotTallySend!=='undefined'?hotTallySend:undefined),
  hotRosterPush: (typeof hotRosterPush!=='undefined'?hotRosterPush:undefined),
  hotBotOusted: (typeof hotBotOusted!=='undefined'?hotBotOusted:undefined),
  awardBountyHot: (typeof awardBountyHot!=='undefined'?awardBountyHot:undefined),
  hostUnoustHot: (typeof hostUnoustHot!=='undefined'?hostUnoustHot:undefined),
  avrAdjust: (typeof avrAdjust!=='undefined'?avrAdjust:undefined),
  avrPush: (typeof avrPush!=='undefined'?avrPush:undefined),
  get avr(){ return (typeof avr!=='undefined')?avr:undefined; },
  set avr(v){ avr=v; },
  avrPhase: (typeof avrPhase!=='undefined'?avrPhase:undefined),                                   // v2.6.129: the step-driven combat helper
  avrPhaseTo: (typeof avrPhaseTo!=='undefined'?avrPhaseTo:undefined),
  avrOpen: (typeof avrOpen!=='undefined'?avrOpen:undefined),
  avrClear: (typeof avrClear!=='undefined'?avrClear:undefined),
  avrResolve: (typeof avrResolve!=='undefined'?avrResolve:undefined),
  avrFresh: (typeof avrFresh!=='undefined'?avrFresh:undefined),
  avrDuelAnnounce: (typeof avrDuelAnnounce!=='undefined'?avrDuelAnnounce:undefined),
  tallyCombatMerge: (typeof tallyCombatMerge!=='undefined'?tallyCombatMerge:undefined),
  get CMB_LINE(){ return (typeof CMB_LINE!=='undefined')?CMB_LINE:undefined; },
  get AVR_CMB0(){ return (typeof AVR_CMB0!=='undefined')?AVR_CMB0:undefined; },
  cmbDamage: (typeof cmbDamage!=='undefined'?cmbDamage:undefined),
  cmbSidesIn: (typeof cmbSidesIn!=='undefined'?cmbSidesIn:undefined),
  cmbWatch: (typeof cmbWatch!=='undefined'?cmbWatch:undefined),
  cmbSet: (typeof cmbSet!=='undefined'?cmbSet:undefined),
  cmbStrike: (typeof cmbStrike!=='undefined'?cmbStrike:undefined),
  cmbExtra: (typeof cmbExtra!=='undefined'?cmbExtra:undefined),
  cmbNextPair: (typeof cmbNextPair!=='undefined'?cmbNextPair:undefined),
  cmbManeuver: (typeof cmbManeuver!=='undefined'?cmbManeuver:undefined),
  cmbSetRange: (typeof cmbSetRange!=='undefined'?cmbSetRange:undefined),
  cmbPrevent: (typeof cmbPrevent!=='undefined'?cmbPrevent:undefined),
  cmbPress: (typeof cmbPress!=='undefined'?cmbPress:undefined),
  cmbMenu: (typeof cmbMenu!=='undefined'?cmbMenu:undefined),
  cmbParseCardN: (typeof cmbParseCardN!=='undefined'?cmbParseCardN:undefined),
  set uiDialog(v){ uiDialog=v; },
  get playedPinned(){ return (typeof playedPinned!=='undefined')?playedPinned:undefined; },          // v2.6.132: a menu-started combat pins the Played window
  set toast(v){ toast=v; },
  cardMenu: (typeof cardMenu!=='undefined'?cardMenu:undefined),                                    // v2.6.134: tests walk the REAL card menu (Actions > Block, Bleed)
  set showMenu(v){ showMenu=v; },                                                                   // v2.6.134: ...by capturing what it would show
  cmbPick: (typeof cmbPick!=='undefined'?cmbPick:undefined),
  cmbEnv: (typeof cmbEnv!=='undefined'?cmbEnv:undefined),                                          // v2.6.135: aggravated / wounded / every-round damage
  cmbSideDamage: (typeof cmbSideDamage!=='undefined'?cmbSideDamage:undefined),
  cmbStolen: (typeof cmbStolen!=='undefined'?cmbStolen:undefined),                              // v2.6.140: the steal read-out's rule (bot v0.6.196)
  cmbWounded: (typeof cmbWounded!=='undefined'?cmbWounded:undefined),
  get cmbHist(){ return (typeof _cmbHist!=='undefined')?_cmbHist:undefined; },
  resolvePlayedActions: (typeof resolvePlayedActions!=='undefined'?resolvePlayedActions:undefined),   // v2.6.137: nothing outlives its action / turn
  tallyStaleClose: (typeof tallyStaleClose!=='undefined'?tallyStaleClose:undefined),
  get actUndir(){ return (typeof _actUndir!=='undefined')?_actUndir:undefined; },
  hotLoadBotRes: (typeof hotLoadBotRes!=='undefined'?hotLoadBotRes:undefined),                    // v2.6.139: the knowledge layer's data reaches the bots
  botCfgMerge: (typeof botCfgMerge!=='undefined'?botCfgMerge:undefined),                          // v2.6.139: THE BOT TEMPO (spec-bot-tempo-2026-09-27)
  botCfgSet: (typeof botCfgSet!=='undefined'?botCfgSet:undefined),
  botCfgNow: (typeof botCfgNow!=='undefined'?botCfgNow:undefined),
  botCfgRaw: (typeof botCfgRaw!=='undefined'?botCfgRaw:undefined),
  botCfgWhy: (typeof botCfgWhy!=='undefined'?botCfgWhy:undefined),
  botCfgSeed: (typeof botCfgSeed!=='undefined'?botCfgSeed:undefined),
  botCfgText: (typeof botCfgText!=='undefined'?botCfgText:undefined),
  botCfgHtml: (typeof botCfgHtml!=='undefined'?botCfgHtml:undefined),
  botCfgDeafVer: (typeof botCfgDeafVer!=='undefined'?botCfgDeafVer:undefined),
  botBtnWanted: (typeof botBtnWanted!=='undefined'?botBtnWanted:undefined),
  botBtnSync: (typeof botBtnSync!=='undefined'?botBtnSync:undefined),
  botGiveWord: (typeof botGiveWord!=='undefined'?botGiveWord:undefined),
  botGiveWordWanted: (typeof botGiveWordWanted!=='undefined'?botGiveWordWanted:undefined),
  botGiveWordTargets: (typeof botGiveWordTargets!=='undefined'?botGiveWordTargets:undefined),   // v2.6.140: the play button's filter, tested on its own
  verAtLeast: (typeof verAtLeast!=='undefined'?verAtLeast:undefined),
  get BOTCFG0(){ return (typeof BOTCFG0!=='undefined')?BOTCFG0:undefined; },
  set botCfgOpen(v){ _botCfgOpen=!!v; },
  set botPanelOpen(v){ _botPanelOpen=!!v; },                                                                         // v2.6.132: tests read toasts                                                                   // v2.6.129: tests answer the combat prompts
  hotBotDeckMenu: (typeof hotBotDeckMenu!=='undefined'?hotBotDeckMenu:undefined),
  hotBotDeckKey: (typeof hotBotDeckKey!=='undefined'?hotBotDeckKey:undefined),
  hotBotDeckFor: (typeof hotBotDeckFor!=='undefined'?hotBotDeckFor:undefined),
  hotBotVersionOk: (typeof hotBotVersionOk!=='undefined'?hotBotVersionOk:undefined),                     // v2.6.125
  get HOT_BOT_DECKS(){ return (typeof HOT_BOT_DECKS!=='undefined')?HOT_BOT_DECKS:undefined; },
  get HOT_BOT_PERSONA(){ return (typeof HOT_BOT_PERSONA!=='undefined')?HOT_BOT_PERSONA:undefined; },
  get HOT_BOT_PERSONAS(){ return (typeof HOT_BOT_PERSONAS!=='undefined')?HOT_BOT_PERSONAS:undefined; },
  hotHoldNote: (typeof hotHoldNote!=='undefined'?hotHoldNote:undefined),
  hotHoldMark: (typeof hotHoldMark!=='undefined'?hotHoldMark:undefined),                          // v2.6.101
  hotHoldIsBot: (typeof hotHoldIsBot!=='undefined'?hotHoldIsBot:undefined),                        // v2.6.142: the badge follows the bots' hold rule
  hotHoldPrune: (typeof hotHoldPrune!=='undefined'?hotHoldPrune:undefined),
  hotHoldAfterPanelRelease: (typeof hotHoldAfterPanelRelease!=='undefined'?hotHoldAfterPanelRelease:undefined),
  chatSendLine: (typeof chatSendLine!=='undefined'?chatSendLine:undefined),                        // v2.6.142: the chat line's Enter body
  botCfgHoldLine: (typeof botCfgHoldLine!=='undefined'?botCfgHoldLine:undefined),
  get BOTCFG_HOLD(){ return (typeof BOTCFG_HOLD!=='undefined')?BOTCFG_HOLD:undefined; },
  hotHoldTableHasBots: (typeof hotHoldTableHasBots!=='undefined'?hotHoldTableHasBots:undefined),                              // v2.6.96: the visible hold
  hotHoldRelease: (typeof hotHoldRelease!=='undefined'?hotHoldRelease:undefined),
  hotHoldSync: (typeof hotHoldSync!=='undefined'?hotHoldSync:undefined),
  get hotHoldBy(){ return (typeof hotHoldBy!=='undefined')?hotHoldBy:undefined; },
  sayBubbleMs: (typeof sayBubbleMs!=='undefined'?sayBubbleMs:undefined),
  sayLabel: (typeof sayLabel!=='undefined'?sayLabel:undefined),
  hotRelayLog: (typeof hotRelayLog!=='undefined'?hotRelayLog:undefined),
  updateRoomBar: (typeof updateRoomBar!=='undefined'?updateRoomBar:undefined),
  syncOffBotLock: (typeof syncOffBotLock!=='undefined'?syncOffBotLock:undefined),                 // v2.6.93: the bot lock for board + helpers
  hotTournSession: (typeof hotTournSession!=='undefined'?hotTournSession:undefined),               // v2.6.92: the session-scoped Tournament override
  hotTournRestore: (typeof hotTournRestore!=='undefined'?hotTournRestore:undefined),
  get hotTournBefore(){ return (typeof hotTournBefore!=='undefined')?hotTournBefore:undefined; },
  leaveHotseat: (typeof leaveHotseat!=='undefined'?leaveHotseat:undefined),
  offlineSeatSet: (typeof offlineSeatSet!=='undefined'?offlineSeatSet:undefined),                 // v2.6.91: the one seat-row edit path (Johan's 1v1 find)
  offlineSyncStart: (typeof offlineSyncStart!=='undefined'?offlineSyncStart:undefined),
  errKey: (typeof errKey!=='undefined'?errKey:undefined),                                    // v2.6.55: B-54 telemetry
  onClientError: (typeof onClientError!=='undefined'?onClientError:undefined),
  log: (typeof log!=='undefined'?log:undefined),
  get errRing(){ return (typeof errRing!=='undefined')?errRing:undefined; },
  get RING_MAX(){ return (typeof RING_MAX!=='undefined')?RING_MAX:undefined; },                 // v2.6.60: B-63 dump family
  get DUMP_BUDGET(){ return (typeof DUMP_BUDGET!=='undefined')?DUMP_BUDGET:undefined; },
  get cardDBSrc(){ return (typeof cardDBSrc!=='undefined')?cardDBSrc:undefined; },
  buildDump: (typeof buildDump!=='undefined'?buildDump:undefined),
  buildDumpBoard: (typeof buildDumpBoard!=='undefined'?buildDumpBoard:undefined),
  fitReport: (typeof fitReport!=='undefined'?fitReport:undefined),
  deckCensus: (typeof deckCensus!=='undefined'?deckCensus:undefined),
  storageEstimate: (typeof storageEstimate!=='undefined'?storageEstimate:undefined),
  loadDecks: (typeof loadDecks!=='undefined'?loadDecks:undefined),
  openErrReport: (typeof openErrReport!=='undefined'?openErrReport:undefined),
  _atPolyfill: (typeof _atPolyfill!=='undefined'?_atPolyfill:undefined),                       // v2.6.64
  get crashNoticed(){ return (typeof _crashNoticed!=='undefined')?_crashNoticed:undefined; },
  resetCrashNotice: ()=>{ if(typeof _crashNoticed!=='undefined') _crashNoticed=false; },
  crashNotice: (typeof crashNotice!=='undefined'?crashNotice:undefined),
  get booted(){ return window.__elysiumBooted===true; },
  get _errSent(){ return (typeof _errSent!=='undefined')?_errSent:undefined; },
  get pendingRevealDrop(){ return (typeof pendingRevealDrop!=='undefined')?pendingRevealDrop:undefined; },   // v2.6.51: the pile-drag handoff the online park path reads — settable so revealed() can be driven end to end
  set pendingRevealDrop(v){ pendingRevealDrop = v; },
  freeReadySpot: (typeof freeReadySpot!=='undefined'?freeReadySpot:undefined),          // v2.6.51: pile-park bounce
  occupiedFeltBoxes: (typeof occupiedFeltBoxes!=='undefined'?occupiedFeltBoxes:undefined),
  helperPolicyFor: (typeof helperPolicyFor!=='undefined'?helperPolicyFor:undefined),    // v2.6.51: the three create-time Helpers modes
  hx: (typeof hx!=='undefined'?hx:undefined),
  chatBubbleWanted: (typeof chatBubbleWanted!=='undefined'?chatBubbleWanted:undefined),           // v2.6.113: the local chat-bubble view filter
  dfxCancel: (typeof dfxCancel!=='undefined'?dfxCancel:undefined),                                // v2.6.115: the one path that stops a running Reaction window
  setHelperAllOn: (v)=>{ if(typeof helperAllOn!=='undefined') helperAllOn = !!v; },   // v2.6.51: session-only hotseat flag; a setter (not the raw binding) so a test can prove it never reaches the persisted helper object
  CW: (typeof CW!=='undefined'?CW:undefined), CH: (typeof CH!=='undefined'?CH:undefined),
  get hotBots(){ return (typeof hotBots!=='undefined')?hotBots:undefined; },                       // v2.6.108: the two registries the panel reads
  get netBots(){ return (typeof netBots!=='undefined')?netBots:undefined; },
  hotBotBtnShow: (typeof hotBotBtnShow!=='undefined'?hotBotBtnShow:undefined),                    // v2.6.108: the panel's mount/unmount + render, for a DOM-level probe
  botPanelRender: (typeof botPanelRender!=='undefined'?botPanelRender:undefined),
  botPanelToggle: (typeof botPanelToggle!=='undefined'?botPanelToggle:undefined),
  botPanelSeats: (typeof botPanelSeats!=='undefined'?botPanelSeats:undefined),                    // v2.6.108: THE BOT PANEL
  botPanelRead: (typeof botPanelRead!=='undefined'?botPanelRead:undefined),
  botPanelCountdown: (typeof botPanelCountdown!=='undefined'?botPanelCountdown:undefined),
  botDebugAllowed: (typeof botDebugAllowed!=='undefined'?botDebugAllowed:undefined),
  botDebugOn: (typeof botDebugOn!=='undefined'?botDebugOn:undefined),
  get BOT_STEP_LABEL(){ return (typeof BOT_STEP_LABEL!=='undefined')?BOT_STEP_LABEL:undefined; },
  get HELPER_DEFS(){ return (typeof HELPER_DEFS!=='undefined')?HELPER_DEFS:undefined; },
  get helper(){ return (typeof helper!=='undefined')?helper:undefined; },
  cleanAddr: (typeof cleanAddr!=='undefined'?cleanAddr:undefined),                             // v2.6.54: the ws-vs-wss / :8123 rule
  dismissRoute: (typeof dismissRoute!=='undefined'?dismissRoute:undefined),                    // v2.6.56: the sticky-lobby dismissal ladder (backdrop + Escape share it)
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
  get catalog(){ return (typeof catalog!=='undefined')?catalog:undefined; },
  buildCardIndex: (typeof buildCardIndex!=='undefined'?buildCardIndex:undefined), cardIsAdv: (typeof cardIsAdv!=='undefined'?cardIsAdv:undefined),   // v2.6.143: who owns a bare card name
  rollLine: (typeof rollLine!=='undefined'?rollLine:undefined), lobbyRollPush: (typeof lobbyRollPush!=='undefined'?lobbyRollPush:undefined),       // v2.6.143: the lobby's roll list
  get LOBBY_DIE(){ return (typeof LOBBY_DIE!=='undefined')?LOBBY_DIE:undefined; },
  setDockPin: (typeof setDockPin!=='undefined'?setDockPin:undefined), setL2Dock: (typeof setL2Dock!=='undefined'?setL2Dock:undefined),             // v2.6.143: the dock pin
  get dockPinned(){ return (typeof dockPinned!=='undefined')?dockPinned:undefined; },
  readyDropFace: (typeof readyDropFace!=='undefined'?readyDropFace:undefined),   // v2.6.144: the face a card shows when a drag lands it in ready
  zoneRefuses: (typeof zoneRefuses!=='undefined'?zoneRefuses:undefined), groupMove: (typeof groupMove!=='undefined'?groupMove:undefined),   // v2.6.145: which zones refuse which kind of card
  addSel: (typeof addSel!=='undefined'?addSel:undefined), clearSel: (typeof clearSel!=='undefined'?clearSel:undefined)
};`;
  const factory = new Function(
    'document','window','localStorage','navigator','requestAnimationFrame','cancelAnimationFrame',
    'AudioContext','webkitAudioContext','getComputedStyle','matchMedia','location','fetch',
    src + expose);   // v2.6.74: `fetch` is SHADOWED with a rejecting stub -- the card database is on by default now, so every boot would otherwise reach for static.krcg.org (a real 3 MB download mid-suite on a networked machine; a hang or a live-data race)
  const api = factory(
    env.documentStub, env.windowStub, env.localStorageStub, env.windowStub.navigator,
    () => 0, () => {}, env.windowStub.AudioContext, env.windowStub.webkitAudioContext,
    () => makeStub(), env.windowStub.matchMedia, env.windowStub.location,
    (opts && typeof opts.fetch === 'function') ? opts.fetch : (() => Promise.reject(new Error('harness: network disabled'))));   // v2.6.54: the address logic reads `location.protocol`; v2.6.74: the fetch stub; v2.6.139: opts.fetch serves chosen files (the bot loader's three JSONs)
  // v2.6.51: the SHARED element stub every $() lookup resolves to — including #board. Tests seed
  // api.__stubEl.classList._t to turn a view mode on (e.g. 'l4mode' for the Classic free board).
  try { Object.defineProperty(api, '__stubEl', { value: env.documentStub.getElementById(), enumerable:false }); } catch (e) {}
  try { Object.defineProperty(api, '__ls', { value: env.localStorageStub, enumerable:false }); } catch (e) {}   // v2.6.117: the localStorage stub, so a test can read what an autosave actually wrote
  try { Object.defineProperty(api, '__doc', { value: env.documentStub, enumerable:false }); } catch (e) {}   // v2.6.110: the document stub itself, so tests can inject named IDs for $()
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
    appendFile(pth, d, cb){ if (typeof cb === 'function') cb(null); },   // srv-2.6.25 B-54: the error-log append, same no-op contract
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
  handleClientError: (typeof handleClientError!=='undefined'?handleClientError:undefined),   // srv-2.6.25: B-54
  errRecord: (typeof errRecord!=='undefined'?errRecord:undefined),
  errScrub: (typeof errScrub!=='undefined'?errScrub:undefined),
  errAppend: (typeof errAppend!=='undefined'?errAppend:undefined),
  handleLogFetch: (typeof handleLogFetch!=='undefined'?handleLogFetch:undefined),
  passHash: (typeof passHash!=='undefined'?passHash:undefined),
  ipLogAuth: (typeof ipLogAuth!=='undefined'?ipLogAuth:undefined),
  handleMaintenance: (typeof handleMaintenance!=='undefined'?handleMaintenance:undefined),
  maintActive: (typeof maintActive!=='undefined'?maintActive:undefined),
  maintNotice: (typeof maintNotice!=='undefined'?maintNotice:undefined),
  get _maint(){ return (typeof maint!=='undefined')?maint:undefined; },
  set _maint(v){ maint = v; },
  serverErrRecord: (typeof serverErrRecord!=='undefined'?serverErrRecord:undefined),
  ipErrs: (typeof ipErrs!=='undefined'?ipErrs:undefined),
  ERR_MAX: (typeof ERR_MAX!=='undefined'?ERR_MAX:undefined),
  ERR_BODY_MAX: (typeof ERR_BODY_MAX!=='undefined'?ERR_BODY_MAX:undefined),
  ERR_RING_MAX: (typeof ERR_RING_MAX!=='undefined'?ERR_RING_MAX:undefined),   // srv-2.6.29: B-63
  dumpRecord: (typeof dumpRecord!=='undefined'?dumpRecord:undefined),
  buildRoomList: (typeof buildRoomList!=='undefined'?buildRoomList:undefined),
  helperMode: (typeof helperMode!=='undefined'?helperMode:undefined),                          // srv-2.6.33
  hostOrRef: (typeof hostOrRef!=='undefined'?hostOrRef:undefined),                            // srv-2.6.35
  humansLeft: (typeof humansLeft!=='undefined'?humansLeft:undefined),                         // srv-2.6.36: CLOSE TABLE -- the bot/human census and the teardown
  closeRoomNow: (typeof closeRoomNow!=='undefined'?closeRoomNow:undefined),
  drop: (typeof dropPlayer!=='undefined'?(c)=>dropPlayer(c, false):undefined),                // a DISCONNECT (forGood=false), as the socket-close path calls it
  BOT_ROOM_GRACE_MS: (typeof BOT_ROOM_GRACE_MS!=='undefined'?BOT_ROOM_GRACE_MS:undefined),
  strikes: (typeof strikes!=='undefined'?strikes:undefined),
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
  MAX_ROOMS: (typeof MAX_ROOMS!=='undefined'?MAX_ROOMS:undefined),
  botcfgMerge: (typeof botcfgMerge!=='undefined'?botcfgMerge:undefined),                       // srv-2.6.43: the bot tempo's merge rule (the twin test drives it beside the client's and the bridge's)
  joinReply: (typeof joinReply!=='undefined'?joinReply:undefined),                             // srv-2.6.43: the late-joiner replay
  roomSnap: (typeof roomSnap!=='undefined'?roomSnap:undefined),                                // srv-2.6.43: the snapshot record, both directions
  roomUnsnap: (typeof roomUnsnap!=='undefined'?roomUnsnap:undefined),
  BOT_STATICS: (typeof BOT_STATICS!=='undefined'?BOT_STATICS:undefined)
};`;
  const factory = new Function('require', 'module', 'exports', '__dirname', '__filename', src + expose);
  const mod = { exports: {} };
  return factory(req, mod, mod.exports, '/tmp', '/tmp/elysium-server.js');
}

module.exports = { loadClient, loadServer, makeStub, makeEnv };
