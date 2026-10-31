'use strict';

/** Shuttle Cue v1.4. Standalone offline-first PWA, no server or tracking. */
const STORAGE_KEY = 'shuttle-cue-settings-v1.4';
const LEGACY_STORAGE_KEYS = ['shuttle-cue-settings-v1.3', 'shuttle-cue-settings-v1.2', 'shuttle-cue-settings-v1.1', 'shuttle-cue-settings-v1'];
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
  right:['fhDrive'], left:['bhDrive'],
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
const MODE_INFO = {
  reaction:{name:'REACTION / A', icon:'✦', prompt:'삑 소리에 맞춰 스플릿 스텝!'},
  footwork:{name:'FOOTWORK / B', icon:'↗', prompt:'음성 방향에 따라 이동하고 중앙으로 복귀하세요'},
  grip:{name:'GRIP / C', icon:'⌁', prompt:'숫자를 듣고 해당 그립과 스트로크를 준비하세요'},
  combination:{name:'COMBINATION / D', icon:'✧', prompt:'방향을 듣고 이동 → 스트로크를 듣고 스윙 → 복귀'}
};
const DEFAULTS = () => ({
  mode:'reaction', duration:60,
  intervals:{reaction:{min:1,max:3},footwork:{min:1,max:3},grip:{min:1,max:3},combination:{min:1,max:3}},
  recovery:2, voiceLanguage:'en-US', voiceRate:1.2, beepVolume:0.65,
  combination:{delay:0.7,recovery:2,avoidRepeat:true,strokes:defaultComboStrokes()},
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
    const fromV11 = current!==null || ['shuttle-cue-settings-v1.3','shuttle-cue-settings-v1.2','shuttle-cue-settings-v1.1'].some(k=>localStorage.getItem(k)!==null);
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
      if(Number.isFinite(Number(combo.delay))) s.combination.delay=round1(clamp(Number(combo.delay),0,2));
      if(Number.isFinite(Number(combo.recovery))) s.combination.recovery=round1(clamp(Number(combo.recovery),0,8));
      if(typeof combo.avoidRepeat==='boolean') s.combination.avoidRepeat=combo.avoidRepeat;
      if(combo.strokes && typeof combo.strokes==='object'){
        for(const direction of DIRECTIONS){
          const savedStrokes=combo.strokes[direction.id];
          if(Array.isArray(savedStrokes)) s.combination.strokes[direction.id]=
            COMBO_ALLOWED[direction.id].filter(id=>savedStrokes.includes(id));
        }
      }
    }
  } catch(error) {console.warn('설정 복구 실패. 기본값 사용:',error);}
  return s;
}
let settings=restoreSettings();
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
    showToast('음성 합성(TTS) 기능을 지원하는 브라우저에서 실행해 주세요.');
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
        showToast('음성이 나오지 않으면 선택 언어의 TTS 음성을 확인해 주세요.');
      }
      done(false);
    };
    synth.speak(utterance);
    if(onFinished)watchdog=setTimeout(()=>{
      if(completed)return;
      console.warn('TTS onend timeout:',text);
      showToast('음성이 오래 지연되어 다음 단계로 넘어갑니다. TTS 설정을 확인하세요.');
      synth.cancel();done(false);
    },6000);
    return true;
  }catch(error){
    console.warn('음성 출력 실패',error);
    if(activeSpeechCleanup){activeSpeechCleanup();activeSpeechCleanup=null;}
    showToast('선택한 언어의 음성 엔진을 확인해 주세요.');
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
  $('cueTitle').textContent='준비 완료';
  $('cueSubtitle').textContent=info.prompt;
  $('cueGlyph').textContent=info.icon;
  $('remainingTime').textContent=formatTime(settings.duration*1000);
  $('cueCount').innerHTML='0<span class="metric-unit">회</span>';
  $('nextCue').textContent='—';
  $('progressFill').style.width='0%';
  state.lastCue=null;state.count=0;state.remainingMs=settings.duration*1000;
  updateControls();
}
function updateControls(){
  const {phase}=state;
  const label={idle:'훈련 시작',countdown:'일시정지',running:'일시정지',paused:'이어하기',complete:'다시 시작'}[phase];
  const symbol={idle:'▶',countdown:'Ⅱ',running:'Ⅱ',paused:'▶',complete:'↻'}[phase];
  $('mainActionText').textContent=label;
  $('mainActionIcon').textContent=symbol;
  $('stopAction').hidden=!isActive();
  const live=$('liveState');
  const messages={idle:'READY',countdown:'COUNTDOWN',running:'TRAINING',paused:'PAUSED',complete:'DONE'};
  live.innerHTML='<span class="live-dot"></span> '+messages[phase];
  live.className='live-state'+(phase==='running'?' is-running':phase==='paused'?' is-paused':phase==='complete'?' is-complete':'');
  updateTabs();
}
function intervalInfo(mode){
  const i=settings.intervals[mode];
  if(mode==='footwork')return `신호 후 복귀 <b>${settings.recovery.toFixed(1)}초</b> + 랜덤 <b>${i.min.toFixed(1)}~${i.max.toFixed(1)}초</b> = 다음 신호까지 약 <b>${(settings.recovery+i.min).toFixed(1)}~${(settings.recovery+i.max).toFixed(1)}초</b>`;
  if(mode==='combination')return `방향 음성 → <b>${settings.combination.delay.toFixed(1)}초</b> → 스트로크 음성 → 복귀 <b>${settings.combination.recovery.toFixed(1)}초</b> + 랜덤 <b>${i.min.toFixed(1)}~${i.max.toFixed(1)}초</b>. 음성 재생 시간은 별도로 걸립니다.`;
  return `신호는 <b>${i.min.toFixed(1)}~${i.max.toFixed(1)}초</b> 사이에서 무작위로 발생합니다.`;
}
function comboCornerMarkup(direction){
  const chosen=settings.combination.strokes[direction.id];
  const options=COMBO_ALLOWED[direction.id];
  return `<details class="combo-corner"><summary><span class="combo-direction-icon">${direction.glyph}</span><span class="combo-corner-title">${direction.label}</span><span class="combo-count" data-combo-count="${direction.id}">${chosen.length}/${options.length} 선택</span><span class="combo-chevron" aria-hidden="true">⌄</span></summary>
    <div class="combo-options">${options.map(id=>{
      const stroke=STROKE_BY_ID[id];
      return `<label class="choice-pill"><input type="checkbox" data-combo-dir="${direction.id}" data-combo-stroke="${id}" ${chosen.includes(id)?'checked':''} ${isActive()?'disabled':''}><span>${stroke.label}${stroke.gripId?` <small class="grip-ref">C-${stroke.gripId}</small>`:''}</span></label>`;
    }).join('')}</div></details>`;
}
function updateComboCount(){
  const pairs=selectedCombinations();
  const counter=$('comboPairCount');if(counter)counter.textContent=String(pairs.length);
  for(const direction of DIRECTIONS){
    const label=document.querySelector(`[data-combo-count="${direction.id}"]`);
    if(label) label.textContent=`${settings.combination.strokes[direction.id].length}/${COMBO_ALLOWED[direction.id].length} 선택`;
  }
  const warning=$('comboEmptyWarning');if(warning)warning.hidden=pairs.length>0;
}
function renderSettings(){
  const mode=settings.mode;
  const locked=isActive();
  const interval=settings.intervals[mode];
  const disabled=locked?'disabled':'';
  const timingInfo=intervalInfo(mode);
  let html=`
    <div class="setting-block"><div class="setting-head"><div><div class="setting-label">무작위 신호 간격</div><p class="setting-description">0.1초 단위 · 최소 0.1초 / 최대 5.0초</p></div><div class="setting-value" id="intervalValue">${interval.min.toFixed(1)}–${interval.max.toFixed(1)}초</div></div>
      <div class="slider-row"><label for="intervalMin">최소</label><input id="intervalMin" type="range" min="0.1" max="5" step="0.1" value="${interval.min}" ${disabled}><output id="minOutput">${interval.min.toFixed(1)}초</output></div>
      <div class="fine-adjust"><span>최소 간격 미세 조절</span><button type="button" data-step-target="intervalMin" data-step-delta="-0.1" aria-label="최소 간격 0.1초 감소" ${disabled}>− 0.1</button><button type="button" data-step-target="intervalMin" data-step-delta="0.1" aria-label="최소 간격 0.1초 증가" ${disabled}>+ 0.1</button></div>
      <div class="slider-row"><label for="intervalMax">최대</label><input id="intervalMax" type="range" min="0.1" max="5" step="0.1" value="${interval.max}" ${disabled}><output id="maxOutput">${interval.max.toFixed(1)}초</output></div>
      <div class="fine-adjust"><span>최대 간격 미세 조절</span><button type="button" data-step-target="intervalMax" data-step-delta="-0.1" aria-label="최대 간격 0.1초 감소" ${disabled}>− 0.1</button><button type="button" data-step-target="intervalMax" data-step-delta="0.1" aria-label="최대 간격 0.1초 증가" ${disabled}>+ 0.1</button></div>
      <div class="interval-summary" id="intervalSummary">${timingInfo}</div>
    </div>`;
  if(mode==='footwork'){
    html+=`<div class="setting-block"><div class="setting-head"><div><div class="setting-label">중앙 복귀 시간</div><p class="setting-description">기본 2초. 이 시간이 지난 뒤 추가 랜덤 대기가 시작됩니다.</p></div><div class="setting-value" id="recoveryValue">${settings.recovery.toFixed(1)}초</div></div>
      <div class="slider-row"><label for="recoveryRange">복귀</label><input id="recoveryRange" type="range" min="0" max="8" step="0.1" value="${settings.recovery}" ${disabled}><output id="recoveryOutput">${settings.recovery.toFixed(1)}초</output></div>
      <div class="fine-adjust"><span>복귀 시간 미세 조절</span><button type="button" data-step-target="recoveryRange" data-step-delta="-0.1" aria-label="복귀 시간 0.1초 감소" ${disabled}>− 0.1</button><button type="button" data-step-target="recoveryRange" data-step-delta="0.1" aria-label="복귀 시간 0.1초 증가" ${disabled}>+ 0.1</button></div>
      <p class="setting-description">복귀 시간은 음성 신호가 시작되는 순간부터 계산됩니다. 첫 신호는 복귀 시간 없이 랜덤 대기 후 나옵니다.</p>
    </div>`;
  }
  if(mode==='combination'){
    html+=`<div class="setting-block"><div class="setting-head"><div><div class="setting-label">방향 → 스트로크 간격</div><p class="setting-description">방향 음성이 끝난 후 스트로크 음성을 시작할 때까지의 시간.</p></div><div class="setting-value" id="comboDelayValue">${settings.combination.delay.toFixed(1)}초</div></div>
      <div class="slider-row"><label for="comboDelayRange">지연</label><input id="comboDelayRange" type="range" min="0" max="2" step="0.1" value="${settings.combination.delay}" ${disabled}><output id="comboDelayOutput">${settings.combination.delay.toFixed(1)}초</output></div>
      <div class="fine-adjust"><span>0.1초 미세 조절</span><button type="button" data-step-target="comboDelayRange" data-step-delta="-0.1" ${disabled}>− 0.1</button><button type="button" data-step-target="comboDelayRange" data-step-delta="0.1" ${disabled}>+ 0.1</button></div>
    </div>
    <div class="setting-block"><div class="setting-head"><div><div class="setting-label">스트로크 후 중앙 복귀 시간</div><p class="setting-description">스트로크 음성이 끝난 뒤 복귀 시간을 확보합니다. 이후 랜덤 대기가 추가됩니다.</p></div><div class="setting-value" id="comboRecoveryValue">${settings.combination.recovery.toFixed(1)}초</div></div>
      <div class="slider-row"><label for="comboRecoveryRange">복귀</label><input id="comboRecoveryRange" type="range" min="0" max="8" step="0.1" value="${settings.combination.recovery}" ${disabled}><output id="comboRecoveryOutput">${settings.combination.recovery.toFixed(1)}초</output></div>
      <div class="fine-adjust"><span>0.1초 미세 조절</span><button type="button" data-step-target="comboRecoveryRange" data-step-delta="-0.1" ${disabled}>− 0.1</button><button type="button" data-step-target="comboRecoveryRange" data-step-delta="0.1" ${disabled}>+ 0.1</button></div>
    </div>`;
  }
  html+=`<div class="setting-block"><div class="setting-head"><div class="setting-label">훈련 시간</div><div class="setting-value">${settings.duration>=60?settings.duration/60+'분':settings.duration+'초'}</div></div><div class="duration-picker">${[30,60,120,180].map(seconds=>`<button class="duration-button ${seconds===settings.duration?'is-selected':''}" data-duration="${seconds}" type="button" ${disabled}>${seconds<60?seconds+'초':seconds/60+'분'}</button>`).join('')}</div></div>`;
  if(mode==='footwork'){
    html+=`<div class="setting-block"><div class="setting-head"><div><div class="setting-label">훈련 방향 선택 <span id="directionCount">(${settings.directions.length}/8)</span></div><p class="setting-description">선택한 언어로 방향을 읽습니다. 숫자 암기는 필요 없습니다.</p></div></div>
      <div class="choice-grid">${DIRECTIONS.map(d=>`<label class="choice-pill"><input type="checkbox" data-direction="${d.id}" ${settings.directions.includes(d.id)?'checked':''} ${disabled}><span>${d.label}</span></label>`).join('')}</div><div class="warn-note">${settings.voiceLanguage==='ko-KR' ? '한국어: 왼쪽 앞 / 앞 / 오른쪽 앞 / 오른쪽 / 왼쪽 / 오른쪽 뒤 / 뒤 / 왼쪽 뒤.' : settings.voiceLanguage==='ja-JP' ? '日本語: 左前 / 前 / 右前 / 右 / 左 / 右後ろ / 後ろ / 左後ろ.' : 'English: Front Left / Front / Front Right / Right / Left / Back Right / Back / Back Left.'} 방향만 말하면 사이드 이동입니다 (Right / Left · 右 / 左 · 오른쪽 / 왼쪽).</div></div>`;
  }
  if(mode==='grip'){
    html+=`<div class="setting-block"><div class="setting-head"><div><div class="setting-label">연습할 그립 번호 <span id="gripCount">(${settings.grips.length}/10)</span></div><p class="setting-description">숫자만 말합니다. 1~5 포핸드, 6~10 백핸드.</p></div></div>
      <div class="group-label">FOREHAND · 1–5</div><div class="choice-grid">${GRIPS.slice(0,5).map(gripChoice).join('')}</div>
      <div class="group-label">BACKHAND · 6–10</div><div class="choice-grid">${GRIPS.slice(5).map(gripChoice).join('')}</div></div>`;
  }
  if(mode==='combination'){
    html+=`<div class="setting-block combo-setting"><div class="setting-head"><div><div class="setting-label">코너별 스트로크 직접 선택 <span class="combo-total">(<span id="comboPairCount">${selectedCombinations().length}</span>개 조합)</span></div><p class="setting-description">방향을 펼쳐 체크한 스트로크만 출제합니다. 모두 해제한 방향은 훈련에서 제외됩니다.</p></div></div>
      <div class="combo-map-key">오른손잡이 기준 기본값 · 좌우 사이드는 드라이브 전용</div>
      <div class="combo-corners">${DIRECTIONS.map(comboCornerMarkup).join('')}</div>
      <p id="comboEmptyWarning" class="warn-note" ${selectedCombinations().length?'hidden':''}>선택된 스트로크가 없습니다. 하나 이상 체크해야 훈련을 시작할 수 있습니다.</p>
      <div class="combo-actions"><label class="combo-repeat"><input id="comboAvoidRepeat" type="checkbox" ${settings.combination.avoidRepeat?'checked':''} ${disabled}><span>직전 동일 방향·스트로크 조합 반복 방지</span></label><button id="restoreComboDefaults" class="text-button" type="button" ${disabled}>추천 조합 복원</button></div>
      <div class="warn-note">앞쪽: 언더·푸쉬·헤어핀 / 양 사이드: 드라이브만 / 오른쪽 뒤·뒤: 클리어·스매시·드롭 / 왼쪽 뒤: 위 3종 + 백핸드 클리어. C.Grip의 1~10 번호는 변경되지 않습니다.</div>
    </div>`;
  }
  if(mode==='reaction'){
    html+=`<div class="setting-block"><div class="setting-head"><div><div class="setting-label">비프음 크기</div><p class="setting-description">휴대폰의 미디어 볼륨과 별도로 조절합니다.</p></div><div class="setting-value" id="volumeValue">${Math.round(settings.beepVolume*100)}%</div></div><div class="slider-row"><label for="beepVolumeRange">음량</label><input type="range" id="beepVolumeRange" min="0.1" max="1" step="0.1" value="${settings.beepVolume}" ${disabled}><output id="volumeOutput">${Math.round(settings.beepVolume*100)}%</output></div></div>`;
  }else{
    html+=`<div class="setting-block voice-settings"><div class="setting-head"><div><div class="setting-label">음성 언어 · Voice Language</div><p class="setting-description">B/C/D 음성 신호에 적용됩니다. 기본 English (US).</p></div></div>
      <div class="voice-language-picker" role="group" aria-label="음성 언어 선택">
      ${VOICE_LANGUAGES.map(v=>`<button type="button" class="voice-lang-button ${settings.voiceLanguage===v.id?'is-selected':''}" data-voice-lang="${v.id}" aria-pressed="${settings.voiceLanguage===v.id}" ${disabled}><strong>${v.label}</strong><small>${v.detail}</small></button>`).join('')}
      </div>
      <p class="setting-description">영어(미국식)·한국어·일본어 중 선택합니다. 각 언어의 TTS 음성 설치 상태에 따라 발음이 달라질 수 있습니다.</p>
    </div>
    <div class="setting-block"><div class="setting-head"><div><div class="setting-label">음성 속도 · Speech Rate</div><p class="setting-description">선택한 언어의 방향·스트로크·숫자를 읽는 속도입니다.</p></div><div class="setting-value" id="rateValue">${settings.voiceRate.toFixed(1)}배</div></div><div class="slider-row"><label for="voiceRateRange">속도</label><input id="voiceRateRange" type="range" min="0.8" max="1.6" step="0.1" value="${settings.voiceRate}" ${disabled}><output id="rateOutput">${settings.voiceRate.toFixed(1)}배</output></div></div>`;
  }
  html+=`<div class="setting-block"><div class="sample-row"><button id="testSound" class="test-button" type="button" ${locked?'disabled':''}>${mode==='reaction'?'♪ 비프음 테스트':'🔊 음성 테스트'}</button><p class="setting-description">훈련 전 소리가 잘 들리는지 확인하세요. 무음 설정과 미디어 볼륨에 주의하세요.</p></div></div>`;
  $('settingsPanel').innerHTML=html;
  $('resetSettings').disabled=locked;
  if(mode==='footwork') $('intervalSummary').innerHTML=timingInfo;
}
function gripChoice(g){return `<label class="choice-pill"><input type="checkbox" data-grip="${g.id}" ${settings.grips.includes(g.id)?'checked':''} ${isActive()?'disabled':''}><span class="choice-number">${g.id}</span><span>${g.name.replace(/^포핸드 |^백핸드 /,'')}</span></label>`;}
function updateIntervalLabels(){
  const m=settings.mode,i=settings.intervals[m];
  $('minOutput').textContent=i.min.toFixed(1)+'초';
  $('maxOutput').textContent=i.max.toFixed(1)+'초';
  $('intervalValue').textContent=`${i.min.toFixed(1)}–${i.max.toFixed(1)}초`;
  $('intervalSummary').innerHTML=intervalInfo(m);
}
function begin(){
  if(['footwork','grip','combination'].includes(settings.mode)&&!canSpeak()){
    showToast('브라우저의 음성(TTS) 지원이 필요합니다.');return;
  }
  if(settings.mode==='footwork' && !settings.directions.length || settings.mode==='grip' && !settings.grips.length){
    showToast('연습할 방향 또는 그립을 하나 이상 선택해 주세요.');return;
  }
  if(settings.mode==='combination'&&!selectedCombinations().length){
    showToast('D 모드에서 방향·스트로크 조합을 최소 1개 선택해 주세요.');return;
  }
  ensureAudio();cancelSpeak();
  state.sequenceToken++;
  state.phase='countdown';state.mode=settings.mode;state.count=0;state.lastCue=null;
  state.lastComboKey=null;state.currentCombo=null;state.comboPhase='waiting';
  state.remainingMs=settings.duration*1000;state.countdownEndsAt=performance.now()+3000;
  $('cueCount').innerHTML='0<span class="metric-unit">회</span>';
  $('remainingTime').textContent=formatTime(state.remainingMs);
  $('nextCue').textContent='준비';
  $('progressFill').style.width='0%';
  setCueDisplay('3','시작 전 준비하세요','✦');
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
        previousSecond=seconds;setCueDisplay(String(seconds),'시작 전 준비하세요','✦');
        beep({frequency:560,duration:.085,volume:.2});
      }
      if(now>=state.countdownEndsAt){
        state.phase='running';state.countdownRemainingMs=0;state.endsAt=now+settings.duration*1000;
        state.nextAt=now+randomSeconds(state.mode)*1000;
        setCueDisplay('집중!','첫 신호를 기다리세요',MODE_INFO[state.mode].icon);
        $('nextCue').textContent='랜덤';updateControls();renderSettings();
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
  if(!pairs.length){stop();showToast('선택한 스트로크 조합이 없습니다.');return;}
  let eligible=pairs;
  if(settings.combination.avoidRepeat && pairs.length>1)
    eligible=pairs.filter(pair=>pair.key!==state.lastComboKey);
  const combo=randomPick(eligible);
  state.currentCombo=combo;state.lastComboKey=combo.key;
  state.lastDirection=combo.direction.id;
  state.lastCue=combo.direction.label+' / '+combo.stroke.label;
  state.count++;
  $('cueCount').innerHTML=String(state.count)+'<span class="metric-unit">회</span>';
  setCueDisplay(combo.direction.label,'① 방향 이동 · 다음은 스트로크 음성',combo.direction.glyph,{animate:true});
  runComboDirectionSpeech();
}
function runComboDirectionSpeech(){
  if(state.mode!=='combination'||!state.currentCombo)return;
  state.comboPhase='direction';state.nextAt=Infinity;
  $('nextCue').textContent='방향 음성';
  const token=++state.sequenceToken;
  speak(directionSpeech(state.currentCombo.direction),()=>{
    if(token!==state.sequenceToken||state.phase!=='running')return;
    state.comboPhase='gap';
    state.nextAt=performance.now()+settings.combination.delay*1000;
    $('nextCue').textContent='스트로크 대기';
  });
}
function deliverComboStroke(){
  if(state.mode!=='combination'||!state.currentCombo||state.phase!=='running')return;
  const combo=state.currentCombo;
  setCueDisplay(combo.stroke.label,`② ${combo.direction.label} · 스트로크 후 중앙 복귀`, '✧',{animate:true});
  runComboStrokeSpeech();
}
function runComboStrokeSpeech(){
  if(state.mode!=='combination'||!state.currentCombo)return;
  state.comboPhase='stroke';state.nextAt=Infinity;
  $('nextCue').textContent='스트로크 음성';
  const token=++state.sequenceToken;
  speak(strokeSpeech(state.currentCombo.stroke),()=>{
    if(token!==state.sequenceToken||state.phase!=='running')return;
    if(performance.now()>=state.endsAt){finish();return;}
    state.comboPhase='waiting';
    state.nextAt=performance.now()+(settings.combination.recovery+randomSeconds('combination'))*1000;
    $('nextCue').textContent='복귀 + 대기';
  });
}
function deliverCue(now){
  if(state.mode==='combination'){beginComboDirection(now);return;}
  let title,subtitle,glyph;
  if(state.mode==='reaction'){
    title='삑!';subtitle='스플릿 스텝!';glyph='✦';
    if(!beep({duration:Math.min(0.16,settings.intervals.reaction.min*0.70)})) showToast('비프음을 재생할 수 없습니다. Chrome에서 다시 시도하세요.');
  }else if(state.mode==='footwork'){
    const directions=DIRECTIONS.filter(d=>settings.directions.includes(d.id));
    const chosen=randomPick(directions);
    state.lastDirection=chosen.id;
    title=chosen.label;subtitle='이동 → 스플릿 스텝 → 중앙 복귀';glyph=chosen.glyph;
    speak(directionSpeech(chosen));
  }else{
    const grips=GRIPS.filter(g=>settings.grips.includes(g.id));
    const chosen=randomPick(grips);
    state.lastGrip=chosen.id;
    title=String(chosen.id);subtitle=chosen.name;glyph=chosen.id<=5?'F':'B';
    speak(gripSpeech(chosen));
  }
  state.lastCue=title;
  state.count++;
  $('cueCount').innerHTML=String(state.count)+'<span class="metric-unit">회</span>';
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
  setCueDisplay('일시정지',fromBackground?'화면 전환이 감지되어 자동으로 멈췄습니다':'이어하기를 눌러 계속하세요','Ⅱ');
  $('nextCue').textContent='—';updateControls();renderSettings();
  if(fromBackground)showToast('화면이 꺼지거나 앱을 전환해 훈련을 일시정지했습니다.');
}
function resume(){
  if(state.phase!=='paused')return;
  const now=performance.now();
  if(state.countdownRemainingMs>0){
    state.phase='countdown';state.countdownEndsAt=now+state.countdownRemainingMs;
    setCueDisplay(String(Math.ceil(state.countdownRemainingMs/1000)),'준비 카운트다운','✦');
    $('nextCue').textContent='준비';
  }else{
    state.phase='running';state.endsAt=now+state.remainingMs;state.nextAt=now+state.nextDelayMs;
    setCueDisplay('다시 집중!','다음 랜덤 신호를 기다리세요',MODE_INFO[state.mode].icon);
    $('nextCue').textContent='랜덤';
    if(state.mode==='combination'){
      if(state.comboPhase==='direction'){
        setCueDisplay(state.currentCombo.direction.label,'① 방향 음성 다시 재생',state.currentCombo.direction.glyph);
        runComboDirectionSpeech();
      }else if(state.comboPhase==='stroke'){
        setCueDisplay(state.currentCombo.stroke.label,'② 스트로크 음성 다시 재생','✧');
        runComboStrokeSpeech();
      }else if(state.comboPhase==='gap')$('nextCue').textContent='스트로크 대기';
      else $('nextCue').textContent='복귀 + 대기';
    }
  }
  updateControls();renderSettings();void acquireWakeLock();
}
function finish(){
  if(state.ticker){clearInterval(state.ticker);state.ticker=null;}
  state.phase='complete';state.remainingMs=0;state.countdownRemainingMs=0;
  state.sequenceToken++;
  cancelSpeak();releaseWakeLock();
  $('remainingTime').textContent='00:00';$('nextCue').textContent='완료';
  $('progressFill').style.width='100%';
  setCueDisplay('훈련 완료!','총 '+state.count+'개의 랜덤 신호를 수행했습니다.','✦',{animate:true});
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
  cancelSpeak();settings=DEFAULTS();settings.mode=mode;state.phase='idle';saveSettings();
  updateMainView();renderSettings();showToast('설정을 기본값으로 초기화했습니다.');
});
$('settingsPanel').addEventListener('click',event=>{
  const languageButton=event.target.closest('[data-voice-lang]');
  if(languageButton && !isActive()){
    const language=languageButton.dataset.voiceLang;
    if(!VOICE_LANGUAGES.some(v=>v.id===language))return;
    cancelSpeak();settings.voiceLanguage=language;saveSettings();renderSettings();return;
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
    showToast('D 모드 추천 조합을 복원했습니다.');return;
  }
  const test=event.target.closest('#testSound');
  if(test&&!isActive()){
    if(settings.mode==='reaction'){
      if(!beep())showToast('이 기기에서는 비프음을 재생할 수 없습니다.');
    }else if(settings.mode==='footwork')speak(directionSpeech(DIRECTIONS[0]));
    else if(settings.mode==='grip')speak(gripSpeech(GRIPS[6]));
    else{
      const pairs=selectedCombinations();
      if(!pairs.length){showToast('D 모드의 스트로크를 하나 이상 체크하세요.');return;}
      const combo=pairs[0];
      speak(directionSpeech(combo.direction),()=>{
        if(settings.mode!=='combination'||isActive())return;
        setTimeout(()=>{
          if(settings.mode==='combination'&&!isActive())speak(strokeSpeech(combo.stroke));
        },settings.combination.delay*1000);
      });
    }
  }
});
$('settingsPanel').addEventListener('change',event=>{
  if(isActive())return;
  const target=event.target;
  if(target.matches('input[data-direction]')){
    const id=target.dataset.direction;
    settings.directions=target.checked?[...settings.directions,id]:settings.directions.filter(x=>x!==id);
    if(settings.directions.length===0){settings.directions=[id];target.checked=true;showToast('최소 하나의 방향을 선택해 주세요.');}
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
    if(settings.grips.length===0){settings.grips=[id];target.checked=true;showToast('최소 하나의 그립 번호를 선택해 주세요.');}
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
    $(isDelay?'comboDelayValue':'comboRecoveryValue').textContent=settings.combination[key].toFixed(1)+'초';
    $(isDelay?'comboDelayOutput':'comboRecoveryOutput').textContent=settings.combination[key].toFixed(1)+'초';
    updateIntervalLabels();saveSettings();
  }else if(id==='recoveryRange'){
    settings.recovery=round1(clamp(value,0,8));
    $('recoveryRange').value=String(settings.recovery);
    $('recoveryValue').textContent=settings.recovery.toFixed(1)+'초';
    $('recoveryOutput').textContent=settings.recovery.toFixed(1)+'초';
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
    $('rateValue').textContent=settings.voiceRate.toFixed(1)+'배';
    $('rateOutput').textContent=settings.voiceRate.toFixed(1)+'배';saveSettings();
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
updateMainView();renderSettings();
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
  navigator.serviceWorker.register('./service-worker.js').then(()=>navigator.serviceWorker.ready).then(()=>{
    document.querySelector('.app-status').innerHTML='<span class="status-dot"></span>OFFLINE READY';
  }).catch(error=>{console.warn('PWA 등록 실패',error);document.querySelector('.app-status').textContent='WEB MODE';});
}else{
  document.querySelector('.app-status').textContent='WEB MODE';
}
