const DATA_URL = "./data/weekly-hoc-report.json";
const number = new Intl.NumberFormat("en-US");
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 });

const state = {
  rows: [],
  filters: {
    search: "",
    focus: "all",
  },
};

const els = {
  reportWindow: document.getElementById("reportWindow"),
  statusSummary: document.getElementById("statusSummary"),
  summaryCards: document.getElementById("summaryCards"),
  briefingList: document.getElementById("briefingList"),
  leadersList: document.getElementById("leadersList"),
  topFiveList: document.getElementById("topFiveList"),
  lowestList: document.getElementById("lowestList"),
  growthList: document.getElementById("growthList"),
  vendorList: document.getElementById("vendorList"),
  searchInput: document.getElementById("searchInput"),
  focusSelect: document.getElementById("focusSelect"),
  preRegChart: document.getElementById("preRegChart"),
  weeklyGrowthChart: document.getElementById("weeklyGrowthChart"),
  memberMixChart: document.getElementById("memberMixChart"),
  vendorChart: document.getElementById("vendorChart"),
  tableBody: document.getElementById("tableBody"),
};

init();

async function init() {
  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
    state.rows = (await response.json()).map(enrichRow);
    bindEvents();
    render();
  } catch (error) {
    document.body.innerHTML = `
      <div class="page-shell">
        <div class="panel" style="padding: 24px;">
          <p class="eyebrow">Data Error</p>
          <h1 style="margin: 0 0 10px;">Unable to load the weekly HOC data.</h1>
          <p class="muted" style="margin: 0;">Check that <code>${DATA_URL}</code> is present beside the dashboard and refresh the page.</p>
        </div>
      </div>
    `;
    console.error(error);
  }
}

function enrichRow(row) {
  const totalPreRegistered = row.totalPreRegistered || 0;
  const memberPreRegistered = row.memberPreRegistered || 0;
  const nonMemberPreRegistered = row.nonMemberPreRegistered || 0;
  const weeklyIncreaseTotal = row.weeklyIncreaseTotal || 0;
  const vendorRegistered = row.vendorRegistered || 0;
  const memberShare = totalPreRegistered ? memberPreRegistered / totalPreRegistered : 0;
  const vendorGap = Math.max(totalPreRegistered - vendorRegistered, 0);
  const weeklyMomentum = totalPreRegistered ? weeklyIncreaseTotal / totalPreRegistered : 0;

  return {
    ...row,
    totalPreRegistered,
    memberPreRegistered,
    nonMemberPreRegistered,
    weeklyIncreaseTotal,
    vendorRegistered,
    memberShare,
    vendorGap,
    weeklyMomentum,
  };
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    render();
  });

  els.focusSelect.addEventListener("change", (event) => {
    state.filters.focus = event.target.value;
    render();
  });
}

function render() {
  const visibleRows = getVisibleRows();
  renderHeader();
  renderSummary();
  renderBriefing();
  renderSignals();
  renderCharts(visibleRows);
  renderTable(visibleRows);
}

function renderHeader() {
  const reportWindow = state.rows[0]?.reportDate || "Unknown";
  const statuses = [...new Set(state.rows.map((row) => row.status))];
  els.reportWindow.textContent = reportWindow;
  els.statusSummary.textContent = `${statuses.join(", ")} | ${number.format(state.rows.length)} total HOCs`;
}

