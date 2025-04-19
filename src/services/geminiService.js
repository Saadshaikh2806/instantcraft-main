// Get the appropriate backend URL based on the environment
let BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// In production, use the current hostname
if (process.env.NODE_ENV === 'production') {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  BACKEND_URL = `${protocol}//${hostname}`;
}

console.log('Using backend URL:', BACKEND_URL);

export async function generateWebsite(description, onUpdate) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/generate-website`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    let lastUpdate = { html: '', css: '', js: '' };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          const { text } = data;
          
          // Accumulate the text
          accumulatedText += text;
          
          // Extract HTML, CSS, and JavaScript from the accumulated response
          const htmlMatch = accumulatedText.match(/```html\n([\s\S]*?)\n```/);
          const cssMatch = accumulatedText.match(/```css\n([\s\S]*?)\n```/);
          const jsMatch = accumulatedText.match(/```javascript\n([\s\S]*?)\n```/);

          const update = {
            html: htmlMatch ? htmlMatch[1].trim() : lastUpdate.html,
            css: cssMatch ? cssMatch[1].trim() : lastUpdate.css,
            js: jsMatch ? jsMatch[1].trim() : lastUpdate.js
          };

          // Only update if there are actual changes
          if (update.html !== lastUpdate.html || 
              update.css !== lastUpdate.css || 
              update.js !== lastUpdate.js) {
            console.log('New update:', update);
            lastUpdate = update;
            onUpdate(update);
          }
        }
      }
    }

    // Final update with complete code
    const finalHtmlMatch = accumulatedText.match(/```html\n([\s\S]*?)\n```/);
    const finalCssMatch = accumulatedText.match(/```css\n([\s\S]*?)\n```/);
    const finalJsMatch = accumulatedText.match(/```javascript\n([\s\S]*?)\n```/);

    if (finalHtmlMatch || finalCssMatch || finalJsMatch) {
      const finalUpdate = {
        html: finalHtmlMatch ? finalHtmlMatch[1].trim() : lastUpdate.html,
        css: finalCssMatch ? finalCssMatch[1].trim() : lastUpdate.css,
        js: finalJsMatch ? finalJsMatch[1].trim() : lastUpdate.js
      };
      console.log('Final update:', finalUpdate);
      onUpdate(finalUpdate);
    }

  } catch (error) {
    console.error('Error calling backend API:', error);
    throw new Error('Failed to generate website: ' + error.message);
  }
}

export async function modifyWebsite(modificationDescription, currentHtml, currentCss, currentJs, onUpdate) {
  try {
    // Validate inputs before sending
    if (!modificationDescription?.trim()) {
      throw new Error('Modification description is required');
    }

    if (!currentHtml?.trim()) {
      throw new Error('Current HTML code is required');
    }

    const payload = {
      modificationDescription: modificationDescription.trim(),
      currentHtml: currentHtml.trim(),
      currentCss: currentCss?.trim() || '',
      currentJs: currentJs?.trim() || ''
    };

    console.log('Sending modification request to:', `${BACKEND_URL}/api/modify-website`);
    console.log('Request payload:', payload);

    const response = await fetch(`${BACKEND_URL}/api/modify-website`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      } catch (e) {
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    let lastUpdate = { html: currentHtml, css: currentCss, js: currentJs };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const { text } = data;
            
            // Accumulate the text
            accumulatedText += text;
            
            // Extract HTML, CSS, and JavaScript from the accumulated response
            const htmlMatch = accumulatedText.match(/```html\n([\s\S]*?)\n```/);
            const cssMatch = accumulatedText.match(/```css\n([\s\S]*?)\n```/);
            const jsMatch = accumulatedText.match(/```javascript\n([\s\S]*?)\n```/);

            const update = {
              html: htmlMatch ? htmlMatch[1].trim() : lastUpdate.html,
              css: cssMatch ? cssMatch[1].trim() : lastUpdate.css,
              js: jsMatch ? jsMatch[1].trim() : lastUpdate.js
            };

            // Only update if there are actual changes
            if (update.html !== lastUpdate.html || 
                update.css !== lastUpdate.css || 
                update.js !== lastUpdate.js) {
              console.log('New update:', update);
              lastUpdate = { ...update };
              onUpdate(update);
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError);
            continue;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in modifyWebsite:', error);
    throw error;
  }
}