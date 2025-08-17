/* Flow:
   1) Show 5 text fragments (with magenta blanks between)
   2) Hide text
   3) Run dot/color sequence ONCE
   4) Show text again → loop
*/
(function(){
  const root = document.documentElement;
  const stage = document.querySelector('.stage');
  const textLayer = document.querySelector('.text');
  const items = Array.from(document.querySelectorAll('.fragments li'));
  if(!stage || !textLayer || !items.length) return;

  // Read timings from CSS variables
  const sec = v => parseFloat(v) || 0;
  const getVar = name => getComputedStyle(root).getPropertyValue(name);
  const onMs  = sec(getVar('--text-on')) * 1000 || 3200;
  const gapMs = sec(getVar('--text-gap')) * 1000 || 1200;
  const fullAnimMs =
    (sec(getVar('--hold')) + sec(getVar('--grow')) + sec(getVar('--settle'))) * 2 * 1000;

  let playing = true;
  let dotRunning = false;
  let dotTimer = null;
  let i = -1;

  // Ensure resting state
  stage.classList.remove('run');
  textLayer.style.visibility = 'visible';

  // Pause/resume text with click
  document.addEventListener('click', ()=>{
    playing = !playing;
    if(playing && !dotRunning) runTextSequence();
  });

  // Space resumes
  document.addEventListener('keydown', e=>{
    if(e.code === 'Space'){
      e.preventDefault();
      if(!playing){
        playing = true;
        if(!dotRunning) runTextSequence();
      }
    }
  });

  // Text sequence
  async function runTextSequence(){
    await sleep(600); // initial blank

    for(let step=0; step<items.length; step++){
      if(!playing) await waitUntilPlaying();

      // hide previous with slower fade-out
      if(i >= 0){
        items[i].classList.add('hiding');
        items[i].classList.remove('show');
      }

      // next
      i = (i + 1) % items.length;

      // show current (fast fade-in)
      requestAnimationFrame(()=>{
        items[i].classList.remove('hiding');
        items[i].classList.add('show');
      });

      // visible duration
      await sleep(onMs);

      // start fade-out and wait for blank
      items[i].classList.add('hiding');
      items[i].classList.remove('show');
      await sleep(gapMs);
    }

    // After all fragments → dots
    startDotSequence();
  }

  function startDotSequence(){
    if(dotRunning) return;
    dotRunning = true;

    // Hide text for the color show
    textLayer.style.visibility = 'hidden';

    // Kick animations
    stage.classList.add('run');

    // Fallback timer in case animationend doesn't fire
    dotTimer = setTimeout(onDotSequenceDone, fullAnimMs + 200);

    // Listen for the bg animation end
    stage.addEventListener('animationend', onBgDone, { once: true });
  }

  function onBgDone(e){
    if(e && e.animationName !== 'bgCycle') return;
    onDotSequenceDone();
  }

  function onDotSequenceDone(){
    if(!dotRunning) return;
    dotRunning = false;
    if(dotTimer){ clearTimeout(dotTimer); dotTimer = null; }

    // Reset stage
    stage.classList.remove('run');

    // Show text again and loop
    textLayer.style.visibility = 'visible';
    if(playing) runTextSequence();
  }

  // Helpers
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
