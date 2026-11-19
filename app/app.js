// Trophy Atlas — guide & tracker for the 55 GTA VI PS5 trophies.
// Plain browser script: loads data/trophies.json from its own folder, keeps progress
// in localStorage, and never asks the network for anything else.

const STORAGE_KEY = 'trophy-atlas-gta6-v1';
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const GRADE_TOTALS = { platinum: 1, gold: 2, silver: 6, bronze: 46 };

// The platinum roadmap: stages in the order a first playthrough should meet them.
// Each entry is [trophy id, short note]. Built from the official descriptions:
// story chapters and named missions first, character lines as they open, then the
// counted collectibles and activities, a crime-and-money cleanup, and 100% last.
const ROADMAP_STAGES = [
  {
    title: 'Stage 1 · Chapter 1 — Leonida Keys & Port Gellhorn',
    sub: 'Learn both protagonists. Do Lucia\u2019s balcony meditation at Jason\u2019s house the morning after Down to Earth — it feeds the game\u2019s only missable trophy and is gone when Chapter 1 ends. Meet Cal (fishing) and Kenton (shipwrecks) here; their lines finish much later.',
    items: [[2, 'opening mission: Gone Fishing'], [3, 'finish Chapter 1'], [28, 'MISSABLE — start the 18 meditation spots here']],
  },
  {
    title: 'Stage 2 · Chapter 2 — Jason & Lucia together',
    sub: 'Coffee Break puts both characters in free roam together, which unlocks every partner trophy. The Real Estate app (garages) and Moses\u2019 Scooter Bros app also open in this chapter.',
    items: [[4, 'finish Chapter 2'], [8, 'mission: Breakfast Run']],
  },
  {
    title: 'Stage 3 · Chapter 3 — Vice City opens up',
    sub: 'Yasmani\u2019s Jewelry Jobs hand you the Snap Gun (stealth robberies), Credit Check earns the Dye Pack Jammer (laundering), and the Andy, Randy and Tyrone lines all start here.',
    items: [[5, 'finish Chapter 3'], [9, 'mission: The Cartel Heist']],
  },
  {
    title: 'Stage 4 · Chapter 4 — Heists and takedowns',
    sub: 'The optional mission That\u2019s Where The Money Is\u2026 opens bank-vault robberies, the backbone of the money trophies in Stage 9.',
    items: [[6, 'finish Chapter 4'], [10, 'mission: Child\u2019s Play'], [11, 'mission: Headliners'], [12, 'mission: VCIA Takedown']],
  },
  {
    title: 'Stage 5 · Chapter 5 & the finale',
    sub: 'Keep a manual save before the final mission — there is no mission replay. Free roam continues after the credits, so everything left can be cleaned up on the same save.',
    items: [[13, 'mission: Operation Savage Glory'], [7, 'the final mission (gold)']],
  },
  {
    title: 'Stage 6 · Character lines & strangers',
    sub: 'Finish every named character\u2019s last mission and eight stranger strands. None of these are missable — they wait for you after the story — but they are long, so chip away between chapters.',
    items: [[22, 'Andy\u2019s final mission (Lucia, from Ch.3)'], [23, 'Kenton\u2019s final mission (from Ch.1)'], [24, 'Billy\u2019s final mission (from Ch.2)'], [26, 'Randy\u2019s final mission — 16 Wish List cars'], [27, 'Tyrone\u2019s final mission (Jason, from Ch.3)'], [29, 'hunt a unique animal for Bret'], [25, '8 stranger mission strands (silver)']],
  },
  {
    title: 'Stage 7 · Collectibles & exploration',
    sub: 'The counted hunts. Scan as you travel: WAiNK spots and vehicles register in seconds, and a plane clears the map fog fastest.',
    items: [[30, 'complete 3 Collectible Card sets (silver)'], [31, 'WAiNK It at 100 locations (silver)'], [35, 'discover 100 vehicles'], [42, 'explore all of Leonida'], [28, 'finish all 18 meditation spots']],
  },
  {
    title: 'Stage 8 · Activities & challenges',
    sub: 'Ranges, races, stunts and the activity sampler. Gold medals at the ranges also build the Focus that Gunslinger needs.',
    items: [[17, 'gold in all 42 Shooting Range challenges (silver)'], [15, 'complete 250 Stunts (silver)'], [18, 'win a drone race at all 14 locations'], [19, 'win 20 different races'], [16, 'try each of the 9 activity types once'], [20, 'beat Cal in a fishing challenge'], [21, 'complete an arcade game'], [32, 'complete 50 Challenges']],
  },
  {
    title: 'Stage 9 · Crime, money & one-off moments',
    sub: 'Robberies first (they fund everything else), partner jobs while you are wanted, then the strange little one-offs and the spending totals.',
    items: [[40, 'rob 5 Bank Vaults and escape (silver)'], [41, 'rob an Armored Truck and escape'], [39, 'rob a jewelry store unseen'], [43, 'rob one operation of each of the 9 gangs'], [52, 'launder $250,000 of Marked Bills'], [33, 'lose 4 stars with your partner'], [34, 'rob 3 shops back-to-back, still wanted'], [36, '5 takedowns in one Combat Focus'], [37, 'steal a docked jet at VCIA'], [38, 'steal a Rhino tank at Mile Zero'], [46, 'clean out Kingpin Bowling, Port Gellhorn'], [44, 'a cocktail with a view on Ocean Beach'], [45, 'smash out of a showroom window'], [47, 'max Strength for Jason and Lucia'], [48, '500 Criminal Profile actions'], [49, 'succeed on a second try'], [50, 'witness something strange'], [51, 'melee drive-by knockdown'], [53, 'spend $100,000 across all shops'], [54, 'buy all 8 garage properties'], [55, 'register 10 vehicles to Scooter Bros']],
  },
  {
    title: 'Stage 10 · 100% and the platinum',
    sub: 'Open Progress > Stats > 100% Completion and work the in-game checklist down — it asks for a share of most systems, not all of everything. When the last of the 54 pops, the platinum follows on its own.',
    items: [[14, 'attain 100% Completion (gold)'], [1, 'Vice Got a Price! — earn the other 54']],
  },
];

