"""
Entry point dell'app.
I moduli tempo/ e studio/ sono già pronti come cartelle: quando avranno
un router.py, basterà aggiungere un app.include_router(...) qui sotto,
con lo stesso pattern usato per finanza.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from finanza.router import router as finanza_router

# Crea le tabelle nel database se non esistono già.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="App Studenti Fuori Sede")

# Permette al frontend (servito su un'altra origine/porta) di chiamare questa API.
# In locale resta aperto a tutti ("*"). In produzione, imposta la variabile
# d'ambiente FRONTEND_URL con l'indirizzo reale del frontend per restringerlo.
origini_consentite = os.environ.get("FRONTEND_URL", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origini_consentite] if origini_consentite != "*" else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(finanza_router, prefix="/finanza", tags=["finanza"])

# Futuro:
# from tempo.router import router as tempo_router
# app.include_router(tempo_router, prefix="/tempo", tags=["tempo"])
#
# from studio.router import router as studio_router
# app.include_router(studio_router, prefix="/studio", tags=["studio"])


@app.get("/")
def root():
    return {"status": "ok", "message": "Backend attivo"}
