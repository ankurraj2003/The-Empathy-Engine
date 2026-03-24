

from __future__ import annotations

import logging
from pathlib import Path

from dotenv import load_dotenv

# Load environment variables from the services/.env file
env_path = Path(__file__).resolve().parent / "services" / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, field_validator

from services.emotion_service import analyze_text
from services.tts_service import generate_audio

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="The Empathy Engine",
    description="Dynamically modulates TTS vocal parameters based on detected text emotion.",
    version="1.0.0",
)

# CORS — allow the Next.js dev server (and any origin for prototyping)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Directories
# ---------------------------------------------------------------------------

OUTPUTS_DIR = Path(__file__).resolve().parent / "outputs"

# Create outputs dir before mounting (mount runs at import time, before startup events)
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
logger.info("Outputs directory ready: %s", OUTPUTS_DIR)

# Mount the outputs folder so generated audio is servable
app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class SynthesizeRequest(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def text_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Text must not be empty.")
        return v.strip()


class SynthesizeResponse(BaseModel):
    emotion: str
    intensity: float
    audio_url: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.post("/api/synthesize", response_model=SynthesizeResponse)
async def synthesize(req: SynthesizeRequest):
    """Analyse text emotion and generate modulated TTS audio."""
    try:
        # Step 1 — Emotion detection
        result = analyze_text(req.text)
        emotion = result["label"]
        intensity = result["score"]

        # Step 2 — TTS generation
        audio_url = await generate_audio(req.text, emotion, intensity)

        return SynthesizeResponse(
            emotion=emotion,
            intensity=intensity,
            audio_url=audio_url,
        )

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error during synthesis")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Check server logs for details.",
        ) from exc


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health():
    return {"status": "ok"}