const els = {
  list: document.getElementById('trophy-list'),
  roadmap: document.getElementById('roadmap'),
  detail: document.getElementById('detail'),
  search: document.getElementById('search'),
  status: document.getElementById('status-line'),
  spoiler: document.getElementById('spoiler-toggle'),
  progressCount: document.getElementById('progress-count'),
  progressPct: document.getElementById('progress-pct'),
  progressFill: document.getElementById('progress-fill'),
};

const params = new URLSearchParams(location.search);
const state = {
  trophies: [],
  byId: new Map(),
  earned: new Set(),
  spoilers: true,
  view: params.get('view') === 'roadmap' ? 'roadmap' : 'guide',
  kind: params.get('filter') || 'all',
  earnedFilter: 'all',
  query: '',
  selectedId: null,
};

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) state.earned = new Set(saved.earned);
    if (typeof saved.spoilers === 'boolean') state.spoilers = saved.spoilers;
  } catch { /* a corrupt save simply starts fresh */ }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...state.earned], spoilers: state.spoilers }));
}

function isMasked(trophy) {
  return state.spoilers && trophy.kind === 'story' && !state.earned.has(trophy.id);
}

function displayName(trophy) {
  return isMasked(trophy) ? 'Hidden story trophy' : trophy.name;
}

function displayDesc(trophy) {
  return isMasked(trophy) ? 'Name and description stay hidden until you earn it — or switch the spoiler shield off.' : trophy.description;
}

