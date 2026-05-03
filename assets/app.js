const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.getElementById("year").textContent = new Date().getFullYear();

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inlineMarkdown(value) {
  let output = escapeHtml(value);
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a class="text-link" href="$2" target="_blank" rel="noopener">$1</a>');
  return output;
}

function renderMarkdown(markdown) {
  const source = markdown.replace(/^---[\s\S]*?---\s*/, "").trim();
  const lines = source.split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let list = [];
  let code = [];
  let inCode = false;

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  }

  lines.forEach((line) => {
    if (line.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        inCode = true;
      }
      return;
    }

    if (inCode) {
      code.push(line);
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length + 1;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      return;
    }

    const item = line.match(/^[-*]\s+(.+)$/);
    if (item) {
      flushParagraph();
      list.push(item[1]);
      return;
    }

    paragraph.push(line.trim());
  });

  flushParagraph();
  flushList();
  if (code.length) html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  return html.join("");
}

async function loadPosts() {
  const list = document.getElementById("postList");
  const reader = document.getElementById("postReader");
  if (!list || !reader) return;

  try {
    const response = await fetch("posts/manifest.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load manifest");
    const posts = await response.json();
    const sorted = posts.slice().sort((a, b) => b.date.localeCompare(a.date));

    list.innerHTML = sorted.map((post) => `
      <button class="post-card" type="button" data-slug="${escapeHtml(post.slug)}">
        <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.summary)}</p>
        <span class="tags">${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</span>
      </button>
    `).join("");

    async function openPost(slug) {
      const post = sorted.find((item) => item.slug === slug);
      if (!post) return;
      const article = await fetch(`posts/${post.file}`, { cache: "no-store" });
      if (!article.ok) throw new Error("Unable to load post");
      const markdown = await article.text();
      reader.hidden = false;
      reader.innerHTML = `
        <div class="reader-top">
          <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time>
          <button class="small-button" type="button" id="closePost">Back</button>
        </div>
        <h1>${escapeHtml(post.title)}</h1>
        ${renderMarkdown(markdown)}
      `;
      reader.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      document.getElementById("closePost").addEventListener("click", () => {
        reader.hidden = true;
        history.replaceState(null, "", "#recent-blog");
      });
      history.replaceState(null, "", `#post=${encodeURIComponent(slug)}`);
    }

    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-slug]");
      if (!button) return;
      openPost(button.dataset.slug).catch(() => {
        reader.hidden = false;
        reader.innerHTML = "<p>Article failed to load.</p>";
      });
    });

    const selected = window.location.hash.match(/^#post=(.+)$/);
    if (selected) {
      openPost(decodeURIComponent(selected[1])).catch(() => {});
    }
  } catch {
    list.innerHTML = '<p class="muted">No posts found.</p>';
  }
}

loadPosts();
