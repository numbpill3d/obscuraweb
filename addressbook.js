(function () {
  'use strict';

  var records = [
    { name: 'CIRCUIT FORUM', category: 'community', categoryLabel: 'COMMUNITY', status: 'ACTIVE', address: 'circuitforum7m4x.onion', description: 'A slow forum for independent researchers, archivists, and people making things by hand.', tags: ['forum', 'discussion', 'research'], added: '2026-11-08', fingerprint: '7F 42 1B 90 0D 8A 33 CE', compartment: 'LANTERN / 04', alias: 'lowtide-04', trace: { network: 2, metadata: 3, social: 4 }, handoff: 'Use a fresh handle. Keep your usual avatar and writing tics out of this room.' },
    { name: 'FATHOM LIBRARY', category: 'library', categoryLabel: 'LIBRARY', status: 'MIRROR', address: 'fathomlib3k2q.onion', description: 'A plain-text index of public-domain books, manuals, and out-of-print technical ephemera.', tags: ['books', 'archive', 'text'], added: '2026-11-05', fingerprint: 'A1 0C E7 3D 4B 19 22 8F', compartment: 'PAPER / 11', alias: 'mothpaper-11', trace: { network: 1, metadata: 2, social: 1 }, handoff: 'Read-only posture. Download to a clean folder and strip document metadata before sharing.' },
    { name: 'MARGIN SEARCH', category: 'tools', categoryLabel: 'TOOL', status: 'ACTIVE', address: 'marginsearchp9v2.onion', description: 'Search the small web without feeds, profiles, or a popularity contest.', tags: ['search', 'discovery', 'index'], added: '2026-11-02', fingerprint: 'D8 4A 19 72 F0 6C 11 3B', compartment: 'RADIO / 22', alias: 'sideband-22', trace: { network: 3, metadata: 1, social: 1 }, handoff: 'Search without personal phrasing. Do not paste private queries into public results.' },
    { name: 'NIGHT SCHOOL', category: 'community', categoryLabel: 'COMMUNITY', status: 'NEW', address: 'nightschoolx2n7.onion', description: 'Lessons, notes, and late-night study groups for privacy, systems, and the open web.', tags: ['learning', 'notes', 'classes'], added: '2026-10-29', fingerprint: '21 C0 9E 44 7A 83 0B D1', compartment: 'MOTH / 07', alias: 'nightstudent-07', trace: { network: 2, metadata: 2, social: 5 }, handoff: 'Assume social context is sticky. Keep this alias out of your public profile graph.' },
    { name: 'QUIET DROP', category: 'privacy', categoryLabel: 'PRIVACY', status: 'ACTIVE', address: 'quietdropm8r4.onion', description: 'A dead-simple file drop with short retention and a preference for no questions.', tags: ['files', 'drop', 'sharing'], added: '2026-10-21', fingerprint: 'E2 6B 58 90 3F 1A 4D 77', compartment: 'COLD / 19', alias: 'winterrelay-19', trace: { network: 4, metadata: 5, social: 2 }, handoff: 'Treat uploads as radioactive: remove EXIF, filenames, timestamps, and embedded author fields first.' },
    { name: 'OLD SIGNALS', category: 'library', categoryLabel: 'LIBRARY', status: 'MIRROR', address: 'oldsignalsc4y6.onion', description: 'Scans, zines, BBS artifacts, and other things that were almost lost.', tags: ['zines', 'bbs', 'history'], added: '2026-10-16', fingerprint: '3C 8E A0 1D 52 F9 74 6A', compartment: 'ARCHIVE / 31', alias: 'deadletter-31', trace: { network: 1, metadata: 4, social: 1 }, handoff: 'Keep the acquisition trail local. Do not mirror source filenames or your own folder structure.' },
    { name: 'KEYS UNDER MAT', category: 'privacy', categoryLabel: 'PRIVACY', status: 'NEW', address: 'keysundermat5tq.onion', description: 'A reference shelf for threat models, operational security, and safer defaults.', tags: ['security', 'guides', 'privacy'], added: '2026-10-11', fingerprint: '91 2A 6D E4 8B 03 7C 55', compartment: 'VAULT / 44', alias: 'paperkey-44', trace: { network: 2, metadata: 2, social: 1 }, handoff: 'Use as a checklist, not a ritual. Adapt controls to your actual adversary and device.' },
    { name: 'BLACKBIRD BBS', category: 'community', categoryLabel: 'COMMUNITY', status: 'ACTIVE', address: 'blackbirdbbs1wq.onion', description: 'Text-only rooms for people who miss the hum of a modem and the joy of a handle.', tags: ['bbs', 'chat', 'text'], added: '2026-09-27', fingerprint: '5E 17 C2 88 0A 4F 96 B3', compartment: 'BBS / 58', alias: 'dialtone-58', trace: { network: 3, metadata: 3, social: 5 }, handoff: 'Assume language is a fingerprint. Change cadence, vocabulary, and personal anecdotes between identities.' }
  ];

  var state = { filter: 'all', query: '', sort: 'name', selected: 0 };
  var list = document.getElementById('address-list');
  var inspector = document.getElementById('inspector');
  var envelope = document.getElementById('envelope');
  var empty = document.getElementById('empty-state');

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (match) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[match]; });
  }

  function filtered() {
    var query = state.query.toLowerCase();
    return records.filter(function (record) {
      var inCategory = state.filter === 'all' || record.category === state.filter;
      var haystack = [record.name, record.address, record.description, record.categoryLabel].concat(record.tags).join(' ').toLowerCase();
      return inCategory && (!query || haystack.indexOf(query) !== -1);
    }).sort(function (a, b) {
      if (state.sort === 'recent') return b.added.localeCompare(a.added);
      if (state.sort === 'status') return a.status.localeCompare(b.status) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }

  function render() {
    var rows = filtered();
    list.innerHTML = rows.map(function (record) {
      var index = records.indexOf(record);
      return '<button class="address-row ' + (index === state.selected ? 'is-selected' : '') + '" type="button" role="option" aria-selected="' + (index === state.selected) + '" data-index="' + index + '">' +
        '<span class="record-symbol" aria-hidden="true">' + (record.status === 'ACTIVE' ? '●' : '○') + '</span>' +
        '<span class="record-main"><b>' + esc(record.name) + '</b><span>' + esc(record.address) + '</span></span>' +
        '<span class="record-tag">' + esc(record.categoryLabel) + '</span>' +
        '<span class="record-status status-' + record.status.toLowerCase() + '">' + esc(record.status) + '</span>' +
      '</button>';
    }).join('');
    empty.hidden = rows.length !== 0;
    document.getElementById('result-copy').textContent = String(rows.length).padStart(2, '0') + ' records found';
    document.getElementById('directory-title').textContent = 'ADDRESS BOOK — ' + String(records.length).padStart(2, '0') + ' RECORDS';
    list.querySelectorAll('.address-row').forEach(function (button) { button.addEventListener('click', function () { state.selected = Number(button.dataset.index); render(); renderInspector(); }); });
    updateCounts();
  }

  function renderInspector() {
    var record = records[state.selected] || records[0];
    inspector.innerHTML = '<div class="inspector-symbol" aria-hidden="true">' + (record.status === 'ACTIVE' ? '◉' : '◎') + '</div>' +
      '<p class="inspector-kicker">RECORD ' + String(state.selected + 1).padStart(2, '0') + ' / ' + esc(record.categoryLabel) + '</p>' +
      '<h2>' + esc(record.name) + '</h2>' +
      '<div class="inspector-rule"></div>' +
      '<p class="inspector-description">' + esc(record.description) + '</p>' +
      '<dl class="record-details"><div><dt>ADDRESS</dt><dd class="address-value">' + esc(record.address) + '</dd></div><div><dt>STATUS</dt><dd>' + esc(record.status) + '</dd></div><div><dt>ADDED</dt><dd>' + esc(record.added) + '</dd></div><div><dt>FINGERPRINT</dt><dd>' + esc(record.fingerprint) + '</dd></div></dl>' +
      '<div class="inspector-tags">' + record.tags.map(function (tag) { return '<span>#' + esc(tag) + '</span>'; }).join('') + '</div>' +
      '<button class="copy-address" type="button">COPY ADDRESS</button>' +
      '<p class="inspector-warning">⚠ Verify the address and fingerprint independently before use.</p>';
    var copyButton = inspector.querySelector('.copy-address');
    copyButton.addEventListener('click', function () {
      var original = copyButton.textContent;
      var done = function () { copyButton.textContent = 'COPIED TO CLIPBOARD'; setTimeout(function () { copyButton.textContent = original; }, 1400); };
      if (navigator.clipboard) navigator.clipboard.writeText(record.address).then(done, done);
      else done();
    });
    renderEnvelope(record);
  }

  function renderEnvelope(record) {
    var alias = record.alias;
    envelope.innerHTML = '<p class="envelope-kicker">LOCAL COMPARTMENT / NOT IDENTITY</p>' +
      '<div class="compartment-id"><span>' + esc(record.compartment) + '</span><b>' + esc(alias) + '</b></div>' +
      '<p class="envelope-copy">A disposable approach for this record. Keep it separate from your name, face, cadence, files, and usual browser habits.</p>' +
      '<div class="trace-budget"><div class="trace-title"><span>TRACE BUDGET</span><b>LOWER IS BETTER</b></div>' +
      traceRow('NETWORK', record.trace.network) + traceRow('METADATA', record.trace.metadata) + traceRow('SOCIAL', record.trace.social) + '</div>' +
      '<p class="handoff-note"><b>HANDOFF RULE</b>' + esc(record.handoff) + '</p>' +
      '<button class="rotate-alias" type="button">ROTATE LOCAL ALIAS</button>' +
      '<p class="envelope-footnote">Generated in memory only. Refreshing the page discards the rotation.</p>';
    envelope.querySelector('.rotate-alias').addEventListener('click', function () {
      var token = makeAlias();
      alias = token;
      envelope.querySelector('.compartment-id b').textContent = alias;
      envelope.querySelector('.rotate-alias').textContent = 'ROTATED — USE ONCE';
    });
  }

  function traceRow(label, score) {
    var cells = '';
    for (var i = 0; i < 5; i += 1) cells += '<i class="trace-cell ' + (i < score ? 'is-hot' : '') + '"></i>';
    return '<div class="trace-row"><span>' + label + '</span><span class="trace-cells" aria-label="' + score + ' of 5">' + cells + '</span></div>';
  }

  function makeAlias() {
    var words = ['ashen', 'quiet', 'relay', 'moth', 'signal', 'paper', 'orbit', 'cold'];
    var bytes = new Uint32Array(2);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else { bytes[0] = Math.floor(Math.random() * 4294967295); bytes[1] = Date.now(); }
    return words[bytes[0] % words.length] + '-' + String(bytes[1] % 100).padStart(2, '0');
  }

  function updateCounts() {
    document.getElementById('entry-count').textContent = String(records.length).padStart(2, '0');
    document.querySelectorAll('[data-filter]').forEach(function (button) {
      var filter = button.dataset.filter;
      var count = filter === 'all' ? records.length : records.filter(function (record) { return record.category === filter; }).length;
      button.querySelector('b').textContent = String(count).padStart(2, '0');
    });
  }

  document.getElementById('search-input').addEventListener('input', function (event) { state.query = event.target.value; render(); });
  document.getElementById('sort-select').addEventListener('change', function (event) { state.sort = event.target.value; render(); });
  document.querySelectorAll('[data-filter]').forEach(function (button) { button.addEventListener('click', function () { state.filter = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach(function (item) { item.classList.toggle('is-selected', item === button); }); render(); }); });
  render();
  renderInspector();
}());
