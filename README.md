# The Empathy Engine
A web application that takes in arbitrary text, analyzes the underlying emotional sentiment in real-time, and generates emotionally resonant Text-to-Speech (TTS) audio. It fundamentally gives AI a human voice by letting it speak not just words, but feelings.

## 🛠️ Tech Stack
- **Frontend**: Next.js (React), Tailwind CSS, Lucide Icons. Features an interactive, 3D animated dashboard to display inference latency, NLP confidence, and the detected emotion.
- **Backend / NLP**: FastAPI (Python), Hugging Face `transformers` running `j-hartmann/emotion-english-distilroberta-base` for fast, local 7-class emotion classification.
- **Audio Generation**: `edge-tts` (Microsoft Edge Text-to-Speech API). Uses native SSML prosody parameters to shift the voice's pitch and rate algorithmically generation.

---

## 🚀 How to Run

### 1. Prerequisites
- **Node.js & npm** (for the frontend)
- **Python 3.9+** (for the backend)
- *(Optional but recommended)* A Python virtual environment.

### 2. Backend Setup
Open your terminal and navigate to the project's root directory (`The-Empathy-Engine`).

```bash
# Navigate to the root folder
cd The-Empathy-Engine

# Create and activate a virtual environment (Windows)
python -m venv .venv
.venv\Scripts\activate
# For Mac/Linux: source .venv/bin/activate

# Install the necessary python dependencies
pip install fastapi uvicorn transformers torch edge-tts python-dotenv

# Start the FastAPI server
uvicorn main:app --reload --port 7860
```
The server will spin up on `http://localhost:7860`. 
*Note: On the first run, it will briefly pause to download the ~328MB DistilRoBERTa emotion model from Hugging Face.*

### 3. Frontend Setup
Leave the backend terminal running, open a **new** terminal, and navigate to the `frontend` folder.

```bash
# Navigate to the frontend directory
cd The-Empathy-Engine/frontend

# Install JS dependencies
npm install

# Start the Next.js development server
npm run dev
```
Navigate your browser to `http://localhost:3000` to interact with the application!

---

## 🧠 Design Choices: Emotion to Voice Mapping
To ensure the synthesis sounds genuinely human rather than just a robotic filter, the audio is **not** post-processed via digital signal processing (DSP) filters. Instead, the emotional resonance is achieved natively during synthesis using **SSML Prosody tags**. This removes the need for external tools like FFmpeg entirely.

When the NLP model classifies a text, it yields both an **emotion label** and an **intensity score** (confidence, 0.0 to 1.0). We use this data to dynamically modify the base vocal profile (`en-US-JennyNeural`) across two primary auditory vectors: **rate** (speed) and **pitch** (frequency).

### Base Modulation Matrix
### Base Modulation Matrix
- **Joy**: `+15% rate`, `+15Hz pitch`, `+20% volume` (Louder, brighter, upbeat)
- **Sadness**: `-15% rate`, `-20Hz pitch`, `-20% volume` (Quieter, deeper tone, more somber)
- **Anger**: `+25% rate`, `+20Hz pitch`, `+30% volume` (Much louder, faster, and authoritative)
- **Surprise**: `+5% rate`, `+40Hz pitch`, `+15% volume` (Louder, sharp increase in pitch)
- **Fear**: `+15% rate`, `+30Hz pitch`, `+15% volume` (Tense, faster, louder)
- **Disgust**: `-10% rate`, `-25Hz pitch`, `-15% volume` (Quieter, deeper tone, contempt)
- **Neutral**: Unmodified baseline speech.

### Dynamic NLP Scaling
The actual modification applied to the voice is calculated as the **product** of these baseline numbers and the model's prediction intensity.

`Actual Parameter Shift = Target Parameter × NLP Intensity Score`

For example, a mildly angry sentence (intensity: 0.5) will only drop the pitch by `-15Hz`, while a furiously angry statement (intensity: 0.95) will drop the pitch by the near maximum `-28Hz`. This dynamic scaling mechanism prevents the voice from sounding like an extreme caricature on ambiguous sentences, while guaranteeing that undeniably emotional statements sound deeply and unmistakably passionate.
