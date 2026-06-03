# 📚 MiniRAG Course Notes Viewer

A structured, interactive knowledge base built around the **MiniRAG YouTube course** — a comprehensive Arabic-language series covering Retrieval-Augmented Generation (RAG) systems from the ground up to production-ready deployment.

> **Course Instructor:** Abu Bakr Soliman (bakrianoo) — [mini-rag GitHub Repo](https://github.com/bakrianoo/mini-rag)
> **Built & Researched by:** [Ahmed Amin](https://github.com/ahmedamen1) — Zewail City University

---

## ✨ Features

- 📖 **25 video chapters** — every concept from the course, deeply explained
- 🧠 **19 Advanced Topics** — beyond the course: GraphRAG, Agentic RAG, Arabic RAG, Evaluation, Security, and more
- ✅ **Production RAG Cheatsheet** — a complete checklist and best-practices guide for building ideal RAG systems
- 🔍 **Live search** — instantly filter chapters from the sidebar
- 💻 **Syntax-highlighted code** — all code examples are formatted and highlighted
- 📱 **Responsive** — works on desktop and mobile
- ⚡ **Zero dependencies** — pure HTML/JS/CSS, runs with a simple local server

---

## 📖 Topics Covered

### Core Course (Videos 1–25)
| Range | Topics |
|-------|--------|
| Videos 1–2 | RAG fundamentals, system design |
| Videos 3–4 | Dev setup (WSL, Docker, Git, Conda), project architecture |
| Videos 5–8 | FastAPI, routes, file upload, document processing & chunking |
| Videos 9–11 | Docker + MongoDB + Motor, schemas, indexing |
| Videos 12–13 | Pipeline enhancements, Checkpoint 1 |
| Videos 14–15 | LLM Factory + Vector DB Factory |
| Videos 16–18 | Semantic search, augmented answers, Checkpoint 2 |
| Video 19 | Ollama local LLMs, quantization, ngrok |
| Videos 20–21 | PostgreSQL, SQLAlchemy, Alembic, PgVector |
| Videos 22–23 | Deployment: Nginx, Prometheus, Grafana, CI/CD |
| Videos 24–25 | Celery workers, Redis, RabbitMQ, Flower |

### Advanced Topics (Beyond the Course)
1. Advanced Retrieval — Hybrid search, re-ranking, HyDE, parent-child chunking
2. Query Understanding & Routing
3. Advanced Document Processing — Tables, images, OCR
4. Agentic RAG — ReAct, RAPTOR, iterative retrieval
5. Evaluation & RAGAS
6. Production Safety & Security
7. Conversation & Memory
8. Performance & Scaling
9. Multi-modal RAG
10. Embedding Models Deep Dive
11. Chunking Strategies Deep Dive
12. GraphRAG & Knowledge Graphs
13. Prompt Engineering for RAG
14. RAG for Arabic & RTL Languages
15. Prompt Injection & RAG Security
16. Metadata Filtering
17. Cost Optimization & Token Management
18. Testing RAG Systems
19. LangChain & LlamaIndex Integration
20. ✅ **Production RAG Cheatsheet** — Steps, checklist & best practices

---

## 🚀 Getting Started

### Prerequisites
- Python 3.x **or** any local HTTP server (Node.js, VS Code Live Server, etc.)

### Run Locally

**Option 1 — Use the included batch file (Windows):**
```bat
start_viewer.bat
```

**Option 2 — Python built-in server:**
```bash
cd Mini_RAG
python -m http.server 8080
# Then open: http://localhost:8080
```

**Option 3 — Node.js:**
```bash
npx serve .
```

> ⚠️ You **cannot** open `index.html` directly by double-clicking — the browser blocks local file fetches for security. Always use a local server.

---

## 🗂️ Project Structure

```
Mini_RAG/
├── index.html              # App shell — sidebar + content area
├── style.css               # Light theme design system
├── script.js               # Markdown parser, routing, search
├── minirag_course_notes.md # The full knowledge base (~850KB)
├── start_viewer.bat        # One-click local server launcher (Windows)
├── README.md               # This file
└── CONTRIBUTING.md         # Guide for adding new topics
```

---

## 🤝 Contributing

Want to add a missing topic, fix a typo, or expand an existing section? See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

In short:
1. Fork this repository
2. Add your section to `minirag_course_notes.md` following the template in `CONTRIBUTING.md`
3. Open a Pull Request with a short description of what you added

---

## 👤 About the Author

<table>
  <tr>
    <td valign="top" width="60%">

**Ahmed Amin**
AI & ML Engineer | LLM Systems Researcher

🎓 **Education**
University of Science and Technology at Zewail City

💡 **Open To**
- AI Research
- Applied ML / Computer Vision Roles
- LLM Systems & Efficiency Research

    </td>
    <td valign="top" width="40%">

📫 **Connect with Me**

[![GitHub](https://img.shields.io/badge/GitHub-ahmedamen1-181717?style=flat&logo=github)](https://github.com/ahmedamen1)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-ahmed--amin-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/ahmed-amin)

[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-4CAF50?style=flat&logo=google-chrome)](https://ahmedamen1.github.io/Portofolio/)

[![Email](https://img.shields.io/badge/Email-s--ahmed.mohamed%40zewailcity.edu.eg-D44638?style=flat&logo=gmail)](mailto:s-ahmed.mohamed@zewailcity.edu.eg)

    </td>
  </tr>
</table>

---

## 📜 License

This project is open for learning and sharing. Content is based on the MiniRAG course by Abu Bakr Soliman. All code examples are for educational purposes.
