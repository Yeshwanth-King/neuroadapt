(function () {
  'use strict';

  const MIN_PARAGRAPH_LENGTH = 15;
  const STORAGE_KEY = 'adaptn-adhd-pasted-text';

  let paragraphs = [];
  let currentIndex = 0;

  const titleEl = document.getElementById('readerTitle');
  const contentEl = document.getElementById('readerContent');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnClose = document.getElementById('btnClose');

  function splitIntoParagraphs(text) {
    if (!text || typeof text !== 'string') return [];
    const raw = text.split(/\n\n+|\n/).map(function (s) { return s.trim(); });
    const out = [];
    for (let i = 0; i < raw.length; i++) {
      if (raw[i].length >= MIN_PARAGRAPH_LENGTH) out.push(raw[i]);
      else if (raw[i].length > 0 && out.length > 0) out[out.length - 1] += ' ' + raw[i];
      else if (raw[i].length > 0) out.push(raw[i]);
    }
    return out.length ? out : [text.trim()].filter(Boolean);
  }

  function updateContent() {
    if (paragraphs.length === 0) {
      contentEl.textContent = '';
      contentEl.innerHTML = '<p class="reader-empty">Paste text in the extension popup and click "Open ADHD reader".</p>';
      titleEl.textContent = '';
      btnPrev.disabled = true;
      btnNext.disabled = true;
      return;
    }
    titleEl.textContent = 'Paragraph ' + (currentIndex + 1) + ' of ' + paragraphs.length;
    contentEl.textContent = paragraphs[currentIndex];
    btnPrev.disabled = currentIndex === 0;
    btnNext.disabled = currentIndex === paragraphs.length - 1;
  }

  function goPrev() {
    if (currentIndex > 0) {
      currentIndex--;
      updateContent();
    }
  }

  function goNext() {
    if (currentIndex < paragraphs.length - 1) {
      currentIndex++;
      updateContent();
    }
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      goNext();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      window.close();
    }
  }

  btnPrev.addEventListener('click', goPrev);
  btnNext.addEventListener('click', goNext);
  btnClose.addEventListener('click', function () { window.close(); });
  document.addEventListener('keydown', onKeyDown);

  chrome.storage.local.get([STORAGE_KEY], function (data) {
    const text = data[STORAGE_KEY] || '';
    paragraphs = splitIntoParagraphs(text);
    currentIndex = 0;
    updateContent();
  });
})();
