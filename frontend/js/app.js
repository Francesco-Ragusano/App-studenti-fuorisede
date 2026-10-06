// Base URL del backend.
// In locale punta automaticamente a uvicorn su :8000.
// Online, va sostituito con l'indirizzo reale del backend dopo il deploy
// (es. "https://finanza-backend.onrender.com/finanza").
const API_BASE = (() => {
  const inLocale = ["localhost", "127.0.0.1"].includes(location.hostname);
  return inLocale
    ? "http://localhost:8000/finanza"
    : "https://app-studenti-fuorisede.onrender.com/finanza";
})();

const oggi = new Date();
const anno = oggi.getFullYear();
const mese = oggi.getMonth() + 1;

const fmt = (n) => `€${Number(n).toFixed(2).replace(".", ",")}`;
const circonferenza = 2 * Math.PI * 52; // r=52 nel SVG del ring

// ---------- Caricamento dati ----------

async function caricaTutto() {
  document.getElementById("data-oggi").textContent = oggi.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  await Promise.all([
    caricaBudgetOggi(),
    caricaRiepilogoMese(),
    caricaAlertCategorie(),
    caricaTransazioni(),
  ]);
}

async function caricaBudgetOggi() {
  try {
    const res = await fetch(`${API_BASE}/budget/oggi`);
    const dati = await res.json();
    renderRing(dati);

    // Nessun budget per il mese corrente: è il momento di chiederlo
    // (primo avvio dell'app, oppure semplicemente inizio di un nuovo mese).
    if (dati.messaggio && !overlayBudget.classList.contains("modal-overlay--open")) {
      apriModaleBudget({ obbligatoria: true });
    }
  } catch (e) {
    console.error("Errore budget/oggi:", e);
  }
}

async function caricaRiepilogoMese() {
  try {
    const res = await fetch(`${API_BASE}/mese/riepilogo?anno=${anno}&mese=${mese}`);
    const dati = await res.json();
    document.getElementById("entrate-mese").textContent = fmt(dati.entrate);
    document.getElementById("uscite-mese").textContent = fmt(dati.uscite);
  } catch (e) {
    console.error("Errore mese/riepilogo:", e);
  }
}

async function caricaAlertCategorie() {
  try {
    const res = await fetch(`${API_BASE}/categorie/alert`);
    const alerts = await res.json();
    const container = document.getElementById("alert-container");
    container.innerHTML = "";
    if (!alerts || alerts.length === 0) return;

    const box = document.createElement("div");
    box.className = "alert";
    alerts.forEach((a) => {
      const row = document.createElement("div");
      row.className = "alert__row";
      row.innerHTML = `<span>⚠️ <strong>${a.categoria}</strong>: +${a.scostamento_percentuale}% rispetto alla media</span>`;
      box.appendChild(row);
    });
    container.appendChild(box);
  } catch (e) {
    console.error("Errore categorie/alert:", e);
  }
}

async function caricaTransazioni() {
  const lista = document.getElementById("transazioni-list");
  try {
    const res = await fetch(`${API_BASE}/transazioni`);
    const transazioni = await res.json();
    lista.innerHTML = "";

    if (!transazioni || transazioni.length === 0) {
      lista.innerHTML = `<li class="transazioni__empty">Nessuna transazione ancora. Aggiungine una con "+ Nuova".</li>`;
      return;
    }

    transazioni.slice(0, 15).forEach((t) => {
      const li = document.createElement("li");
      li.className = "transazioni__item";
      const segno = t.tipo === "entrata" ? "+" : "−";
      const classeImporto = t.tipo === "entrata" ? "transazioni__importo--entrata" : "transazioni__importo--uscita";
      const dataLeggibile = new Date(t.data).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
      li.innerHTML = `
        <div class="transazioni__info">
          <span class="transazioni__categoria">${t.note || t.categoria || "Senza categoria"}</span>
          <span class="transazioni__meta">${t.categoria || ""} · ${dataLeggibile}</span>
        </div>
        <span class="transazioni__importo ${classeImporto}">${segno} ${fmt(t.importo)}</span>
      `;
      lista.appendChild(li);
    });
  } catch (e) {
    console.error("Errore transazioni:", e);
    lista.innerHTML = `<li class="transazioni__empty">Impossibile contattare il backend. Verifica che sia avviato su localhost:8000.</li>`;
  }
}

