# App Studenti Fuori Sede - modulo Finanza

Backend (FastAPI) + frontend (PWA) del modulo finanza.

## Avvio del backend

```bash
# 1. Ambiente virtuale (consigliato)
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\Activate.ps1

# 2. Dipendenze
pip install -r requirements.txt

# 3. Avvio
uvicorn main:app --reload
```

Backend su `http://localhost:8000`. Documentazione interattiva su `http://localhost:8000/docs`.

## Avvio del frontend (PWA)

Il frontend è nella cartella `frontend/`. Non può essere aperto con doppio click
(il browser bloccherebbe le chiamate all'API per motivi di sicurezza): va servito
da un piccolo server locale. Con Python già installato, da dentro `frontend/`:

```bash
cd frontend
python3 -m http.server 5500
```

Poi apri `http://localhost:5500` nel browser (anche da telefono, se sei sulla
stessa rete WiFi del PC, usando l'IP locale del PC al posto di `localhost`).

**Importante:** avvia prima il backend (`uvicorn`) e solo dopo il frontend,
altrimenti la pagina mostrerà errori di connessione.

## Struttura del progetto

```
main.py                 → avvia FastAPI, collega i moduli, abilita CORS
database.py              → connessione DB condivisa tra tutti i moduli
finanza/
  models.py               → tabelle DB + schemi di validazione API
  logic.py                 → calcoli (budget giornaliero, alert, medie storiche)
  router.py                → endpoint /finanza/...
tempo/                    → modulo futuro, struttura già pronta
studio/                    → modulo futuro, struttura già pronta
frontend/
  index.html                → schermata home del modulo finanza
  css/style.css              → stile (palette bianco/blu, rosso/verde)
  js/app.js                   → chiamate API, rendering, form nuova transazione
  manifest.json                → rende la pagina installabile come PWA su Android
```

## Primo test end-to-end

1. Avvia backend e frontend come sopra
2. Nell'app, tocca "+ Nuova" e aggiungi una transazione (es. uscita, categoria
   cibo, importo 15)
3. Su `/docs` del backend, chiama `POST /finanza/budget` con
   `{"mese": 10, "anno": 2026, "importo_disponibile": 500}`
4. Torna sulla PWA e ricarica la pagina: dovresti vedere il cerchio del budget
   di oggi, entrate/uscite del mese e la transazione appena inserita in lista

## Note

- Tutta la logica di calcolo vive nel backend, non nel frontend — quando la
  PWA verrà sostituita da React Native, questo backend non cambia.
- Il database è SQLite (`app.db`), creato automaticamente al primo avvio.
- Le tabelle hanno prefisso `finanza_` per restare isolate logicamente dai
  futuri moduli `tempo` e `studio`, pur condividendo lo stesso database.
- `allow_origins=["*"]` nel CORS va bene solo in sviluppo locale: quando l'app
  sarà online andrà ristretto al dominio reale del frontend.
