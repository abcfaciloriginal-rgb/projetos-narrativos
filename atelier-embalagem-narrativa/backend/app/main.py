import os
from typing import Literal, Any, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")

app = FastAPI(title="Atelier API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
- devolver apenas:
  5 títulos
  5 conceitos de thumbnail
  5 textos curtos de thumbnail
  3 combinações finais

Regras:
- linguagem cinematográfica, emocional e filosófica
- sem clickbait vazio
- curiosidade com honestidade
- thumbnails minimalistas e legíveis
- texto da thumb com no máximo 3 palavras
- coerência entre título, thumbnail e promessa do vídeo

Formato:
responda em JSON válido com esta estrutura:
{
  "titles": ["...", "...", "...", "...", "..."],
  "thumbnails": [
    {"concept": "...", "emotion": "...", "symbol": "..."},
    {"concept": "...", "emotion": "...", "symbol": "..."},
    {"concept": "...", "emotion": "...", "symbol": "..."},
    {"concept": "...", "emotion": "...", "symbol": "..."},
    {"concept": "...", "emotion": "...", "symbol": "..."}
  ],
  "thumb_texts": ["...", "...", "...", "...", "..."],
  "combos": [
    {
      "title": "...",
      "thumb_text": "...",
      "visual_concept": "...",
      "why_it_works": "..."
    },
    {
      "title": "...",
      "thumb_text": "...",
      "visual_concept": "...",
      "why_it_works": "..."
    },
    {
      "title": "...",
      "thumb_text": "...",
      "visual_concept": "...",
      "why_it_works": "..."
    }
  ]
}
""".strip()


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
{payload.tone or "cinematográfico, emocional e filosófico"}

Contexto de referência:
{payload.referenceContext or "nenhum"}

Instrução crítica:
Use as referências apenas como gramática criativa e campo de inspiração.
Nunca copie literalmente thumbnails, frases ou composições.
Procure originalidade dentro da mesma família emocional e visual.

Tarefa:
gere a embalagem completa em JSON.
""".strip()


@app.get("/")
async def root():
    return {"message": "Atelier API online"}


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/api/packaging")
async def generate_packaging(payload: PackagingRequest):
    if not payload.story or len(payload.story.strip()) < 30:
        raise HTTPException(status_code=400, detail="A história está curta demais.")

    if payload.provider == "openai":
        return await call_openai(payload)

    if payload.provider == "gemini":
        return await call_gemini(payload)

    raise HTTPException(status_code=400, detail="Provider inválido.")


async def call_openai(payload: PackagingRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY não configurada.")

    body = {
        "model": OPENAI_MODEL,
        "input": [
            {
                "role": "system",
                "content": [
                    {"type": "input_text", "text": SYSTEM_PROMPT}
                ],
            },
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": build_user_prompt(payload)}
                ],
            },
        ],
    }

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://api.openai.com/v1/responses",
            headers=headers,
            json=body,
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    data = response.json()

    text_output = data.get("output_text")
    if not text_output:
        output = data.get("output", [])
        fragments = []
        for item in output:
            for content in item.get("content", []):
                if content.get("type") == "output_text":
                    fragments.append(content.get("text", ""))
        text_output = "\n".join(fragments).strip()

    return {
        "provider": "openai",
        "raw_text": text_output,
        "raw_response": data
    }


async def call_gemini(payload: PackagingRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY não configurada.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

    body = {
        "system_instruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "contents": [
            {
                "parts": [
                    {"text": build_user_prompt(payload)}
                ]
            }
        ]
    }

    headers = {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(url, headers=headers, json=body)

    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    data = response.json()

    text_output = ""
    candidates = data.get("candidates", [])
    if candidates:
      parts = candidates[0].get("content", {}).get("parts", [])
      text_output = "\n".join(
          part.get("text", "") for part in parts if "text" in part
      ).strip()

    return {
        "provider": "gemini",
        "raw_text": text_output,
        "raw_response": data
    }