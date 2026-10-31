'use strict';

/** Shuttle Cue v1.6. Standalone offline-first PWA, no server or tracking. */
const STORAGE_KEY = 'shuttle-cue-settings-v1.6';
const LEGACY_STORAGE_KEYS = ['shuttle-cue-settings-v1.5', 'shuttle-cue-settings-v1.4', 'shuttle-cue-settings-v1.3', 'shuttle-cue-settings-v1.2', 'shuttle-cue-settings-v1.1', 'shuttle-cue-settings-v1'];
const VOICE_LANGUAGES = [
  {id:'en-US',label:'English', detail:'US'},
  {id:'ko-KR',label:'한국어', detail:'KR'},
  {id:'ja-JP',label:'日本語', detail:'JP'}
];
const ENGLISH_DIRECTIONS = {
  frontLeft:'Front Left', front:'Front', frontRight:'Front Right',
  right:'Right', left:'Left', backRight:'Back Right',
  back:'Back', backLeft:'Back Left'
};
const JAPANESE_DIRECTIONS = {
  frontLeft:'ひだりまえ', front:'まえ', frontRight:'みぎまえ',
  right:'みぎ', left:'ひだり', backRight:'みぎうしろ',
  back:'うしろ', backLeft:'ひだりうしろ'
};
const JAPANESE_NUMBERS = [
  'いち','に','さん','よん','ご','ろく','なな','はち','きゅう','じゅう'
];
const ENGLISH_NUMBERS = [
  'One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'
];

const DIRECTIONS = [
  {id:'frontLeft',  label:'왼쪽 앞',       cue:'왼쪽 앞', glyph:'↖'},
  {id:'front',      label:'정면',         cue:'앞',      glyph:'↑'},
  {id:'frontRight', label:'오른쪽 앞',     cue:'오른쪽 앞',glyph:'↗'},
  {id:'right',      label:'오른쪽 사이드', cue:'오른쪽',  glyph:'→'},
  {id:'left',       label:'왼쪽 사이드',   cue:'왼쪽',    glyph:'←'},
  {id:'backRight',  label:'오른쪽 뒤',     cue:'오른쪽 뒤',glyph:'↘'},
  {id:'back',       label:'뒤',           cue:'뒤',      glyph:'↓'},
  {id:'backLeft',   label:'왼쪽 뒤',       cue:'왼쪽 뒤', glyph:'↙'}
];
const GRIPS = [
  {id:1, name:'포핸드 정면',  spoken:'일'},
  {id:2, name:'포핸드 푸쉬',  spoken:'이'},
  {id:3, name:'포핸드 드라이브',spoken:'삼'},
  {id:4, name:'포핸드 사이드',spoken:'사'},
  {id:5, name:'포핸드 언더',  spoken:'오'},
  {id:6, name:'백핸드 정면',  spoken:'육'},
  {id:7, name:'백핸드 푸쉬',  spoken:'칠'},
  {id:8, name:'백핸드 드라이브',spoken:'팔'},
  {id:9, name:'백핸드 사이드',spoken:'구'},
  {id:10,name:'백핸드 언더',  spoken:'십'}
];
/** Direction-dependent safe training vocabulary (right-handed default).
 * Grip IDs refer to the unchanged C.Grip definitions, not new numbers. */
