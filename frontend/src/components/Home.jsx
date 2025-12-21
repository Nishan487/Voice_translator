import React from "react";
import "./Home.css";

const Home = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // later: send selected languages to backend
  };

  return (
    <div id="home-container">
      <h1 id="app-title">🎙️ Voice Language Translator</h1>
      <p id="app-subtitle">
        Choose two languages and start voice-to-voice translation
      </p>

      <form id="language-form" onSubmit={handleSubmit}>
        {/* First Language Section */}
        <div className="language-card">
          <h2>First Language</h2>
          <select id="first-language" className="language-select">
            <option value="">Select language</option>
            <option value="en">English</option>
            <option value="ne">Nepali</option>
          </select>
        </div>

        {/* Second Language Section */}
        <div className="language-card">
          <h2>Second Language</h2>
          <select id="second-language" className="language-select">
            <option value="">Select language</option>
            <option value="ne">Nepali</option>
            <option value="en">English</option>
          </select>
        </div>

        <button id="start-btn" type="submit">
          Start Translation
        </button>
      </form>
    </div>
  );
};

export default Home;