function renderSummary() {
  const totals = aggregate(state.rows);
  const growingCount = state.rows.filter((row) => row.weeklyIncreaseTotal > 0).length;
  const stalledCount = state.rows.length - growingCount;
  const cards = [
    {
      title: "Total Pre-Reg",
      value: number.format(totals.totalPreRegistered),
      note: `${number.format(totals.memberPreRegistered)} members and ${number.format(totals.nonMemberPreRegistered)} non-members across all HOCs.`,
      tone: "tone-royal",
    },
    {
      title: "Weekly Increase",
      value: number.format(totals.weeklyIncreaseTotal),
      note: `${number.format(totals.weeklyIncreaseMembers)} member adds and ${number.format(totals.weeklyIncreaseNonMembers)} non-member adds this week.`,
      tone: "tone-green",
    },
    {
      title: "Vendor Registration",
      value: number.format(totals.vendorRegistered),
      note: `${number.format(state.rows.filter((row) => row.vendorRegistered >= 8).length)} HOCs already have 8+ vendor registrations.`,
      tone: "tone-gold",
    },
    {
      title: "Growing HOCs",
      value: number.format(growingCount),
      note: `${number.format(stalledCount)} HOCs were flat week over week and may need extra push.`,
      tone: "tone-coral",
    },
    {
      title: "Member Mix",
      value: percent.format(totals.totalPreRegistered ? totals.memberPreRegistered / totals.totalPreRegistered : 0),
      note: `Members currently make up the bulk of the registration base across the portfolio.`,
      tone: "tone-sky",
    },
  ];

  els.summaryCards.innerHTML = cards
    .map(
      (card) => `
        <article class="panel summary-card ${escapeHtml(card.tone)}">
          <h3>${escapeHtml(card.title)}</h3>
          <div class="summary-value">${escapeHtml(card.value)}</div>
          <div class="summary-note">${escapeHtml(card.note)}</div>
        </article>
      `,
    )
    .join("");
}

function renderBriefing() {
  const totals = aggregate(state.rows);
  const topPreReg = getTopRows(state.rows, "totalPreRegistered", 1)[0];
  const topGrowth = getTopRows(state.rows, "weeklyIncreaseTotal", 1)[0];
  const topVendor = getTopRows(state.rows, "vendorRegistered", 1)[0];
  const lowestRows = getLowestRows(state.rows);
  const topFive = getTopRows(state.rows, "totalPreRegistered", 5);
  const upcomingFive = sortRowsByDate(state.rows).slice(0, 5);
  const zeroGrowth = state.rows.filter((row) => row.weeklyIncreaseTotal === 0).length;
  const vendorGapCount = state.rows.filter((row) => row.vendorRegistered < 5).length;
  const memberShareValue = totals.totalPreRegistered ? totals.memberPreRegistered / totals.totalPreRegistered : 0;
  const stalledRows = sortRowsByDate(state.rows.filter((row) => row.weeklyIncreaseTotal === 0)).slice(0, 4);
  const sections = [
    {
      title: "Portfolio snapshot",
      bullets: [
        `${number.format(state.rows.length)} HOCs are included in this weekly update for ${state.rows[0]?.reportDate || "the current reporting period"}.`,
        `Combined pre-registration stands at ${number.format(totals.totalPreRegistered)} with ${number.format(totals.weeklyIncreaseTotal)} net new registrations added during the week.`,
        `The next five HOCs on the calendar are ${upcomingFive.map((row) => `${row.hoc} (${formatEventDate(row.eventDate)})`).join(", ")}.`,
      ],
    },
    {
      title: "Registration leaders and low-volume HOCs",
      bullets: [
        `${topPreReg.hoc} leads the portfolio with ${number.format(topPreReg.totalPreRegistered)} pre-registrations ahead of ${formatEventDate(topPreReg.eventDate)}.`,
        `The top five HOCs by registration are ${topFive.map((row) => `${row.hoc} (${number.format(row.totalPreRegistered)})`).join(", ")}.`,
        `The lowest current registration level is ${number.format(lowestRows[0].totalPreRegistered)}, currently shared by ${lowestRows.map((row) => `${row.hoc} (${formatEventDate(row.eventDate)})`).join(", ")}.`,
      ],
    },
    {
      title: "Audience mix",
      bullets: [
        `Members currently represent ${percent.format(memberShareValue)} of the total base with ${number.format(totals.memberPreRegistered)} member registrations and ${number.format(totals.nonMemberPreRegistered)} non-member registrations.`,
        `The portfolio is still member-led, which means non-member conversion is the clearest opportunity for incremental growth.`,
      ],
    },
    {
      title: "Momentum and follow-up focus",
      bullets: [
        `${topGrowth.hoc} posted the strongest weekly gain with ${number.format(topGrowth.weeklyIncreaseTotal)} new registrations ahead of ${formatEventDate(topGrowth.eventDate)}.`,
        `${number.format(zeroGrowth)} HOCs had no week-over-week movement and should be treated as the highest-priority follow-up set.`,
        `The earliest stalled HOCs on the calendar are ${stalledRows.map((row) => `${row.hoc} (${formatEventDate(row.eventDate)})`).join(", ")}.`,
      ],
    },
    {
      title: "Vendor outlook",
      bullets: [
        `${topVendor.hoc} currently leads vendor sign-ups with ${number.format(topVendor.vendorRegistered)} vendors committed.`,
        `${number.format(vendorGapCount)} HOCs remain below five vendor registrations, so sponsor outreach is still needed across the lower-coverage events.`,
      ],
    },
  ];

  els.briefingList.innerHTML = sections
    .map(
      (section) => `
        <section class="briefing-block">
          <h3>${escapeHtml(section.title)}</h3>
          <ul>
            ${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>
      `,
    )
    .join("");
}