const STROKES = [
  {id:'fhPush',label:'포핸드 푸쉬',gripId:2,en:'Forehand Push',ko:'포핸드 푸시',ja:'フォアプッシュ'},
  {id:'bhPush',label:'백핸드 푸쉬',gripId:7,en:'Backhand Push',ko:'백핸드 푸시',ja:'バックプッシュ'},
  {id:'fhUnder',label:'포핸드 언더',gripId:5,en:'Forehand Under',ko:'포핸드 언더',ja:'フォアアンダー'},
  {id:'bhUnder',label:'백핸드 언더',gripId:10,en:'Backhand Under',ko:'백핸드 언더',ja:'バックアンダー'},
  {id:'hairpin',label:'헤어핀',gripId:null,en:'Hairpin',ko:'헤어핀',ja:'ヘアピン'},
  {id:'fhDrive',label:'포핸드 드라이브',gripId:3,en:'Drive',ko:'드라이브',ja:'ドライブ'},
  {id:'bhDrive',label:'백핸드 드라이브',gripId:8,en:'Drive',ko:'드라이브',ja:'ドライブ'},
  {id:'clear',label:'클리어',gripId:null,en:'Clear',ko:'클리어',ja:'クリア'},
  {id:'smash',label:'스매시',gripId:null,en:'Smash',ko:'스매시',ja:'スマッシュ'},
  {id:'drop',label:'드롭',gripId:null,en:'Drop',ko:'드롭',ja:'ドロップ'},
  {id:'bhClear',label:'백핸드 클리어',gripId:null,en:'Backhand Clear',ko:'백핸드 클리어',ja:'バックハンドクリア'}
];
const STROKE_BY_ID = Object.fromEntries(STROKES.map(s=>[s.id,s]));
const COMBO_ALLOWED = {
  frontLeft:['bhUnder','bhPush','hairpin'],
  front:['fhUnder','bhUnder','fhPush','bhPush','hairpin'],
  frontRight:['fhUnder','fhPush','hairpin'],
  right:['fhDrive','smash'], left:['bhDrive','smash'],
  backRight:['clear','smash','drop'],
  back:['clear','smash','drop'],
  backLeft:['clear','smash','drop','bhClear']
};
const defaultComboStrokes = () => Object.fromEntries(
  DIRECTIONS.map(direction=>[direction.id,[...COMBO_ALLOWED[direction.id]]])
);
function selectedCombinations(){
  return DIRECTIONS.flatMap(direction=>
    (settings.combination.strokes[direction.id] || []).map(id=>({
      direction,stroke:STROKE_BY_ID[id], key:`${direction.id}:${id}`
    })).filter(item=>Boolean(item.stroke))
  );
}
function strokeSpeech(stroke){
  return settings.voiceLanguage==='ko-KR' ? stroke.ko :
    settings.voiceLanguage==='ja-JP' ? stroke.ja : stroke.en;
}
/** A single TTS utterance, not two overlapping voices. */
function combinedComboSpeech(combo){
  const separator=settings.voiceLanguage==='ja-JP'?'、':', ';
  return directionSpeech(combo.direction)+separator+strokeSpeech(combo.stroke);
}
const MODE_INFO = {
  reaction:{name:'REACTION / A', icon:'✦', promptKey:'promptReaction'},
  footwork:{name:'FOOTWORK / B', icon:'↗', promptKey:'promptFootwork'},
  grip:{name:'GRIP / C', icon:'⌁', promptKey:'promptGrip'},
  combination:{name:'COMBINATION / D', icon:'✧', promptKey:'promptCombo'}
};
const DEFAULTS = () => ({
  mode:'reaction', duration:60, uiLanguage:UILang.fromBrowser(),
  intervals:{reaction:{min:1,max:3},footwork:{min:1,max:3},grip:{min:1,max:3},combination:{min:1,max:3}},
  recovery:2, voiceLanguage:'en-US', voiceRate:1.2, beepVolume:0.65,
  combination:{speechMode:'staged',delay:0.7,recovery:2,avoidRepeat:true,strokes:defaultComboStrokes()},
  directions:DIRECTIONS.map(d=>d.id), grips:GRIPS.map(g=>g.id)
});
const $ = (id) => document.getElementById(id);
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
const round1 = (value) => Math.round(value*10)/10;
function restoreSettings(){
  const s=DEFAULTS();
  try {
    const current=localStorage.getItem(STORAGE_KEY);
    const raw=current ?? LEGACY_STORAGE_KEYS.map(key=>localStorage.getItem(key)).find(value=>value!==null);
    if (!raw) return s;
    const saved=JSON.parse(raw);
    if (!saved || typeof saved!=='object') return s;
    if (MODE_INFO[saved.mode]) s.mode=saved.mode;
    // Existing users keep their Korean display when upgrading from V1.5 or older.
    s.uiLanguage=['ko','ja','en'].includes(saved.uiLanguage)?saved.uiLanguage:'ko';
    if ([30,60,120,180].includes(Number(saved.duration))) s.duration=Number(saved.duration);
    for (const mode of Object.keys(s.intervals)){
      const interval=saved.intervals?.[mode];
      if (!interval) continue;
      const min=round1(clamp(Number(interval.min ?? 1),0.1,5));
      const max=round1(clamp(Number(interval.max ?? 3),0.1,5));
      s.intervals[mode]={min:Math.min(min,max),max:Math.max(min,max)};
    }
    if (Number.isFinite(Number(saved.recovery))) s.recovery=round1(clamp(Number(saved.recovery),0,8));
    if (VOICE_LANGUAGES.some(v=>v.id===saved.voiceLanguage)) s.voiceLanguage=saved.voiceLanguage;
    // en-GB was removed in V1.2. Migrate it safely to the US English option.
    if (saved.voiceLanguage==='en-GB') s.voiceLanguage='en-US';
    // Preserve the chosen voice speed across V1.1/V1.2/V1.3 migrations.
    const fromV11 = current!==null || ['shuttle-cue-settings-v1.5','shuttle-cue-settings-v1.4','shuttle-cue-settings-v1.3','shuttle-cue-settings-v1.2','shuttle-cue-settings-v1.1'].some(k=>localStorage.getItem(k)!==null);
    if (fromV11 && Number.isFinite(Number(saved.voiceRate)))
      s.voiceRate=round1(clamp(Number(saved.voiceRate),0.8,1.6));
    if (Number.isFinite(Number(saved.beepVolume))) s.beepVolume=round1(clamp(Number(saved.beepVolume),0.1,1));
    if (Array.isArray(saved.directions)){
      const picked=DIRECTIONS.map(d=>d.id).filter(id=>saved.directions.includes(id));
      if (picked.length) s.directions=picked;
    }
    if (Array.isArray(saved.grips)){
      const picked=GRIPS.map(g=>g.id).filter(id=>saved.grips.includes(id));
      if (picked.length) s.grips=picked;
    }
    const combo=saved.combination;
    if(combo && typeof combo==='object'){
      if(['staged','combined'].includes(combo.speechMode)) s.combination.speechMode=combo.speechMode;
      if(Number.isFinite(Number(combo.delay))) s.combination.delay=round1(clamp(Number(combo.delay),0,2));
      if(Number.isFinite(Number(combo.recovery))) s.combination.recovery=round1(clamp(Number(combo.recovery),0,8));
      if(typeof combo.avoidRepeat==='boolean') s.combination.avoidRepeat=combo.avoidRepeat;
      if(combo.strokes && typeof combo.strokes==='object'){
        for(const direction of DIRECTIONS){
          const savedStrokes=combo.strokes[direction.id];
          if(Array.isArray(savedStrokes)){
            // New in v1.5: enabled side-drive corners also gain Smash on upgrade.
            // Intentionally disabled directions (empty array) remain disabled.
            // Once v1.5 settings are saved, later changes are never overridden.
            const upgradeSideSmash = current===null && localStorage.getItem('shuttle-cue-settings-v1.5')===null && ['right','left'].includes(direction.id)
              && savedStrokes.includes(direction.id==='right'?'fhDrive':'bhDrive');
            s.combination.strokes[direction.id]=COMBO_ALLOWED[direction.id].filter(id=>
              savedStrokes.includes(id)||(upgradeSideSmash&&id==='smash'));
          }
        }
      }
    }
  } catch(error) {console.warn('설정 복구 실패. 기본값 사용:',error);}
  return s;
}
let settings=restoreSettings();
function t(key,params={}){return UILang.text(settings.uiLanguage,key,params);}
function directionLabel(direction){return UILang.direction(settings.uiLanguage,direction.id);}
function strokeLabel(stroke){return UILang.stroke(settings.uiLanguage,stroke.id);}
function gripLabel(grip){return UILang.grip(settings.uiLanguage,grip.id);}
function secs(value){return t('seconds',{n:Number(value).toFixed(1)});}
function countMarkup(number){const unit=t('countUnit');return String(number)+(unit?`<span class="metric-unit">${unit}</span>`:'');}
let statusMode='offline';
function updateStatus(){
  const node=document.querySelector('.app-status');
  node.innerHTML=statusMode==='offline'?'<span class="status-dot" aria-hidden="true"></span>'+t('offline'):t('webMode');
}
function renderStaticUI(){
  document.documentElement.lang=settings.uiLanguage;
  document.title=t('documentTitle');
  document.querySelector('meta[name="description"]').setAttribute('content',t('metaDescription'));
  document.querySelectorAll('[data-ui-text]').forEach(el=>{el.textContent=t(el.dataset.uiText);});
  document.querySelectorAll('[data-ui-aria]').forEach(el=>{el.setAttribute('aria-label',t(el.dataset.uiAria));});
  const picker=$('uiLanguageSelect');picker.value=settings.uiLanguage;picker.disabled=isActive();
  updateStatus();
}

