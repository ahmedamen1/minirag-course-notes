document.addEventListener('DOMContentLoaded', () => {
    const navLinksContainer = document.getElementById('nav-links');
    const contentContainer = document.getElementById('content-container');
    const searchInput = document.getElementById('search-input');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');

    let sections = []; // Will hold objects: { id, title, content, isOverview }
    let currentSectionId = null;

    // Configure marked.js to use highlight.js
    marked.setOptions({
        highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
        langPrefix: 'hljs language-'
    });

    // Toggle Mobile Menu
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar if clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target) && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });

    // Handle internal #section-* link clicks inside rendered content
    contentContainer.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const targetId = link.getAttribute('href').slice(1);
        const section = sections.find(s => s.id === targetId);
        if (section) {
            e.preventDefault();
            window.history.pushState(null, null, `#${targetId}`);
            renderContent(targetId);
            if (window.innerWidth <= 768) sidebar.classList.remove('open');
        }
    });

    // Fetch and parse the Markdown file
    fetch('minirag_course_notes.md')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(markdown => parseMarkdown(markdown))
        .catch(error => {
            navLinksContainer.innerHTML = '<li style="color: #cf222e; padding: 10px;">Error loading file. Are you running a local server? (e.g. start_viewer.bat)</li>';
            contentContainer.innerHTML = `
                <div style="background: #fff8f0; border:1px solid #d0d7de; padding: 30px; border-radius: 8px; text-align: center;">
                    <h2 style="color:#1f2328;">Could not load notes</h2>
                    <p style="color:#656d76; margin-top: 10px;">If you opened index.html directly, your browser blocks fetching local files.</p>
                    <p style="color:#656d76; margin-top: 5px;">Please run the <strong>start_viewer.bat</strong> script to start a local server.</p>
                </div>`;
            console.error('Error fetching markdown:', error);
        });

    function parseMarkdown(markdown) {
        const rawSections = markdown.split(/\n(?=## )/);

        sections = rawSections.map((sectionContent, index) => {
            const lines = sectionContent.split('\n');
            let titleLine = lines[0];
            let title = titleLine.replace(/^##\s+/, '').trim();

            // The very first chunk (before any ##) becomes the Overview
            if (index === 0 && !titleLine.startsWith('##')) {
                title = 'Overview';
            }

            const id = 'section-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const isOverview = (index === 0 && !rawSections[0].trim().startsWith('##'))
                || title === 'Overview';

            return { id, title, content: sectionContent, isOverview };
        });

        sections = sections.filter(sec => sec.content.trim().length > 0);

        renderSidebar();

        const hash = window.location.hash.slice(1);
        const targetSection = sections.find(s => s.id === hash) || sections[0];
        if (targetSection) renderContent(targetSection.id);

        // Log sections for debugging
        console.log('Sections loaded:', sections.map(s => ({ id: s.id, title: s.title, isOverview: s.title === 'Overview' })));
    }

    function renderSidebar(filterText = '') {
        navLinksContainer.innerHTML = '';

        const filteredSections = sections.filter(sec =>
            sec.title.toLowerCase().includes(filterText.toLowerCase())
        );

        if (filteredSections.length === 0) {
            navLinksContainer.innerHTML = '<li style="padding: 10px; color: #656d76;">No results found.</li>';
            return;
        }

        filteredSections.forEach(sec => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${sec.id}`;
            a.className = `nav-link ${sec.id === currentSectionId ? 'active' : ''}`;
            a.textContent = sec.title;

            a.addEventListener('click', (e) => {
                e.preventDefault();
                window.history.pushState(null, null, `#${sec.id}`);
                renderContent(sec.id);
                if (window.innerWidth <= 768) sidebar.classList.remove('open');
            });

            li.appendChild(a);
            navLinksContainer.appendChild(li);
        });
    }

    function renderContent(id) {
        const section = sections.find(s => s.id === id);
        if (!section) return;

        currentSectionId = id;

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });

        // Overview = first section whose content is basically empty (just the doc title)
        const isOverview = section.title === 'Overview';

        if (isOverview) {
            try {
                contentContainer.innerHTML = buildOverviewHTML();
            } catch(e) {
                console.error('buildOverviewHTML error:', e);
                contentContainer.innerHTML = '<p style="color:red">Error rendering overview: ' + e.message + '</p>';
            }
        } else {
            contentContainer.innerHTML = marked.parse(section.content);
        }

        document.getElementById('main-content').scrollTop = 0;
    }

    // ─── Dynamic Overview / Table of Contents ────────────────────────────────

    function buildOverviewHTML() {
        const nonOverview = sections.filter(s => s.title !== 'Overview');

        const intro       = nonOverview.filter(s => /^introduction$/i.test(s.title));
        const toc         = nonOverview.filter(s => /table of contents/i.test(s.title));
        const videos      = nonOverview.filter(s => /videos?\s*\d/i.test(s.title));
        const checkpoints = nonOverview.filter(s => /checkpoint|video links|course complete/i.test(s.title)
                                && !videos.includes(s));
        const advanced    = nonOverview.filter(s => /advanced topic/i.test(s.title));
        const cheatsheet  = nonOverview.filter(s => /cheatsheet|best practices/i.test(s.title));
        const other       = nonOverview.filter(s =>
            !intro.includes(s) && !toc.includes(s) && !videos.includes(s) &&
            !checkpoints.includes(s) && !advanced.includes(s) &&
            !cheatsheet.includes(s)
        );

        const card = (sec) => `
            <a href="#${sec.id}" class="ov-card" data-section-id="${sec.id}">
                <span class="ov-card-title">${sec.title}</span>
                <span class="ov-card-arrow">→</span>
            </a>`;

        const group = (label, emoji, items, mod = '') => items.length === 0 ? '' : `
            <div class="ov-group ${mod}">
                <h2 class="ov-group-label">${emoji} ${label}</h2>
                <div class="ov-cards">${items.map(card).join('')}</div>
            </div>`;

        return `
        <div class="ov-hero">
            <div class="ov-hero-icon">📚</div>
            <h1 class="ov-hero-title">MiniRAG Course Notes</h1>
            <p class="ov-hero-sub">A comprehensive, interactive knowledge base covering RAG systems — from fundamentals to production-ready deployment.</p>

            <div class="ov-credits">
                <span>Based on the <a href="https://github.com/bakrianoo/mini-rag" target="_blank"><strong>MiniRAG Course</strong></a> by <strong>Abu Bakr Soliman</strong></span>
                <span class="ov-credits-sep">·</span>
                <span>Notes prepared by <a href="https://github.com/ahmedamen1" target="_blank"><strong>Ahmed Amin</strong></a> — Zewail City University</span>
            </div>

            <div class="ov-stats">
                <div class="ov-stat"><span class="ov-stat-n">25</span><span class="ov-stat-l">Course Videos</span></div>
                <div class="ov-stat"><span class="ov-stat-n">${advanced.length}</span><span class="ov-stat-l">Advanced Topics</span></div>
                <div class="ov-stat"><span class="ov-stat-n">${sections.length - 1}</span><span class="ov-stat-l">Total Sections</span></div>
            </div>
            <div class="ov-quick">
                <a href="#${videos[0]?.id || ''}" class="ov-btn ov-btn-video">🎬 Start from Video 1</a>
                <a href="#${advanced[0]?.id || ''}" class="ov-btn ov-btn-advanced">🧠 Advanced Topics</a>
                ${cheatsheet[0] ? `<a href="#${cheatsheet[0].id}" class="ov-btn ov-btn-cheatsheet">✅ Production Cheatsheet</a>` : ''}
            </div>
        </div>

        ${group('Getting Started', '📖', [...intro, ...toc])}
        ${group('Course Videos (1 – 25)', '🎬', videos, 'ov-group--videos')}
        ${checkpoints.length ? group('Checkpoints & References', '🏁', checkpoints) : ''}
        ${group('Advanced Topics', '🧠', advanced, 'ov-group--advanced')}
        ${group('Production Reference', '✅', cheatsheet, 'ov-group--cheatsheet')}
        ${other.length ? group('Other Sections', '📋', other) : ''}
        `;
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        renderSidebar(e.target.value);
    });
});