// ---------- Rendering del ring budget/oggi ----------

function renderRing(dati) {
  const { budget_giornaliero, speso_oggi, scarto, messaggio } = dati;

  document.getElementById("speso-oggi").textContent = fmt(speso_oggi);
  document.getElementById("budget-giornaliero").textContent = fmt(budget_giornaliero);

  const progressEl = document.getElementById("ring-progress");
  const scartoEl = document.getElementById("scarto-oggi");

  if (messaggio) {
    scartoEl.textContent = messaggio;
    scartoEl.className = "hero__scarto hero__scarto--neutral";
    progressEl.style.strokeDashoffset = circonferenza;
    return;
  }

  const percentuale = budget_giornaliero > 0 ? Math.min(speso_oggi / budget_giornaliero, 1) : 0;
  const offset = circonferenza * (1 - percentuale);
  progressEl.style.strokeDashoffset = offset;

  if (scarto >= 0) {
    progressEl.style.stroke = "var(--primary)";
    scartoEl.textContent = `Restano ${fmt(scarto)} oggi`;
    scartoEl.className = "hero__scarto hero__scarto--green";
  } else {
    progressEl.style.stroke = "var(--red)";
    scartoEl.textContent = `Sforato di ${fmt(Math.abs(scarto))} oggi`;
    scartoEl.className = "hero__scarto hero__scarto--red";
  }
}

// ---------- Modale nuova transazione ----------

const overlay = document.getElementById("modal-overlay");
const form = document.getElementById("form-transazione");
let tipoSelezionato = "uscita";

document.getElementById("btn-nuova").addEventListener("click", apriModale);
document.getElementById("modal-close").addEventListener("click", chiudiModale);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) chiudiModale();
});

function apriModale() {
  form.reset();
  document.getElementById("input-data").value = oggi.toISOString().split("T")[0];
  impostaTipo("uscita");
  overlay.classList.add("modal-overlay--open");
}

function chiudiModale() {
  overlay.classList.remove("modal-overlay--open");
}

document.getElementById("btn-oggi").addEventListener("click", () => {
  document.getElementById("input-data").value = new Date().toISOString().split("T")[0];
});

document.querySelectorAll(".toggle-tipo__btn").forEach((btn) => {
  btn.addEventListener("click", () => impostaTipo(btn.dataset.tipo));
});

