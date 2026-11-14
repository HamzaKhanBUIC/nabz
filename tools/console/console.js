(function () {
  "use strict";

  async function apiJson(url, options) {
    const res = await fetch(url, options);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || `HTTP ${res.status}`);
    }
    return body;
  }

  function renderStatusBadge(status) {
    if (!status) return "";
    return `<span class="status-badge" data-level="${escapeHtml(status.level)}">[${escapeHtml(status.iconKey)}] ${escapeHtml(status.label)}</span>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderCardHtml(card) {
    if (!card) {
      return '<div class="card-box">No action card yet today.</div>';
    }
    const todoItems = card.whatToDo.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
    const sourceLinks = card.sources
      .map((src) => `<li><a href="${escapeHtml(src.url)}" target="_blank" rel="noreferrer">${escapeHtml(src.title)}</a></li>`)
      .join("");
    return `
      <div class="card-box">
        <div>${renderStatusBadge(card.status)} <strong>${escapeHtml(card.ruleId)}</strong></div>
        <h3>${escapeHtml(card.title)}</h3>
        <p><strong>What changed:</strong> ${escapeHtml(card.whatChanged)}</p>
        <p><strong>Why it matters:</strong> ${escapeHtml(card.whyItMatters)}</p>
        <p><strong>What to do:</strong></p>
        <ul>${todoItems}</ul>
        <p><strong>Facts:</strong> <code>${escapeHtml(JSON.stringify(card.facts))}</code></p>
        <details><summary>Sources (${card.sources.length})</summary><ul>${sourceLinks}</ul></details>
        <p class="disclaimer">${escapeHtml(card.disclaimer)}</p>
      </div>
    `;
  }

  // 1. Mission & Today
  async function loadMissionAndToday() {
    const [mission, today] = await Promise.all([
      apiJson("/api/mission"),
      apiJson("/api/today"),
    ]);

    const summary = document.getElementById("mission-summary");
    summary.innerHTML = `
      <span class="pill">${escapeHtml(mission.name)} (${escapeHtml(mission.profile)})</span>
      <span class="pill">Day ${mission.missionDay}</span>
      <span class="pill">Earth delay ${mission.commsDelay.oneWayMinMinutes}–${mission.commsDelay.oneWayMaxMinutes} min</span>
    `;

    const todayStatus = document.getElementById("today-status");
    const chkText = today.checkin
      ? `Check-in: ${today.checkin.metrics.meanSpeed} 1/s ${renderStatusBadge(today.checkin.zone.status)}`
      : "Check-in: not done today";
    const bpText = today.bp
      ? `BP: ${today.bp.average.systolic}/${today.bp.average.diastolic} mmHg (${today.bp.category}) ${renderStatusBadge(today.bp.zone.status)}`
      : "BP: not done today";
    const dueText = today.nextDue
      ? `Next reminder due: <code>${escapeHtml(today.nextDue)}</code>`
      : "Reminders: paused";
    todayStatus.innerHTML = `<p>${chkText}</p><p>${bpText}</p><p>${dueText}</p>`;

    document.getElementById("today-card").innerHTML = renderCardHtml(today.card);
  }

  // 2. PVT-B Tap Test & Sample Day
  let pvtProtocol = null;
  let pvtSession = null;

  async function ensureProtocol() {
    if (!pvtProtocol) {
      pvtProtocol = await apiJson("/api/checkin/protocol");
    }
    return pvtProtocol;
  }

  function formatMs(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function clearSessionTimers() {
    if (!pvtSession) return;
    clearTimeout(pvtSession.isiTimer);
    clearTimeout(pvtSession.timeoutTimer);
    clearInterval(pvtSession.clockInterval);
    if (pvtSession.rafId) cancelAnimationFrame(pvtSession.rafId);
  }

  function updatePvtCounts() {
    if (!pvtSession) return;
    const stim = pvtSession.trials.filter((t) => !t.early).length;
    const fs = pvtSession.trials.filter((t) => t.early).length;
    document.getElementById("pvt-counts").textContent = `Stimuli: ${stim} | False starts: ${fs}`;
  }

  function scheduleNextTrial() {
    if (!pvtSession || pvtSession.ended) return;
    const elapsed = performance.now() - pvtSession.startedPerf;
    if (elapsed >= pvtProtocol.durationMs) {
      void finishPvtSession();
      return;
    }

    const isiMs =
      pvtProtocol.isiMinMs +
      Math.floor(Math.random() * (pvtProtocol.isiMaxMs - pvtProtocol.isiMinMs + 1));

    pvtSession.state = "waiting";
    pvtSession.currentIsiMs = isiMs;
    pvtSession.onsetTs = null;

    const target = document.getElementById("pvt-target");
    target.className = "tap-circle waiting";
    target.textContent = pvtSession.lastFeedback
      ? `${pvtSession.lastFeedback} — Wait...`
      : "Wait... tap or Space on green";

    pvtSession.isiTimer = setTimeout(() => {
      if (!pvtSession || pvtSession.ended) return;
      pvtSession.rafId = requestAnimationFrame((frameTs) => {
        if (!pvtSession || pvtSession.ended) return;
        pvtSession.state = "go";
        pvtSession.onsetTs = frameTs;
        target.className = "tap-circle go";
        target.textContent = "TAP NOW!";
        pvtSession.timeoutTimer = setTimeout(() => {
          if (!pvtSession || pvtSession.ended || pvtSession.state !== "go") return;
          pvtSession.trials.push({
            i: pvtSession.trials.length,
            isiMs: pvtSession.currentIsiMs,
            rtMs: null,
            early: false,
          });
          pvtSession.lastFeedback = "No response (lapse)";
          updatePvtCounts();
          scheduleNextTrial();
        }, pvtProtocol.noResponseTimeoutMs);
      });
    }, isiMs);
  }

  function handlePvtInput(eventTimeStamp) {
    if (!pvtSession || pvtSession.ended) return;
    if (pvtSession.state === "waiting") {
      clearTimeout(pvtSession.isiTimer);
      if (pvtSession.rafId) cancelAnimationFrame(pvtSession.rafId);
      pvtSession.trials.push({
        i: pvtSession.trials.length,
        isiMs: pvtSession.currentIsiMs,
        rtMs: null,
        early: true,
      });
      pvtSession.lastFeedback = "Early tap!";
      updatePvtCounts();
      scheduleNextTrial();
      return;
    }

    if (pvtSession.state === "go" && pvtSession.onsetTs !== null) {
      clearTimeout(pvtSession.timeoutTimer);
      const rtMs = Math.max(1, Math.round(eventTimeStamp - pvtSession.onsetTs));
      pvtSession.trials.push({
        i: pvtSession.trials.length,
        isiMs: pvtSession.currentIsiMs,
        rtMs,
        early: false,
      });
      pvtSession.lastFeedback = `${rtMs} ms`;
      updatePvtCounts();
      scheduleNextTrial();
    }
  }

  async function finishPvtSession() {
    if (!pvtSession || pvtSession.ended) return;
    pvtSession.ended = true;
    clearSessionTimers();

    const target = document.getElementById("pvt-target");
    target.className = "tap-circle idle";
    target.disabled = true;
    target.textContent = "Submitting session...";

    document.getElementById("btn-start-pvt").disabled = false;
    document.getElementById("btn-cancel-pvt").disabled = true;

    const sleepInput = document.getElementById("sleep-hours").value.trim();
    const body = {
      protocolId: pvtProtocol.protocolId,
      startedAt: pvtSession.startedAt,
      trials: pvtSession.trials,
      ...(sleepInput !== "" ? { sleepHours: Number(sleepInput) } : {}),
    };

    try {
      const response = await apiJson("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      displayCheckinResponse(response);
      target.textContent = "Complete! Start again anytime.";
    } catch (err) {
      target.textContent = `Error: ${err.message}`;
    }
  }

  function displayCheckinResponse(res) {
    document.getElementById("checkin-result").innerHTML = `
      <p>
        <strong>Zone:</strong> ${renderStatusBadge(res.zone.status)}
        | meanSpeed: <strong>${res.metrics.meanSpeed}</strong> 1/s
        | medianRT: <strong>${res.metrics.medianRtMs ?? "n/a"}</strong> ms
        | lapses: <strong>${res.metrics.lapses}</strong>
        | z: <strong>${res.zone.z ?? "n/a"}</strong>
      </p>
      ${renderCardHtml(res.card)}
    `;
    document.getElementById("checkin-raw").textContent = JSON.stringify(res, null, 2);
    void loadMissionAndToday();
    void loadTrend();
  }

  async function startPvtTest() {
    await ensureProtocol();
    clearSessionTimers();

    pvtSession = {
      startedAt: new Date().toISOString(),
      startedPerf: performance.now(),
      trials: [],
      state: "waiting",
      currentIsiMs: 2000,
      onsetTs: null,
      lastFeedback: "",
      ended: false,
      isiTimer: null,
      timeoutTimer: null,
      clockInterval: null,
      rafId: null,
    };

    const target = document.getElementById("pvt-target");
    target.disabled = false;
    document.getElementById("btn-start-pvt").disabled = true;
    document.getElementById("btn-cancel-pvt").disabled = false;

    pvtSession.clockInterval = setInterval(() => {
      if (!pvtSession || pvtSession.ended) return;
      const elapsed = performance.now() - pvtSession.startedPerf;
      document.getElementById("pvt-timer").textContent =
        `${formatMs(elapsed)} / ${formatMs(pvtProtocol.durationMs)}`;
    }, 250);

    updatePvtCounts();
    scheduleNextTrial();
  }

  async function sendSampleDay120() {
    // Deterministic 65-trial session (~180s total duration, ~3.71 1/s speed, 9 lapses)
    // matching Day 120 (2026-11-15) with sleepHours 5.2 -> RT-SHORT-SLEEP.
    const trials = [];
    for (let i = 0; i < 65; i += 1) {
      const isLapse = i % 7 === 0 && i < 63; // 9 lapses
      trials.push({
        i,
        isiMs: 2500,
        rtMs: isLapse ? 420 : 254,
        early: false,
      });
    }
    const sleepVal = Number(document.getElementById("sleep-hours").value || "5.2");
    const response = await apiJson("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        protocolId: "pvt-b-3min",
        startedAt: "2026-11-15T08:02:11+00:00",
        sleepHours: sleepVal,
        trials,
      }),
    });
    displayCheckinResponse(response);
  }

  // 3. Trend Chart (Inline SVG)
  async function loadTrend() {
    const code = document.getElementById("trend-code").value;
    const days = Number(document.getElementById("trend-days").value || "30");
    const trend = await apiJson(`/api/trends?code=${encodeURIComponent(code)}&days=${days}`);

    document.getElementById("trend-band-info").textContent = trend.band.ready
      ? `Source: ${trend.source} | Band mean: ${trend.band.mean} ${trend.unit} | watchAt: ${trend.band.watchAt ?? "n/a"} | actAt: ${trend.band.actAt ?? "n/a"}`
      : `Source: ${trend.source} | Band: not calibrated`;

    const svgWrap = document.getElementById("trend-chart-wrap");
    const pts = trend.points;
    if (pts.length === 0) {
      svgWrap.innerHTML = "<p>No points in range.</p>";
    } else {
      const W = 720;
      const H = 200;
      const pad = 28;
      const values = pts.map((p) => p.value);
      if (trend.band.mean !== null) values.push(trend.band.mean);
      if (trend.band.watchAt !== null) values.push(trend.band.watchAt);
      if (trend.band.actAt !== null) values.push(trend.band.actAt);
      const minV = Math.min(...values);
      const maxV = Math.max(...values);
      const span = maxV - minV || 1;
      const xFor = (idx) =>
        pad + (idx / Math.max(1, pts.length - 1)) * (W - 2 * pad);
      const yFor = (val) => H - pad - ((val - minV) / span) * (H - 2 * pad);

      const linePath = pts
        .map((p, idx) => `${idx === 0 ? "M" : "L"}${xFor(idx).toFixed(1)},${yFor(p.value).toFixed(1)}`)
        .join(" ");

      const hLine = (val, stroke, label) => {
        if (val === null) return "";
        const y = yFor(val).toFixed(1);
        return `<line x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}" stroke="${stroke}" stroke-dasharray="4 4" />
                <text x="${pad + 4}" y="${Number(y) - 4}" fill="${stroke}" font-size="12">${label}: ${val}</text>`;
      };

      const dots = pts
        .map((p, idx) => {
          const fill = p.zone === "act" ? "#ef4444" : p.zone === "watch" ? "#f59e0b" : "#38bdf8";
          return `<circle cx="${xFor(idx).toFixed(1)}" cy="${yFor(p.value).toFixed(1)}" r="3.5" fill="${fill}" />`;
        })
        .join("");

      svgWrap.innerHTML = `
        <svg class="trend-svg" viewBox="0 0 ${W} ${H}">
          ${hLine(trend.band.mean, "#94a3b8", "mean")}
          ${hLine(trend.band.watchAt, "#f59e0b", "watch")}
          ${hLine(trend.band.actAt, "#ef4444", "act")}
          <path d="${linePath}" fill="none" stroke="#38bdf8" stroke-width="2" />
          ${dots}
        </svg>
      `;
    }

    const tbody = document.querySelector("#trend-table tbody");
    tbody.innerHTML = [...pts]
      .reverse()
      .map(
        (p) => `<tr>
          <td>${p.missionDay}</td>
          <td>${p.value}</td>
          <td>${p.z ?? "—"}</td>
          <td>${escapeHtml(p.zone)}</td>
          <td>${p.baselineMean ?? "—"}</td>
        </tr>`,
      )
      .join("");
  }

  // 4. Guided Blood Pressure
  let retestInterval = null;

  function startTimerBadge(btn, seconds) {
    let remaining = seconds;
    btn.disabled = true;
    btn.textContent = `${remaining}s`;
    const timer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timer);
        btn.disabled = false;
        btn.textContent = "Timer done";
      } else {
        btn.textContent = `${remaining}s`;
      }
    }, 1000);
  }

  async function loadBpGuide() {
    const guide = await apiJson("/api/measurements/bp/guide");
    const stepsEl = document.getElementById("bp-steps");
    stepsEl.innerHTML = guide.steps
      .map((step) => {
        const badge = step.adaptation ? ' <span class="pill">Microgravity adaptation</span>' : "";
        const timerBtn = step.timerSeconds
          ? ` <button type="button" class="bp-step-timer" data-sec="${step.timerSeconds}">Start ${step.timerSeconds}s timer</button>`
          : "";
        return `<li>${escapeHtml(step.text)}${badge}${timerBtn}</li>`;
      })
      .join("");

    stepsEl.querySelectorAll(".bp-step-timer").forEach((btn) => {
      btn.addEventListener("click", () => {
        startTimerBadge(btn, Number(btn.dataset.sec));
      });
    });

    const symptoms = [...guide.severeSymptoms, ...guide.lowSymptoms];
    document.getElementById("bp-symptoms").innerHTML = symptoms
      .map(
        (s) => `
          <label class="symptom-item">
            <input type="checkbox" name="bp-symptom" value="${escapeHtml(s.id)}" />
            <span>${escapeHtml(s.label)}</span>
          </label>
        `,
      )
      .join("");
  }

  async function submitBp() {
    const readings = [
      {
        systolic: Number(document.getElementById("bp-sys-1").value),
        diastolic: Number(document.getElementById("bp-dia-1").value),
      },
      {
        systolic: Number(document.getElementById("bp-sys-2").value),
        diastolic: Number(document.getElementById("bp-dia-2").value),
      },
    ];
    const symptoms = Array.from(document.querySelectorAll('input[name="bp-symptom"]:checked')).map(
      (el) => el.value,
    );
    const retestOf = document.getElementById("bp-retest-of").value.trim();

    const body = {
      takenAt: "2026-11-15T08:20:00+00:00",
      readings,
      symptoms,
      ...(retestOf ? { retestOf } : {}),
    };

    const res = await apiJson("/api/measurements/bp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    clearInterval(retestInterval);
    const retestEl = document.getElementById("bp-retest-timer");
    if (res.nextAction.type === "retest") {
      document.getElementById("bp-retest-of").value = res.id;
      let left = res.nextAction.afterSeconds || 300;
      retestEl.textContent = `Retest countdown: ${left}s (retestOf=${res.id})`;
      retestInterval = setInterval(() => {
        left -= 1;
        if (left <= 0) {
          clearInterval(retestInterval);
          retestEl.textContent = "5 minutes elapsed — take retest reading now.";
        } else {
          retestEl.textContent = `Retest countdown: ${left}s (retestOf=${res.id})`;
        }
      }, 1000);
    } else {
      retestEl.textContent = `Next action: ${res.nextAction.type}`;
    }

    document.getElementById("bp-result").innerHTML = `
      <p>
        <strong>Average:</strong> ${res.average.systolic}/${res.average.diastolic} mmHg
        | <strong>Category:</strong> ${escapeHtml(res.category)}
        | <strong>Zone:</strong> ${renderStatusBadge(res.zone.status)}
      </p>
      ${renderCardHtml(res.card)}
    `;
    void loadMissionAndToday();
  }

  // 5. Emergency Procedures (Self + Crewmate)
  let procedures = [];
  let emergencyFor = "self";
  let metroTimer = null;

  function renderProcedure(proc) {
    clearInterval(metroTimer);
    const stepsHtml = proc.steps
      .map((s) => {
        const caution = s.caution ? ` <em>(${escapeHtml(s.caution)})</em>` : "";
        const timerBtn = s.timerSeconds
          ? ` <button type="button" class="em-step-timer" data-sec="${s.timerSeconds}">Start ${s.timerSeconds}s timer</button>`
          : "";
        const metroBtn = s.metronomeBpm
          ? ` <button type="button" class="em-step-metro" data-bpm="${s.metronomeBpm}">Metronome ${s.metronomeBpm} BPM</button> <span class="metro-beat"></span>`
          : "";
        return `<li>${escapeHtml(s.text)}${caution}${timerBtn}${metroBtn}</li>`;
      })
      .join("");
    const redFlagsHtml = proc.redFlags.map((f) => `<li>${escapeHtml(f)}</li>`).join("");
    const detail = document.getElementById("emergency-detail");
    detail.innerHTML = `
      <div class="card-box">
        <h3>${escapeHtml(proc.title)} <span class="pill">${escapeHtml(proc.for)}</span></h3>
        <p>${escapeHtml(proc.whenToUse)}</p>
        <ol class="steps-list">${stepsHtml}</ol>
        <p><strong>Red flags:</strong></p>
        <ul>${redFlagsHtml}</ul>
        <p><strong>Escalation:</strong> ${escapeHtml(proc.escalation.text)}</p>
        <p class="disclaimer">${escapeHtml(proc.disclaimer)}</p>
      </div>
    `;
    detail.querySelectorAll(".em-step-timer").forEach((btn) => {
      btn.addEventListener("click", () => startTimerBadge(btn, Number(btn.dataset.sec)));
    });
    detail.querySelectorAll(".em-step-metro").forEach((btn) => {
      btn.addEventListener("click", () => {
        clearInterval(metroTimer);
        const bpm = Number(btn.dataset.bpm);
        const beatEl = btn.nextElementSibling;
        let beat = 0;
        const intervalMs = Math.round(60000 / bpm);
        metroTimer = setInterval(() => {
          beat += 1;
          if (beatEl) beatEl.textContent = beat % 2 === 0 ? "● Push" : "○ Recoil";
        }, intervalMs);
      });
    });
  }

  async function loadEmergencyProcedures(forWho = emergencyFor) {
    emergencyFor = forWho;
    document.getElementById("btn-em-self").classList.toggle("primary", forWho === "self");
    document.getElementById("btn-em-crewmate").classList.toggle("primary", forWho === "crewmate");
    const bundle = await apiJson(`/api/emergency/procedures?for=${encodeURIComponent(forWho)}`);
    procedures = bundle.procedures;
    const tabsEl = document.getElementById("emergency-tabs");
    tabsEl.innerHTML = procedures
      .map((p) => `<button type="button" data-proc-id="${escapeHtml(p.id)}">${escapeHtml(p.title)}</button>`)
      .join("");
    tabsEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const found = procedures.find((p) => p.id === btn.dataset.procId);
        if (found) renderProcedure(found);
      });
    });
    if (procedures[0]) {
      renderProcedure(procedures[0]);
    }
  }

  // 6. Coach (Offline-First)
  async function askCoach(questionText) {
    const q = (questionText ?? document.getElementById("coach-question").value).trim();
    if (!q) return;
    document.getElementById("coach-question").value = q;
    const reply = await apiJson("/api/coach/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });
    renderSuggestedQuestions(reply.suggestedQuestions);
    const bannerHtml = reply.banner ? `<p>${renderStatusBadge(reply.banner)}</p>` : "";
    const citesHtml = reply.citations
      .map((c) => `<li><a href="${escapeHtml(c.url)}" target="_blank" rel="noreferrer">${escapeHtml(c.title)}</a></li>`)
      .join("");
    document.getElementById("coach-reply").innerHTML = `
      <div class="card-box">
        ${bannerHtml}
        <p><span class="pill">${reply.grounded ? "Grounded" : "Out of scope"}</span> <span class="pill">${escapeHtml(reply.provider)}</span></p>
        <p>${escapeHtml(reply.answer)}</p>
        ${citesHtml ? `<ul>${citesHtml}</ul>` : ""}
        <p class="disclaimer">${escapeHtml(reply.disclaimer)}</p>
      </div>
    `;
  }

  function renderSuggestedQuestions(list) {
    const questions = list || [
      "Why is my reaction slower?",
      "Is this serious?",
      "What if it gets worse?",
      "Should I tell Earth?",
    ];
    const container = document.getElementById("coach-suggested");
    container.innerHTML = questions
      .map((q) => `<button type="button" class="coach-sug" data-q="${escapeHtml(q)}">${escapeHtml(q)}</button>`)
      .join("");
    container.querySelectorAll(".coach-sug").forEach((btn) => {
      btn.addEventListener("click", () => void askCoach(btn.dataset.q));
    });
  }

  // 7. Send to Earth
  function readShareInput() {
    const note = document.getElementById("share-note").value.trim();
    return {
      includeReaction: document.getElementById("share-reaction").checked,
      includeSleep: document.getElementById("share-sleep").checked,
      includeBp: document.getElementById("share-bp").checked,
      includeCards: document.getElementById("share-cards").checked,
      days: Number(document.getElementById("share-days").value || "3"),
      ...(note ? { note } : {}),
    };
  }

  async function previewShare() {
    const pkg = await apiJson("/api/share/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readShareInput()),
    });
    document.getElementById("share-result").innerHTML = `
      <div class="card-box">
        <p class="meta-line">${escapeHtml(pkg.commsDelay.delayNotice)}</p>
        <pre>${escapeHtml(pkg.summaryText)}</pre>
      </div>
    `;
  }

  async function sendShare() {
    const queued = await apiJson("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...readShareInput(), confirm: true }),
    });
    document.getElementById("share-result").innerHTML = `
      <div class="card-box">
        <p><span class="status-badge" data-level="in_zone">[check] Queued: ${escapeHtml(queued.id)}</span></p>
        <pre>${escapeHtml(queued.package.summaryText)}</pre>
      </div>
    `;
  }

  // 8. Routines & Reminders
  async function loadRoutines() {
    const bundle = await apiJson("/api/routines");
    const el = document.getElementById("routines-list");
    el.innerHTML = bundle.routines
      .map(
        (r) => `
          <div class="card-box">
            <strong>${escapeHtml(r.title)}</strong> <span class="pill">${escapeHtml(r.category)} · ${Math.round(r.durationSeconds / 60)} min</span>
            <p>${escapeHtml(r.summary)}</p>
            <ol class="steps-list">${r.steps.map((s) => `<li>${escapeHtml(s.text)}</li>`).join("")}</ol>
          </div>
        `,
      )
      .join("");
  }

  function renderReminders(data) {
    document.getElementById("rem-enabled").checked = data.schedule.enabled;
    document.getElementById("rem-checkin-utc").value = data.schedule.checkinTimeUtc;
    document.getElementById("rem-bp-days").value = String(data.schedule.bpIntervalDays);
    document.getElementById("rem-bp-utc").value = data.schedule.bpTimeUtc;
    document.getElementById("reminders-panel").innerHTML = `
      <p><strong>Next due:</strong> <code>${escapeHtml(data.nextDue ?? "paused")}</code></p>
      <ul>${data.items
        .map(
          (i) =>
            `<li><strong>${escapeHtml(i.label)}:</strong> ${escapeHtml(i.dueAt)} (${i.overdue ? "overdue" : "scheduled"}) — ${escapeHtml(i.reason)}</li>`,
        )
        .join("")}</ul>
    `;
  }

  async function loadReminders() {
    const data = await apiJson("/api/reminders");
    renderReminders(data);
  }

  async function saveReminders() {
    const data = await apiJson("/api/reminders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled: document.getElementById("rem-enabled").checked,
        checkinTimeUtc: document.getElementById("rem-checkin-utc").value.trim(),
        bpIntervalDays: Number(document.getElementById("rem-bp-days").value || "3"),
        bpTimeUtc: document.getElementById("rem-bp-utc").value.trim(),
      }),
    });
    renderReminders(data);
    void loadMissionAndToday();
  }

  // Wire up events cleanly
  document.getElementById("btn-refresh-today").addEventListener("click", () => void loadMissionAndToday());
  document.getElementById("btn-start-pvt").addEventListener("click", () => void startPvtTest());
  document.getElementById("btn-cancel-pvt").addEventListener("click", () => {
    if (!pvtSession) return;
    pvtSession.ended = true;
    clearSessionTimers();
    const target = document.getElementById("pvt-target");
    target.className = "tap-circle idle";
    target.disabled = true;
    target.textContent = "Cancelled";
    document.getElementById("btn-start-pvt").disabled = false;
    document.getElementById("btn-cancel-pvt").disabled = true;
  });
  document.getElementById("btn-send-sample").addEventListener("click", () => void sendSampleDay120());
  document.getElementById("btn-load-trend").addEventListener("click", () => void loadTrend());
  document.getElementById("btn-submit-bp").addEventListener("click", () => void submitBp());
  document.getElementById("btn-em-self").addEventListener("click", () => void loadEmergencyProcedures("self"));
  document.getElementById("btn-em-crewmate").addEventListener("click", () => void loadEmergencyProcedures("crewmate"));
  document.getElementById("btn-coach-ask").addEventListener("click", () => void askCoach());
  document.getElementById("btn-share-preview").addEventListener("click", () => void previewShare());
  document.getElementById("btn-share-send").addEventListener("click", () => void sendShare());
  document.getElementById("btn-save-reminders").addEventListener("click", () => void saveReminders());

  document.getElementById("pvt-target").addEventListener("pointerdown", (e) => {
    handlePvtInput(e.timeStamp);
  });
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && pvtSession && !pvtSession.ended) {
      e.preventDefault();
      handlePvtInput(e.timeStamp);
    }
  });

  renderSuggestedQuestions();
  void Promise.all([
    loadMissionAndToday(),
    loadTrend(),
    loadBpGuide(),
    loadEmergencyProcedures("self"),
    loadRoutines(),
    loadReminders(),
  ]);
})();