function renderSignals() {
  renderMiniList(
    els.leadersList,
    sortRowsByDate(getTopRows(state.rows, "totalPreRegistered", 4)),
    (row) => `${number.format(row.totalPreRegistered)} pre-reg`,
  );
  renderMiniList(
    els.topFiveList,
    sortRowsByDate(getTopRows(state.rows, "totalPreRegistered", 5)),
    (row) => `${number.format(row.totalPreRegistered)} pre-reg`,
  );
  renderMiniList(
    els.lowestList,
    sortRowsByDate(getLowestRows(state.rows)),
    (row) => `${number.format(row.totalPreRegistered)} pre-reg`,
  );
  renderMiniList(
    els.growthList,
    sortRowsByDate(getTopRows(state.rows, "weeklyIncreaseTotal", 4)),
    (row) => `${number.format(row.weeklyIncreaseTotal)} added`,
    { showTrend: true },
  );
  renderMiniList(
    els.vendorList,
    sortRowsByDate(getTopRows(state.rows, "vendorRegistered", 4)),
    (row) => `${number.format(row.vendorRegistered)} vendors`,
  );
}

function renderMiniList(target, rows, valueFormatter, options = {}) {
  target.innerHTML = rows
    .map(
      (row) => `
        <div class="mini-item">
          <div class="mini-item-title">
            <strong>${escapeHtml(row.hoc)}</strong>
            <span class="date-tag">${escapeHtml(formatEventDate(row.eventDate))}</span>
          </div>
          <span>
            ${escapeHtml(valueFormatter(row))}
            ${options.showTrend && row.weeklyIncreaseTotal > 0 ? `<span class="trend-badge">↑ ${number.format(row.weeklyIncreaseTotal)}</span>` : ""}
          </span>
        </div>
      `,
    )
    .join("");
}

function renderCharts(rows) {
  renderBarChart(els.preRegChart, rows, "totalPreRegistered", "registrations", "fill", true);
  renderBarChart(els.weeklyGrowthChart, rows, "weeklyIncreaseTotal", "new this week", "fill secondary", true);
  renderStackedChart(els.memberMixChart, rows);
  renderBarChart(els.vendorChart, rows, "vendorRegistered", "vendor registrations", "fill vendor", true);
}