function impostaTipo(tipo) {
  tipoSelezionato = tipo;
  document.querySelectorAll(".toggle-tipo__btn").forEach((b) => {
    b.classList.toggle("toggle-tipo__btn--active", b.dataset.tipo === tipo);
  });
  // Il livello di necessità ha senso solo per le uscite.
  document.getElementById("field-necessita").style.display = tipo === "uscita" ? "flex" : "none";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    importo: parseFloat(document.getElementById("input-importo").value),
    tipo: tipoSelezionato,
    data: document.getElementById("input-data").value,
    categoria: tipoSelezionato === "uscita" ? document.getElementById("input-categoria").value : null,
    livello_necessita: tipoSelezionato === "uscita" ? document.getElementById("input-necessita").value : null,
    note: document.getElementById("input-note").value || null,
  };

  try {
    const res = await fetch(`${API_BASE}/transazioni`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Errore ${res.status}`);

    chiudiModale();
    await caricaTutto();
  } catch (err) {
    alert("Errore nel salvataggio. Verifica che il backend sia avviato.\n" + err.message);
  }
});

// ---------- Modale budget mensile (impostazioni / primo avvio / nuovo mese) ----------

const overlayBudget = document.getElementById("modal-overlay-budget");
const formBudget = document.getElementById("form-budget");

document.getElementById("btn-impostazioni").addEventListener("click", () => apriModaleBudget());
document.getElementById("modal-budget-close").addEventListener("click", chiudiModaleBudget);
overlayBudget.addEventListener("click", (e) => {
  if (e.target === overlayBudget && !overlayBudget.dataset.obbligatoria) chiudiModaleBudget();
});

async function apriModaleBudget({ obbligatoria = false } = {}) {
  const titolo = document.getElementById("budget-modal-title");
  const hint = document.getElementById("budget-modal-hint");
  const input = document.getElementById("input-budget-importo");

  overlayBudget.dataset.obbligatoria = obbligatoria ? "1" : "";
  document.getElementById("modal-budget-close").style.display = obbligatoria ? "none" : "flex";

  if (obbligatoria) {
    titolo.textContent = "Imposta il budget di questo mese";
    hint.textContent = "Non hai ancora un budget per questo mese: impostalo per iniziare a tracciare entrate e uscite.";
    input.value = "";
  } else {
    titolo.textContent = "Budget del mese";
    hint.textContent = "Il budget resta fisso per tutto il mese: lo puoi rivedere qui in qualsiasi momento.";
    // Precompila con il valore attuale, se esiste.
    try {
      const res = await fetch(`${API_BASE}/budget?anno=${anno}&mese=${mese}`);
      if (res.ok) {
        const dati = await res.json();
        input.value = dati.importo_disponibile;
      } else {
        input.value = "";
      }
    } catch {
      input.value = "";
    }
  }

  overlayBudget.classList.add("modal-overlay--open");
}

function chiudiModaleBudget() {
  overlayBudget.classList.remove("modal-overlay--open");
}

formBudget.addEventListener("submit", async (e) => {
  e.preventDefault();
  const importo = parseFloat(document.getElementById("input-budget-importo").value);

  try {
    const res = await fetch(`${API_BASE}/budget`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mese, anno, importo_disponibile: importo }),
    });
    if (!res.ok) throw new Error(`Errore ${res.status}`);

    chiudiModaleBudget();
    await caricaTutto();
  } catch (err) {
    alert("Errore nel salvataggio del budget.\n" + err.message);
  }
});

// ---------- Schermata storico transazioni ----------

const screenHome = document.getElementById("screen-home");
const screenStorico = document.getElementById("screen-storico");

let storicoAnno = anno;
let storicoMese = mese;

document.getElementById("btn-apri-storico").addEventListener("click", apriStorico);
document.getElementById("btn-chiudi-storico").addEventListener("click", chiudiStorico);
document.getElementById("storico-mese-prev").addEventListener("click", () => cambiaMeseStorico(-1));
document.getElementById("storico-mese-next").addEventListener("click", () => cambiaMeseStorico(1));
document.getElementById("storico-filtro-categoria").addEventListener("change", caricaStorico);

function apriStorico() {
  storicoAnno = anno;
  storicoMese = mese;
  screenHome.style.display = "none";
  screenStorico.style.display = "flex";
  caricaStorico();
}

function chiudiStorico() {
  screenStorico.style.display = "none";
  screenHome.style.display = "flex";
}

function cambiaMeseStorico(delta) {
  storicoMese += delta;
  if (storicoMese > 12) { storicoMese = 1; storicoAnno++; }
  if (storicoMese < 1) { storicoMese = 12; storicoAnno--; }
  caricaStorico();
}

async function caricaStorico() {
  const label = document.getElementById("storico-mese-label");
  const dataRiferimento = new Date(storicoAnno, storicoMese - 1, 1);
  label.textContent = dataRiferimento.toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  const lista = document.getElementById("storico-lista");
  const riepilogo = document.getElementById("storico-riepilogo");
  const categoriaFiltro = document.getElementById("storico-filtro-categoria").value;

  lista.innerHTML = `<p class="transazioni__empty">Caricamento...</p>`;

  try {
    const res = await fetch(`${API_BASE}/transazioni`);
    const tutte = await res.json();

    const delMese = tutte.filter((t) => {
      const d = new Date(t.data);
      return d.getFullYear() === storicoAnno && d.getMonth() + 1 === storicoMese;
    });
    const filtrate = categoriaFiltro
      ? delMese.filter((t) => t.categoria === categoriaFiltro)
      : delMese;

    const entrate = filtrate.filter((t) => t.tipo === "entrata").reduce((s, t) => s + t.importo, 0);
    const uscite = filtrate.filter((t) => t.tipo === "uscita").reduce((s, t) => s + t.importo, 0);
    riepilogo.innerHTML = `
      <span>Entrate: <strong style="color:var(--green)">${fmt(entrate)}</strong></span>
      <span>Uscite: <strong style="color:var(--red)">${fmt(uscite)}</strong></span>
    `;

    renderStorico(filtrate);
  } catch (e) {
    console.error("Errore storico:", e);
    lista.innerHTML = `<p class="transazioni__empty">Impossibile contattare il backend.</p>`;
  }
}

function renderStorico(transazioni) {
  const lista = document.getElementById("storico-lista");
  lista.innerHTML = "";

  if (transazioni.length === 0) {
    lista.innerHTML = `<p class="transazioni__empty">Nessuna transazione per questo mese.</p>`;
    return;
  }

  // Raggruppa per data (già ordinate dal backend, più recenti prima).
  const gruppi = {};
  transazioni.forEach((t) => {
    if (!gruppi[t.data]) gruppi[t.data] = [];
    gruppi[t.data].push(t);
  });

  Object.keys(gruppi).sort().reverse().forEach((data) => {
    const giornoDiv = document.createElement("div");
    giornoDiv.className = "storico-giorno";

    const labelGiorno = new Date(data).toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const card = document.createElement("div");
    card.className = "storico-giorno__card";

    gruppi[data].forEach((t) => {
      const item = document.createElement("div");
      item.className = "storico-item";
      const segno = t.tipo === "entrata" ? "+" : "−";
      const classeImporto = t.tipo === "entrata" ? "storico-item__importo--entrata" : "storico-item__importo--uscita";
      item.innerHTML = `
        <div class="storico-item__info">
          <span class="storico-item__categoria">${t.note || t.categoria || "Senza categoria"}</span>
          <span class="storico-item__meta">${t.categoria || ""}${t.livello_necessita ? " · " + t.livello_necessita : ""}</span>
        </div>
        <div class="storico-item__right">
          <span class="storico-item__importo ${classeImporto}">${segno} ${fmt(t.importo)}</span>
          <button class="storico-item__elimina" data-id="${t.id}" aria-label="Elimina">&times;</button>
        </div>
      `;
      card.appendChild(item);
    });

    giornoDiv.innerHTML = `<span class="storico-giorno__label">${labelGiorno}</span>`;
    giornoDiv.appendChild(card);
    lista.appendChild(giornoDiv);
  });

  lista.querySelectorAll(".storico-item__elimina").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Eliminare questa transazione?")) return;
      try {
        await fetch(`${API_BASE}/transazioni/${btn.dataset.id}`, { method: "DELETE" });
        await caricaStorico();
        await caricaTutto(); // aggiorna anche i dati della home in sottofondo
      } catch (e) {
        alert("Errore durante l'eliminazione.");
      }
    });
  });
}

// ---------- Navigazione moduli futuri ----------

document.querySelectorAll(".bottom-nav__item").forEach((btn) => {
  btn.addEventListener("click", () => {
    const modulo = btn.dataset.modulo;
    if (modulo !== "finanza") {
      alert(`Modulo "${modulo}" non ancora disponibile.`);
    }
  });
});

// ---------- Avvio ----------

caricaTutto();
