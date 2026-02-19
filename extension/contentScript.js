(function () {
  'use strict';

  const ROOT = document.documentElement;
  const STORAGE_KEYS = [
    'enabled',
    'modeDyslexia',
    'modeLowVision',
    'modeAdhdFocus',
    'fontScale',
    'letterSpacingEm',
    'lineHeight'
  ];

  function getDefaults() {
    return {
      enabled: false,
      modeDyslexia: false,
      modeLowVision: false,
      modeAdhdFocus: false,
      fontScale: 1.0,
      letterSpacingEm: 0.12,
      lineHeight: 1.6
    };
  }

  /* Only paragraph-level elements so we get many blocks, not one huge article/section/main */
  const FOCUSABLE_SELECTOR = 'p, li, blockquote';
  const MIN_TEXT_LENGTH = 20;
  const MIN_PART_LENGTH = 15;
  const MAX_PART_LENGTH = 280;
  const LOG = function (msg, data) {
    if (typeof console !== 'undefined' && console.log) {
      if (data !== undefined) console.log('[AdaptLearn ADHD]', msg, data);
      else console.log('[AdaptLearn ADHD]', msg);
    }
  };

  /** Split paragraph text into smaller parts (sentences / chunks) for step-through reading */
  function splitParagraphIntoParts(text) {
    if (!text || !String(text).trim()) return [];
    var s = String(text).trim();
    var parts = s.split(/(?<=[.!?])\s+/);
    if (!parts || parts.length === 0) {
      if (s.length >= MIN_PART_LENGTH) return [s];
      return [];
    }
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      if (p.length < MIN_PART_LENGTH) continue;
      if (p.length <= MAX_PART_LENGTH) {
        out.push(p);
      } else {
        var byComma = p.split(/\s*,\s*/);
        if (byComma.length > 1) {
          for (var c = 0; c < byComma.length; c++) {
            var seg = byComma[c].trim();
            if (seg.length >= MIN_PART_LENGTH) out.push(seg);
          }
        } else {
          for (var j = 0; j < p.length; j += MAX_PART_LENGTH) {
            var chunk = p.slice(j, j + MAX_PART_LENGTH).trim();
            if (chunk.length >= MIN_PART_LENGTH) out.push(chunk);
          }
        }
      }
    }
    return out;
  }

  function getAllFocusableBlocks() {
    const nodes = document.querySelectorAll(FOCUSABLE_SELECTOR);
    const out = [];
    for (let i = 0; i < nodes.length; i++) {
      const text = (nodes[i].textContent || '').trim();
      if (text.length >= MIN_TEXT_LENGTH) out.push(nodes[i]);
    }
    LOG('getAllFocusableBlocks: found ' + nodes.length + ' nodes, ' + out.length + ' with >= ' + MIN_TEXT_LENGTH + ' chars');
    if (out.length > 0) LOG('first block tag:', out[0].tagName);
    return out;
  }

  function findFocusableBlock(el) {
    const tagList = ['p', 'li', 'blockquote'];
    let node = el;
    LOG('findFocusableBlock: click target tag=', el?.tagName, 'id=', el?.id);
    while (node && node !== document.body) {
      if (tagList.includes(node.tagName?.toLowerCase())) {
        const text = (node.textContent || '').trim();
        if (text.length >= MIN_TEXT_LENGTH) {
          LOG('findFocusableBlock: found block', node.tagName, 'textLength=' + text.length);
          return node;
        }
      }
      node = node.parentElement;
    }
    LOG('findFocusableBlock: no block found for click');
    return null;
  }

  let adhdPanelEl = null;
  let adhdBackdropEl = null;
  /** Array of strings (block text) so we don't rely on DOM nodes that may be detached */
  let adhdBlocks = [];
  let adhdCurrentIndex = 0;

  function closeAdhdPanel() {
    if (adhdBackdropEl && adhdBackdropEl.parentNode) adhdBackdropEl.parentNode.removeChild(adhdBackdropEl);
    if (adhdPanelEl && adhdPanelEl.parentNode) adhdPanelEl.parentNode.removeChild(adhdPanelEl);
    adhdBackdropEl = null;
    adhdPanelEl = null;
    adhdBlocks = [];
  }

  function updateAdhdPanelContent() {
    if (!adhdPanelEl || !adhdBlocks.length) return;
    var idx = Math.max(0, Math.min(adhdCurrentIndex, adhdBlocks.length - 1));
    adhdCurrentIndex = idx;
    const contentEl = adhdPanelEl.querySelector('.adaptn-adhd-panel-content');
    const titleEl = adhdPanelEl.querySelector('.adaptn-adhd-panel-title');
    const prevBtn = adhdPanelEl.querySelector('[data-adaptn-prev]');
    const nextBtn = adhdPanelEl.querySelector('[data-adaptn-next]');
    const text = adhdBlocks[idx];
    if (contentEl) contentEl.textContent = typeof text === 'string' ? text : '';
    if (titleEl) titleEl.textContent = 'Part ' + (idx + 1) + ' of ' + adhdBlocks.length;
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === adhdBlocks.length - 1;
  }

  function openAdhdPanel(clickedBlock) {
    const blockNodes = getAllFocusableBlocks();
    LOG('openAdhdPanel: blocks.length=' + blockNodes.length + ', clickedBlock=', clickedBlock?.tagName);
    if (blockNodes.length === 0) {
      LOG('openAdhdPanel: no blocks, not opening panel');
      return;
    }
    closeAdhdPanel();
    /* Build flat list of parts: each paragraph split into sentences/chunks */
    var allParts = [];
    var partCountByBlock = [];
    for (var b = 0; b < blockNodes.length; b++) {
      var blockText = (blockNodes[b].textContent || '').trim();
      var parts = splitParagraphIntoParts(blockText);
      partCountByBlock.push(parts.length);
      for (var p = 0; p < parts.length; p++) allParts.push(parts[p]);
    }
    adhdBlocks = allParts;
    if (adhdBlocks.length === 0) return;
    var clickedIdx = blockNodes.indexOf(clickedBlock);
    if (clickedIdx < 0) clickedIdx = 0;
    var partStartIndex = 0;
    for (var i = 0; i < clickedIdx; i++) partStartIndex += partCountByBlock[i];
    adhdCurrentIndex = partStartIndex;

    adhdBackdropEl = document.createElement('div');
    adhdBackdropEl.className = 'adaptn-adhd-backdrop';
    adhdBackdropEl.setAttribute('aria-hidden', 'true');
    adhdBackdropEl.addEventListener('click', function () { closeAdhdPanel(); });

    adhdPanelEl = document.createElement('div');
    adhdPanelEl.className = 'adaptn-adhd-panel';
    adhdPanelEl.setAttribute('role', 'dialog');
    adhdPanelEl.setAttribute('aria-label', 'ADHD focus – one part at a time');
    adhdPanelEl.innerHTML =
      '<span class="adaptn-adhd-panel-title">Part ' + (adhdCurrentIndex + 1) + ' of ' + adhdBlocks.length + '</span>' +
      '<div class="adaptn-adhd-panel-content"></div>' +
      '<div class="adaptn-adhd-panel-nav">' +
      '<button type="button" data-adaptn-prev>← Previous</button>' +
      '<span class="adaptn-adhd-panel-title" style="margin:0;">Use ← → keys</span>' +
      '<button type="button" data-adaptn-next>Next →</button>' +
      '</div>' +
      '<button type="button" class="adaptn-adhd-panel-close" data-adaptn-close aria-label="Close">×</button>';
    var initialText = adhdBlocks[adhdCurrentIndex];
    adhdPanelEl.querySelector('.adaptn-adhd-panel-content').textContent = typeof initialText === 'string' ? initialText : '';

    adhdPanelEl.querySelector('[data-adaptn-close]').addEventListener('click', function () { closeAdhdPanel(); });
    adhdPanelEl.querySelector('[data-adaptn-prev]').addEventListener('click', function () {
      if (adhdCurrentIndex > 0) { adhdCurrentIndex--; updateAdhdPanelContent(); }
    });
    adhdPanelEl.querySelector('[data-adaptn-next]').addEventListener('click', function () {
      if (adhdCurrentIndex < adhdBlocks.length - 1) { adhdCurrentIndex++; updateAdhdPanelContent(); }
    });

    adhdPanelEl.addEventListener('click', function (e) { e.stopPropagation(); });

    document.body.appendChild(adhdBackdropEl);
    document.body.appendChild(adhdPanelEl);
    updateAdhdPanelContent();
    LOG('openAdhdPanel: panel opened, part ' + (adhdCurrentIndex + 1) + ' of ' + adhdBlocks.length);
  }

  function onAdhdPanelKeyDown(e) {
    if (!adhdPanelEl || !document.body.contains(adhdPanelEl)) return;
    if (e.key === 'Escape') { e.preventDefault(); closeAdhdPanel(); return; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (adhdCurrentIndex < adhdBlocks.length - 1) { adhdCurrentIndex++; updateAdhdPanelContent(); }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (adhdCurrentIndex > 0) { adhdCurrentIndex--; updateAdhdPanelContent(); }
    }
  }

  function applySettings(settings) {
    LOG('applySettings: enabled=' + !!settings?.enabled + ', modeAdhdFocus=' + !!settings?.modeAdhdFocus);
    if (!settings || settings.enabled === false) {
      ROOT.classList.remove('adaptn-enabled', 'adaptn-dyslexia', 'adaptn-lowvision', 'adaptn-adhd');
      ROOT.style.setProperty('--adaptn-font-scale', '1');
      ROOT.style.setProperty('--adaptn-letter-spacing-em', '0');
      ROOT.style.setProperty('--adaptn-line-height', '');
      closeAdhdPanel();
      return;
    }
    ROOT.classList.add('adaptn-enabled');
    ROOT.classList.toggle('adaptn-dyslexia', !!settings.modeDyslexia);
    ROOT.classList.toggle('adaptn-lowvision', !!settings.modeLowVision);
    ROOT.classList.toggle('adaptn-adhd', !!settings.modeAdhdFocus);
    ROOT.style.setProperty('--adaptn-font-scale', String(settings.fontScale ?? 1));
    ROOT.style.setProperty('--adaptn-letter-spacing-em', settings.modeDyslexia ? String(settings.letterSpacingEm ?? 0.12) + 'em' : '0');
    ROOT.style.setProperty('--adaptn-line-height', settings.modeDyslexia ? String(settings.lineHeight ?? 1.6) : '');
    if (!settings.modeAdhdFocus) {
      closeAdhdPanel();
    } else {
      var count = getAllFocusableBlocks().length;
      LOG('ADHD mode ON. Page has ' + count + ' focusable paragraph(s). Click one to open the reader.');
    }
  }

  function onDocumentClick(e) {
    const settings = window.__adaptnSettings;
    LOG('onDocumentClick: enabled=' + !!settings?.enabled + ', adhd=' + !!settings?.modeAdhdFocus + ', target=' + (e.target?.tagName));
    if (!settings?.enabled || !settings?.modeAdhdFocus) {
      LOG('onDocumentClick: skipped (extension or ADHD off)');
      return;
    }
    if (adhdPanelEl && adhdPanelEl.contains(e.target)) return;
    if (adhdBackdropEl && e.target === adhdBackdropEl) return;
    const block = findFocusableBlock(e.target);
    if (!block) {
      LOG('onDocumentClick: no focusable block, click ignored');
      return;
    }
    LOG('onDocumentClick: opening panel for block');
    e.preventDefault();
    e.stopPropagation();
    openAdhdPanel(block);
  }

  function onKeyDown(e) {
    if (adhdPanelEl && document.body.contains(adhdPanelEl)) {
      onAdhdPanelKeyDown(e);
      return;
    }
  }

  function loadAndApply() {
    chrome.storage.sync.get(STORAGE_KEYS, function (stored) {
      const settings = { ...getDefaults(), ...stored };
      window.__adaptnSettings = settings;
      applySettings(settings);
    });
  }

  document.addEventListener('click', onDocumentClick, true);
  document.addEventListener('keydown', onKeyDown, true);

  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName !== 'sync') return;
    chrome.storage.sync.get(STORAGE_KEYS, function (stored) {
      const settings = { ...getDefaults(), ...stored };
      window.__adaptnSettings = settings;
      applySettings(settings);
    });
  });

  chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
    if (msg.type === 'APPLY_SETTINGS') {
      loadAndApply();
      sendResponse({ ok: true });
    } else if (msg.type === 'CLEAR_FOCUS') {
      closeAdhdPanel();
      sendResponse({ ok: true });
    }
    return true;
  });

  loadAndApply();
})();
