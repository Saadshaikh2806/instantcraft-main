import React, { useState, useEffect, useRef } from 'react';

const StreamingLivePreview = ({ htmlCode, cssCode, jsCode, isLoading }) => {
  const iframeRef = useRef(null);
  const [popupWindow, setPopupWindow] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  const focusIframe = (e) => {
    if (iframeRef.current) {
      iframeRef.current.focus();
      setIsFocused(true);
    }
    e?.stopPropagation();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFocused) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  const openInNewWindow = (e) => {
    e.stopPropagation();
    if (popupWindow && !popupWindow.closed) {
      popupWindow.close();
    }

    try {
      const width = window.screen.width;
      const height = window.screen.height;
      const newWindow = window.open('', 'Preview', 
        `width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no`
      );
      
      if (!newWindow) {
        console.error('Failed to open new window - popup might be blocked');
        return;
      }

      newWindow.moveTo(0, 0);
      newWindow.resizeTo(width, height);
      setPopupWindow(newWindow);

      const content = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: *; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                min-height: 100vh;
                background-color: #000;
                color: #fff;
                padding: 20px;
                overflow-y: auto;
                overflow-x: hidden;
              }

              canvas {
                display: block;
                margin: auto;
                outline: none;
                image-rendering: pixelated;
              }

              ${cssCode || ''}
            </style>
          </head>
          <body>
            <div id="root">
              ${htmlCode || '<h1 style="text-align: center; margin-top: 20px;">Your website will appear here</h1>'}
            </div>
            <script>
              try {
                ${jsCode || ''}
              } catch (error) {
                console.error('Error executing JavaScript:', error);
              }
            </script>
          </body>
        </html>
      `;

      newWindow.document.write(content);
      newWindow.document.close();
      newWindow.focus();

      window.addEventListener('beforeunload', () => {
        if (newWindow && !newWindow.closed) {
          newWindow.close();
        }
      });
    } catch (error) {
      console.error('Error opening new window:', error);
    }
  };

  useEffect(() => {
    const updateIframeContent = () => {
      try {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const doc = iframe.contentDocument;
        if (!doc) return;

        const content = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: *; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';">
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  min-height: 100vh;
                  background-color: #000;
                  color: #fff;
                  padding: 20px;
                  overflow-y: auto;
                  overflow-x: hidden;
                }

                canvas {
                  display: block;
                  margin: auto;
                  outline: none;
                  image-rendering: pixelated;
                }

                /* Apply custom CSS */
                ${cssCode || ''}
              </style>
            </head>
            <body>
              <div id="root">
                ${htmlCode || '<h1 style="text-align: center; margin-top: 20px;">Your website will appear here</h1>'}
              </div>
              <script>
                try {
                  ${jsCode || ''}
                } catch (error) {
                  console.error('Error executing JavaScript:', error);
                }
              </script>
            </body>
          </html>
        `;

        doc.open();
        doc.write(content);
        doc.close();

        iframe.focus();
        setIsFocused(true);

        setTimeout(() => {
          iframe.focus();
          setIsFocused(true);
        }, 100);
      } catch (error) {
        console.error('Error updating iframe content:', error);
      }
    };

    updateIframeContent();

    return () => {
      try {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentDocument) {
          iframe.contentDocument.open();
          iframe.contentDocument.write('');
          iframe.contentDocument.close();
        }
        setIsFocused(false);
      } catch (error) {
        console.error('Error cleaning up iframe:', error);
      }
    };
  }, [htmlCode, cssCode, jsCode]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    iframe.addEventListener('focus', handleFocus);
    iframe.addEventListener('blur', handleBlur);

    return () => {
      iframe.removeEventListener('focus', handleFocus);
      iframe.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <div 
      className="streaming-live-preview" 
      style={{ 
        height: 'calc(100% - 40px)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
      onClick={focusIframe}
    >
      {isLoading && (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      )}
      <button 
        onClick={openInNewWindow}
        className="fullscreen-toggle"
        aria-label="Open in new window"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </button>
      <iframe 
        ref={iframeRef} 
        title="Streaming Live Preview"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          border: `1px solid ${isFocused ? 'var(--accent-color)' : 'var(--text-color)'}`,
          borderRadius: '4px',
          marginBottom: '0',
          outline: 'none',
          opacity: isLoading ? '0.3' : '1',
          transition: 'opacity 0.3s ease'
        }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-downloads"
        tabIndex="0"
        onMouseEnter={focusIframe}
      />
    </div>
  );
};

export default StreamingLivePreview;