function renderBarChart(target, rows, key, suffix, fillClass, showTrend = false) {
  if (!rows.length) {
    target.innerHTML = `<p class="muted">No HOCs match the current filter.</p>`;
    return;
  }

  const maxValue = Math.max(...rows.map((row) => row[key]), 1);
  target.innerHTML = rows
    .map((row) => {
      const width = (row[key] / maxValue) * 100;
      return `
        <div class="chart-row">
          <div class="chart-label-row">
            <span class="chart-title">
              <span class="chart-label">${escapeHtml(row.hoc)}</span>
              <span class="date-tag">${escapeHtml(formatEventDate(row.eventDate))}</span>
            </span>
            <span class="chart-value-row">
              <span class="chart-value">${number.format(row[key])} ${escapeHtml(suffix)}</span>
              ${showTrend && row.weeklyIncreaseTotal > 0 ? `<span class="trend-badge">↑ ${number.format(row.weeklyIncreaseTotal)}</span>` : ""}
            </span>
          </div>
          <div class="track">
            <div class="${fillClass}" style="width: ${width}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderStackedChart(target, rows) {
  if (!rows.length) {
    target.innerHTML = `<p class="muted">No HOCs match the current filter.</p>`;
    return;
  }

  target.innerHTML = rows
    .map((row) => {
      const memberWidth = row.totalPreRegistered ? (row.memberPreRegistered / row.totalPreRegistered) * 100 : 0;
      const nonMemberWidth = row.totalPreRegistered ? (row.nonMemberPreRegistered / row.totalPreRegistered) * 100 : 0;

      return `
        <div class="chart-row">
          <div class="chart-label-row">
            <span class="chart-title">
              <span class="chart-label">${escapeHtml(row.hoc)}</span>
              <span class="date-tag">${escapeHtml(formatEventDate(row.eventDate))}</span>
            </span>
            <span class="chart-value-row">
              <span class="chart-value">${number.format(row.memberPreRegistered)} members | ${number.format(row.nonMemberPreRegistered)} non-members</span>
              ${row.weeklyIncreaseTotal > 0 ? `<span class="trend-badge">↑ ${number.format(row.weeklyIncreaseTotal)}</span>` : ""}
            </span>
          </div>
          <div class="stacked-track">
            <div class="stack-segment members" style="width: ${memberWidth}%"></div>
            <div class="stack-segment non-members" style="width: ${nonMemberWidth}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderTable(rows) {
  els.tableBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>
            <div class="chart-title">
              <strong>${escapeHtml(row.hoc)}</strong>
              <span class="date-tag">${escapeHtml(formatEventDate(row.eventDate))}</span>
            </div>
            <div class="muted">${escapeHtml(row.eventName)}</div>
          </td>
          <td>${number.format(row.totalPreRegistered)}</td>
          <td>${number.format(row.memberPreRegistered)}</td>
          <td>${number.format(row.nonMemberPreRegistered)}</td>
          <td>
            ${number.format(row.weeklyIncreaseTotal)}
            ${row.weeklyIncreaseTotal > 0 ? `<span class="trend-badge">↑</span>` : ""}
          </td>
          <td>${number.format(row.vendorRegistered)}</td>
          <td>${percent.format(row.memberShare)}</td>
          <td><span class="badge">${escapeHtml(row.status)}</span></td>
        </tr>
      `,
    )
    .join("");
}

function getVisibleRows() {
  const search = state.filters.search;
  const focus = state.filters.focus;

  return sortRowsByDate(
    [...state.rows]
    .filter((row) => {
      const matchesSearch = !search
        || row.hoc.toLowerCase().includes(search)
        || row.eventName.toLowerCase().includes(search);
      const matchesFocus = focus === "all"
        || (focus === "growing" && row.weeklyIncreaseTotal > 0)
        || (focus === "stalled" && row.weeklyIncreaseTotal === 0);
      return matchesSearch && matchesFocus;
    }),
  );
}

function sortRowsByDate(rows) {
  return [...rows].sort((a, b) => {
    const left = String(a.eventDate || "");
    const right = String(b.eventDate || "");
    if (left !== right) return left.localeCompare(right);
    return a.hoc.localeCompare(b.hoc);
  });
}

function getLowestRows(rows) {
  const minRegistration = Math.min(...rows.map((row) => row.totalPreRegistered));
  return rows
    .filter((row) => row.totalPreRegistered === minRegistration)
    .sort((a, b) => a.hoc.localeCompare(b.hoc));
}

function getTopRows(rows, key, limit) {
  return [...rows]
    .sort((a, b) => {
      const delta = (b[key] || 0) - (a[key] || 0);
      if (delta !== 0) return delta;
      return a.hoc.localeCompare(b.hoc);
    })
    .slice(0, limit);
}

function formatEventDate(value) {
  if (!value) return "Date TBD";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function aggregate(rows) {
  return rows.reduce(
    (acc, row) => {
      acc.totalPreRegistered += row.totalPreRegistered;
      acc.memberPreRegistered += row.memberPreRegistered;
      acc.nonMemberPreRegistered += row.nonMemberPreRegistered;
      acc.weeklyIncreaseTotal += row.weeklyIncreaseTotal;
      acc.weeklyIncreaseMembers += row.weeklyIncreaseMembers || 0;
      acc.weeklyIncreaseNonMembers += row.weeklyIncreaseNonMembers || 0;
      acc.vendorRegistered += row.vendorRegistered;
      return acc;
    },
    {
      totalPreRegistered: 0,
      memberPreRegistered: 0,
      nonMemberPreRegistered: 0,
      weeklyIncreaseTotal: 0,
      weeklyIncreaseMembers: 0,
      weeklyIncreaseNonMembers: 0,
      vendorRegistered: 0,
    },
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