function saveSettings(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));}catch(error){console.warn('설정 저장 불가',error);}}
// Upgrade V1/V1.1 settings without deleting previous locally saved preferences.
try { if (!localStorage.getItem(STORAGE_KEY)) saveSettings(); } catch (error) { console.warn('설정 마이그레이션 저장 불가:',error); }
function directionSpeech(direction){
  if (settings.voiceLanguage==='ko-KR') return direction.cue;
  if (settings.voiceLanguage==='ja-JP') return JAPANESE_DIRECTIONS[direction.id];
  return ENGLISH_DIRECTIONS[direction.id];
}
function gripSpeech(grip){
  if (settings.voiceLanguage==='ko-KR') return grip.spoken;
  if (settings.voiceLanguage==='ja-JP') return JAPANESE_NUMBERS[grip.id-1];
  return ENGLISH_NUMBERS[grip.id-1];
}
let audioContext=null;
let activeSpeechCleanup=null;
let wakeLock=null;
let toastTimer=null;
let cueAnimationTimer=null;
const state={phase:'idle',mode:settings.mode,endsAt:0,nextAt:0,countdownEndsAt:0,
  remainingMs:settings.duration*1000, nextDelayMs:0,countdownRemainingMs:0,
  count:0,lastCue:null,lastDirection:null,lastGrip:null,ticker:null,
  comboPhase:'waiting',currentCombo:null,lastComboKey:null,sequenceToken:0};
function isActive(){return ['countdown','running','paused'].includes(state.phase);}
function randomSeconds(mode){const v=settings.intervals[mode];return v.min + Math.random()*(v.max-v.min);}
function randomPick(items){return items[Math.floor(Math.random()*items.length)];}
function showToast(message){
  const toast=$('toast');toast.textContent=message;toast.classList.add('visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),3800);
}
function ensureAudio(){
  try {
    if (!audioContext){const Ctx=window.AudioContext||window.webkitAudioContext;if (!Ctx) return false;audioContext=new Ctx();}
    if (audioContext.state==='suspended') void audioContext.resume();
    return true;
  } catch(error){console.warn('오디오 초기화 실패',error);return false;}
}
function beep({frequency=920,duration=0.16,volume=settings.beepVolume}={}){
  if (!ensureAudio()) return false;
  try {
    const oscillator=audioContext.createOscillator();
    const gain=audioContext.createGain();
    const start=audioContext.currentTime;
    oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,start);
    gain.gain.setValueAtTime(0,start);
    gain.gain.linearRampToValueAtTime(Math.max(.001,volume*.33),start+.012);
    gain.gain.exponentialRampToValueAtTime(.001,start+duration);
    oscillator.connect(gain);gain.connect(audioContext.destination);
    oscillator.start(start);oscillator.stop(start+duration+.015);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    return true;
  }catch(error){console.warn('비프음 실패',error);return false;}
}
function canSpeak(){return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;}
/** Optional completion callback supports the two-step D speech sequence.
 * Chrome Android may fail to fire onend; use a 6s safety timeout for D cues.
 * All callbacks are invalidated by cancelSpeak() when paused or stopped. */
function speak(text,onFinished=null){
  if(!canSpeak()){
    showToast(t('ttsUnsupported'));
    if(onFinished) setTimeout(()=>onFinished(false),0);
    return false;
  }
  try{
    const synth=window.speechSynthesis;
    if(activeSpeechCleanup){activeSpeechCleanup();activeSpeechCleanup=null;}
    synth.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=settings.voiceLanguage;
    utterance.rate=settings.voiceRate;utterance.pitch=1;utterance.volume=1;
    const voices=synth.getVoices();
    const locale=settings.voiceLanguage.toLowerCase();
    const base=locale.split('-')[0];
    const matching=voices.find(v=>v.lang.toLowerCase().replace('_','-')===locale)
      || voices.find(v=>v.lang.toLowerCase().split(/[-_]/)[0]===base);
    if(matching)utterance.voice=matching;
    let completed=false, watchdog=null;
    const cleanup=()=>{
      completed=true;clearTimeout(watchdog);
      utterance.onend=null;utterance.onerror=null;
    };
    const done=(ok)=>{
      if(completed)return;
      cleanup();
      if(activeSpeechCleanup===cleanup)activeSpeechCleanup=null;
      if(onFinished)onFinished(ok);
    };
    activeSpeechCleanup=cleanup;
    utterance.onend=()=>done(true);
    utterance.onerror=(event)=>{
      if(event.error && event.error!=='interrupted' && event.error!=='canceled'){
        console.warn('TTS 오류:',event.error);
        showToast(t('ttsError'));
      }
      done(false);
    };
    synth.speak(utterance);
    if(onFinished)watchdog=setTimeout(()=>{
      if(completed)return;
      console.warn('TTS onend timeout:',text);
      showToast(t('ttsTimeout'));
      synth.cancel();done(false);
    },6000);
    return true;
  }catch(error){
    console.warn('음성 출력 실패',error);
    if(activeSpeechCleanup){activeSpeechCleanup();activeSpeechCleanup=null;}
    showToast(t('ttsEngine'));
    if(onFinished)setTimeout(()=>onFinished(false),0);
    return false;
  }
}
function cancelSpeak(){
  if(activeSpeechCleanup){activeSpeechCleanup();activeSpeechCleanup=null;}
  if(canSpeak())try{window.speechSynthesis.cancel();}catch(_){}
}
async function acquireWakeLock(){
  if (!('wakeLock' in navigator) || document.hidden || !['countdown','running'].includes(state.phase)) return;
  try {
    const lock=await navigator.wakeLock.request('screen');
    if (['countdown','running'].includes(state.phase)) wakeLock=lock;
    else await lock.release();
  }catch(error){console.info('화면 켜짐 유지 기능 사용 불가:',error.message);}
}
function releaseWakeLock(){if(wakeLock){void wakeLock.release().catch(()=>{});wakeLock=null;}}
function setCueDisplay(title,subtitle,glyph,{animate=false}={}){
  $('cueTitle').textContent=title;
  $('cueSubtitle').textContent=subtitle;
  $('cueGlyph').textContent=glyph;
  if (animate){
    const stage=$('cueStage');stage.classList.remove('is-cue');void stage.offsetWidth;stage.classList.add('is-cue');
    clearTimeout(cueAnimationTimer);cueAnimationTimer=setTimeout(()=>stage.classList.remove('is-cue'),750);
  }
}
function formatTime(milliseconds){
  const seconds=Math.ceil(Math.max(0,milliseconds)/1000);
  return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
}
function updateTabs(){
  document.querySelectorAll('[data-mode]').forEach(button=>{
    button.setAttribute('aria-pressed',String(button.dataset.mode===settings.mode));
    button.disabled=isActive();
  });
}
function updateMainView(){
  state.mode=settings.mode;
  const info=MODE_INFO[settings.mode];
  $('trainingTag').textContent=info.name;
  $('cueStage').className=`cue-stage mode-${settings.mode}`;
  $('cueTitle').textContent=t('ready');
  $('cueSubtitle').textContent=t(info.promptKey);
  $('cueGlyph').textContent=info.icon;
  $('remainingTime').textContent=formatTime(settings.duration*1000);
  $('cueCount').innerHTML=countMarkup(0);
  $('nextCue').textContent='—';
  $('progressFill').style.width='0%';
  state.lastCue=null;state.count=0;state.remainingMs=settings.duration*1000;
  updateControls();
}
function updateControls(){
  const {phase}=state;
  const keys={idle:'start',countdown:'pause',running:'pause',paused:'resume',complete:'restart'};
  const symbol={idle:'▶',countdown:'Ⅱ',running:'Ⅱ',paused:'▶',complete:'↻'}[phase];
  $('mainActionText').textContent=t(keys[phase]);
  $('mainActionIcon').textContent=symbol;
  $('stopAction').hidden=!isActive();
  $('stopAction').textContent=t('stop');
  const live=$('liveState');
  const messages={idle:'stateIdle',countdown:'stateCountdown',running:'stateRunning',paused:'statePaused',complete:'stateComplete'};
  live.innerHTML='<span class="live-dot"></span> '+t(messages[phase]);
  live.className='live-state'+(phase==='running'?' is-running':phase==='paused'?' is-paused':phase==='complete'?' is-complete':'');
  updateTabs();
  $('uiLanguageSelect').disabled=isActive();
}
function intervalInfo(mode){
  const i=settings.intervals[mode];
  const params={recovery:settings.recovery.toFixed(1),min:i.min.toFixed(1),max:i.max.toFixed(1),
    from:(settings.recovery+i.min).toFixed(1),to:(settings.recovery+i.max).toFixed(1)};
  if(mode==='footwork')return t('footworkSummary',params);
  if(mode==='combination'){
    const lead=settings.combination.speechMode==='combined'?t('comboLeadCombined'):
      t('comboLeadStaged',{delay:settings.combination.delay.toFixed(1)});
    return t('comboSummary',{lead,recovery:settings.combination.recovery.toFixed(1),min:params.min,max:params.max});
  }
  return t('intervalSummary',params);
}
function comboCornerMarkup(direction){
  const chosen=settings.combination.strokes[direction.id];
  const options=COMBO_ALLOWED[direction.id];
  return `<details class="combo-corner"><summary><span class="combo-direction-icon">${direction.glyph}</span><span class="combo-corner-title">${directionLabel(direction)}</span><span class="combo-count" data-combo-count="${direction.id}">${t('selected',{n:chosen.length,total:options.length})}</span><span class="combo-chevron" aria-hidden="true">⌄</span></summary>
    <div class="combo-options">${options.map(id=>{
      const stroke=STROKE_BY_ID[id];
      return `<label class="choice-pill"><input type="checkbox" data-combo-dir="${direction.id}" data-combo-stroke="${id}" ${chosen.includes(id)?'checked':''} ${isActive()?'disabled':''}><span>${strokeLabel(stroke)}${stroke.gripId?` <small class="grip-ref">C-${stroke.gripId}</small>`:''}</span></label>`;
    }).join('')}</div></details>`;
}
function updateComboCount(){
  const pairs=selectedCombinations();
  const counter=$('comboPairCount');if(counter)counter.textContent=String(pairs.length);
  for(const direction of DIRECTIONS){
    const label=document.querySelector(`[data-combo-count="${direction.id}"]`);
    if(label) label.textContent=t('selected',{n:settings.combination.strokes[direction.id].length,total:COMBO_ALLOWED[direction.id].length});
  }
  const warning=$('comboEmptyWarning');if(warning)warning.hidden=pairs.length>0;
}
/** Render the selected training mode using display-language strings only.
 * No training rules or spoken cue vocabulary are modified by UI translation. */
