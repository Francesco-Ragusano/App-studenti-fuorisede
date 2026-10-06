"""
Modelli del modulo finanza.
Ogni classe *ORM (es. TransazioneORM) rappresenta una tabella nel database.
Ogni classe senza suffisso (es. Transazione) è uno schema Pydantic:
definisce la forma dei dati che entrano/escono dall'API.
"""
from datetime import date as date_type
from enum import Enum

from sqlalchemy import Column, Integer, String, Float, Date
from pydantic import BaseModel

from database import Base


class TipoTransazione(str, Enum):
    entrata = "entrata"
    uscita = "uscita"


class LivelloNecessita(str, Enum):
    essenziale = "essenziale"
    utile = "utile"
    superfluo = "superfluo"


# ---------- Tabelle DB (nomi prefissati "finanza_" per isolamento logico) ----------

class TransazioneORM(Base):
    __tablename__ = "finanza_transazioni"

    id = Column(Integer, primary_key=True, index=True)
    importo = Column(Float, nullable=False)
    tipo = Column(String, nullable=False)  # "entrata" | "uscita"
    data = Column(Date, nullable=False, index=True)
    categoria = Column(String, nullable=True)  # es: cibo, istruzione, svago
    livello_necessita = Column(String, nullable=True)
    note = Column(String, nullable=True)


class BudgetMensileORM(Base):
    __tablename__ = "finanza_budget_mensile"

    id = Column(Integer, primary_key=True, index=True)
    mese = Column(Integer, nullable=False)  # 1-12
    anno = Column(Integer, nullable=False)
    importo_disponibile = Column(Float, nullable=False)


# ---------- Schemi Pydantic (validazione input / forma output API) ----------

class TransazioneCreate(BaseModel):
    importo: float
    tipo: TipoTransazione
    data: date_type
    categoria: str | None = None
    livello_necessita: LivelloNecessita | None = None
    note: str | None = None


class TransazioneOut(TransazioneCreate):
    id: int

    class Config:
        from_attributes = True  # permette di creare lo schema da un oggetto ORM


class BudgetMensileCreate(BaseModel):
    mese: int
    anno: int
    importo_disponibile: float


class BudgetMensileOut(BudgetMensileCreate):
    id: int
    budget_giornaliero: float  # calcolato, non salvato nel DB

    class Config:
        from_attributes = True