function matchesFilters(trophy) {
  if (state.kind !== 'all' && trophy.kind !== state.kind && !(state.kind === 'missable' && trophy.missable)) return false;
  if (state.earnedFilter === 'earned' && !state.earned.has(trophy.id)) return false;
  if (state.earnedFilter === 'unearned' && state.earned.has(trophy.id)) return false;
  if (state.query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind}`.toLowerCase();
    if (!hay.includes(state.query)) return false;
  }
  return true;
}

function badge(text, cls) {
  const span = document.createElement('span');
  span.className = `badge ${cls}`;
  span.textContent = text;
  return span;
}

function renderProgress() {
  const total = state.trophies.length;
  const done = state.earned.size;
  els.progressCount.textContent = `${done} / ${total} earned`;
  const pct = total ? Math.round((done / total) * 100) : 0;
  els.progressPct.textContent = `${pct}%`;
  els.progressFill.style.width = `${pct}%`;
  for (const grade of Object.keys(GRADE_TOTALS)) {
    const got = state.trophies.filter((t) => t.grade === grade && state.earned.has(t.id)).length;
    document.getElementById(`gc-${grade}`).textContent = `${got}/${GRADE_TOTALS[grade]}`;
  }
}

function renderList() {
  els.list.replaceChildren();
  const shown = state.trophies.filter(matchesFilters);
  if (state.kind === 'online') {
    const note = document.createElement('div');
    note.className = 'empty-note';
    note.innerHTML = '<strong>No online trophies.</strong> The base list is entirely single-player — every one of the 55 can be earned offline in the story world, so this filter has nothing to show.';
    els.list.append(note);
    return;
  }
  if (!shown.length) {
    const note = document.createElement('div');
    note.className = 'empty-note';
    note.textContent = 'No trophies match the current filters. Loosen the search or pick another filter.';
    els.list.append(note);
    return;
  }
  if (state.kind === 'missable') {
    const info = document.createElement('div');
    info.className = 'empty-note';
    const storyCount = state.trophies.filter((t) => t.kind === 'story').length;
    info.innerHTML = `<strong>Exactly one missable trophy in the whole game.</strong> Everything else on the list can still be earned after the story — free roam continues and no other trophy has a closing window. Protect this run three ways: (1) do the Chapter 1 balcony meditation before the chapter ends, (2) keep a manual save at the start of every chapter and one before the final mission — there is no mission replay, (3) leave cheats off, since a cheat disables trophies and saving. Meanwhile the spoiler shield is ${state.spoilers ? `<strong>ON</strong>: all ${storyCount} story trophies are masked as “Hidden story trophy” in the full checklist until you earn each one` : 'OFF: story trophy names and descriptions are currently visible'}.`;
    els.list.append(info);
  }
  for (const trophy of shown) {
    const row = document.createElement('div');
    row.className = 'trophy-row';
    if (state.earned.has(trophy.id)) row.classList.add('is-earned');
    if (state.selectedId === trophy.id) row.classList.add('is-selected');
    if (isMasked(trophy)) row.classList.add('masked');
    row.setAttribute('role', 'button');
    row.tabIndex = 0;

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.has(trophy.id);
    box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
    box.addEventListener('click', (ev) => ev.stopPropagation());
    box.addEventListener('change', () => toggleEarned(trophy.id, box.checked));

    const main = document.createElement('div');
    main.className = 'row-main';
    const name = document.createElement('div');
    name.className = 'row-name';
    name.textContent = displayName(trophy);
    const desc = document.createElement('div');
    desc.className = 'row-desc';
    desc.textContent = displayDesc(trophy);
    const meta = document.createElement('div');
    meta.className = 'row-meta';
    meta.append(badge(trophy.grade, `grade-${trophy.grade}`));
    meta.append(badge(trophy.kind, 'kind'));
    if (trophy.missable) meta.append(badge('Missable', 'missable'));
    if (trophy.hidden) meta.append(badge('Hidden on PSN', 'hidden-t'));
    if (trophy.count) meta.append(badge(`Count: ${trophy.count}`, 'count'));
    main.append(name, desc, meta);

    const side = document.createElement('div');
    side.className = 'row-side';
    const stage = document.createElement('span');
    stage.className = 'stage';
    stage.textContent = `Roadmap stage ${trophy.roadmapStage}`;
    side.append(stage);
    if (state.earned.has(trophy.id)) {
      const mark = document.createElement('span');
      mark.className = 'done-mark';
      mark.textContent = 'Earned ✓';
      side.append(mark);
    }

    row.append(box, main, side);
    row.addEventListener('click', () => selectTrophy(trophy.id));
    row.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') selectTrophy(trophy.id); });
    els.list.append(row);
  }
}

function renderRoadmap() {
  els.roadmap.replaceChildren();
  const intro = document.createElement('div');
  intro.className = 'road-intro';
  const h = document.createElement('h2');
  h.textContent = 'Roadmap to the platinum — one playthrough, about 200 hours';
  intro.append(h);
  const facts = [
    'No online trophies, no difficulty trophies, and no mission replay: play the story once, keep a manual save at the start of each chapter and one before the final mission, and clean up in free roam afterwards.',
    'Exactly one trophy is missable: Positive Mental Attitude. Its first meditation spot — Lucia\u2019s balcony meditation in Chapter 1 — disappears when the chapter ends.',
    'Leave cheats off for the whole run: turning one on disables trophies and saving.',
  ];
  for (const fact of facts) {
    const p = document.createElement('p');
    p.textContent = fact;
    intro.append(p);
  }
  els.roadmap.append(intro);

  for (const stage of ROADMAP_STAGES) {
    const card = document.createElement('section');
    card.className = 'stage-card';
    const title = document.createElement('h3');
    title.textContent = stage.title;
    const sub = document.createElement('p');
    sub.className = 'stage-sub';
    sub.textContent = stage.sub;
    const list = document.createElement('ul');
    list.className = 'stage-list';
    let doneCount = 0;
    for (const [id, note] of stage.items) {
      const trophy = state.byId.get(id);
      if (!trophy) continue;
      const li = document.createElement('li');
      if (state.earned.has(id)) { li.classList.add('is-done'); doneCount += 1; }
      const nm = document.createElement('span');
      nm.className = 'st-name';
      nm.textContent = state.earned.has(id) ? `✓ ${trophy.name}` : trophy.name;
      const nt = document.createElement('span');
      nt.className = 'st-note';
      nt.textContent = `— ${note}`;
      li.append(nm, nt);
      li.addEventListener('click', () => selectTrophy(id));
      li.style.cursor = 'pointer';
      list.append(li);
    }
    const prog = document.createElement('p');
    prog.className = 'stage-progress';
    prog.textContent = `${doneCount} / ${stage.items.length} done in this stage`;
    card.append(title, sub, list, prog);
    els.roadmap.append(card);
  }
}

function renderDetail() {
  els.detail.replaceChildren();
  const trophy = state.byId.get(state.selectedId) || state.trophies[0];
  if (!trophy) return;
  const masked = isMasked(trophy);

  const badges = document.createElement('div');
  badges.className = 'detail-badges';
  badges.append(badge(trophy.grade, `grade-${trophy.grade}`));
  badges.append(badge(`Kind: ${trophy.kind}`, 'kind'));
  if (trophy.hidden) badges.append(badge('Hidden on PlayStation until earned', 'hidden-t'));
  if (trophy.count) badges.append(badge(`Tracked count: ${trophy.count}`, 'count'));
  badges.append(badge(`Roadmap stage ${trophy.roadmapStage}`, 'kind'));
  els.detail.append(badges);

  const h2 = document.createElement('h2');
  h2.textContent = displayName(trophy);
  const desc = document.createElement('p');
  desc.className = 'official-desc';
  desc.textContent = displayDesc(trophy);
  els.detail.append(h2, desc);

  if (trophy.missable) {
    const warn = document.createElement('div');
    warn.className = 'warn-box';
    const strong = document.createElement('strong');
    strong.textContent = 'MISSABLE — the only one in the game. ';
    warn.append(strong, document.createTextNode(trophy.missableNote || ''));
    els.detail.append(warn);
  }

  if (state.kind === 'missable') {
    const shield = document.createElement('div');
    shield.className = 'shield-note';
    shield.textContent = state.spoilers
      ? `Spoiler shield is ON: the ${state.trophies.filter((t) => t.kind === 'story').length} story trophies show as \u201cHidden story trophy\u201d in the checklist until you earn each one. Positive Mental Attitude is not a story trophy, so it stays readable — plan Chapter 1 around it.`
      : 'Spoiler shield is OFF: story trophy names and descriptions are visible. Turn it back on in the toolbar if you want them hidden until earned.';
    els.detail.append(shield);
  }

  const guideH = document.createElement('h3');
  guideH.textContent = 'Guide — in this atlas\u2019 own words';
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = masked
    ? 'This is a story trophy: finish the mission named in its official description and it pops on its own. Its name and description stay under the spoiler shield until you earn it.'
    : trophy.guide;
  els.detail.append(guideH, guide);

  if (trophy.hidden) {
    const note = document.createElement('p');
    note.className = 'sources';
    note.textContent = 'PlayStation hides this trophy\u2019s name and description until it is earned; this atlas shows them so you can plan around them.';
    els.detail.append(note);
  }

  const srcH = document.createElement('h3');
  srcH.textContent = 'Sources';
  const srcList = document.createElement('ul');
  srcList.className = 'sources';
  for (const source of trophy.sources || []) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = source.url;
    a.textContent = source.name;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    li.append(a, document.createTextNode(` — ${source.url}`));
    srcList.append(li);
  }
  els.detail.append(srcH, srcList);

  const actions = document.createElement('div');
  actions.className = 'detail-actions';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'tool-btn';
  const isDone = state.earned.has(trophy.id);
  toggle.textContent = isDone ? 'Earned ✓ — tap to undo' : 'Mark as earned';
  if (isDone) toggle.classList.add('is-active');
  toggle.addEventListener('click', () => toggleEarned(trophy.id, !state.earned.has(trophy.id)));
  actions.append(toggle);
  els.detail.append(actions);
}

function render() {
  renderProgress();
  const roadmapOn = state.view === 'roadmap';
  els.list.hidden = roadmapOn;
  els.roadmap.hidden = !roadmapOn;
  document.getElementById('view-guide').classList.toggle('is-active', !roadmapOn);
  document.getElementById('view-roadmap').classList.toggle('is-active', roadmapOn);
  if (roadmapOn) renderRoadmap(); else renderList();
  renderDetail();
}

function selectTrophy(id) {
  state.selectedId = id;
  render();
}

function toggleEarned(id, on) {
  if (on) state.earned.add(id); else state.earned.delete(id);
  persist();
  render();
}

function setStatus(message) {
  els.status.textContent = message;
}

function exportProgress() {
  const payload = {
    app: 'trophy-atlas-gta6',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: state.trophies.filter((t) => state.earned.has(t.id)).map((t) => t.name),
    spoilers: state.spoilers,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(url);
  setStatus(`Exported ${payload.earned.length} earned trophies to gta6-trophy-progress.json.`);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      const data = JSON.parse(String(reader.result));
      const names = new Set(Array.isArray(data.earned) ? data.earned : []);
      state.earned = new Set(state.trophies.filter((t) => names.has(t.name)).map((t) => t.id));
      if (typeof data.spoilers === 'boolean') {
        state.spoilers = data.spoilers;
        els.spoiler.checked = data.spoilers;
      }
      persist();
      render();
      setStatus(`Imported progress: ${state.earned.size} trophies marked earned.`);
    } catch {
      setStatus('That file could not be read as a Trophy Atlas export.');
    }
  });
  reader.readAsText(file);
}

function applyDemoProgress() {
  // A starter spread for screenshots and first-run demos: the opening of Chapter 1
  // done, the 100% gold and two range/stunt silvers under way, nothing late-game.
  for (const id of [2, 3, 14, 15, 17, 20, 21, 35, 53]) state.earned.add(id);
}

function wireControls() {
  document.getElementById('view-guide').addEventListener('click', () => { state.view = 'guide'; render(); });
  document.getElementById('view-roadmap').addEventListener('click', () => { state.view = 'roadmap'; render(); });
  document.getElementById('kind-filters').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-kind]');
    if (!btn) return;
    state.kind = btn.dataset.kind;
    state.view = 'guide';
    for (const chip of document.querySelectorAll('#kind-filters .chip')) chip.classList.toggle('is-active', chip === btn);
    render();
  });
  document.getElementById('earned-filters').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-earned]');
    if (!btn) return;
    state.earnedFilter = btn.dataset.earned;
    for (const chip of document.querySelectorAll('#earned-filters .chip')) chip.classList.toggle('is-active', chip === btn);
    render();
  });
  els.search.addEventListener('input', () => {
    state.query = els.search.value.trim().toLowerCase();
    if (state.view !== 'guide') state.view = 'guide';
    render();
  });
  els.spoiler.addEventListener('change', () => {
    state.spoilers = els.spoiler.checked;
    persist();
    render();
    setStatus(state.spoilers ? 'Spoiler shield on: story trophies are hidden until earned.' : 'Spoiler shield off: story trophies are visible.');
  });
  document.getElementById('export-btn').addEventListener('click', exportProgress);
  document.getElementById('import-file').addEventListener('change', (ev) => {
    if (ev.target.files[0]) importProgress(ev.target.files[0]);
    ev.target.value = '';
  });
  document.getElementById('reset-btn').addEventListener('click', () => {
    state.earned.clear();
    persist();
    render();
    setStatus('Progress reset. All 55 trophies are unearned again.');
  });
}

async function boot() {
  loadSaved();
  const response = await fetch('data/trophies.json');
  const doc = await response.json();
  state.trophies = doc.trophies.slice().sort((a, b) => (GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade]) || (a.id - b.id));
  state.byId = new Map(state.trophies.map((t) => [t.id, t]));
  if (params.get('demo') === '1') applyDemoProgress();
  els.spoiler.checked = state.spoilers;
  for (const chip of document.querySelectorAll('#kind-filters .chip')) {
    chip.classList.toggle('is-active', chip.dataset.kind === state.kind);
  }
  const openId = Number(params.get('open'));
  state.selectedId = state.byId.has(openId) ? openId : 28;
  wireControls();
  render();
  if (params.get('demo') === '1') setStatus('Demo progress loaded: 9 trophies earned, saved in this browser like real progress.');
}

boot();
