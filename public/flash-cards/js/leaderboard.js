/**
 * Leaderboard rendering helpers.
 */

export function renderLeaderboard(olEl, entries, highlightName = null, options = {}) {
  if (!olEl) return;
  olEl.innerHTML = "";

  if (options.loading) {
    const p = document.createElement("p");
    p.className = "leaderboard-empty";
    p.textContent = "Loading worldwide leaderboard…";
    olEl.appendChild(p);
    return;
  }

  if (options.error) {
    const p = document.createElement("p");
    p.className = "leaderboard-empty";
    p.textContent = options.error;
    olEl.appendChild(p);
    return;
  }

  if (!entries.length) {
    const p = document.createElement("p");
    p.className = "leaderboard-empty";
    p.textContent = "No scores yet worldwide — be the first!";
    olEl.appendChild(p);
    return;
  }

  const offset = Number(options.offset || 0);
  entries.forEach((entry, index) => {
    const li = document.createElement("li");
    if (highlightName && entry.name === highlightName) li.classList.add("highlight");

    const left = document.createElement("span");
    left.innerHTML = `<span class="rank">#${offset + index + 1}</span>${escapeHtml(entry.name)}${
      entry.age != null ? ` · ${entry.age}y` : ""
    }`;

    const right = document.createElement("span");
    right.textContent = `${entry.score}/${entry.total} (${entry.percent}%)`;

    li.append(left, right);
    olEl.appendChild(li);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
