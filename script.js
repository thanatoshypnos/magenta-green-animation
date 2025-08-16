/* Ablauf:
   1) Zeige alle 5 Fragmente nacheinander (mit Blank-Zeiten dazwischen)
   2) Blende den Text-Layer aus
   3) Starte EINMAL die Punkt-/Farbsequenz
   4) Am Ende: Text-Layer wieder ein → zurück zu Schritt 1 (Loop)
*/
(function(){
  const root = document.documentElement;
  const stage = document.querySelector('.stage');
  const textLayer = document.querySelector('.text');
  const items = Array.from(document.querySelectorAll('.fragments li'));

  if(!stage || !textLayer || !items.length) return;

  // Zeiten aus CSS-Variablen
  const sec = v => parseFloat(v) || 0;
  const getVar = name => getComputedStyle(root).getPropertyValue(name);
  const onMs  = sec(getVar('--text-on')) * 1000 || 3200;
  const gapMs = sec(getVar('--text-gap')) * 1000 || 1200;
  const fullAnimMs =
    (sec(getVar('--hold')) + sec(getVar('--grow')) + sec(getVar('--settle'))) * 2 * 1000;

  let playing = true;
  let dotRunning = false;
  let dotTimer = null;

  // Sicherheit: Bühne im Ruhemodus starten
  stage.classList.remove('run');
  textLayer.style.visibility = 'visible';

  // Click toggelt Pause/Weiter für den TEXT-Teil
  document.addEventListener('click', ()=>{
    playing = !playing;
    if(playing && !dotRunning) runTextSequence();
  });

  document.addEventListener('keydown', e=>{
    if(e.code === 'Space'){
      e.preventDefault();
      if(!playing){
        playing = true;
        if(!dotRunning) runTextSequence();
      }
    }
  });

  // TEXT-SEQUENZ EINMAL DURCHSPIELEN
  async function runTextSequence(){
    // kleine Anfangs-Blank-Phase
    await sleep(600);

    for(let i=0; i<items.length; i++){
      if(!playing) await waitUntilPlaying();

      const el = items[i];
      el.classList.add('show');          // einblenden
      await sleep(onMs);

      el.classList.remove('show');       // ausblenden
      await sleep(gapMs);                // Blank (magenta)
    }

    // Nach allen Fragmenten → Punkte laufen lassen
    startDotSequence();
  }

  function startDotSequence(){
    if(dotRunning) return;
    dotRunning = true;

    // Text ausblenden, damit die Fläche pur wirkt
    textLayer.style.visibility = 'hidden';

    // Bühne starten
    stage.classList.add('run');

    // Fallback-Timer, falls 'animationend' nicht feuert
    dotTimer = setTimeout(onDotSequenceDone, fullAnimMs + 100);

    // Wenn die Hintergrund-Animation fertig ist, resetten wir
    stage.addEventListener('animationend', onBgDone, { once: true });
  }

  function onBgDone(e){
    // Wir lauschen auf die Stage-Animation 'bgCycle'
    if(e && e.animationName !== 'bgCycle') return;
    onDotSequenceDone();
  }

  function onDotSequenceDone(){
    if(!dotRunning) return;
    dotRunning = false;
    if(dotTimer){ clearTimeout(dotTimer); dotTimer = null; }

    // Bühne stoppen/zurücksetzen
    stage.classList.remove('run');

    // Text wieder sichtbar
    textLayer.style.visibility = 'visible';

    // Loop: von vorn mit den Texten (sofern nicht pausiert)
    if(playing) runTextSequence();
  }

  // Utilities
  function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
  function waitUntilPlaying(){
    return new Promise(resolve=>{
      const iv = setInterval(()=>{
        if(playing){ clearInterval(iv); resolve(); }
      }, 100);
    });
  }

  // Start
  runTextSequence();
})();
