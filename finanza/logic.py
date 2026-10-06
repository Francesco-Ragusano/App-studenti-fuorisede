"""
Logica "intelligente" del modulo finanza.
Tutto quello che è calcolo (non semplice lettura/scrittura) vive qui,
così il frontend (PWA oggi, React Native domani) riceve già risposte
pronte dall'API, senza dover ricalcolare nulla lato client.
"""
import calendar
from datetime import date

from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from .models import TransazioneORM, BudgetMensileORM


def giorni_nel_mese(anno: int, mese: int) -> int:
    return calendar.monthrange(anno, mese)[1]


def calcola_budget_giornaliero(budget: BudgetMensileORM) -> float:
    giorni = giorni_nel_mese(budget.anno, budget.mese)
    return round(budget.importo_disponibile / giorni, 2)


def get_budget_mese(db: Session, anno: int, mese: int) -> BudgetMensileORM | None:
    return (
        db.query(BudgetMensileORM)
        .filter(BudgetMensileORM.anno == anno, BudgetMensileORM.mese == mese)
        .first()
    )


def speso_in_data(db: Session, giorno: date) -> float:
    totale = (
        db.query(func.sum(TransazioneORM.importo))
        .filter(TransazioneORM.data == giorno, TransazioneORM.tipo == "uscita")
        .scalar()
    )
    return round(totale or 0.0, 2)


def riepilogo_oggi(db: Session) -> dict:
    """Calcola budget/speso/scarto per la giornata corrente."""
    oggi = date.today()
    budget = get_budget_mese(db, oggi.year, oggi.month)

    if budget is None:
        return {
            "budget_giornaliero": 0.0,
            "speso_oggi": speso_in_data(db, oggi),
            "scarto": None,
            "messaggio": "Nessun budget impostato per questo mese.",
        }

    budget_giornaliero = calcola_budget_giornaliero(budget)
    speso_oggi = speso_in_data(db, oggi)
    scarto = round(budget_giornaliero - speso_oggi, 2)

    return {
        "budget_giornaliero": budget_giornaliero,
        "speso_oggi": speso_oggi,
        "scarto": scarto,
    }


def riepilogo_mese(db: Session, anno: int, mese: int) -> dict:
    """Totale entrate e uscite del mese indicato."""
    entrate = (
        db.query(func.sum(TransazioneORM.importo))
        .filter(
            extract("year", TransazioneORM.data) == anno,
            extract("month", TransazioneORM.data) == mese,
            TransazioneORM.tipo == "entrata",
        )
        .scalar()
    )
    uscite = (
        db.query(func.sum(TransazioneORM.importo))
        .filter(
            extract("year", TransazioneORM.data) == anno,
            extract("month", TransazioneORM.data) == mese,
            TransazioneORM.tipo == "uscita",
        )
        .scalar()
    )
    return {"entrate": round(entrate or 0.0, 2), "uscite": round(uscite or 0.0, 2)}


def spesa_per_categoria(db: Session, anno: int, mese: int) -> dict[str, float]:
    """Totale speso per categoria nel mese indicato."""
    righe = (
        db.query(TransazioneORM.categoria, func.sum(TransazioneORM.importo))
        .filter(
            extract("year", TransazioneORM.data) == anno,
            extract("month", TransazioneORM.data) == mese,
            TransazioneORM.tipo == "uscita",
        )
        .group_by(TransazioneORM.categoria)
        .all()
    )
    return {categoria or "senza categoria": round(totale, 2) for categoria, totale in righe}


def alert_categorie(db: Session, soglia_percentuale: float = 20.0) -> list[dict]:
    """
    Confronta la spesa per categoria del mese corrente con la media
    degli ultimi 3 mesi precedenti. Segnala le categorie che sforano
    la soglia (es. +20%) rispetto alla loro media storica.
    """
    oggi = date.today()
    spesa_corrente = spesa_per_categoria(db, oggi.year, oggi.month)

    alerts = []
    for categoria, importo_corrente in spesa_corrente.items():
        media_storica = _media_storica_categoria(db, categoria, oggi, mesi=3)
        if media_storica <= 0:
            continue  # nessuno storico sufficiente per confrontare
        scostamento = ((importo_corrente - media_storica) / media_storica) * 100
        if scostamento >= soglia_percentuale:
            alerts.append({
                "categoria": categoria,
                "spesa_corrente": importo_corrente,
                "media_storica": round(media_storica, 2),
                "scostamento_percentuale": round(scostamento, 1),
            })
    return alerts


def _media_storica_categoria(db: Session, categoria: str, oggi: date, mesi: int = 3) -> float:
    totali = []
    anno, mese = oggi.year, oggi.month
    for _ in range(mesi):
        mese -= 1
        if mese == 0:
            mese = 12
            anno -= 1
        totale = (
            db.query(func.sum(TransazioneORM.importo))
            .filter(
                extract("year", TransazioneORM.data) == anno,
                extract("month", TransazioneORM.data) == mese,
                TransazioneORM.tipo == "uscita",
                TransazioneORM.categoria == categoria,
            )
            .scalar()
        )
        if totale:
            totali.append(totale)
    return sum(totali) / len(totali) if totali else 0.0
