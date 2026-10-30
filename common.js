/* 共通の動き（作品の表示・スライド・拡大・連絡先・ポップアップ）。通常は編集しません */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isUrl = u => /^https?:\/\//.test(u || "");
const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const BULK_LIST = typeof BULK !== "undefined" ? BULK : [];

document.querySelectorAll("[data-sitename]").forEach(el => el.textContent = CONFIG.siteName);

const isVid = p => /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(p || "");
function thumbInner(it) {
  if (!it.src) return "COMING SOON";
  if (!isVid(it.src)) return '<img src="' + esc(it.src) + '" alt="' + esc(it.title) + '" loading="lazy">';
  // 動画：poster があればその画像、なければ動画の最初の1コマを出す
  return (it.poster
    ? '<img src="' + esc(it.poster) + '" alt="' + esc(it.title) + '" loading="lazy">'
    : '<video src="' + esc(it.src) + '#t=0.1" muted playsinline preload="metadata" tabindex="-1" aria-label="' + esc(it.title) + '"></video>') +
    '<span class="play" aria-hidden="true">&#9654;</span>';
}

/* ---------- 作品 ---------- */
function worksHTML(list) { // list: [{ w: 作品, i: WORKSの中での番号 }]
  return list.map(({ w, i }) =>
    '<button type="button" class="work clickable" data-lb="w:' + i + '" aria-label="' + esc(w.title) + 'を大きく見る">' +
    '<span class="thumb">' + thumbInner(w) + (w.src && w.more && w.more.length ? '<span class="multi">1/' + (w.more.length + 1) + "</span>" : "") + '</span>' +
    '<span class="meta"><span>' + esc(w.title) + '</span><span class="tag">' + esc(w.tag) + "</span></span></button>"
  ).join("");
}

(function initWorks() {
  const grid = $("#worksGrid");
  if (!grid) return;
  // スマホ（幅560px以下）では、少なく表示（data-limit-mobile）
  const mq = window.matchMedia ? window.matchMedia("(max-width: 560px)") : null;
  const getLimit = () => (mq && mq.matches && Number(grid.dataset.limitMobile)) || Number(grid.dataset.limit) || 0;
  const filters = $("#filters");
  let current = "すべて";
  // works.html#tag=マイクラスキン のように、タグを指定して開けます
  const hm = /^#tag=(.+)$/.exec(decodeURIComponent(location.hash || ""));
  if (hm && WORKS.some(w => w.tag === hm[1])) current = hm[1];
  function draw() {
    let list = WORKS.map((w, i) => ({ w, i })).filter(x => current === "すべて" || x.w.tag === current);
    const limit = getLimit();
    if (limit) list = list.slice(0, limit);
    grid.innerHTML = worksHTML(list);
    if (filters) {
      const tags = ["すべて", ...new Set(WORKS.map(w => w.tag))];
      filters.innerHTML = tags.map(t => '<button type="button" aria-pressed="' + (t === current) + '" data-tag="' + esc(t) + '">' + esc(t) + "</button>").join("");
    }
  }
  if (filters) filters.addEventListener("click", e => {
    const b = e.target.closest("button[data-tag]");
    if (!b) return;
    current = b.dataset.tag;
    draw();
  });
  draw();
  if (mq) (mq.addEventListener ? mq.addEventListener("change", draw) : mq.addListener(draw));
})();

/* ---------- 量産依頼（左右にスライド） ---------- */
(function initBulk() {
  const sec = $("#bulk"), track = $("#bulkTrack");
  if (!sec || !track) return;
  if (!BULK_LIST.length) { sec.hidden = true; return; }
  track.innerHTML = BULK_LIST.map((b, i) =>
    '<article class="bcard">' +
    '<button type="button" class="thumb-btn" data-lb="b:' + i + '" aria-label="' + esc(b.title) + 'を大きく見る"><span class="thumb">' + thumbInner(b) + "</span></button>" +
    '<div class="bcard-body"><h3 class="bcard-title">' + esc(b.title) + "</h3>" +
    (b.desc ? '<p class="bcard-desc">' + esc(b.desc) + "</p>" : "") +
    (isUrl(b.url)
      ? '<a class="btn pink" href="' + esc(b.url) + '" target="_blank" rel="noopener noreferrer">ご依頼はこちら！</a>'
      : '<span class="btn off">準備中（リンク未設定）</span>') +
    "</div></article>"
  ).join("");
  const prev = $("#bulkPrev"), next = $("#bulkNext"), nav = $("#bulkNav");
  const step = () => { const c = track.querySelector(".bcard"); return c ? c.getBoundingClientRect().width + 22 : 300; };
  const update = () => {
    nav.hidden = track.scrollWidth <= track.clientWidth + 2;
    const hint = $("#bulkHint"); if (hint) hint.hidden = nav.hidden;
    prev.disabled = track.scrollLeft <= 8;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
  };
  const go = d => track.scrollBy({ left: d * step(), behavior: reduceMotion() ? "auto" : "smooth" });
  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  track.addEventListener("scroll", update, { passive: true });
  track.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  });
  window.addEventListener("resize", update);
  update();
})();

