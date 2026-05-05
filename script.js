document.addEventListener('DOMContentLoaded', () => {
    const navLinksContainer = document.getElementById('nav-links');
    const contentContainer = document.getElementById('content-container');
    const searchInput = document.getElementById('search-input');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');

    let sections = []; // Will hold objects: { id, title, content }
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

    // Fetch and parse the Markdown file
    fetch('minirag_course_notes.md')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(markdown => parseMarkdown(markdown))
        .catch(error => {
            navLinksContainer.innerHTML = '<li style="color: #ff7b72; padding: 10px;">Error loading file. Are you running a local server? (e.g. start_viewer.bat)</li>';
            contentContainer.innerHTML = `
                <div style="background: #21262d; padding: 30px; border-radius: 8px; text-align: center;">
                    <h2>Could not load notes</h2>
                    <p style="color: #8b949e; margin-top: 10px;">If you opened index.html directly, your browser blocks fetching local files.</p>
                    <p style="color: #8b949e; margin-top: 5px;">Please run the <strong>start_viewer.bat</strong> script to start a local server.</p>
                </div>`;
            console.error('Error fetching markdown:', error);
        });

    function parseMarkdown(markdown) {
        // Split by '## ' which indicates top-level sections in this document
        const rawSections = markdown.split(/\n(?=## )/);
        
        sections = rawSections.map((sectionContent, index) => {
            // Find the title (first line)
            const lines = sectionContent.split('\n');
            let titleLine = lines[0];
            
            // Clean up title
            let title = titleLine.replace(/^##\s+/, '').trim();
            // If it's the very first part of the file (before any ##), it might not have a title
            if (index === 0 && !titleLine.startsWith('##')) {
                title = "Overview";
            }

            // Create a safe ID
            const id = 'section-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            return { id, title, content: sectionContent };
        });

        // Some sections might be empty or too short if the split was weird, filter them
        sections = sections.filter(sec => sec.content.trim().length > 0);

        renderSidebar();
        
        // Load first section or URL hash
        const hash = window.location.hash.slice(1);
        const targetSection = sections.find(s => s.id === hash) || sections[0];
        
        if (targetSection) {
            renderContent(targetSection.id);
        }
    }

    function renderSidebar(filterText = '') {
        navLinksContainer.innerHTML = '';
        
        const filteredSections = sections.filter(sec => 
            sec.title.toLowerCase().includes(filterText.toLowerCase())
        );

        if (filteredSections.length === 0) {
            navLinksContainer.innerHTML = '<li style="padding: 10px; color: #8b949e;">No results found.</li>';
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
                
                // Close mobile sidebar on click
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            });

            li.appendChild(a);
            navLinksContainer.appendChild(li);
        });
    }

    function renderContent(id) {
        const section = sections.find(s => s.id === id);
        if (!section) return;

        currentSectionId = id;
        
        // Update active class in sidebar
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Convert markdown to HTML and inject
        contentContainer.innerHTML = marked.parse(section.content);

        // Scroll to top
        document.getElementById('main-content').scrollTop = 0;
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        renderSidebar(e.target.value);
    });
});
