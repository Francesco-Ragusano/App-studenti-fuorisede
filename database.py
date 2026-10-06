"""
Database condiviso tra tutti i moduli (finanza, tempo, studio).
Ogni modulo definisce le proprie tabelle in models.py, ma usano
tutti lo stesso engine/sessione definiti qui.
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# In locale usa SQLite (un file, zero configurazione). In produzione,
# imposta la variabile d'ambiente DATABASE_URL (es. su Render) con
# l'indirizzo del database Postgres: il codice la usa automaticamente,
# nessuna modifica necessaria.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./app.db")

# Render fornisce l'URL con prefisso "postgres://", ma SQLAlchemy 2.x
# richiede "postgresql://" — normalizziamo se serve.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# connect_args specifico di SQLite: su Postgres va omesso.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base condivisa: ogni modulo importa questa stessa Base per i suoi modelli,
# così tutte le tabelle finiscono nello stesso database fisico.
Base = declarative_base()


def get_db():
    """Dependency FastAPI: apre una sessione DB per la richiesta, la chiude dopo."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