/* ---------- 拡大表示（作品・量産依頼） ---------- */
(function initLightbox() {
  const box = $("#lightbox");
  if (!box) return;
  const root = document.documentElement;
  let imgs = [], pos = 0, ttl = "";
  // 2枚目以降（more）があるときは、丸い矢印ボタンと「1/3」を出す
  function show(title) {
    if (title !== undefined) ttl = title;
    const media = $("#lbMedia");
    if (!imgs.length) { media.innerHTML = '<div class="lb-ph">COMING SOON</div>'; return; }
    const multi = imgs.length > 1;
    const cur = imgs[pos];
    media.innerHTML = '<div class="lb-stage">' + (isVid(cur)
      ? '<video src="' + esc(cur) + '" controls playsinline loop controlslist="nodownload noplaybackrate" disablepictureinpicture preload="metadata"></video>'
      : '<img src="' + esc(cur) + '" alt="' + esc(ttl) + '">') +
      (multi ? '<button type="button" class="lb-arrow prev" data-step="-1" aria-label="前の画像">&#8249;</button>' +
               '<button type="button" class="lb-arrow next" data-step="1" aria-label="次の画像">&#8250;</button>' +
               '<span class="lb-count">' + (pos + 1) + " / " + imgs.length + "</span>" : "") + "</div>";
  }
  function step(d) { if (imgs.length < 2) return; pos = (pos + d + imgs.length) % imgs.length; show(); }
  box.addEventListener("click", e => {
    const a = e.target.closest("[data-step]");
    if (a) { e.stopImmediatePropagation(); step(Number(a.dataset.step)); }
  });
  box.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") step(-1); else if (e.key === "ArrowRight") step(1);
  });
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-lb]");
    if (!t) return;
    const [kind, idx] = t.dataset.lb.split(":");
    const it = (kind === "b" ? BULK_LIST : WORKS)[Number(idx)];
    if (!it) return;
    imgs = it.src ? [it.src].concat(Array.isArray(it.more) ? it.more.filter(Boolean) : []) : [];
    pos = 0; show(it.title);
    $("#lbTitle").textContent = it.title;
    const tag = kind === "b" ? "量産依頼" : it.tag;
    const tg = $("#lbTag"); tg.textContent = tag || ""; tg.hidden = !tag;
    const d = $("#lbDesc"); d.textContent = it.desc || ""; d.hidden = !it.desc;
    $("#lbActions").innerHTML = (kind === "b" && isUrl(it.url))
      ? '<a class="btn pink" href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer">ご依頼はこちら！</a>' : "";
    box.showModal(); root.classList.add("no-scroll"); box.scrollTop = 0;
  });
  $("#lightboxClose").addEventListener("click", () => box.close());
  box.addEventListener("click", e => {
    const r = box.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) box.close();
  });
  box.addEventListener("close", () => { root.classList.remove("no-scroll"); $("#lbMedia").innerHTML = ""; });
})();

