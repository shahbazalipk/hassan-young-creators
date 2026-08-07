/**
 * Certificate download, copy-link, and WhatsApp share.
 */

export function fillCertificate({ name, age, score, total }) {
  document.getElementById("cert-name").textContent = name;
  document.getElementById("cert-age").textContent = String(age);
  document.getElementById("cert-score").textContent = String(score);
  document.getElementById("cert-total").textContent = String(total);
  const percent = total ? Math.round((score / total) * 100) : 0;
  document.getElementById("cert-percent").textContent = `${percent}% correct`;
  document.getElementById("cert-date").textContent = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Draw a polished certificate PNG with Canvas 2D (no external deps). */
export async function saveCertificatePng(filename = "slash-cards-certificate.png") {
  const name = document.getElementById("cert-name").textContent;
  const age = document.getElementById("cert-age").textContent;
  const score = document.getElementById("cert-score").textContent;
  const total = document.getElementById("cert-total").textContent;
  const percent = document.getElementById("cert-percent").textContent;
  const date = document.getElementById("cert-date").textContent;

  const w = 1200;
  const h = 850;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // Background
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#fffdf8");
  grad.addColorStop(1, "#f3e7d3");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Double border
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = 10;
  ctx.strokeRect(40, 40, w - 80, h - 80);
  ctx.lineWidth = 3;
  ctx.strokeRect(55, 55, w - 110, h - 110);

  ctx.fillStyle = "#b8860b";
  ctx.font = "700 28px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("SLASH CARDS", w / 2, 140);

  ctx.fillStyle = "#0f2d48";
  ctx.font = "700 54px Georgia, serif";
  ctx.fillText("Certificate of Completion", w / 2, 230);

  ctx.fillStyle = "#4a5d70";
  ctx.font = "400 26px Georgia, serif";
  ctx.fillText("This certifies that", w / 2, 310);

  ctx.fillStyle = "#c0392b";
  ctx.font = "700 64px Georgia, serif";
  ctx.fillText(name, w / 2, 400);

  ctx.fillStyle = "#2c3e50";
  ctx.font = "600 28px Georgia, serif";
  ctx.fillText(`Age ${age}  ·  Score ${score} / ${total}`, w / 2, 470);

  ctx.fillStyle = "#1a5f7a";
  ctx.font = "700 26px Georgia, serif";
  ctx.fillText(percent, w / 2, 520);

  ctx.fillStyle = "#6a7b8c";
  ctx.font = "400 22px Georgia, serif";
  ctx.fillText(`Created by HASSAAN  ·  ${date}`, w / 2, 620);

  // Ornament lines
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.25, 160);
  ctx.lineTo(w * 0.75, 160);
  ctx.moveTo(w * 0.25, 660);
  ctx.lineTo(w * 0.75, 660);
  ctx.stroke();

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function buildSharePayload({ name, age, score, total }) {
  const percent = total ? Math.round((score / total) * 100) : 0;
  const text = `🎉 ${name} (age ${age}) just finished Slash Cards with a score of ${score}/${total} (${percent}%)! Created by HASSAAN.`;
  const url = buildResultLink({ name, age, score, total });
  return { text, url };
}

export function buildResultLink({ name, age, score, total }) {
  const u = new URL(window.location.href.split("#")[0]);
  u.searchParams.set("result", "1");
  u.searchParams.set("name", name);
  u.searchParams.set("age", String(age));
  u.searchParams.set("score", String(score));
  u.searchParams.set("total", String(total));
  return u.toString();
}

export async function copyResultLink(payload) {
  const { text, url } = buildSharePayload(payload);
  const full = `${text}\n${url}`;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(full);
    return true;
  }
  const ta = document.createElement("textarea");
  ta.value = full;
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  ta.remove();
  return ok;
}

export function shareWithParentsWhatsApp(payload) {
  const { text, url } = buildSharePayload(payload);
  const wa = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
  window.open(wa, "_blank", "noopener,noreferrer");
}