function renderSettings(){
  const mode=settings.mode;
  const locked=isActive();
  const interval=settings.intervals[mode];
  const disabled=locked?'disabled':'';
  const timingInfo=intervalInfo(mode);
  const num=n=>Number(n).toFixed(1);
  const sec=n=>t('seconds',{n:num(n)});
  const durationLabel=s=>s<60?t('secondsOne',{n:s}):t('minutes',{n:s/60});
  const adjust=(target,label,keyDown,keyUp)=>`<div class="fine-adjust"><span>${label}</span><button type="button" data-step-target="${target}" data-step-delta="-0.1" aria-label="${t(keyDown)}" ${disabled}>− 0.1</button><button type="button" data-step-target="${target}" data-step-delta="0.1" aria-label="${t(keyUp)}" ${disabled}>+ 0.1</button></div>`;
  const fine=(target)=>adjust(target,t('fineAdjust'),'ariaFineDown','ariaFineUp');
  let html=`
    <div class="setting-block"><div class="setting-head"><div><div class="setting-label">${t('randomInterval')}</div><p class="setting-description">${t('randomHint')}</p></div><div class="setting-value" id="intervalValue">${num(interval.min)}–${num(interval.max)}${t('seconds',{n:''})}</div></div>
      <div class="slider-row"><label for="intervalMin">${t('min')}</label><input id="intervalMin" type="range" min="0.1" max="5" step="0.1" value="${interval.min}" ${disabled}><output id="minOutput">${sec(interval.min)}</output></div>
      ${adjust('intervalMin',t('minFine'),'ariaMinDown','ariaMinUp')}
      <div class="slider-row"><label for="intervalMax">${t('max')}</label><input id="intervalMax" type="range" min="0.1" max="5" step="0.1" value="${interval.max}" ${disabled}><output id="maxOutput">${sec(interval.max)}</output></div>
      ${adjust('intervalMax',t('maxFine'),'ariaMaxDown','ariaMaxUp')}
      <div class="interval-summary" id="intervalSummary">${timingInfo}</div>
    </div>`;
  if(mode==='footwork'){
    html+=`<div class="setting-block"><div class="setting-head"><div><div class="setting-label">${t('footRecovery')}</div><p class="setting-description">${t('footRecoveryDesc')}</p></div><div class="setting-value" id="recoveryValue">${sec(settings.recovery)}</div></div>
      <div class="slider-row"><label for="recoveryRange">${t('recovery')}</label><input id="recoveryRange" type="range" min="0" max="8" step="0.1" value="${settings.recovery}" ${disabled}><output id="recoveryOutput">${sec(settings.recovery)}</output></div>
      ${adjust('recoveryRange',t('recoveryFine'),'ariaRecoveryDown','ariaRecoveryUp')}
      <p class="setting-description">${t('footRecoveryNote')}</p>
    </div>`;
  }
  if(mode==='combination'){
    html+=`<div class="setting-block"><div class="setting-head"><div><div class="setting-label">${t('cueStyle')}</div><p class="setting-description">${t('cueStyleDesc')}</p></div></div>
      <div class="combo-voice-picker" role="group" aria-label="${t('cueStyleAria')}">
        <button type="button" class="combo-voice-button ${settings.combination.speechMode==='staged'?'is-selected':''}" data-combo-voice="staged" aria-pressed="${settings.combination.speechMode==='staged'}" ${disabled}><strong>${t('staged')}</strong><small>${t('stagedExample',{delay:num(settings.combination.delay)})}</small></button>
        <button type="button" class="combo-voice-button ${settings.combination.speechMode==='combined'?'is-selected':''}" data-combo-voice="combined" aria-pressed="${settings.combination.speechMode==='combined'}" ${disabled}><strong>${t('combined')}</strong><small>${t('combinedExample')}</small></button>
      </div>
      <p class="setting-description">${t('combinedNote')}</p>
    </div>`;
    if(settings.combination.speechMode==='staged'){
      html+=`<div class="setting-block"><div class="setting-head"><div><div class="setting-label">${t('cueDelay')}</div><p class="setting-description">${t('cueDelayDesc')}</p></div><div class="setting-value" id="comboDelayValue">${sec(settings.combination.delay)}</div></div>
        <div class="slider-row"><label for="comboDelayRange">${t('delay')}</label><input id="comboDelayRange" type="range" min="0" max="2" step="0.1" value="${settings.combination.delay}" ${disabled}><output id="comboDelayOutput">${sec(settings.combination.delay)}</output></div>
        ${fine('comboDelayRange')}
      </div>`;
    }
    html+=`<div class="setting-block"><div class="setting-head"><div><div class="setting-label">${t('comboRecovery')}</div><p class="setting-description">${t('comboRecoveryDesc')}</p></div><div class="setting-value" id="comboRecoveryValue">${sec(settings.combination.recovery)}</div></div>
      <div class="slider-row"><label for="comboRecoveryRange">${t('recovery')}</label><input id="comboRecoveryRange" type="range" min="0" max="8" step="0.1" value="${settings.combination.recovery}" ${disabled}><output id="comboRecoveryOutput">${sec(settings.combination.recovery)}</output></div>
      ${fine('comboRecoveryRange')}
    </div>`;
  }
  html+=`<div class="setting-block"><div class="setting-head"><div class="setting-label">${t('duration')}</div><div class="setting-value">${durationLabel(settings.duration)}</div></div><div class="duration-picker">${[30,60,120,180].map(seconds=>`<button class="duration-button ${seconds===settings.duration?'is-selected':''}" data-duration="${seconds}" type="button" ${disabled}>${durationLabel(seconds)}</button>`).join('')}</div></div>`;
  if(mode==='footwork'){
    const sample=DIRECTIONS.map(d=>directionSpeech(d)).join(' / ');
    html+=`<div class="setting-block"><div class="setting-head"><div><div class="setting-label">${t('selectDirections')} <span id="directionCount">(${settings.directions.length}/8)</span></div><p class="setting-description">${t('selectDirectionsDesc')}</p></div></div>
      <div class="choice-grid">${DIRECTIONS.map(d=>`<label class="choice-pill"><input type="checkbox" data-direction="${d.id}" ${settings.directions.includes(d.id)?'checked':''} ${disabled}><span>${directionLabel(d)}</span></label>`).join('')}</div>
      <div class="warn-note">${t('voiceLanguage')}: ${sample}. ${t('sideNote')}</div></div>`;
  }
  if(mode==='grip'){
    html+=`<div class="setting-block"><div class="setting-head"><div><div class="setting-label">${t('selectGrips')} <span id="gripCount">(${settings.grips.length}/10)</span></div><p class="setting-description">${t('gripDesc')}</p></div></div>
      <div class="group-label">FOREHAND · 1–5</div><div class="choice-grid">${GRIPS.slice(0,5).map(gripChoice).join('')}</div>
      <div class="group-label">BACKHAND · 6–10</div><div class="choice-grid">${GRIPS.slice(5).map(gripChoice).join('')}</div></div>`;
  }
  if(mode==='combination'){
    html+=`<div class="setting-block combo-setting"><div class="setting-head"><div><div class="setting-label">${t('selectCombo')} <span class="combo-total">(<span id="comboPairCount">${selectedCombinations().length}</span> ${t('comboPairs',{n:''}).trim()})</span></div><p class="setting-description">${t('comboSelectDesc')}</p></div></div>
      <div class="combo-map-key">${t('comboMapKey')}</div>
      <div class="combo-corners">${DIRECTIONS.map(comboCornerMarkup).join('')}</div>
      <p id="comboEmptyWarning" class="warn-note" ${selectedCombinations().length?'hidden':''}>${t('comboEmpty')}</p>
      <div class="combo-actions"><label class="combo-repeat"><input id="comboAvoidRepeat" type="checkbox" ${settings.combination.avoidRepeat?'checked':''} ${disabled}><span>${t('avoidRepeat')}</span></label><button id="restoreComboDefaults" class="text-button" type="button" ${disabled}>${t('restoreCombo')}</button></div>
      <div class="warn-note">${t('comboHelp')}</div>
    </div>`;
  }
  if(mode==='reaction'){
    html+=`<div class="setting-block"><div class="setting-head"><div><div class="setting-label">${t('beepVolume')}</div><p class="setting-description">${t('beepVolumeDesc')}</p></div><div class="setting-value" id="volumeValue">${Math.round(settings.beepVolume*100)}%</div></div>
      <div class="slider-row"><label for="beepVolumeRange">${t('volume')}</label><input type="range" id="beepVolumeRange" min="0.1" max="1" step="0.1" value="${settings.beepVolume}" ${disabled}><output id="volumeOutput">${Math.round(settings.beepVolume*100)}%</output></div></div>`;
  }else{
    html+=`<div class="setting-block voice-settings"><div class="setting-head"><div><div class="setting-label">${t('voiceLanguage')}</div><p class="setting-description">${t('voiceLanguageDesc')}</p></div></div>
      <div class="voice-language-picker" role="group" aria-label="${t('voiceLanguageAria')}">
      ${VOICE_LANGUAGES.map(v=>`<button type="button" class="voice-lang-button ${settings.voiceLanguage===v.id?'is-selected':''}" data-voice-lang="${v.id}" aria-pressed="${settings.voiceLanguage===v.id}" ${disabled}><strong>${v.label}</strong><small>${v.detail}</small></button>`).join('')}
      </div>
      <p class="setting-description">${t('voiceLanguageHelp')}</p>
    </div>
    <div class="setting-block"><div class="setting-head"><div><div class="setting-label">${t('voiceRate')}</div><p class="setting-description">${t('voiceRateDesc')}</p></div><div class="setting-value" id="rateValue">${t('rateUnit',{n:num(settings.voiceRate)})}</div></div>
      <div class="slider-row"><label for="voiceRateRange">${t('speed')}</label><input id="voiceRateRange" type="range" min="0.8" max="1.6" step="0.1" value="${settings.voiceRate}" ${disabled}><output id="rateOutput">${t('rateUnit',{n:num(settings.voiceRate)})}</output></div></div>`;
  }
  html+=`<div class="setting-block"><div class="sample-row"><button id="testSound" class="test-button" type="button" ${locked?'disabled':''}>${mode==='reaction'?t('beepTest'):t('voiceTest')}</button><p class="setting-description">${t('soundHelp')}</p></div></div>`;
  $('settingsPanel').innerHTML=html;
  $('resetSettings').disabled=locked;
  if(mode==='footwork') $('intervalSummary').innerHTML=timingInfo;
}
function gripChoice(g){
  const name=gripLabel(g);
  const short=name.replace(/^(포핸드 |백핸드 |Forehand |Backhand |フォア|バック)/,'');
  return `<label class="choice-pill"><input type="checkbox" data-grip="${g.id}" ${settings.grips.includes(g.id)?'checked':''} ${isActive()?'disabled':''}><span class="choice-number">${g.id}</span><span>${short}</span></label>`;
}
function updateIntervalLabels(){
  const m=settings.mode,i=settings.intervals[m];
  $('minOutput').textContent=secs(i.min);
  $('maxOutput').textContent=secs(i.max);
  $('intervalValue').textContent=`${i.min.toFixed(1)}–${secs(i.max)}`;
  $('intervalSummary').innerHTML=intervalInfo(m);
}
function begin(){
  if(['footwork','grip','combination'].includes(settings.mode)&&!canSpeak()){
    showToast(t('ttsRequired'));return;
  }
  if(settings.mode==='footwork' && !settings.directions.length || settings.mode==='grip' && !settings.grips.length){
    showToast(t('chooseDirectionGrip'));return;
  }
  if(settings.mode==='combination'&&!selectedCombinations().length){
    showToast(t('chooseCombo'));return;
  }
  ensureAudio();cancelSpeak();
  state.sequenceToken++;
  state.phase='countdown';state.mode=settings.mode;state.count=0;state.lastCue=null;
  state.lastComboKey=null;state.currentCombo=null;state.comboPhase='waiting';
  state.remainingMs=settings.duration*1000;state.countdownEndsAt=performance.now()+3000;
  $('cueCount').innerHTML=countMarkup(0);
  $('remainingTime').textContent=formatTime(state.remainingMs);
  $('nextCue').textContent=t('prepare');
  $('progressFill').style.width='0%';
  setCueDisplay('3',t('countdownHint'),'✦');
  updateControls();renderSettings();
  void acquireWakeLock();
  if(state.ticker) clearInterval(state.ticker);
  let previousSecond=3;
  beep({frequency:560,duration:.085,volume:.2});
  state.ticker=setInterval(()=>{
    const now=performance.now();
    if(state.phase==='countdown'){
      state.countdownRemainingMs=Math.max(0,state.countdownEndsAt-now);
      const seconds=Math.ceil(state.countdownRemainingMs/1000);
      if(seconds>0 && seconds!==previousSecond){
        previousSecond=seconds;setCueDisplay(String(seconds),t('countdownHint'),'✦');
        beep({frequency:560,duration:.085,volume:.2});
      }
      if(now>=state.countdownEndsAt){
        state.phase='running';state.countdownRemainingMs=0;state.endsAt=now+settings.duration*1000;
        state.nextAt=now+randomSeconds(state.mode)*1000;
        setCueDisplay(t('focus'),t('waitFirst'),MODE_INFO[state.mode].icon);
        $('nextCue').textContent=t('random');updateControls();renderSettings();
      }
    }else if(state.phase==='running'){
      const remaining=state.endsAt-now;
      state.remainingMs=Math.max(0,remaining);
      $('remainingTime').textContent=formatTime(state.remainingMs);
      const progress=100*(1-state.remainingMs/(settings.duration*1000));
      $('progressFill').style.width=`${clamp(progress,0,100)}%`;
      if(state.mode==='combination'){
        // Finish the *current* two-step cue even when the workout time expires.
        if(state.comboPhase==='gap'&&now>=state.nextAt)deliverComboStroke();
        else if(state.comboPhase==='waiting'&&remaining>0&&now>=state.nextAt)deliverCue(now);
        else if(remaining<=0&&state.comboPhase==='waiting')finish();
      }else{
        if(remaining<=0){finish();return;}
        if(now>=state.nextAt)deliverCue(now);
      }
    }
  },25);
}
/** D: one pair is counted as one cue, and speech never overlaps.
 * The interval starts *after* the stroke audio ends, for reliable recovery. */
