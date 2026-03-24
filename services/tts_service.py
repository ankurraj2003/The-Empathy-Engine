import logging
import os
import time
import uuid
import edge_tts

logger = logging.getLogger(__name__)

# Base voice profile - Jenny is highly expressive and human-like natively
BASE_VOICE = "en-US-JennyNeural"


MODULATION_RULES = {
    "joy":      {"rate": 20,  "pitch": 20,  "volume": 20},   # louder + brighter
    "sadness":  {"rate": -20, "pitch": -30, "volume": -20},  # quieter + somber
    "anger":    {"rate": 30,  "pitch":25, "volume": 30},   # much louder + authoritative
    "surprise": {"rate": 40,   "pitch": 25,  "volume": 25},   # louder + sharp
    "fear":     {"rate": 30,  "pitch": 20,  "volume": 20},   # tense + louder
    "disgust":  {"rate": -20, "pitch": -30, "volume": -20},  # quieter + contempt
    "neutral":  {"rate": 0,   "pitch": 0,   "volume": 0},    # baseline
}

async def generate_audio(text: str, emotion: str, intensity: float) -> str | None:
    """
    Synthesize audio using edge-tts. Modulates emotion natively via SSML 
    prosody tags rather than post-processing, resulting in highly human-like speech.
    """
    logger.info(f"Generating Edge-TTS Audio | Emotion: {emotion} (Intensity: {intensity:.2f})")

    # Setup directories
    outputs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "outputs")
    os.makedirs(outputs_dir, exist_ok=True)

    uid = str(uuid.uuid4())[:8]
    final_filename = f"{int(time.time())}_{uid}_{emotion}.mp3"
    final_filepath = os.path.join(outputs_dir, final_filename)

    # Calculate modifications
    rule = MODULATION_RULES.get(emotion.lower(), {"rate": 0, "pitch": 0, "volume": 0})
    
    # Apply NLP Intensity multiplier
    rate_val = int(rule["rate"] * intensity)
    pitch_val = int(rule["pitch"] * intensity)
    volume_val = int(rule.get("volume", 0) * intensity)
    
    # Format into explicit strings as required by edge-tts
    rate_str = f"{rate_val:+}%"
    pitch_str = f"{pitch_val:+}Hz"
    volume_str = f"{volume_val:+}%"
    
    logger.info(f"Applying SSML Prosody | Rate: {rate_str}, Pitch: {pitch_str}, Volume: {volume_str}")

    try:
        # edge-tts generates the speech and applies the SSML transformations natively
        communicate = edge_tts.Communicate(
            text=text,
            voice=BASE_VOICE,
            rate=rate_str,
            pitch=pitch_str,
            volume=volume_str
        )
        
        await communicate.save(final_filepath)
        
        return f"/outputs/{final_filename}"
        
    except Exception as e:
        logger.error(f"Edge-TTS Generation Error: {e}")
        raise RuntimeError("Failed to generate audio from edge-tts.")