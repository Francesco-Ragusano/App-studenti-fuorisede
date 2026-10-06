from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from . import models, logic

router = APIRouter()


# ---------- Transazioni ----------

@router.post("/transazioni", response_model=models.TransazioneOut)
def crea_transazione(dati: models.TransazioneCreate, db: Session = Depends(get_db)):
    nuova = models.TransazioneORM(**dati.model_dump())
    db.add(nuova)
    db.commit()
    db.refresh(nuova)
    return nuova


@router.get("/transazioni", response_model=list[models.TransazioneOut])
def lista_transazioni(db: Session = Depends(get_db)):
    return db.query(models.TransazioneORM).order_by(models.TransazioneORM.data.desc()).all()


@router.delete("/transazioni/{transazione_id}")
def elimina_transazione(transazione_id: int, db: Session = Depends(get_db)):
    t = db.query(models.TransazioneORM).filter(models.TransazioneORM.id == transazione_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transazione non trovata")
    db.delete(t)
    db.commit()
    return {"ok": True}


# ---------- Budget mensile ----------

@router.post("/budget", response_model=models.BudgetMensileOut)
def imposta_budget(dati: models.BudgetMensileCreate, db: Session = Depends(get_db)):
    esistente = logic.get_budget_mese(db, dati.anno, dati.mese)
    if esistente:
        esistente.importo_disponibile = dati.importo_disponibile
        db.commit()
        db.refresh(esistente)
        budget_orm = esistente
    else:
        budget_orm = models.BudgetMensileORM(**dati.model_dump())
        db.add(budget_orm)
        db.commit()
        db.refresh(budget_orm)

    return models.BudgetMensileOut(
        id=budget_orm.id,
        mese=budget_orm.mese,
        anno=budget_orm.anno,
        importo_disponibile=budget_orm.importo_disponibile,
        budget_giornaliero=logic.calcola_budget_giornaliero(budget_orm),
    )


@router.get("/budget", response_model=models.BudgetMensileOut)
def leggi_budget(anno: int, mese: int, db: Session = Depends(get_db)):
    """Legge il budget salvato per un dato mese/anno (utile per verifica/debug)."""
    budget_orm = logic.get_budget_mese(db, anno, mese)
    if not budget_orm:
        raise HTTPException(
            status_code=404,
            detail=f"Nessun budget impostato per {mese}/{anno}",
        )
    return models.BudgetMensileOut(
        id=budget_orm.id,
        mese=budget_orm.mese,
        anno=budget_orm.anno,
        importo_disponibile=budget_orm.importo_disponibile,
        budget_giornaliero=logic.calcola_budget_giornaliero(budget_orm),
    )


# ---------- Endpoint "ricchi", già pronti per il frontend ----------

@router.get("/budget/oggi")
def budget_oggi(db: Session = Depends(get_db)):
    """Ritorna già calcolati: budget giornaliero, speso oggi, scarto."""
    return logic.riepilogo_oggi(db)


@router.get("/mese/riepilogo")
def riepilogo_mese(anno: int, mese: int, db: Session = Depends(get_db)):
    """Ritorna entrate e uscite totali del mese indicato."""
    return logic.riepilogo_mese(db, anno, mese)


@router.get("/categorie/alert")
def categorie_in_criticita(db: Session = Depends(get_db)):
    """Ritorna le categorie che sforano la soglia rispetto alla media storica."""
    return logic.alert_categorie(db)


@router.get("/categorie/spesa-mensile")
def spesa_mensile_per_categoria(anno: int, mese: int, db: Session = Depends(get_db)):
    return logic.spesa_per_categoria(db, anno, mese)
