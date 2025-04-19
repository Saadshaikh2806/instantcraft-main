from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import traceback

load_dotenv()

app = Flask(__name__)
# Configure CORS to allow requests from your React app
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})

# Initialize Gemini client with error handling
try:
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in environment variables")
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
except Exception as e:
    print(f"Error initializing Gemini client: {str(e)}")
    traceback.print_exc()

def stream_response(response):
    try:
        for chunk in response:
            if hasattr(chunk, 'text'):
                yield f"data: {json.dumps({'text': chunk.text})}\n\n"
    except Exception as e:
        print(f"Error in stream_response: {str(e)}")
        traceback.print_exc()
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

@app.route('/api/generate-website', methods=['POST'])
def generate_website():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
        
        description = data.get('description')
        if not description:
            return jsonify({'error': 'No description provided'}), 400

        print(f"Received description: {description}")  # Debug log

        # Prompt engineering for website generation
        prompt = f"""
        Create a website based on this description: {description}
        Return only the HTML, CSS, and JavaScript code without any explanations.
        Format the response exactly as:
        ```html
        [HTML code here]
        ```
        ```css
        [CSS code here]
        ```
        ```javascript
        [JavaScript code here]
        ```
        Make sure the code is complete, functional, and properly handles user interactions.
        The JavaScript code should be properly scoped and not interfere with the parent window.
        """

        print("Sending request to Gemini...")  # Debug log
        
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                top_p=0.8,
                top_k=40,
                max_output_tokens=2048,
            ),
            stream=True
        )

        print("Received response from Gemini")  # Debug log

        return Response(
            stream_response(response),
            mimetype='text/event-stream'
        )

    except Exception as e:
        print(f"Error in generate_website: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/modify-website', methods=['POST'])
def modify_website():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400

        modification = data.get('modificationDescription')
        current_html = data.get('currentHtml')
        current_css = data.get('currentCss')
        current_js = data.get('currentJs', '')  # Optional JavaScript code

        if not all([modification, current_html, current_css]):
            return jsonify({'error': 'Missing required fields'}), 400

        prompt = f"""
        Modify this website according to this description: {modification}
        
        Current HTML:
        ```html
        {current_html}
        ```
        
        Current CSS:
        ```css
        {current_css}
        ```
        
        Current JavaScript:
        ```javascript
        {current_js}
        ```
        
        Return only the modified HTML, CSS, and JavaScript code without any explanations.
        Format the response exactly as:
        ```html
        [Modified HTML code here]
        ```
        ```css
        [Modified CSS code here]
        ```
        ```javascript
        [Modified JavaScript code here]
        ```
        Make sure the code is complete, functional, and properly handles user interactions.
        The JavaScript code should be properly scoped and not interfere with the parent window.
        """

        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                top_p=0.8,
                top_k=40,
                max_output_tokens=2048,
            ),
            stream=True
        )

        return Response(
            stream_response(response),
            mimetype='text/event-stream'
        )

    except Exception as e:
        print(f"Error in modify_website: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    app.run(port=3001, debug=True)