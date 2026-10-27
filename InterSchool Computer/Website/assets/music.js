/* AZAFRÁN — persistent background soundtrack */
(function () {
  'use strict';

  if (window.__azafranMusicLoaded) return;
  window.__azafranMusicLoaded = true;

  var SRC = 'assets/audio/once-upon-a-time.mp3';
  var TIME_KEY = 'azafran-sound-time';
  var MUTED_KEY = 'azafran-sound-muted';
  var TARGET_VOLUME = 0.28;

  var audio = document.createElement('audio');
  audio.id = 'azafranSoundtrack';
  audio.src = SRC;
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = TARGET_VOLUME;
  audio.setAttribute('aria-hidden', 'true');
  audio.style.display = 'none';
  document.body.appendChild(audio);

  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'sound-toggle is-paused';
  button.title = 'Background soundtrack';
  button.setAttribute('aria-label', 'Play background soundtrack');
  button.setAttribute('aria-pressed', 'false');
  button.innerHTML =
    '<span class="sound-bars" aria-hidden="true"><i></i><i></i><i></i></span>' +
    '<span class="sound-label">Sound on</span>';
  document.body.appendChild(button);

  var label = button.querySelector('.sound-label');
  var blocked = false;
  var unlockBound = false;
  var lastSave = 0;

  function readSession(key) {
    try { return sessionStorage.getItem(key); } catch (err) { return null; }
  }

  function writeSession(key, value) {
    try { sessionStorage.setItem(key, String(value)); } catch (err) {}
  }

  var savedTime = parseFloat(readSession(TIME_KEY));
  if (!isFinite(savedTime) || savedTime < 0) savedTime = 0;

  function restoreTime() {
    if (!savedTime || !isFinite(audio.duration) || savedTime >= audio.duration) return;
    try { audio.currentTime = savedTime; } catch (err) {}
  }

  audio.addEventListener('loadedmetadata', restoreTime);
  audio.muted = readSession(MUTED_KEY) === 'true';

  function savePosition() {
    if (isFinite(audio.currentTime)) writeSession(TIME_KEY, audio.currentTime);
    writeSession(MUTED_KEY, audio.muted ? 'true' : 'false');
  }

  function paint() {
    var paused = audio.paused;
    var muted = audio.muted;

    button.classList.toggle('is-paused', paused);
    button.classList.toggle('is-muted', !paused && muted);
    button.classList.toggle('is-playing', !paused && !muted);
    button.classList.toggle('is-blocked', blocked && paused);

    if (paused) {
      label.textContent = 'Play soundtrack';
      button.setAttribute('aria-label', 'Play background soundtrack');
      button.setAttribute('aria-pressed', 'false');
    } else if (muted) {
      label.textContent = 'Sound off';
      button.setAttribute('aria-label', 'Unmute background soundtrack');
      button.setAttribute('aria-pressed', 'false');
    } else {
      label.textContent = 'Sound on';
      button.setAttribute('aria-label', 'Mute background soundtrack');
      button.setAttribute('aria-pressed', 'true');
    }
  }

  function play() {
    return audio.play().then(function () {
      blocked = false;
      paint();
    }).catch(function () {
      blocked = true;
      paint();
      bindUnlock();
    });
  }

  function bindUnlock() {
    if (unlockBound) return;
    unlockBound = true;

    var events = ['pointerdown', 'keydown', 'touchstart', 'wheel'];

    function removeUnlock() {
      unlockBound = false;
      events.forEach(function (name) {
        document.removeEventListener(name, unlock, true);
      });
    }

    function unlock(event) {
      if (button.contains(event.target)) return;
      if (!audio.paused) {
        removeUnlock();
        return;
      }
      audio.play().then(function () {
        blocked = false;
        paint();
        removeUnlock();
      }).catch(function () {
        /* Keep listening; some browsers need a more deliberate gesture. */
      });
    }

    events.forEach(function (name) {
      document.addEventListener(name, unlock, true);
    });
  }

  button.addEventListener('click', function () {
    if (audio.paused) {
      play();
      return;
    }
    audio.muted = !audio.muted;
    writeSession(MUTED_KEY, audio.muted ? 'true' : 'false');
    paint();
  });

  audio.addEventListener('play', function () {
    blocked = false;
    paint();
  });
  audio.addEventListener('pause', paint);
  audio.addEventListener('volumechange', paint);
  audio.addEventListener('timeupdate', function () {
    var now = Date.now();
    if (now - lastSave > 1500) {
      lastSave = now;
      savePosition();
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') savePosition();
  });
  window.addEventListener('pagehide', savePosition);
  window.addEventListener('beforeunload', savePosition);

  paint();
  play();
})();
