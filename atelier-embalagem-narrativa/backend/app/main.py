import os
from pathlib import Path
from typing import Literal, Any, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

app = FastAPI(title="Atelier API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------
# LOCALIZAR FRONTEND AUTOMATICAMENTE
# ---------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIR = BASE_DIR / "frontend"

if not FRONTEND_DIR.exists():
    raise RuntimeError(f"Frontend não encontrado em: {FRONTEND_DIR}")

# servir arquivos estáticos
app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="js")
app.mount("/css", StaticFiles(directory=FRONTEND_DIR / "css"), name="css")
app.mount("/library", StaticFiles(directory=FRONTEND_DIR / "library"), name="library")

# página principal
@app.get("/")
async def index():
    return FileResponse(FRONTEND_DIR / "index.html")

# ---------------------------------------------------
# MODELO DE DADOS
# ---------------------------------------------------

class PackagingRequest(BaseModel):
    provider: Literal["openai", "gemini"]
    story: str
    niche: Optional[str] = None
    tone: Optional[str] = None
    summary: Optional[str] = None
    logline: Optional[str] = None
    theme: Optional[str] = None
    emotion: Optional[str] = None
    wound: Optional[str] = None
    contradiction: Optional[str] = None
    symbol: Optional[str] = None
    subtext: Optional[str] = None
    referenceContext: Optional[dict[str, Any]] = None


SYSTEM_PROMPT = """
Você é o motor de embalagem narrativa do Atelier de Embalagem Narrativa.

Função:
- receber uma história pronta
- gerar embalagem para YouTube
- NÃO reescrever a história

Devolver:

5 títulos
5 conceitos de thumbnail
5 textos curtos de thumbnail
3 combinações finais

Formato obrigatório em JSON.
""".strip()


# ---------------------------------------------------
# PROMPT BUILDER
# ---------------------------------------------------

def build_user_prompt(payload: PackagingRequest) -> str:

    return f"""
História:
{payload.story}

Resumo:
{payload.summary or "não informado"}

Logline:
{payload.logline or "não informada"}

Tema:
{payload.theme or "não informado"}

Emoção dominante:
{payload.emotion or "não informada"}

Ferida:
{payload.wound or "não informada"}

Contradição humana:
{payload.contradiction or "não informada"}

Símbolo inicial:
{payload.symbol or "não informado"}

Subtexto:
{payload.subtext or "não informado"}

Nicho:
{payload.niche or "não informado"}

Tom desejado:
{payload.tone or "cinematográfico"}

Contexto de referência:
{payload.referenceContext or "nenhum"}

Tarefa:
gere a embalagem completa em JSON.
""".strip()


# ---------------------------------------------------
# ROTAS
# ---------------------------------------------------

@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/api/packaging")
async def generate_packaging(payload: PackagingRequest):

    if not payload.story or len(payload.story.strip()) < 30:
        raise HTTPException(status_code=400, detail="História muito curta.")

    if payload.provider == "gemini":
        return await call_gemini(payload)

    if payload.provider == "openai":
        return await call_openai(payload)

    raise HTTPException(status_code=400, detail="Provider inválido.")


# ---------------------------------------------------
# OPENAI
# ---------------------------------------------------

async def call_openai(payload: PackagingRequest):

    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY não configurada.")

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }

    body = {
        "model": OPENAI_MODEL,
        "input": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(payload)},
        ],
    }

    async with httpx.AsyncClient(timeout=60) as client:

        response = await client.post(
            "https://api.openai.com/v1/responses",
            headers=headers,
            json=body,
        )

    data = response.json()

    return {
        "provider": "openai",
        "raw_text": data,
        "raw_response": data,
    }


# ---------------------------------------------------
# GEMINI
# ---------------------------------------------------

async def call_gemini(payload: PackagingRequest):

    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY não configurada.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

    headers = {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
    }

    body = {
        "contents": [
            {
                "parts": [
                    {"text": SYSTEM_PROMPT},
                    {"text": build_user_prompt(payload)}
                ]
            }
        ]
    }

    async with httpx.AsyncClient(timeout=60) as client:

        response = await client.post(url, headers=headers, json=body)

    data = response.json()

    text_output = ""

    candidates = data.get("candidates", [])

    if candidates:

        parts = candidates[0].get("content", {}).get("parts", [])

        text_output = "\n".join(
            part.get("text", "") for part in parts if "text" in part
        )

    return {
        "provider": "gemini",
        "raw_text": text_output,
        "raw_response": data
    }