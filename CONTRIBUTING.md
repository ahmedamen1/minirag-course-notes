# 🤝 Contributing to MiniRAG Course Notes

Thank you for wanting to contribute! This knowledge base is a living document — if you know something about RAG that isn't here yet, or you can improve what's already written, your contribution is welcome.

---

## 📋 What You Can Contribute

| Type | Examples |
|------|---------|
| **New Advanced Topic** | A RAG technique, tool, or concept not yet covered |
| **Expand an existing section** | Deeper explanation, better code example, a missing edge case |
| **Fix an error** | Typo, incorrect code, outdated library version |
| **Add a resource** | A paper, blog post, or tool worth linking to |
| **Translate** | An Arabic explanation of a concept (the course is Arabic-first) |

---

## 🧱 How the File is Structured

The entire knowledge base lives in `minirag_course_notes.md`. It uses a specific heading hierarchy:

```
## 🎬 Video N — Title           ← Top-level section (appears in sidebar)
### 🔹 Sub-topic Title          ← Sub-section
#### Sub-sub-topic              ← Rarely used, only for long sections
```

For advanced topics beyond the course:
```
## 🧠 Advanced Topic N — Title  ← Appears in sidebar
### 🔹 Sub-topic                ← Sub-section
```

---

## 📝 Template for a New Advanced Topic

Copy this template and fill it in when adding a new section:

```markdown
---

## 🧠 Advanced Topic N — Your Topic Title

> *One sentence describing what this topic is and why it matters for RAG systems.*

---

### 🔹 What Is [Topic]?

Explain the concept clearly in plain language. Assume the reader has completed the core course (Videos 1–25) but may not know this advanced topic.

---

### 🔹 Why It Matters for RAG

Explain the specific problem this solves or the improvement it enables in a RAG pipeline.

---

### 🔹 How It Works

Include a diagram (ASCII is fine), a step-by-step breakdown, or a comparison table.

```python
# Include a working code example whenever possible
# Make it concrete and runnable, not pseudocode
```

---

### 🔹 When to Use It

| Situation | Recommendation |
|-----------|---------------|
| Use when... | ✅ |
| Avoid when... | ❌ |

---

### 🔹 Updated requirements.txt

```text
# List any new packages needed for this topic
new-package==1.0.0
```
```

---

## ✅ Quality Guidelines

Before submitting, check these:

- [ ] **Concrete, not abstract** — every concept has at least one real code example
- [ ] **Complete** — no "TODO" or placeholder text
- [ ] **Accurate** — library versions, API names, and behavior are verified
- [ ] **Consistent style** — use emojis in headings as the existing sections do
- [ ] **Cites sources** — link to papers, docs, or blog posts when referencing research
- [ ] **No secrets** — never include real API keys or credentials in examples
- [ ] **English** — the main document is in English (Arabic notes can be added as blockquotes)

---

## 🔄 Contribution Workflow

### Step 1 — Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/Mini_RAG.git
cd Mini_RAG
```

### Step 2 — Create a Branch

Name your branch after what you're adding:
```bash
git checkout -b add/topic-embedding-models-deep-dive
git checkout -b fix/typo-in-video-8-chunking
git checkout -b expand/agentic-rag-raptor-example
```

### Step 3 — Add Your Content

Open `minirag_course_notes.md` and add your section following the template above.

**Where to add it:**
- New Advanced Topic → append after the last `## Advanced Topic N` section
- Expanding an existing section → find the right `###` heading and add content below it
- Fix → edit in place

### Step 4 — Test Locally

Run the viewer and make sure your section:
- Appears in the sidebar with the correct title
- Renders without broken markdown
- Code blocks are syntax-highlighted correctly

```bash
python -m http.server 8080
# Open http://localhost:8080 and navigate to your section
```

### Step 5 — Commit and Push

```bash
git add minirag_course_notes.md
git commit -m "docs: add Advanced Topic 20 - Embedding Fine-Tuning"
git push origin add/topic-embedding-models-deep-dive
```

### Step 6 — Open a Pull Request

Go to GitHub and open a PR. In the description:
- What topic did you add or change?
- Why is it relevant to RAG?
- Any sources or references?

---

## 💬 Commit Message Format

Use this format for clarity:

| Prefix | Use for |
|--------|---------|
| `docs: add ...` | New section or topic |
| `docs: expand ...` | Expanding an existing section |
| `fix: ...` | Typo, error, broken code |
| `style: ...` | CSS/UI changes to the viewer |
| `feat: ...` | New viewer feature (search, navigation, etc.) |

**Examples:**
```
docs: add Advanced Topic 20 - Embedding Model Fine-Tuning
docs: expand Video 8 chunking section with semantic chunking example
fix: correct pgvector HNSW index parameter in Video 21
```

---

## 🙋 Questions?

If you're unsure whether your contribution fits or how to structure it, open a GitHub Issue first and describe what you want to add. Happy to help!
