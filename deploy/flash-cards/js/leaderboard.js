/**
 * Leaderboard rendering helpers.
 */

export function renderLeaderboard(olEl, entries, highlightName = null) {
  if (!olEl) return;
  olEl.innerHTML = "";

  if (!entries.length) {
    const p = document.createElement("p");
    p.className = "leaderboard-empty";
    p.textContent = "No scores yet — be the first!";
    olEl.appendChild(p);
    return;
  }

  entries.forEach((entry, index) => {
    const li = document.createElement("li");
    if (highlightName && entry.name === highlightName) li.classList.add("highlight");

    const left = document.createElement("span");
    left.innerHTML = `<span class="rank">#${index + 1}</span>${escapeHtml(entry.name)} · ${entry.age}y`;

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
