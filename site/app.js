/* 사회과 수업자료 아카이브 — 화면 동작
   자료 내용은 data.js에서 고칩니다. 이 파일은 고칠 필요가 없습니다. */
(function () {
  'use strict';

  const CLASSIFICATION = typeof SUBJECT_CLASSIFICATION !== 'undefined' ? SUBJECT_CLASSIFICATION : [];
  const DIGITAL = typeof DIGITAL_MATERIALS !== 'undefined' ? DIGITAL_MATERIALS : [];
  const MATERIALS = (typeof ARCHIVE_MATERIALS !== 'undefined' ? ARCHIVE_MATERIALS : [])
    .slice()
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  const DIGITAL_PAGE_SIZE = 3;
  const state = { category: 'ALL', subject: 'ALL', dtype: 'ALL', dpage: 0, ftype: 'ALL', query: '' };

  const $ = (id) => document.getElementById(id);

  // 글자 안의 <, >, & , 따옴표를 안전하게 바꿔 화면에 그대로 보이게 함
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // 파일 이름 끝(확장자)으로 형식 정하기: .hwp/.hwpx → HWP, .ppt/.pptx → PPTX ...
  function fileTypeOf(item) {
    if (item.fileType) return String(item.fileType).toUpperCase();
    const ext = String(item.file || '').split('?')[0].split('.').pop().toLowerCase();
    if (ext === 'hwp' || ext === 'hwpx') return 'HWP';
    if (ext === 'ppt' || ext === 'pptx') return 'PPTX';
    if (ext === 'pdf') return 'PDF';
    if (ext === 'xls' || ext === 'xlsx') return 'XLSX';
    return '링크';
  }
  const fileNameOf = (item) => decodeURIComponent(String(item.file || '').split('?')[0].split('/').pop() || '');
  const isExternal = (url) => /^https?:\/\//.test(String(url || ''));

  /* ── 알림 ─────────────────────────────── */
  let toastTimer;
  function showToast(message) {
    const toast = $('toast');
    $('toast-message').textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 2800);
  }

  /* ── 필터 공통 ─────────────────────────── */
  const matchSubject = (item) =>
    (state.category === 'ALL' || item.category === state.category) &&
    (state.subject === 'ALL' || item.subject === state.subject);

  const countFor = (category, subject) =>
    DIGITAL.concat(MATERIALS).filter((it) => it.category === category && (!subject || it.subject === subject)).length;

  function filterLabel() {
    if (state.subject !== 'ALL') return state.category + ' · ' + state.subject;
    if (state.category !== 'ALL') return state.category + ' 전체';
    return '전체 과목';
  }

  function renderAll() {
    renderSubjects();
    renderDigital();
    renderArchive();
    $('subject-active-badge-text').textContent = filterLabel();
    $('archive-filter-status').textContent = filterLabel();
  }

  /* ── 과목별 분류 ───────────────────────── */
  function renderSubjects() {
    $('subject-classification-grid').innerHTML = CLASSIFICATION.map((group) => {
      const groupOn = state.category === group.category;
      const wholeOn = groupOn && state.subject === 'ALL';
      const items = group.subjects.map((subj) => {
        const on = state.subject === subj && groupOn;
        const n = countFor(group.category, subj);
        return `<li>
          <button type="button" data-category="${esc(group.category)}" data-subject="${esc(subj)}" aria-pressed="${on}"
            class="w-full text-left py-1.5 flex items-center justify-between gap-2 text-[14px] ${on ? 'font-bold text-ink' : 'text-body hover:text-ink'}">
            <span class="${on ? 'underline decoration-[1.5px] underline-offset-[5px]' : 'hover:underline underline-offset-[5px]'}">${esc(subj)}</span>
            <span class="text-[12px] ${n ? 'text-muted' : 'text-slate-400'}">${n}</span>
          </button>
        </li>`;
      }).join('');
      return `<div class="p-4 sm:p-5 ${groupOn ? 'bg-surface' : 'bg-white'}">
        <button type="button" data-category="${esc(group.category)}" aria-pressed="${wholeOn}"
          class="w-full text-left pb-3 mb-3 border-b border-line flex items-center justify-between gap-2 group">
          <span class="text-[15px] font-bold tracking-tight">${esc(group.category)}</span>
          <span class="text-[12px] ${wholeOn ? 'font-bold text-ink' : 'text-slate-500 group-hover:text-ink'}">${wholeOn ? '선택됨' : '전체'}</span>
        </button>
        <ul class="space-y-1">${items}</ul>
      </div>`;
    }).join('');
  }

  function selectCategory(category) {
    if (state.category === category && state.subject === 'ALL') state.category = 'ALL';
    else { state.category = category; state.subject = 'ALL'; }
    state.dpage = 0;
    renderAll();
  }

  function selectSubject(category, subject) {
    if (state.subject === subject && state.category === category) state.subject = 'ALL';
    else { state.category = category; state.subject = subject; }
    state.dpage = 0;
    renderAll();
  }

  function resetAll(withToast) {
    Object.assign(state, { category: 'ALL', subject: 'ALL', dtype: 'ALL', dpage: 0, ftype: 'ALL', query: '' });
    $('archive-search-input').value = '';
    renderAll();
    if (withToast) showToast('전체 과목과 전체 자료로 되돌렸습니다.');
  }

  /* ── 디지털 수업자료 ───────────────────── */
  // 원래 코드의 주제별 썸네일 그림 (svgKey: balance, mobility, compound, exchange, verdict, civic, 없으면 기본 그림)
    function getDigitalEditorialSVG(key) {
      switch (key) {
        case 'balance':
          return `
            <svg class="w-full h-full p-5" viewBox="0 0 320 180" fill="none">
              <line x1="160" y1="30" x2="160" y2="146" stroke="#142438" stroke-width="1.8" stroke-linecap="round"/>
              <line x1="116" y1="146" x2="204" y2="146" stroke="#142438" stroke-width="2" stroke-linecap="round"/>
              <line x1="74" y1="58" x2="246" y2="44" stroke="#142438" stroke-width="2" stroke-linecap="round"/>
              <circle cx="160" cy="51" r="5" fill="#142438"/>
              <rect x="46" y="76" width="56" height="32" rx="6" fill="#FFFFFF" stroke="#142438" stroke-width="1.5"/>
              <line x1="74" y1="58" x2="74" y2="76" stroke="#243B55" stroke-width="1.4"/>
              <rect x="218" y="62" width="56" height="32" rx="6" fill="#142438"/>
              <line x1="246" y1="44" x2="246" y2="62" stroke="#243B55" stroke-width="1.4"/>
              <line x1="58" y1="92" x2="90" y2="92" stroke="#142438" stroke-width="1.6" stroke-linecap="round"/>
              <line x1="230" y1="78" x2="262" y2="78" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          `;
        case 'mobility':
          return `
            <svg class="w-full h-full p-5" viewBox="0 0 320 180" fill="none">
              <rect x="48" y="26" width="96" height="128" rx="8" fill="#FFFFFF" stroke="#142438" stroke-width="1.5"/>
              <rect x="62" y="42" width="68" height="22" rx="4" fill="#142438"/>
              <rect x="62" y="76" width="68" height="22" rx="4" fill="#F4F6F9" stroke="#243B55" stroke-width="1.3"/>
              <rect x="62" y="110" width="68" height="22" rx="4" fill="#F4F6F9" stroke="#CBD5E1" stroke-width="1.3"/>
              <rect x="176" y="26" width="96" height="128" rx="8" fill="#FFFFFF" stroke="#142438" stroke-width="1.5"/>
              <rect x="190" y="42" width="68" height="22" rx="4" fill="#F4F6F9" stroke="#CBD5E1" stroke-width="1.3"/>
              <rect x="190" y="76" width="68" height="22" rx="4" fill="#243B55"/>
              <rect x="190" y="110" width="68" height="22" rx="4" fill="#F4F6F9" stroke="#CBD5E1" stroke-width="1.3"/>
              <path d="M144 53C160 53 160 87 176 87" stroke="#142438" stroke-width="1.8" stroke-linecap="round"/>
              <circle cx="176" cy="87" r="3.5" fill="#142438"/>
            </svg>
          `;
        case 'compound':
          return `
            <svg class="w-full h-full p-5" viewBox="0 0 320 180" fill="none">
              <rect x="44" y="24" width="232" height="132" rx="10" fill="#FFFFFF" stroke="#142438" stroke-width="1.5"/>
              <line x1="74" y1="134" x2="248" y2="134" stroke="#142438" stroke-width="1.5"/>
              <line x1="74" y1="44" x2="74" y2="134" stroke="#142438" stroke-width="1.5"/>
              <path d="M84 124Q154 114 236 48" stroke="#142438" stroke-width="2.2" fill="none" stroke-linecap="round"/>
              <line x1="84" y1="124" x2="236" y2="96" stroke="#64748B" stroke-width="1.5" stroke-dasharray="4 4"/>
              <circle cx="236" cy="48" r="4.5" fill="#142438"/>
              <circle cx="236" cy="96" r="4" fill="#FFFFFF" stroke="#64748B" stroke-width="1.5"/>
            </svg>
          `;
        case 'exchange':
          return `
            <svg class="w-full h-full p-5" viewBox="0 0 320 180" fill="none">
              <rect x="44" y="24" width="232" height="132" rx="10" fill="#FFFFFF" stroke="#142438" stroke-width="1.5"/>
              <line x1="78" y1="42" x2="78" y2="136" stroke="#142438" stroke-width="1.5"/>
              <line x1="78" y1="136" x2="244" y2="136" stroke="#142438" stroke-width="1.5"/>
              <path d="M94 52L224 124" stroke="#142438" stroke-width="1.9" stroke-linecap="round"/>
              <path d="M94 124L224 52" stroke="#243B55" stroke-width="1.6" stroke-dasharray="4 4" stroke-linecap="round"/>
              <circle cx="159" cy="88" r="5.5" fill="#142438"/>
              <circle cx="159" cy="88" r="11" stroke="#243B55" stroke-opacity="0.35" stroke-width="1.4"/>
            </svg>
          `;
        case 'verdict':
          return `
            <svg class="w-full h-full p-5" viewBox="0 0 320 180" fill="none">
              <rect x="64" y="22" width="192" height="136" rx="8" fill="#FFFFFF" stroke="#142438" stroke-width="1.5"/>
              <rect x="84" y="38" width="68" height="14" rx="3" fill="#142438"/>
              <line x1="84" y1="68" x2="236" y2="68" stroke="#CBD5E1" stroke-width="1.5"/>
              <line x1="84" y1="84" x2="220" y2="84" stroke="#CBD5E1" stroke-width="1.5"/>
              <rect x="84" y="102" width="152" height="38" rx="6" fill="#F4F6F9" stroke="#243B55" stroke-width="1.3"/>
              <line x1="98" y1="116" x2="188" y2="116" stroke="#142438" stroke-width="1.6" stroke-linecap="round"/>
              <line x1="98" y1="127" x2="156" y2="127" stroke="#64748B" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          `;
        case 'civic':
          return `
            <svg class="w-full h-full p-5" viewBox="0 0 320 180" fill="none">
              <rect x="96" y="64" width="128" height="84" rx="8" fill="#FFFFFF" stroke="#142438" stroke-width="1.5"/>
              <line x1="126" y1="82" x2="194" y2="82" stroke="#142438" stroke-width="2" stroke-linecap="round"/>
              <rect x="134" y="32" width="52" height="44" rx="4" fill="#142438"/>
              <path d="M149 54L157 62L173 46" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
        default:
          return `
            <svg class="w-full h-full p-5" viewBox="0 0 320 180" fill="none">
              <rect x="46" y="24" width="228" height="132" rx="10" fill="#FFFFFF" stroke="#142438" stroke-width="1.5"/>
              <rect x="82" y="92" width="22" height="36" rx="3" fill="#CBD5E1"/>
              <rect x="116" y="72" width="22" height="56" rx="3" fill="#243B55"/>
              <rect x="150" y="52" width="22" height="76" rx="3" fill="#142438"/>
              <circle cx="220" cy="84" r="22" fill="#F4F6F9" stroke="#142438" stroke-width="1.5"/>
              <polygon points="215,76 230,84 215,92" fill="#142438"/>
            </svg>
          `;
      }
    }

  // 썸네일: images 폴더의 화면 캡처가 있으면 그 사진, 없으면 원래의 주제별 그림
  function thumbHtml(item) {
    if (item.thumb) {
      return `<img src="${esc(item.thumb)}" alt="${esc(item.title)} 화면" loading="lazy" class="w-full h-full object-cover" />`;
    }
    return getDigitalEditorialSVG(item.svgKey);
  }

  function renderDigital() {
    document.querySelectorAll('.digital-type-btn').forEach((btn) => {
      const on = btn.dataset.dtype === state.dtype;
      btn.setAttribute('aria-pressed', String(on));
      btn.className = 'digital-type-btn pb-0.5 border-b-2 ' + (on ? 'font-bold text-ink border-ink' : 'font-medium text-muted hover:text-ink border-transparent');
    });

    const list = DIGITAL.filter((it) => matchSubject(it) && (state.dtype === 'ALL' || it.type === state.dtype));
    const pages = Math.max(1, Math.ceil(list.length / DIGITAL_PAGE_SIZE));
    state.dpage = Math.min(Math.max(state.dpage, 0), pages - 1);

    const prev = $('digital-prev-btn');
    const next = $('digital-next-btn');
    prev.disabled = state.dpage === 0;
    next.disabled = state.dpage >= pages - 1;
    [prev, next].forEach((b) => b.classList.toggle('opacity-40', b.disabled));
    $('digital-page-indicator').textContent = `${state.dpage + 1} / ${pages}`;

    const grid = $('digital-thumbnails-grid');
    if (!list.length) {
      const none = DIGITAL.length === 0;
      grid.innerHTML = `<div class="col-span-1 sm:col-span-3 py-12 px-6 rounded-[14px] bg-surface border border-line text-center">
        <p class="text-[15px] font-bold">${none ? '첫 디지털 수업자료를 준비하고 있습니다.' : '조건에 맞는 디지털 수업자료가 없습니다.'}</p>
        <p class="mt-1 text-[13.5px] text-muted">${none ? '웹앱·영상·게임을 수업에 써 본 뒤 이곳에 올립니다.' : '유형이나 과목 선택을 바꿔 보세요.'}</p>
      </div>`;
      return;
    }

    const start = state.dpage * DIGITAL_PAGE_SIZE;
    grid.innerHTML = list.slice(start, start + DIGITAL_PAGE_SIZE).map((it) => `
      <article class="flex flex-col">
        <button type="button" data-digital="${esc(it.id)}" class="group text-left flex flex-col">
          <span class="aspect-video w-full rounded-[12px] thumb-schematic-surface border border-line group-hover:border-ink transition-colors overflow-hidden relative flex items-center justify-center">
            ${thumbHtml(it)}
            <span class="absolute top-3 left-3 px-2.5 py-0.5 rounded bg-ink text-white text-[11.5px] font-bold">${esc(it.type)}</span>
          </span>
          <span class="mt-3.5 text-[12.5px] font-medium text-muted">${esc(it.category)} · <span class="text-ink font-bold">${esc(it.subject)}</span></span>
          <span class="mt-1 text-[16px] font-bold group-hover:underline underline-offset-4 decoration-[1.5px]">${esc(it.title)}</span>
          <span class="mt-1.5 text-[13.5px] text-body leading-[1.6] line-clamp-2">${esc(it.summary)}</span>
        </button>
      </article>`).join('');
  }

  /* ── 수업자료 목록 ─────────────────────── */
  function renderArchive() {
    document.querySelectorAll('.archive-ftype-btn').forEach((btn) => {
      const on = btn.dataset.ftype === state.ftype;
      btn.setAttribute('aria-pressed', String(on));
      btn.className = 'archive-ftype-btn ' + (on ? 'font-bold text-ink underline decoration-2 underline-offset-[6px]' : 'font-medium text-muted hover:text-ink');
    });

    const q = state.query.trim().toLowerCase();
    const list = MATERIALS.filter((it) => {
      if (!matchSubject(it)) return false;
      if (state.ftype !== 'ALL' && fileTypeOf(it) !== state.ftype) return false;
      if (!q) return true;
      return [it.title, it.subject, it.unit, it.shortUnit, it.summary].join(' ').toLowerCase().includes(q);
    });

    $('archive-result-count').textContent = String(list.length);
    const rows = $('archive-list-rows');
    const empty = $('archive-empty-state');

    if (!list.length) {
      rows.innerHTML = '';
      empty.classList.remove('hidden');
      const none = MATERIALS.length === 0;
      $('archive-empty-title').textContent = none ? '첫 수업자료를 준비하고 있습니다.' : '조건에 맞는 수업자료가 없습니다.';
      $('archive-empty-desc').textContent = none ? '수업에 적용해 본 자료부터 차례로 올립니다.' : '검색어를 지우거나 과목·파일 형식을 전체로 바꿔 보세요.';
      $('archive-empty-reset').classList.toggle('hidden', none);
      return;
    }
    empty.classList.add('hidden');

    rows.innerHTML = list.map((it) => `
      <li class="py-4 px-2 flex items-center justify-between gap-4 hover:bg-surface transition-colors">
        <div class="flex items-center gap-3.5 min-w-0 flex-1">
          <span class="w-12 shrink-0 text-center py-1 rounded bg-surface border border-line text-[11.5px] font-bold tracking-wide">${esc(fileTypeOf(it))}</span>
          <span class="w-36 sm:w-44 shrink-0 text-[13px] truncate">
            <span class="font-bold">${esc(it.subject)}</span><span class="text-slate-400 mx-1" aria-hidden="true">·</span><span class="text-muted">${esc(it.shortUnit)}</span>
          </span>
          <button type="button" data-material="${esc(it.id)}" class="text-left text-[15px] font-medium hover:underline underline-offset-4 truncate" title="${esc(it.title)}">${esc(it.title)}</button>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" data-material="${esc(it.id)}" class="px-4 py-2 rounded-full bg-ink hover:bg-ink-2 text-white text-[13px] font-bold transition-colors whitespace-nowrap">수업자료</button>
          ${it.blogUrl
            ? `<a href="${esc(it.blogUrl)}" target="_blank" rel="noopener" class="px-4 py-2 rounded-full border border-ink bg-white hover:bg-surface text-[13px] font-bold transition-colors whitespace-nowrap">블로그 기록<span class="sr-only"> (새 창)</span></a>`
            : ''}
        </div>
      </li>`).join('');
  }

  /* ── 팝업 ─────────────────────────────── */
  let lastFocus = null;
  let openModalEl = null;

  function openModal(id) {
    lastFocus = document.activeElement;
    openModalEl = $(id);
    openModalEl.classList.remove('hidden');
    openModalEl.classList.add('flex');
    document.body.style.overflow = 'hidden';
    openModalEl.querySelector('[data-close]').focus();
  }

  function closeModal() {
    if (!openModalEl) return;
    openModalEl.classList.add('hidden');
    openModalEl.classList.remove('flex');
    openModalEl = null;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  let currentMaterial = null;
  function openMaterial(id) {
    const it = MATERIALS.find((m) => String(m.id) === String(id));
    if (!it) return;
    currentMaterial = it;
    $('m-modal-category').textContent = it.category || '';
    $('m-modal-subject').textContent = it.subject || '';
    $('m-modal-unit').textContent = it.unit || it.shortUnit || '';
    $('m-modal-filetype').textContent = fileTypeOf(it);
    $('m-modal-title').textContent = it.title || '';
    $('m-modal-summary').textContent = it.summary || '';
    $('m-modal-filename').textContent = fileNameOf(it) || '(파일 준비 중)';
    $('m-modal-meta').textContent = it.meta || '';
    $('m-modal-meta-row').classList.toggle('hidden', !it.meta);

    const dl = $('m-modal-download');
    if (it.file) {
      dl.href = it.file;
      dl.classList.remove('hidden');
      if (isExternal(it.file)) { dl.target = '_blank'; dl.rel = 'noopener'; dl.removeAttribute('download'); }
      else { dl.removeAttribute('target'); dl.setAttribute('download', fileNameOf(it)); }
    } else {
      dl.classList.add('hidden');
    }

    const blog = $('m-modal-blog');
    blog.classList.toggle('hidden', !it.blogUrl);
    if (it.blogUrl) blog.href = it.blogUrl;

    openModal('material-modal');
  }

  function copyMaterialInfo() {
    if (!currentMaterial) return;
    const link = currentMaterial.file ? new URL(currentMaterial.file, location.href).href : location.href;
    const text = `[사회과 수업자료 아카이브] ${currentMaterial.subject} - ${currentMaterial.title}\n${link}`;
    const done = () => showToast('자료 안내를 복사했습니다.');
    const fail = () => showToast('복사하지 못했습니다. 주소창의 주소를 직접 복사해 주세요.');
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fail);
    else {
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
        done();
      } catch (e) { fail(); }
    }
  }

  function openDigital(id) {
    const it = DIGITAL.find((d) => String(d.id) === String(id));
    if (!it) return;
    $('d-modal-type').textContent = it.type || '';
    $('d-modal-category').textContent = it.category || '';
    $('d-modal-subject').textContent = it.subject || '';
    $('d-modal-title').textContent = it.title || '';
    $('d-modal-thumb').innerHTML = thumbHtml(it);
    $('d-modal-desc').textContent = it.desc || it.summary || '';
    $('d-modal-env').textContent = it.env || '';
    const launch = $('d-modal-launch');
    launch.classList.toggle('hidden', !it.url);
    if (it.url) launch.href = it.url;
    openModal('digital-modal');
  }

  /* ── 헤더 메뉴: 지금 보고 있는 구역에 밑줄 ── */
  function setupNavHighlight() {
    const links = Array.from(document.querySelectorAll('.nav-link'));
    const setActive = (id) => links.forEach((a) => {
      const on = a.dataset.nav === id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    if (!('IntersectionObserver' in window)) return;
    const visible = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      let best = null; let bestRatio = 0;
      links.forEach((a) => { const r = visible.get(a.dataset.nav) || 0; if (r > bestRatio) { best = a.dataset.nav; bestRatio = r; } });
      if (best) setActive(best);
    }, { rootMargin: '-80px 0px -45% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
    links.forEach((a) => { const sec = $(a.dataset.nav); if (sec) io.observe(sec); });
  }

  /* ── 푸터 영역 바로가기 ─────────────────── */
  function renderFooter() {
    $('footer-categories').innerHTML = CLASSIFICATION.map((g, i) =>
      `${i ? '<span class="text-slate-300" aria-hidden="true">|</span>' : ''}<button type="button" data-jump="${esc(g.category)}" class="hover:text-ink hover:underline underline-offset-4">${esc(g.category)}</button>`
    ).join('');
  }

  /* ── 클릭 한곳에서 처리 ─────────────────── */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, a');
    if (!t) {
      if (openModalEl && e.target === openModalEl) closeModal();
      return;
    }
    if (t.hasAttribute('data-close')) return closeModal();
    if (t.dataset.action === 'reset') return resetAll(true);
    if (t.id === 'home-link') { e.preventDefault(); resetAll(false); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (t.dataset.subject !== undefined && t.dataset.category) return selectSubject(t.dataset.category, t.dataset.subject);
    if (t.dataset.category) return selectCategory(t.dataset.category);
    if (t.dataset.dtype) { state.dtype = t.dataset.dtype; state.dpage = 0; return renderDigital(); }
    if (t.dataset.ftype) { state.ftype = t.dataset.ftype; return renderArchive(); }
    if (t.id === 'digital-prev-btn') { state.dpage -= 1; return renderDigital(); }
    if (t.id === 'digital-next-btn') { state.dpage += 1; return renderDigital(); }
    if (t.dataset.digital) return openDigital(t.dataset.digital);
    if (t.dataset.material) return openMaterial(t.dataset.material);
    if (t.id === 'm-modal-copy') return copyMaterialInfo();
    if (t.dataset.jump) {
      state.category = t.dataset.jump; state.subject = 'ALL'; state.dpage = 0;
      renderAll();
      $('subjects').scrollIntoView({ behavior: 'smooth' });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!openModalEl) return;
    if (e.key === 'Escape') return closeModal();
    if (e.key === 'Tab') {
      const focusables = Array.from(openModalEl.querySelectorAll('a:not(.hidden), button:not(.hidden)')).filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0]; const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  $('archive-search-input').addEventListener('input', (e) => { state.query = e.target.value; renderArchive(); });

  renderFooter();
  renderAll();
  setupNavHighlight();
})();
