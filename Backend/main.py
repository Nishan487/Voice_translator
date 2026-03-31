import os
import base64
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI, BadRequestError
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.post("/api/translate")
async def translate_voice(
    audio: UploadFile = File(...),
    sourceLang: str = Form(...),
    targetLang: str = Form(...)
):
    # Ensure temporary file has correct extension
    temp_filename = f"temp_audio_{os.urandom(8).hex()}.webm"
    
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

        # 1. Transcription
        with open(temp_filename, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file
            )
        
        original_text = transcription.text

        # 2. Translation
        translation_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"Translate text from {sourceLang} to {targetLang}. Result only."},
                {"role": "user", "content": original_text}
            ]
        )
        translated_text = translation_response.choices[0].message.content

        # 3. Text to Speech
        speech_response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=translated_text
        )

        audio_base64 = base64.b64encode(speech_response.content).decode('utf-8')

        return {
            "originalText": original_text,
            "translatedText": translated_text,
            "audioContent": audio_base64
        }

    except BadRequestError as e:
        # Catch OpenAI specific errors (too short, wrong format)
        print(f"OpenAI Error: {e.message}")
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        print(f"General Error: {e}")
        raise HTTPException(status_code=500, detail="Internal translation error")
    
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)