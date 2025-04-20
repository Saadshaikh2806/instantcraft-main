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
    console.log('Sending request to:', `${BACKEND_URL}/api/generate_website`);

    // First try the Vercel serverless function (note the underscore in the path)
    let response = await fetch(`${BACKEND_URL}/api/generate_website`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });

    // If that fails, try the Flask server endpoint (with hyphen)
    if (!response.ok && process.env.NODE_ENV !== 'production') {
      console.log('Falling back to Flask server endpoint');
      response = await fetch(`${BACKEND_URL}/api/generate-website`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error('Network response was not ok');
    }

    // Check if we got a streaming response or a regular JSON response
    const contentType = response.headers.get('Content-Type');

    if (contentType && contentType.includes('text/event-stream')) {
      // Handle streaming response (from Flask server)
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
    } else {
      // Handle regular JSON response (from Vercel serverless function)
      const jsonResponse = await response.json();
      console.log('Received JSON response:', jsonResponse);

      if (jsonResponse.error) {
        console.error('API error:', jsonResponse.error);
        console.error('Traceback:', jsonResponse.traceback);
        throw new Error(jsonResponse.error);
      }

      // Extract HTML, CSS, and JavaScript from the result
      const result = jsonResponse.result || '';
      const htmlMatch = result.match(/```html\n([\s\S]*?)\n```/);
      const cssMatch = result.match(/```css\n([\s\S]*?)\n```/);
      const jsMatch = result.match(/```javascript\n([\s\S]*?)\n```/);

      const update = {
        html: htmlMatch ? htmlMatch[1].trim() : '',
        css: cssMatch ? cssMatch[1].trim() : '',
        js: jsMatch ? jsMatch[1].trim() : ''
      };

      console.log('Extracted update:', update);
      onUpdate(update);
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

    console.log('Sending modification request to:', `${BACKEND_URL}/api/modify_website`);
    console.log('Request payload:', payload);

    // First try the Vercel serverless function (note the underscore in the path)
    let response = await fetch(`${BACKEND_URL}/api/modify_website`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // If that fails, try the Flask server endpoint (with hyphen)
    if (!response.ok && process.env.NODE_ENV !== 'production') {
      console.log('Falling back to Flask server endpoint');
      response = await fetch(`${BACKEND_URL}/api/modify-website`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(payload),
      });
    }

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

    // Check if we got a streaming response or a regular JSON response
    const contentType = response.headers.get('Content-Type');

    if (contentType && contentType.includes('text/event-stream')) {
      // Handle streaming response (from Flask server)
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
    } else {
      // Handle regular JSON response (from Vercel serverless function)
      const jsonResponse = await response.json();
      console.log('Received JSON response:', jsonResponse);

      if (jsonResponse.error) {
        console.error('API error:', jsonResponse.error);
        console.error('Traceback:', jsonResponse.traceback);
        throw new Error(jsonResponse.error);
      }

      // Extract HTML, CSS, and JavaScript from the result
      const result = jsonResponse.result || '';
      const htmlMatch = result.match(/```html\n([\s\S]*?)\n```/);
      const cssMatch = result.match(/```css\n([\s\S]*?)\n```/);
      const jsMatch = result.match(/```javascript\n([\s\S]*?)\n```/);

      const update = {
        html: htmlMatch ? htmlMatch[1].trim() : currentHtml,
        css: cssMatch ? cssMatch[1].trim() : currentCss,
        js: jsMatch ? jsMatch[1].trim() : currentJs
      };

      console.log('Extracted update:', update);
      onUpdate(update);
    }
  } catch (error) {
    console.error('Error in modifyWebsite:', error);
    throw error;
  }
}