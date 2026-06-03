document.addEventListener('DOMContentLoaded', () => {

    // ── DOM refs ──────────────────────────────────────────────
    const navLinksContainer = document.getElementById('nav-links');
    const contentContainer  = document.getElementById('content-container');
    const pageToc           = document.getElementById('page-toc');
    const searchInput       = document.getElementById('search-input');
    const mobileMenuBtn     = document.getElementById('mobile-menu-btn');
    const themeToggle       = document.getElementById('theme-toggle');
    const sidebar           = document.getElementById('sidebar');
    const progressBar       = document.getElementById('progress-bar');
    const mainContent       = document.getElementById('main-content');
    const breadcrumb        = document.getElementById('breadcrumb');
    const sectionCounter    = document.getElementById('section-counter');
    const searchModeLabel   = document.querySelector('.search-mode-label');

    // ── State ─────────────────────────────────────────────────
    let sections        = [];
    let currentSectionId = null;
    let searchMode      = 'title';   // 'title' | 'content'
    let searchTimeout   = null;
    let activeTocId     = null;
    let tocObserver     = null;

    // ── Theme ─────────────────────────────────────────────────
    const savedTheme = localStorage.getItem('minirag-theme') || 'light';
    applyTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('minirag-theme', theme);
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        // Update highlight.js theme
        const hlLink = document.getElementById('hljs-theme');
        if (hlLink) {
            hlLink.href = theme === 'dark'
                ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
                : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
        }
    }

    // ── Configure marked.js ───────────────────────────────────
    marked.setOptions({
        highlight(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
        langPrefix: 'hljs language-'
    });

    // ── Mobile menu ───────────────────────────────────────────
    mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 &&
            !sidebar.contains(e.target) &&
            !mobileMenuBtn.contains(e.target) &&
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });

    // ── Reading progress bar ──────────────────────────────────
    mainContent.addEventListener('scroll', () => {
        const el = mainContent;
        const scrolled = el.scrollTop;
        const total    = el.scrollHeight - el.clientHeight;
        const pct      = total > 0 ? Math.round((scrolled / total) * 100) : 0;
        progressBar.style.width = pct + '%';
    });

    // ── Fetch markdown ────────────────────────────────────────
    fetch('minirag_course_notes.md')
        .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.text(); })
        .then(md => parseMarkdown(md))
        .catch(() => {
            navLinksContainer.innerHTML =
                '<li style="color:#cf222e;padding:12px 10px;font-size:.85rem">Error loading file — run start_viewer.bat first.</li>';
            contentContainer.innerHTML = `
                <div style="background:var(--bg-card);border:1px solid var(--border);padding:32px;border-radius:12px;text-align:center;">
                    <h2 style="color:var(--text-main)">Could not load notes</h2>
                    <p style="color:var(--text-muted);margin-top:10px;">Open index.html via the <strong>start_viewer.bat</strong> local server — browsers block direct file access.</p>
                </div>`;
        });

    // ── Parse markdown into sections ──────────────────────────
    function parseMarkdown(markdown) {
        // Split on ## headings (top-level sections)
        const rawSections = markdown.split(/\n(?=## )/);

        sections = rawSections.map((raw, idx) => {
            const lines = raw.split('\n');
            const titleLine = lines[0];
            let title = titleLine.startsWith('##')
                ? titleLine.replace(/^##\s+/, '').trim()
                : 'Overview';
            if (idx === 0 && !titleLine.startsWith('##')) title = 'Overview';

            const id = 'section-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            // Strip markdown for plain-text content search
            const plainText = raw
                .replace(/```[\s\S]*?```/g, ' ')
                .replace(/`[^`]+`/g, ' ')
                .replace(/[#*_>~\[\]]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            return { id, title, content: raw, plainText };
        }).filter(s => s.content.trim().length > 0);

        renderSidebar();

        const hash = window.location.hash.slice(1);
        const target = sections.find(s => s.id === hash) || sections[0];
        if (target) renderContent(target.id);

        // Update section counter display
        updateCounter();
    }

    // ── Sidebar rendering with groups ─────────────────────────
    function renderSidebar(filterText = '') {
        navLinksContainer.innerHTML = '';

        const q = filterText.trim().toLowerCase();

        if (q) {
            // Flat filtered list
            const hits = sections.filter(s =>
                searchMode === 'content'
                    ? s.plainText.toLowerCase().includes(q)
                    : s.title.toLowerCase().includes(q)
            );

            if (hits.length === 0) {
                navLinksContainer.innerHTML =
                    '<li style="padding:12px 10px;color:var(--text-muted);font-size:.85rem">No results found.</li>';
                return;
            }

            hits.forEach(sec => navLinksContainer.appendChild(makeLinkLi(sec)));
            return;
        }

        // Grouped nav (no filter)
        const groups = [
            { label: 'Getting Started', key: 'start',    match: s => /^(overview|introduction|table of contents|contributors)/i.test(s.title) },
            { label: 'Course Videos',   key: 'videos',   match: s => /video\s*\d|videos\s*\d/i.test(s.title) },
            { label: 'Checkpoints',     key: 'check',    match: s => /checkpoint|video links|course complete|knowledge base complete/i.test(s.title) },
            { label: 'Advanced Topics', key: 'advanced', match: s => /advanced topic/i.test(s.title) },
            { label: 'Reference Guides',key: 'ref',      match: s => /chatbot production guide|rag architectures|ai design patterns|generative ai interview|level \d/i.test(s.title) },
            { label: 'Production',      key: 'prod',     match: s => /cheatsheet|best practices/i.test(s.title) },
        ];

        const assigned = new Set();

        groups.forEach(({ label, key, match }) => {
            const items = sections.filter(s => match(s) && !assigned.has(s.id));
            items.forEach(s => assigned.add(s.id));
            if (items.length === 0) return;

            const collapseKey = `nav-group-${key}`;
            const isCollapsed = localStorage.getItem(collapseKey) === 'collapsed';

            const groupEl = document.createElement('div');
            groupEl.className = 'nav-group' + (isCollapsed ? ' collapsed' : '');

            const header = document.createElement('div');
            header.className = 'nav-group-header';
            header.innerHTML = `<span class="nav-group-label">${label}</span><span class="nav-group-toggle">▾</span>`;
            header.addEventListener('click', () => {
                groupEl.classList.toggle('collapsed');
                localStorage.setItem(collapseKey, groupEl.classList.contains('collapsed') ? 'collapsed' : 'open');
            });

            const itemsEl = document.createElement('div');
            itemsEl.className = 'nav-group-items';
            items.forEach(sec => itemsEl.appendChild(makeLinkLi(sec)));

            groupEl.appendChild(header);
            groupEl.appendChild(itemsEl);
            navLinksContainer.appendChild(groupEl);
        });

        // Anything not assigned
        const rest = sections.filter(s => !assigned.has(s.id));
        if (rest.length > 0) {
            const groupEl = document.createElement('div');
            groupEl.className = 'nav-group';
            const header = document.createElement('div');
            header.className = 'nav-group-header';
            header.innerHTML = `<span class="nav-group-label">Other</span><span class="nav-group-toggle">▾</span>`;
            const itemsEl = document.createElement('div');
            itemsEl.className = 'nav-group-items';
            rest.forEach(sec => itemsEl.appendChild(makeLinkLi(sec)));
            groupEl.appendChild(header);
            groupEl.appendChild(itemsEl);
            navLinksContainer.appendChild(groupEl);
        }
    }

    function makeLinkLi(sec) {
        const li = document.createElement('li');
        const a  = document.createElement('a');
        a.href      = `#${sec.id}`;
        a.className = `nav-link${sec.id === currentSectionId ? ' active' : ''}`;
        a.textContent = sec.title;
        a.title     = sec.title;
        a.addEventListener('click', e => {
            e.preventDefault();
            window.history.pushState(null, null, `#${sec.id}`);
            renderContent(sec.id);
            if (window.innerWidth <= 768) sidebar.classList.remove('open');
        });
        li.appendChild(a);
        return li;
    }

    // ── Render content ────────────────────────────────────────
    function renderContent(id) {
        const section = sections.find(s => s.id === id);
        if (!section) return;

        currentSectionId = id;

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
        });

        // Scroll active link into sidebar view
        const activeLink = navLinksContainer.querySelector('.nav-link.active');
        if (activeLink) activeLink.scrollIntoView({ block: 'nearest' });

        // Render content
        if (section.title === 'Overview') {
            contentContainer.innerHTML = buildOverviewHTML();
            pageToc.innerHTML = '';
        } else {
            contentContainer.innerHTML = marked.parse(section.content);
            addCopyButtons();
            buildPageToc();
        }

        mainContent.scrollTop = 0;
        updateBreadcrumb(section.title);
        updateCounter();
    }

    // ── Copy buttons ──────────────────────────────────────────
    function addCopyButtons() {
        contentContainer.querySelectorAll('pre').forEach(pre => {
            const code = pre.querySelector('code');
            if (!code) return;

            // Detect language from class
            const langClass = [...code.classList].find(c => c.startsWith('language-'));
            const lang = langClass ? langClass.replace('language-', '').replace('hljs ', '') : '';

            // Language badge (only if meaningful)
            if (lang && lang !== 'plaintext') {
                const badge = document.createElement('span');
                badge.className = 'code-lang';
                badge.textContent = lang;
                pre.style.paddingTop = '32px';
                pre.appendChild(badge);
            }

            const btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.textContent = 'Copy';
            btn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(code.innerText);
                    btn.textContent = '✓ Copied';
                    btn.classList.add('copied');
                    setTimeout(() => {
                        btn.textContent = 'Copy';
                        btn.classList.remove('copied');
                    }, 2000);
                } catch {
                    btn.textContent = 'Failed';
                    setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
                }
            });
            pre.appendChild(btn);
        });
    }

    // ── In-page TOC ───────────────────────────────────────────
    function buildPageToc() {
        if (tocObserver) tocObserver.disconnect();
        pageToc.innerHTML = '';

        const headings = [...contentContainer.querySelectorAll('h2, h3, h4')];
        if (headings.length < 3) return;  // not worth showing for tiny sections

        // Assign IDs to headings for linking
        headings.forEach((h, i) => {
            if (!h.id) {
                h.id = 'h-' + h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + i;
            }
        });

        const label = document.createElement('div');
        label.className = 'page-toc-label';
        label.textContent = 'On this page';
        pageToc.appendChild(label);

        const list = document.createElement('ul');
        list.className = 'page-toc-list';

        headings.forEach(h => {
            const li  = document.createElement('li');
            li.className = `page-toc-item depth-${h.tagName.toLowerCase()}`;
            li.dataset.target = h.id;
            const a   = document.createElement('a');
            a.href    = `#${h.id}`;
            a.textContent = h.textContent.replace(/^[#🔹🔬🏗️💡🎯🟢🟡🔴⚫🔀📐⚡🔄]+\s*/, '');
            a.addEventListener('click', e => {
                e.preventDefault();
                h.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            li.appendChild(a);
            list.appendChild(li);
        });

        pageToc.appendChild(list);

        // Intersection observer to highlight active heading
        tocObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.querySelectorAll('.page-toc-item').forEach(li => li.classList.remove('active'));
                    const target = document.querySelector(`.page-toc-item[data-target="${entry.target.id}"]`);
                    if (target) target.classList.add('active');
                }
            });
        }, { rootMargin: '-10% 0px -80% 0px', root: mainContent });

        headings.forEach(h => tocObserver.observe(h));
    }

    // ── Full-text search ──────────────────────────────────────
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const q = e.target.value.trim();
            if (!q) {
                renderSidebar();
                if (currentSectionId) renderContent(currentSectionId);
                return;
            }
            if (searchMode === 'content') {
                renderFullTextResults(q);
            } else {
                renderSidebar(q);
            }
        }, 180);
    });

    // Toggle search mode (Ctrl+Shift+F for full-text)
    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
            // Switch to full-text on Enter if in title mode
            if (searchMode === 'title') {
                searchMode = 'content';
                if (searchModeLabel) searchModeLabel.textContent = 'Full-text search — Esc to clear';
                renderFullTextResults(searchInput.value.trim());
            }
        }
        if (e.key === 'Escape') {
            searchInput.value = '';
            searchMode = 'title';
            if (searchModeLabel) searchModeLabel.textContent = 'Press Enter for full-text search';
            renderSidebar();
            if (currentSectionId) renderContent(currentSectionId);
            searchInput.blur();
        }
    });

    function renderFullTextResults(query) {
        const q = query.toLowerCase();
        const results = [];

        sections.forEach(sec => {
            if (sec.title === 'Overview') return;
            const idx = sec.plainText.toLowerCase().indexOf(q);
            if (idx === -1) return;

            // Get surrounding excerpt
            const start   = Math.max(0, idx - 80);
            const end     = Math.min(sec.plainText.length, idx + query.length + 120);
            let excerpt   = sec.plainText.slice(start, end).trim();
            if (start > 0) excerpt = '...' + excerpt;
            if (end < sec.plainText.length) excerpt += '...';

            // Highlight the match
            const re = new RegExp(`(${escapeRegex(query)})`, 'gi');
            const highlightedExcerpt = excerpt.replace(re, '<mark>$1</mark>');
            const highlightedTitle   = sec.title.replace(re, '<mark>$1</mark>');

            results.push({ sec, highlightedTitle, highlightedExcerpt, idx });
        });

        // Sidebar: flat filtered list
        renderSidebar(query);

        // Main area: results panel
        if (results.length === 0) {
            contentContainer.innerHTML = `
                <div class="search-results-panel">
                    <div class="search-no-results">
                        <div style="font-size:2rem;margin-bottom:12px">🔍</div>
                        No results found for <strong>"${escapeHtml(query)}"</strong><br>
                        <span style="font-size:.8rem;margin-top:6px;display:block">Try different keywords or check spelling</span>
                    </div>
                </div>`;
            pageToc.innerHTML = '';
            return;
        }

        contentContainer.innerHTML = `
            <div class="search-results-panel">
                <div class="search-results-header">
                    Found <strong>${results.length}</strong> section${results.length !== 1 ? 's' : ''} matching <strong>"${escapeHtml(query)}"</strong>
                    <span style="color:var(--text-sub);margin-left:8px;font-size:.75rem">Click a result to open that section</span>
                </div>
                ${results.map(r => `
                    <div class="search-result-item" data-section-id="${r.sec.id}">
                        <div class="search-result-title">${r.highlightedTitle}</div>
                        <div class="search-result-excerpt">${r.highlightedExcerpt}</div>
                    </div>
                `).join('')}
            </div>`;

        pageToc.innerHTML = '';

        // Click result → open section
        contentContainer.querySelectorAll('.search-result-item').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.dataset.sectionId;
                searchInput.value = '';
                searchMode = 'title';
                if (searchModeLabel) searchModeLabel.textContent = 'Press Enter for full-text search';
                renderSidebar();
                window.history.pushState(null, null, `#${id}`);
                renderContent(id);
            });
        });
    }

    // ── Internal link clicks (within rendered content) ────────
    contentContainer.addEventListener('click', e => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const targetId = link.getAttribute('href').slice(1);
        const section  = sections.find(s => s.id === targetId);
        if (section) {
            e.preventDefault();
            window.history.pushState(null, null, `#${targetId}`);
            renderContent(targetId);
            if (window.innerWidth <= 768) sidebar.classList.remove('open');
        }
    });

    // ── Breadcrumb & counter ──────────────────────────────────
    function updateBreadcrumb(title) {
        if (!breadcrumb) return;
        const group = getGroupForTitle(title);
        breadcrumb.innerHTML = group
            ? `<span style="color:var(--text-sub)">${group} /</span> <strong>${escapeHtml(title)}</strong>`
            : `<strong>${escapeHtml(title)}</strong>`;
    }

    function getGroupForTitle(title) {
        if (/video\s*\d|videos\s*\d/i.test(title)) return '🎬 Course Videos';
        if (/advanced topic/i.test(title))           return '🧠 Advanced Topics';
        if (/chatbot production|rag architectures|design patterns|interview guide|level \d/i.test(title)) return '📚 Reference Guides';
        if (/cheatsheet|best practices/i.test(title)) return '✅ Production';
        return '';
    }

    function updateCounter() {
        if (!sectionCounter) return;
        const idx = sections.findIndex(s => s.id === currentSectionId);
        sectionCounter.textContent = idx >= 0
            ? `${idx + 1} / ${sections.length}`
            : '';
    }

    // ── Keyboard shortcuts ────────────────────────────────────
    document.addEventListener('keydown', e => {
        // / → focus search
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
            return;
        }

        // Arrow keys → scroll within the current page
        if (document.activeElement === searchInput) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            mainContent.scrollBy({ top: 120, behavior: 'smooth' });
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            mainContent.scrollBy({ top: -120, behavior: 'smooth' });
        }
    });

    // ── Browser back/forward ──────────────────────────────────
    window.addEventListener('popstate', () => {
        const id = window.location.hash.slice(1);
        if (id) renderContent(id);
    });

    // ── Overview builder ──────────────────────────────────────
    function buildOverviewHTML() {
        const nonOv       = sections.filter(s => s.title !== 'Overview');
        const intro       = nonOv.filter(s => /^(introduction|table of contents|contributors)/i.test(s.title));
        const videos      = nonOv.filter(s => /video\s*\d|videos\s*\d/i.test(s.title));
        const checkpoints = nonOv.filter(s => /checkpoint|video links|course complete|knowledge base complete/i.test(s.title));
        const advanced    = nonOv.filter(s => /advanced topic/i.test(s.title));
        const reference   = nonOv.filter(s => /chatbot production guide|rag architectures|ai design patterns|generative ai interview/i.test(s.title));
        const cheatsheet  = nonOv.filter(s => /cheatsheet|best practices/i.test(s.title));

        const card = sec => `
            <a href="#${sec.id}" class="ov-card" data-section-id="${sec.id}">
                <span class="ov-card-title">${escapeHtml(sec.title)}</span>
                <span class="ov-card-arrow">→</span>
            </a>`;

        const group = (label, emoji, items, mod = '') => items.length === 0 ? '' : `
            <div class="ov-group ${mod}">
                <h2 class="ov-group-label">${emoji} ${label}</h2>
                <div class="ov-cards">${items.map(card).join('')}</div>
            </div>`;

        const contributors = [
            { name: 'Abu Bakr Soliman', role: 'Course Instructor', url: 'https://www.linkedin.com/in/bakrianoo/' },
            { name: 'Ahmed Amin',       role: 'AI Engineer @ Takhaial', url: 'https://www.linkedin.com/in/ahmed-amin-47196321a/?locale=ar' },
            { name: 'Lamhot Siagian',   role: 'PhD Student | AI Engineer', url: 'https://www.linkedin.com/in/lamhotsiagian/' },
            { name: 'Chandra Sekhar',   role: 'AI Practitioner', url: 'https://www.linkedin.com/in/v-chandra-sekhar/' },
            { name: 'Hesham Haroon',    role: 'AI Team Lead | GenAI Specialist', url: 'https://www.linkedin.com/in/hesham-haroon/' },
        ];

        return `
        <div class="ov-hero">
            <div class="ov-hero-icon">📚</div>
            <h1 class="ov-hero-title">MiniRAG Course Notes</h1>
            <p class="ov-hero-sub">A comprehensive, interactive knowledge base covering RAG systems — from fundamentals to production-ready deployment.</p>

            <div class="ov-credits">
                <span>Based on <a href="https://github.com/bakrianoo/mini-rag" target="_blank">MiniRAG Course</a> by <strong>Abu Bakr Soliman</strong></span>
                <span class="ov-credits-sep">·</span>
                <span>Notes by <a href="https://www.linkedin.com/in/ahmed-amin-47196321a/?locale=ar" target="_blank">Ahmed Amin</a></span>
                <span class="ov-credits-sep">·</span>
                <span>AI Engineer @ Takhaial</span>
            </div>

            <div class="ov-stats">
                <div class="ov-stat"><span class="ov-stat-n">25</span><span class="ov-stat-l">Course Videos</span></div>
                <div class="ov-stat"><span class="ov-stat-n">${advanced.length}</span><span class="ov-stat-l">Advanced Topics</span></div>
                <div class="ov-stat"><span class="ov-stat-n">4</span><span class="ov-stat-l">Reference Guides</span></div>
                <div class="ov-stat"><span class="ov-stat-n">${sections.length - 1}</span><span class="ov-stat-l">Total Sections</span></div>
            </div>

            <div class="ov-quick">
                ${videos[0] ? `<a href="#${videos[0].id}" class="ov-btn ov-btn-video" data-section-id="${videos[0].id}">🎬 Start from Video 1</a>` : ''}
                ${advanced[0] ? `<a href="#${advanced[0].id}" class="ov-btn ov-btn-advanced" data-section-id="${advanced[0].id}">🧠 Advanced Topics</a>` : ''}
                ${cheatsheet[0] ? `<a href="#${cheatsheet[0].id}" class="ov-btn ov-btn-cheatsheet" data-section-id="${cheatsheet[0].id}">✅ Production Cheatsheet</a>` : ''}
            </div>
        </div>

        <div class="ov-contributors">
            <h2>Contributors & Authors</h2>
            <div class="ov-contributor-grid">
                ${contributors.map(c => `
                    <a href="${c.url}" target="_blank" class="ov-contributor-card">
                        <span class="ov-contributor-name">${c.name}</span>
                        <span class="ov-contributor-role">${c.role}</span>
                    </a>`).join('')}
            </div>
        </div>

        ${group('Getting Started', '📖', intro)}
        ${group('Course Videos (1 – 25)', '🎬', videos, 'ov-group--videos')}
        ${group('Checkpoints & References', '🏁', checkpoints)}
        ${group('Advanced Topics (AT-1 – AT-23)', '🧠', advanced, 'ov-group--advanced')}
        ${group('Reference Guides', '📚', reference)}
        ${group('Production Cheatsheet', '✅', cheatsheet, 'ov-group--cheatsheet')}
        `;
    }

    // ── Utilities ─────────────────────────────────────────────
    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
});
