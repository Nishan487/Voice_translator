import React, { useState, useRef } from "react";
import "./Home.css";

const Home = () => {
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("ne");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const startTimeRef = useRef(null); // Added to track duration

  const startRecording = async () => {
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Explicitly set MimeType to webm
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      startTimeRef.current = Date.now(); 

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = handleAudioUpload;
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async () => {
    // 1. Duration Check: Ignore if less than 300ms
    const duration = Date.now() - startTimeRef.current;
    if (duration < 300) {
      console.warn("Recording too short, ignoring request.");
      return;
    }

    setLoading(true);
    // Use .webm blob
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    
    // Explicitly name the file with .webm extension
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("sourceLang", sourceLang === "en" ? "English" : "Nepali");
    formData.append("targetLang", targetLang === "ne" ? "Nepali" : "English");

    try {
      const response = await fetch("http://127.0.0.1:5000/api/translate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      setResult(data);
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audio.play();
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="home-container">
      <h1 id="app-title">🎙️ Voice Language Translator</h1>
      <p id="app-subtitle">Choose two languages and start voice-to-voice translation</p>

      <div id="language-form">
        <div className="language-card">
          <h2>First Language</h2>
          <select className="language-select" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
            <option value="en">English</option>
            <option value="ne">Nepali</option>
          </select>
        </div>

        <div className="language-card">
          <h2>Second Language</h2>
          <select className="language-select" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
            <option value="ne">Nepali</option>
            <option value="en">English</option>
          </select>
        </div>

        <button 
          id="start-btn" 
          className={isRecording ? "recording" : ""}
          onMouseDown={startRecording} 
          onMouseUp={stopRecording}
          onTouchStart={startRecording} 
          onTouchEnd={stopRecording}
          disabled={loading}
        >
          {loading ? "Translating..." : isRecording ? "Release to Translate" : "Hold to Speak"}
        </button>
      </div>

      {result && (
        <div id="result-display">
          <p><strong>You said:</strong> {result.originalText}</p>
          <p><strong>Translation:</strong> <span style={{color: '#00c6ff'}}>{result.translatedText}</span></p>
        </div>
      )}
    </div>
  );
};

export default Home;