/* ---------- 連絡先（プロフィール風のカード） ---------- */
(function initProfile() {
  const el = $("#profileCard");
  if (!el) return;
  const p = CONFIG.profile || {}, c = CONFIG.contact || {};
  const name = p.name || CONFIG.siteName;
  const icon = p.icon ? '<img src="' + esc(p.icon) + '" alt="">' : esc(Array.from(name)[0] || "");
  const mail = c.email || "";
  const masked = mail.indexOf("★") >= 0;
  const rows = [];
  rows.push(mail
    ? '<li><span class="p-tag">MAIL</span><a href="#" data-mail>' + esc(mail) + "</a>" +
      (masked ? '<small class="p-note">★を@に変えてお送りください</small>' : "") + "</li>"
    : '<li><span class="p-tag">MAIL</span><span class="off">準備中</span></li>');
  rows.push(isUrl(c.xUrl)
    ? '<li><span class="p-tag">X</span><a href="' + esc(c.xUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(c.xHandle || c.xUrl) + "</a></li>"
    : '<li><span class="p-tag">X</span><span class="off">準備中</span></li>');
  el.innerHTML =
    '<div class="p-icon" aria-hidden="true">' + icon + "</div>" +
    '<div class="p-body"><p class="p-name">' + esc(name) + "</p>" +
    (p.bio ? '<p class="p-bio">' + esc(p.bio) + "</p>" : "") +
    '<ul class="p-links">' + rows.join("") + "</ul>" +
    ($("#messageField")
      ? '<div class="p-copy"><button type="button" class="btn white" id="tmplCopy">問い合わせテンプレートをコピー</button>' +
        '<small>見積もりも自動で入ります</small><span id="tmplMsg" class="copy-msg" role="status"></span></div>'
      : "") +
    "</div>";
  // クリックしたときだけ、★を本物の@に直してメールを開く（ページの中に本物のアドレスは書かない）
  el.addEventListener("click", e => {
    if (!e.target.closest("a[data-mail]")) return;
    e.preventDefault();
    window.location.href = "mailto:" + mail.replace(/★/g, "@");
  });
})();

/* ---------- ポップアップ（注意事項など）の開け閉め ---------- */
(function initPopups() {
  const root = document.documentElement;
  document.addEventListener("click", e => {
    const o = e.target.closest("[data-open]");
    if (o) {
      const d = document.getElementById(o.getAttribute("data-open"));
      if (!d) return;
      d.showModal(); root.classList.add("no-scroll");
      const body = d.querySelector(".nd-body"); if (body) body.scrollTop = 0;
      return;
    }
    const x = e.target.closest("[data-close]");
    if (x) { x.closest("dialog").close(); return; }
    if (e.target.id === "notesDialog") e.target.close();
  });
  const nd = document.getElementById("notesDialog");
  if (nd) nd.addEventListener("close", () => root.classList.remove("no-scroll"));
})();

/* ---------- 下の料金バー（スマホ）：見積もりを見ているときだけ出す ---------- */
(function initPriceBar() {
  const bar = $("#mbar"), sec = $("#price");
  if (!bar || !sec) return;
  const set = on => { bar.classList.toggle("show", on); bar.setAttribute("aria-hidden", on ? "false" : "true"); };
  if (!("IntersectionObserver" in window)) { set(true); return; }
  // 画面の真ん中あたりに見積もりが来ているときだけ表示
  new IntersectionObserver(es => set(es[0].isIntersecting), { rootMargin: "-30% 0px -30% 0px", threshold: 0 }).observe(sec);
})();

/* ---------- コピー（コピーできない環境でも動くように、二重に用意） ---------- */
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
  } catch (e) { /* 下の方法を試す */ }
  const ta = document.createElement("textarea");
  ta.value = text; ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
  document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  ta.remove();
  return ok;
}

/* ---------- お問い合わせのテンプレート ---------- */
(function initTemplate() {
  const ta = $("#messageField");
  if (!ta || typeof INQUIRY_TEMPLATE === "undefined") return;
  const block = (t, body) => "【" + t.label + "】\n" + body + "\n";
  // フォームの入力欄：最初から入れておく（リセットしても戻る）
  const formText = INQUIRY_TEMPLATE.filter(t => t.form !== false)
    .map(t => block(t, (t.hint ? "（" + t.hint + "）" : "") + (t.formNote ? "\n（" + t.formNote + "）" : ""))).join("\n");
  ta.value = ta.defaultValue = formText;
  // XやメールのDM用：全項目。見積もりを選んでいれば、その内容を入れる
  const msg = $("#tmplMsg"); let timer;
  const say = m => { msg.textContent = m; clearTimeout(timer); timer = setTimeout(() => { msg.textContent = ""; }, 6000); };
  $("#tmplCopy").addEventListener("click", async () => {
    const est = ($("#estimateField") || {}).value || "";
    const text = INQUIRY_TEMPLATE.filter(t => t.dm !== false).map(t => block(t, t.estimate && est ? est : (t.hint ? "（" + t.hint + "）" : ""))).join("\n");
    say((await copyText(text)) ? "コピーしました。XのDMやメールに貼り付けて、書き込んでください。" : "コピーできませんでした。お手数ですが、フォームの項目を見ながら書いてください。");
  });
})();

