import React, { useState, useCallback, useEffect } from 'react';
import UserInput from './UserInput';
import ModifyWebsiteInput from './ModifyWebsiteInput';
import StreamingLivePreview from './StreamingLivePreview';
import { generateWebsite, modifyWebsite } from '../services/geminiService';
import { downloadCodeAsZip } from '../utils/zipUtils';
import '../styles/LiveRenderer.css';

const LiveRenderer = ({ toggleMode, isLightMode }) => {
  const [userInput, setUserInput] = useState(() => localStorage.getItem('userInput') || '');
  const [modifyInput, setModifyInput] = useState(() => localStorage.getItem('modifyInput') || '');
  const [htmlCode, setHtmlCode] = useState(() => localStorage.getItem('htmlCode') || '');
  const [cssCode, setCssCode] = useState(() => localStorage.getItem('cssCode') || '');
  const [jsCode, setJsCode] = useState(() => localStorage.getItem('jsCode') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userInput', userInput);
    localStorage.setItem('modifyInput', modifyInput);
    localStorage.setItem('htmlCode', htmlCode);
    localStorage.setItem('cssCode', cssCode);
    localStorage.setItem('jsCode', jsCode);
  }, [userInput, modifyInput, htmlCode, cssCode, jsCode]);

  const handleGenerateWebsite = useCallback(async () => {
    if (!userInput.trim()) {
      setError('Please enter a website description');
      return;
    }
    setIsLoading(true);
    setError(null);
    setHtmlCode('');
    setCssCode('');
    setJsCode('');

    try {
      await generateWebsite(userInput, ({ html, css, js }) => {
        console.log('Received update:', { html, css, js });
        if (html) setHtmlCode(html);
        if (css) setCssCode(css);
        if (js) setJsCode(js);
      });
    } catch (err) {
      setError('Failed to generate website: ' + err.message);
      console.error('Error generating website:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userInput]);

  const handleModifyWebsite = useCallback(async () => {
    if (!modifyInput.trim()) {
      setError('Please enter a modification description');
      return;
    }
    if (!htmlCode) {
      setError('Please generate a website first');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await modifyWebsite(modifyInput, htmlCode, cssCode, jsCode, ({ html, css, js }) => {
        if (html) setHtmlCode(html);
        if (css) setCssCode(css);
        if (js) setJsCode(js);
      });
    } catch (err) {
      console.error('Error details:', err);
      setError(err.response?.data?.error || 'Failed to modify website. Please try again.');
      console.error('Error modifying website:', err);
    } finally {
      setIsLoading(false);
    }
  }, [modifyInput, htmlCode, cssCode, jsCode]);

  const handleClear = () => {
    // Clear all stored data
    localStorage.removeItem('userInput');
    localStorage.removeItem('modifyInput');
    localStorage.removeItem('htmlCode');
    localStorage.removeItem('cssCode');
    localStorage.removeItem('jsCode');
    
    // Reset state
    setUserInput('');
    setModifyInput('');
    setHtmlCode('');
    setCssCode('');
    setJsCode('');
    setError(null);
  };

  return (
    <div className="live-renderer">
      <div className="input-container">
        <div className="header-container">
          <h2>WEBSITE DESCRIPTION</h2>
        </div>
        <div className="user-input-wrapper">
          <UserInput 
            value={userInput} 
            onChange={setUserInput} 
            isLoading={isLoading}
          />
          <button 
            onClick={handleGenerateWebsite} 
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Website'}
          </button>
        </div>
        
        <h2>MODIFY WEBSITE</h2>
        <div className="modify-input-wrapper">
          <ModifyWebsiteInput 
            value={modifyInput} 
            onChange={setModifyInput} 
            isLoading={isLoading}
          />
          <button 
            onClick={handleModifyWebsite} 
            disabled={isLoading || !htmlCode}
          >
            {isLoading ? 'Modifying...' : 'Modify Website'}
          </button>
        </div>
        
        <div className="theme-toggle-container">
          <label className="theme-switch">
            <input
              type="checkbox"
              checked={isLightMode}
              onChange={toggleMode}
            />
            <span className="slider round"></span>
          </label>
          <span className="theme-label">
            {isLightMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </div>
        
        {error && <p className="error">{error}</p>}
      </div>
      <div className="preview-container">
        <div className="preview-header">
          <h2>LIVE PREVIEW</h2>
          <div className="preview-actions">
            <button
              onClick={() => downloadCodeAsZip(htmlCode, cssCode, jsCode)}
              className="download-button"
              disabled={!htmlCode}
              title="Download code as ZIP"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Code
            </button>
            <button 
              onClick={handleClear}
              className="clear-button"
              title="Clear all content"
            >
              Clear All
            </button>
          </div>
        </div>
        <StreamingLivePreview 
          htmlCode={htmlCode} 
          cssCode={cssCode} 
          jsCode={jsCode} 
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default LiveRenderer;