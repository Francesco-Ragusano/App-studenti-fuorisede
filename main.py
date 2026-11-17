import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from finanza.router import router as finanza_router

# Crea le tabelle nel database se non esistono già.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="App Studenti Fuori Sede")

origini_consentite = os.environ.get("FRONTEND_URL", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origini_consentite] if origini_consentite != "*" else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(finanza_router, prefix="/finanza", tags=["finanza"])



@app.get("/")
def root():
    return {"status": "ok", "message": "Backend attivo"}