function beginComboDirection(now){
  const pairs=selectedCombinations();
  if(!pairs.length){stop();showToast(t('noCombos'));return;}
  let eligible=pairs;
  if(settings.combination.avoidRepeat && pairs.length>1)
    eligible=pairs.filter(pair=>pair.key!==state.lastComboKey);
  const combo=randomPick(eligible);
  state.currentCombo=combo;state.lastComboKey=combo.key;
  state.lastDirection=combo.direction.id;
  state.lastCue=directionLabel(combo.direction)+' / '+strokeLabel(combo.stroke);
  state.count++;
  $('cueCount').innerHTML=countMarkup(state.count);
  if(settings.combination.speechMode==='combined'){
    setCueDisplay(directionLabel(combo.direction)+' · '+strokeLabel(combo.stroke),t('comboCueCombined'),combo.direction.glyph,{animate:true});
    runComboCombinedSpeech();
  }else{
    setCueDisplay(directionLabel(combo.direction),t('comboCueDirection'),combo.direction.glyph,{animate:true});
    runComboDirectionSpeech();
  }
}
function runComboDirectionSpeech(){
  if(state.mode!=='combination'||!state.currentCombo)return;
  state.comboPhase='direction';state.nextAt=Infinity;
  $('nextCue').textContent=t('phaseDirection');
  const token=++state.sequenceToken;
  speak(directionSpeech(state.currentCombo.direction),()=>{
    if(token!==state.sequenceToken||state.phase!=='running')return;
    state.comboPhase='gap';
    state.nextAt=performance.now()+settings.combination.delay*1000;
    $('nextCue').textContent=t('phaseStrokeWait');
  });
}
/** Combined cue: exactly one TTS call and a shared finish/recovery path. */
function runComboCombinedSpeech(){
  if(state.mode!=='combination'||!state.currentCombo)return;
  state.comboPhase='combined';state.nextAt=Infinity;
  $('nextCue').textContent=t('phaseCombined');
  const token=++state.sequenceToken;
  speak(combinedComboSpeech(state.currentCombo),()=>{
    if(token!==state.sequenceToken||state.phase!=='running')return;
    scheduleComboRecovery();
  });
}
function scheduleComboRecovery(){
  if(performance.now()>=state.endsAt){finish();return;}
  state.comboPhase='waiting';
  state.nextAt=performance.now()+(settings.combination.recovery+randomSeconds('combination'))*1000;
  $('nextCue').textContent=t('phaseRecovery');
}
function deliverComboStroke(){
  if(state.mode!=='combination'||!state.currentCombo||state.phase!=='running')return;
  const combo=state.currentCombo;
  setCueDisplay(strokeLabel(combo.stroke),t('comboCueStroke',{direction:directionLabel(combo.direction)}), '✧',{animate:true});
  runComboStrokeSpeech();
}
function runComboStrokeSpeech(){
  if(state.mode!=='combination'||!state.currentCombo)return;
  state.comboPhase='stroke';state.nextAt=Infinity;
  $('nextCue').textContent=t('phaseStroke');
  const token=++state.sequenceToken;
  speak(strokeSpeech(state.currentCombo.stroke),()=>{
    if(token!==state.sequenceToken||state.phase!=='running')return;
    scheduleComboRecovery();
  });
}
function deliverCue(now){
  if(state.mode==='combination'){beginComboDirection(now);return;}
  let title,subtitle,glyph;
  if(state.mode==='reaction'){
    title=t('reactionSound');subtitle=t('splitStep');glyph='✦';
    if(!beep({duration:Math.min(0.16,settings.intervals.reaction.min*0.70)})) showToast(t('beepFail'));
  }else if(state.mode==='footwork'){
    const directions=DIRECTIONS.filter(d=>settings.directions.includes(d.id));
    const chosen=randomPick(directions);
    state.lastDirection=chosen.id;
    title=directionLabel(chosen);subtitle=t('footCue');glyph=chosen.glyph;
    speak(directionSpeech(chosen));
  }else{
    const grips=GRIPS.filter(g=>settings.grips.includes(g.id));
    const chosen=randomPick(grips);
    state.lastGrip=chosen.id;
    title=String(chosen.id);subtitle=gripLabel(chosen);glyph=chosen.id<=5?'F':'B';
    speak(gripSpeech(chosen));
  }
  state.lastCue=title;
  state.count++;
  $('cueCount').innerHTML=countMarkup(state.count);
  setCueDisplay(title,subtitle,glyph,{animate:true});
  const extra=state.mode==='footwork'?settings.recovery:0;
  state.nextAt=now+(extra+randomSeconds(state.mode))*1000;
}
function pause(fromBackground=false){
  if(!['countdown','running'].includes(state.phase))return;
  const now=performance.now();
  if(state.phase==='running'){
    state.remainingMs=Math.max(0,state.endsAt-now);
    state.nextDelayMs=Number.isFinite(state.nextAt)?Math.max(0,state.nextAt-now):0;
  }else state.countdownRemainingMs=Math.max(0,state.countdownEndsAt-now);
  state.sequenceToken++;
  state.phase='paused';cancelSpeak();releaseWakeLock();
  setCueDisplay(t('paused'),fromBackground?t('pausedBackground'):t('pausedManual'),'Ⅱ');
  $('nextCue').textContent='—';updateControls();renderSettings();
  if(fromBackground)showToast(t('pausedToast'));
}
function resume(){
  if(state.phase!=='paused')return;
  const now=performance.now();
  if(state.countdownRemainingMs>0){
    state.phase='countdown';state.countdownEndsAt=now+state.countdownRemainingMs;
    setCueDisplay(String(Math.ceil(state.countdownRemainingMs/1000)),t('resumeCountdown'),'✦');
    $('nextCue').textContent=t('prepare');
  }else{
    state.phase='running';state.endsAt=now+state.remainingMs;state.nextAt=now+state.nextDelayMs;
    setCueDisplay(t('refocus'),t('waitNext'),MODE_INFO[state.mode].icon);
    $('nextCue').textContent=t('random');
    if(state.mode==='combination'){
      if(state.comboPhase==='combined'){
        setCueDisplay(directionLabel(state.currentCombo.direction)+' · '+strokeLabel(state.currentCombo.stroke),t('comboCombinedReplay'),state.currentCombo.direction.glyph);
        runComboCombinedSpeech();
      }else if(state.comboPhase==='direction'){
        setCueDisplay(directionLabel(state.currentCombo.direction),t('comboDirectionReplay'),state.currentCombo.direction.glyph);
        runComboDirectionSpeech();
      }else if(state.comboPhase==='stroke'){
        setCueDisplay(strokeLabel(state.currentCombo.stroke),t('comboStrokeReplay'),'✧');
        runComboStrokeSpeech();
      }else if(state.comboPhase==='gap')$('nextCue').textContent=t('phaseStrokeWait');
      else $('nextCue').textContent=t('phaseRecovery');
    }
  }
  updateControls();renderSettings();void acquireWakeLock();
}
function finish(){
  if(state.ticker){clearInterval(state.ticker);state.ticker=null;}
  state.phase='complete';state.remainingMs=0;state.countdownRemainingMs=0;
  state.sequenceToken++;
  cancelSpeak();releaseWakeLock();
  $('remainingTime').textContent='00:00';$('nextCue').textContent=t('finished');
  $('progressFill').style.width='100%';
  setCueDisplay(t('finishedTitle'),t('finishedSubtitle',{n:state.count}),'✦',{animate:true});
  updateControls();renderSettings();
  beep({frequency:850,duration:.2,volume:.25});
}
function stop(){
  if(state.ticker){clearInterval(state.ticker);state.ticker=null;}
  state.phase='idle';state.countdownRemainingMs=0;state.nextDelayMs=0;
  state.sequenceToken++;
  state.comboPhase='waiting';state.currentCombo=null;
  cancelSpeak();releaseWakeLock();updateMainView();renderSettings();
}
$('mainAction').addEventListener('click',()=>{
  if(state.phase==='idle'||state.phase==='complete')begin();
  else if(state.phase==='paused')resume();
  else pause();
});
$('stopAction').addEventListener('click',stop);
$('modeTabs').addEventListener('click',event=>{
  const button=event.target.closest('button[data-mode]');
  if(!button||isActive())return;
  cancelSpeak();settings.mode=button.dataset.mode;saveSettings();
  state.phase='idle';updateMainView();renderSettings();
});
$('resetSettings').addEventListener('click',()=>{
  if(isActive())return;
  const mode=settings.mode;
  const uiLanguage=settings.uiLanguage;
  cancelSpeak();settings=DEFAULTS();settings.mode=mode;settings.uiLanguage=uiLanguage;state.phase='idle';saveSettings();
  updateMainView();renderSettings();showToast(t('defaultsRestored'));
});
$('uiLanguageSelect').addEventListener('change',event=>{
  if(isActive()){event.target.value=settings.uiLanguage;showToast(t('uiLocked'));return;}
  const locale=event.target.value;
  if(!['ko','en','ja'].includes(locale))return;
  cancelSpeak();settings.uiLanguage=locale;saveSettings();
  renderStaticUI();updateMainView();renderSettings();
});
$('settingsPanel').addEventListener('click',event=>{
  const languageButton=event.target.closest('[data-voice-lang]');
  if(languageButton && !isActive()){
    const language=languageButton.dataset.voiceLang;
    if(!VOICE_LANGUAGES.some(v=>v.id===language))return;
    cancelSpeak();settings.voiceLanguage=language;saveSettings();renderSettings();return;
  }
  const comboVoice=event.target.closest('button[data-combo-voice]');
  if(comboVoice&&!isActive()&&settings.mode==='combination'){
    const mode=comboVoice.dataset.comboVoice;
    if(!['staged','combined'].includes(mode))return;
    cancelSpeak();settings.combination.speechMode=mode;saveSettings();renderSettings();return;
  }
  const duration=event.target.closest('[data-duration]');
  if(duration&&!isActive()){
    settings.duration=Number(duration.dataset.duration);saveSettings();
    if(state.phase==='complete'){state.phase='idle';updateMainView();}
    state.remainingMs=settings.duration*1000;
    $('remainingTime').textContent=formatTime(state.remainingMs);
    renderSettings();return;
  }
  const restoreCombo=event.target.closest('#restoreComboDefaults');
  if(restoreCombo&&!isActive()){
    settings.combination.strokes=defaultComboStrokes();saveSettings();renderSettings();
    showToast(t('comboRestored'));return;
  }
  const test=event.target.closest('#testSound');
  if(test&&!isActive()){
    if(settings.mode==='reaction'){
      if(!beep())showToast(t('beepUnsupported'));
    }else if(settings.mode==='footwork')speak(directionSpeech(DIRECTIONS[0]));
    else if(settings.mode==='grip')speak(gripSpeech(GRIPS[6]));
    else{
      const pairs=selectedCombinations();
      if(!pairs.length){showToast(t('chooseComboTest'));return;}
      const combo=pairs[0];
      if(settings.combination.speechMode==='combined'){
        speak(combinedComboSpeech(combo));
      }else{
        speak(directionSpeech(combo.direction),()=>{
          if(settings.mode!=='combination'||isActive())return;
          setTimeout(()=>{
            if(settings.mode==='combination'&&settings.combination.speechMode==='staged'&&!isActive())
              speak(strokeSpeech(combo.stroke));
          },settings.combination.delay*1000);
        });
      }
    }
  }
});
$('settingsPanel').addEventListener('change',event=>{
  if(isActive())return;
  const target=event.target;
  if(target.matches('input[data-direction]')){
    const id=target.dataset.direction;
    settings.directions=target.checked?[...settings.directions,id]:settings.directions.filter(x=>x!==id);
    if(settings.directions.length===0){settings.directions=[id];target.checked=true;showToast(t('chooseDirection'));}
    $('directionCount').textContent=`(${settings.directions.length}/8)`;saveSettings();
  }else if(target.matches('input[data-combo-stroke]')){
    const dir=target.dataset.comboDir,id=target.dataset.comboStroke;
    if(!Object.prototype.hasOwnProperty.call(COMBO_ALLOWED,dir)||!COMBO_ALLOWED[dir].includes(id))return;
    const previous=settings.combination.strokes[dir];
    settings.combination.strokes[dir]=COMBO_ALLOWED[dir].filter(strokeId=>
      strokeId===id ? target.checked : previous.includes(strokeId));
    updateComboCount();saveSettings();
  }else if(target.id==='comboAvoidRepeat'){
    settings.combination.avoidRepeat=target.checked;saveSettings();
  }else if(target.matches('input[data-grip]')){
    const id=Number(target.dataset.grip);
    settings.grips=target.checked?[...settings.grips,id]:settings.grips.filter(x=>x!==id);
    if(settings.grips.length===0){settings.grips=[id];target.checked=true;showToast(t('chooseGrip'));}
    $('gripCount').textContent=`(${settings.grips.length}/10)`;saveSettings();
  }
});
// All time sliders and fine-adjust buttons share the same clamp and rounding logic.
function updateTimeSetting(id,value){
  if(isActive())return;
  if(id==='intervalMin'||id==='intervalMax'){
    const current=settings.intervals[settings.mode];
    const next=round1(clamp(value,0.1,5));
    if(id==='intervalMin'){
      current.min=next;
      if(current.min>current.max)current.max=current.min;
    }else{
      current.max=next;
      if(current.max<current.min)current.min=current.max;
    }
    $('intervalMin').value=String(current.min);
    $('intervalMax').value=String(current.max);
    updateIntervalLabels();saveSettings();
  }else if(id==='comboDelayRange'||id==='comboRecoveryRange'){
    const isDelay=id==='comboDelayRange';
    const key=isDelay?'delay':'recovery',max=isDelay?2:8;
    settings.combination[key]=round1(clamp(value,0,max));
    $(id).value=String(settings.combination[key]);
    $(isDelay?'comboDelayValue':'comboRecoveryValue').textContent=secs(settings.combination[key]);
    $(isDelay?'comboDelayOutput':'comboRecoveryOutput').textContent=secs(settings.combination[key]);
    updateIntervalLabels();saveSettings();
  }else if(id==='recoveryRange'){
    settings.recovery=round1(clamp(value,0,8));
    $('recoveryRange').value=String(settings.recovery);
    $('recoveryValue').textContent=secs(settings.recovery);
    $('recoveryOutput').textContent=secs(settings.recovery);
    updateIntervalLabels();saveSettings();
  }
}
$('settingsPanel').addEventListener('click',event=>{
  const button=event.target.closest('button[data-step-target]');
  if(!button||isActive())return;
  const targetId=button.dataset.stepTarget;
  const slider=$(targetId);
  if(!slider)return;
  updateTimeSetting(targetId,round1(Number(slider.value)+Number(button.dataset.stepDelta)));
});
$('settingsPanel').addEventListener('input',event=>{
  if(isActive())return;
  const target=event.target;
  if(['intervalMin','intervalMax','recoveryRange','comboDelayRange','comboRecoveryRange'].includes(target.id)){
    updateTimeSetting(target.id,Number(target.value));
  }else if(target.id==='voiceRateRange'){
    settings.voiceRate=Number(target.value);
    $('rateValue').textContent=t('rateUnit',{n:settings.voiceRate.toFixed(1)});
    $('rateOutput').textContent=t('rateUnit',{n:settings.voiceRate.toFixed(1)});saveSettings();
  }else if(target.id==='beepVolumeRange'){
    settings.beepVolume=Number(target.value);
    $('volumeValue').textContent=Math.round(settings.beepVolume*100)+'%';
    $('volumeOutput').textContent=Math.round(settings.beepVolume*100)+'%';saveSettings();
  }
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden && ['countdown','running'].includes(state.phase))pause(true);
});
window.addEventListener('pagehide',()=>{if(['countdown','running'].includes(state.phase))pause(true);});
renderStaticUI();updateMainView();renderSettings();
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
  navigator.serviceWorker.register('./service-worker.js').then(()=>navigator.serviceWorker.ready).then(()=>{
    statusMode='offline';updateStatus();
  }).catch(error=>{console.warn('PWA 등록 실패',error);statusMode='web';updateStatus();});
}else{
  statusMode='web';updateStatus();
}
