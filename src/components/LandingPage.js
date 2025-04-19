import React, { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';
import '../styles/GlassButton.css';

const LandingPage = memo(({ isLightMode }) => {
  const navigate = useNavigate();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleVideoPlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handleVideoPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleNavigateHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleStartCreating = useCallback(() => {
    navigate('/create');
  }, [navigate]);

  return (
    <div className="landing-page">
      <video
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        className={`background-video ${videoLoaded ? 'loaded' : ''} ${isPlaying ? 'playing' : ''}`}
      >
        <source src={`${process.env.PUBLIC_URL}/assets/videos/background.mp4`} type="video/mp4" />
        Your browser does not support video playback.
      </video>

      <div className="overlay" />

      <div className="content-wrapper">
        <header className="landing-header">
          <h1 onClick={handleNavigateHome}>InstantCraft</h1>
        </header>

        <main className="landing-content">
          <h2>Create Websites Instantly with AI</h2>
          <p>Transform your ideas into beautiful websites in seconds using the power of AI</p>
          <button 
            onClick={handleStartCreating}
            className="glass-btn"
          >
            Start Creating
          </button>
        </main>
      </div>
    </div>
  );
});

LandingPage.displayName = 'LandingPage';
export default LandingPage;
