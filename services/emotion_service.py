"""
Emotion Service — NLP Brain of The Empathy Engine.

Uses the Hugging Face `j-hartmann/emotion-english-distilroberta-base` model
to classify text into one of 7 emotions: anger, disgust, fear, joy, neutral,
sadness, surprise.
"""

from __future__ import annotations

import logging
from functools import lru_cache

from transformers import pipeline, Pipeline

logger = logging.getLogger(__name__)

MODEL_NAME = "j-hartmann/emotion-english-distilroberta-base"

# ---------------------------------------------------------------------------
# Model loading (cached so it only downloads / loads once)
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_pipeline() -> Pipeline:
    """Load and cache the emotion-classification pipeline."""
    logger.info("Loading emotion model: %s …", MODEL_NAME)
    try:
        classifier = pipeline(
            "text-classification",
            model=MODEL_NAME,
            top_k=1,
            truncation=True,
        )
        logger.info("Emotion model loaded successfully.")
        return classifier
    except Exception as exc:
        logger.error("Failed to load emotion model: %s", exc)
        raise RuntimeError(
            f"Could not load the emotion model '{MODEL_NAME}'. "
            "Make sure you have an internet connection on first run "
            "so the model weights can be downloaded."
        ) from exc


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def analyze_text(text: str) -> dict:
    """Analyse *text* and return the top detected emotion with its confidence.

    Returns
    -------
    dict
        ``{"label": "<emotion>", "score": <float 0-1>}``

    Raises
    ------
    ValueError
        If *text* is empty or whitespace-only.
    RuntimeError
        If the model cannot be loaded.
    """
    if not text or not text.strip():
        raise ValueError("Input text must not be empty.")

    classifier = _get_pipeline()

    # pipeline returns [[{"label": ..., "score": ...}]] when top_k=1
    results = classifier(text)
    top = results[0]  # list of dicts (length 1 because top_k=1)

    if isinstance(top, list):
        top = top[0]

    emotion = top["label"].lower()
    score = round(float(top["score"]), 4)

    logger.info("Detected emotion: %s (%.2f%%)", emotion, score * 100)
    return {"label": emotion, "score": score}