/* ---------- YouTube（最新の動画かshortsを埋め込み。未設定なら COMING SOON） ---------- */
(function initYoutube() {
  const hosts = document.querySelectorAll("[data-youtube]");
  if (!hosts.length) return;
  const y = typeof YOUTUBE !== "undefined" ? YOUTUBE : null;
  if (!y || !y.enabled) { hosts.forEach(h => { const s = h.closest("section"); (s || h).hidden = true; }); return; }
  const idOk = /^[\w-]{6,20}$/.test(y.videoId || "");
  const player = idOk
    ? '<div class="yt-player' + (y.isShort ? " short" : "") + '"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(y.videoId) +
      '" title="' + esc(y.title) + '" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>'
    : '<div class="yt-player ph' + (y.isShort ? " short" : "") + '"><span>COMING SOON</span></div>';
  const btn = isUrl(y.channelUrl)
    ? '<a class="btn pink" href="' + esc(y.channelUrl) + '" target="_blank" rel="noopener noreferrer">YouTubeチャンネルへ</a>'
    : '<span class="btn off">チャンネル準備中</span>';
  hosts.forEach(h => {
    h.innerHTML = '<div class="yt-text"><span class="eyebrow">YOUTUBE</span><h2>' + esc(y.title) + "</h2><p>" + esc(y.text) + "</p>" + btn + "</div>" + player;
  });
})();

/* ---------- 画像・動画の保存をしにくくする（右クリック・長押しメニュー・ドラッグ）。スクリーンショットなどは防げません ---------- */
(function protectImages() {
  const media = t => t && t.closest && t.closest("img, video, .thumb, .lb-media, .hero-media, .p-icon, .yt-player");
  document.addEventListener("contextmenu", e => { if (media(e.target)) e.preventDefault(); });
  document.addEventListener("dragstart", e => { if (e.target.tagName === "IMG" || e.target.tagName === "VIDEO") e.preventDefault(); });
  const mark = root => root.querySelectorAll("img").forEach(i => { i.draggable = false; });
  mark(document);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType === 1) { if (n.tagName === "IMG") n.draggable = false; else mark(n); }
  }))).observe(document.body, { childList: true, subtree: true });
})();

/* ---------- 現在のスケジュール ---------- */
(function initSchedule() {
  const sec = $("#schedule"), list = $("#schedList");
  if (!sec || !list) return;
  const S = typeof SCHEDULE !== "undefined" ? SCHEDULE : null;
  if (!S || !S.enabled || !(S.months || []).length) { sec.hidden = true; return; }
  const norm = { "◎": "◎", "〇": "〇", "○": "〇", "◯": "〇", "△": "△", "×": "×", "✕": "×", "x": "×", "X": "×" };
  const info = { "◎": ["s-a", "余裕があります"], "〇": ["s-b", "受付可能です"], "△": ["s-c", "内容により受付可能です"], "×": ["s-d", "受付不可"] };
  const ms = S.months.map(m => {
    const mm = /^(\d{4})-(\d{1,2})$/.exec(m.month || "");
    const st = norm[String(m.status || "").trim()];
    return mm && st ? { y: mm[1], mo: Number(mm[2]), st, memo: m.memo || "" } : null;
  }).filter(Boolean);
  const head = ms.map((m, i) => '<th scope="col"><small>' + ((i === 0 || m.mo === 1) ? m.y + "年" : "&nbsp;") + "</small>" + m.mo + "月</th>").join("");
  const cells = ms.map(m => '<td><span class="sch-s ' + info[m.st][0] + '" title="' + info[m.st][1] + '" aria-label="' + info[m.st][1] + '">' + m.st + "</span></td>").join("");
  const memos = ms.filter(m => m.memo).map(m => "<li>" + m.mo + "月：" + esc(m.memo) + "</li>").join("");
  const legend = ["◎", "〇", "△", "×"].map(k => '<li><span class="sch-s mini ' + info[k][0] + '" aria-hidden="true">' + k + "</span>" + info[k][1] + "</li>").join("");
  list.innerHTML = '<table class="sch"><caption class="sr">月ごとの受付状況</caption><thead><tr><th scope="row" class="sch-k">納期</th>' + head +
    '</tr></thead><tbody><tr><th scope="row" class="sch-k">受付</th>' + cells + "</tr></tbody></table>" +
    '<ul class="sch-legend">' + legend + "</ul>" + (memos ? '<ul class="sch-memo">' + memos + "</ul>" : "");
  const u = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(S.updated || "");
  if (u) $("#schedUpdated").textContent = "（" + Number(u[2]) + "月" + Number(u[3]) + "日 更新）";
})();
