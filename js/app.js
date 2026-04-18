(function () {
  'use strict';

  let allData = [];
  let activeCategory = 'all';
  let searchQuery = '';
  let expandedCardId = null;

  // --- Init ---
  document.addEventListener('DOMContentLoaded', function () {
    fetch('data.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        allData = data;
        render();
        bindFilters();
        bindSearch();
      });
  });

  // --- Render grid ---
  function render() {
    var grid = document.getElementById('grid');
    var counter = document.getElementById('counter');
    var filtered = filterData();

    counter.textContent = filtered.length + ' statement' + (filtered.length !== 1 ? 's' : '') + ' on record';

    grid.innerHTML = '';
    filtered.forEach(function (item) {
      grid.appendChild(createCard(item));
    });
  }

  // --- Filter data ---
  function filterData() {
    return allData.filter(function (item) {
      var matchCat = activeCategory === 'all' || item.category === activeCategory;
      var q = searchQuery.toLowerCase();
      var matchSearch = !q
        || item.author.toLowerCase().indexOf(q) !== -1
        || item.quote.toLowerCase().indexOf(q) !== -1
        || (item.role && item.role.toLowerCase().indexOf(q) !== -1)
        || (item.context && item.context.toLowerCase().indexOf(q) !== -1);
      return matchCat && matchSearch;
    });
  }

  // --- Create card ---
  function createCard(item) {
    var card = document.createElement('div');
    card.className = 'card';
    if (expandedCardId === item.id) {
      card.classList.add('expanded');
    }
    card.setAttribute('data-id', item.id);

    var html = '';

    // Photo background
    if (item.image) {
      html += '<div class="card-photo" style="background-image:url(\'' + item.image + '\')"></div>';
    }

    // Close button
    html += '<button class="card-close" title="Close">&times;</button>';

    // Main content
    html += '<div class="card-content">';
    html += '<div class="card-quote">' + escapeHtml(item.quote) + '</div>';
    html += '</div>';

    // Meta
    html += '<div class="card-meta">';
    html += '<div class="card-author">' + escapeHtml(item.author) + '</div>';
    html += '<div class="card-role">' + escapeHtml(item.role || '') + '</div>';
    if (item.date_statement) {
      html += '<div class="card-date">' + escapeHtml(item.date_statement) + '</div>';
    }
    html += '</div>';

    // Expanded content
    html += '<div class="card-expanded-content">';

    if (item.context) {
      html += '<div class="card-context">' + escapeHtml(item.context) + '</div>';
    }

    if (item.description) {
      html += '<div class="card-description">' + escapeHtml(item.description) + '</div>';
    }

    // Attachments
    if (item.attachments && item.attachments.length > 0) {
      html += '<div class="card-attachments">';
      item.attachments.forEach(function (att) {
        html += renderAttachment(att);
      });
      html += '</div>';
    }

    // Source link
    if (item.source_url) {
      html += '<div class="card-source-link">Source: <a href="' + escapeAttr(item.source_url) + '" target="_blank" rel="noopener">' + escapeHtml(item.source_url) + '</a></div>';
    }

    html += '</div>'; // end expanded-content

    card.innerHTML = html;

    // Click to expand
    card.addEventListener('click', function (e) {
      if (e.target.classList.contains('card-close')) {
        expandedCardId = null;
        render();
        return;
      }
      // Don't collapse when clicking links/iframes inside expanded card
      if (card.classList.contains('expanded') && (e.target.tagName === 'A' || e.target.tagName === 'IFRAME')) {
        return;
      }
      if (card.classList.contains('expanded')) {
        expandedCardId = null;
      } else {
        expandedCardId = item.id;
      }
      render();
      // Scroll to expanded card
      if (expandedCardId !== null) {
        setTimeout(function () {
          var el = document.querySelector('.card.expanded');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
    });

    return card;
  }

  // --- Render attachment ---
  function renderAttachment(att) {
    if (att.type === 'video') {
      var embedUrl = toEmbedUrl(att.url);
      if (embedUrl) {
        return '<iframe src="' + escapeAttr(embedUrl) + '" allowfullscreen loading="lazy"></iframe>';
      }
      return '<a href="' + escapeAttr(att.url) + '" target="_blank" rel="noopener">Watch video</a>';
    }
    if (att.type === 'image') {
      return '<img src="' + escapeAttr(att.url) + '" alt="Evidence" loading="lazy">';
    }
    if (att.type === 'tweet') {
      return '<blockquote><a href="' + escapeAttr(att.url) + '" target="_blank" rel="noopener">View original tweet</a></blockquote>';
    }
    if (att.type === 'article') {
      return '<a href="' + escapeAttr(att.url) + '" target="_blank" rel="noopener">Read article</a>';
    }
    return '<a href="' + escapeAttr(att.url) + '" target="_blank" rel="noopener">View source</a>';
  }

  // --- YouTube URL to embed ---
  function toEmbedUrl(url) {
    var m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (m) return 'https://www.youtube-nocookie.com/embed/' + m[1];
    return null;
  }

  // --- Bind filters ---
  function bindFilters() {
    var buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeCategory = btn.getAttribute('data-category');
        expandedCardId = null;
        render();
      });
    });
  }

  // --- Bind search ---
  function bindSearch() {
    var searchBar = document.getElementById('searchBar');
    searchBar.addEventListener('input', function () {
      searchQuery = searchBar.value;
      expandedCardId = null;
      render();
    });
  }

  // --- Escape ---
  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

})();
