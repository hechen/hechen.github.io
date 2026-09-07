(function () {
  'use strict';

  var themes = [
    ['github-light', 'GitHub Light'],
    ['github-dark', 'GitHub Dark'],
    ['dracula', 'Dracula']
  ];
  var root = document.documentElement;
  var selectors = [];
  var selected = themes.find(function (theme) {
    return root.classList.contains('code-theme-' + theme[0]);
  });
  var current = selected ? selected[0] : 'github-light';

  function applyTheme(value) {
    current = themes.some(function (theme) { return theme[0] === value; }) ? value : 'github-light';
    themes.forEach(function (theme) {
      root.classList.toggle('code-theme-' + theme[0], theme[0] === current);
    });
    selectors.forEach(function (select) { select.value = current; });
  }

  var languages = {
    swift: 'Swift', c: 'C', cpp: 'C++', objc: 'Objective-C',
    'objective-c': 'Objective-C', javascript: 'JavaScript', js: 'JavaScript',
    typescript: 'TypeScript', ts: 'TypeScript', json: 'JSON',
    html: 'HTML', xml: 'XML', css: 'CSS', bash: 'Shell', sh: 'Shell',
    python: 'Python', text: 'Plain text', plaintext: 'Plain text'
  };

  document.querySelectorAll('main pre').forEach(function (pre) {
    var block = pre.closest('.highlight') || pre;
    if (block.closest('.code-example')) return;

    var code = block.querySelector('code[data-lang]') || block.querySelector('code');
    var match = code && code.className.match(/(?:^|\s)language-([^\s]+)/);
    var language = (code && code.dataset.lang) || (match && match[1]) || 'text';
    var example = document.createElement('div');
    example.className = 'code-example';
    var toolbar = document.createElement('div');
    toolbar.className = 'code-toolbar';
    var caption = document.createElement('span');
    caption.className = 'code-language';
    caption.textContent = languages[language] || language;

    var label = document.createElement('label');
    label.className = 'code-theme-label';
    label.appendChild(document.createTextNode('Code theme'));
    var select = document.createElement('select');
    select.className = 'code-theme-select';
    themes.forEach(function (theme) {
      var option = document.createElement('option');
      option.value = theme[0];
      option.textContent = theme[1];
      select.appendChild(option);
    });
    select.value = current;
    select.addEventListener('change', function () {
      applyTheme(select.value);
      try { localStorage.setItem('chen-code-theme', current); } catch (_) {}
    });
    selectors.push(select);
    label.appendChild(select);
    toolbar.appendChild(caption);
    toolbar.appendChild(label);
    block.before(example);
    example.appendChild(toolbar);
    example.appendChild(block);

    // Make horizontally scrolling code available to keyboard readers.
    pre.tabIndex = 0;
    pre.setAttribute('aria-label', caption.textContent + ' code');
  });

  window.addEventListener('storage', function (event) {
    if (event.key === 'chen-code-theme' || event.key === null) applyTheme(event.newValue);
  });
})();
