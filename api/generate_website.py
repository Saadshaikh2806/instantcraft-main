from http.server import BaseHTTPRequestHandler
from flask import Response
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
import traceback

load_dotenv()

# Initialize Gemini client
try:
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in environment variables")
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.0-pro-latest')
except Exception as e:
    print(f"Error initializing Gemini client: {str(e)}")
    traceback.print_exc()

def handle_request(request_body):
    try:
        if not request_body:
            return {'error': 'No JSON data received'}, 400
        
        description = request_body.get('description')
        if not description:
            return {'error': 'No description provided'}, 400

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
        
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                top_p=0.8,
                top_k=40,
                max_output_tokens=2048,
            )
        )

        return {'result': response.text}, 200

    except Exception as e:
        return {
            'error': str(e),
            'traceback': traceback.format_exc()
        }, 500

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            request_body = self.rfile.read(content_length)
            data = json.loads(request_body)
            
            response_data, status_code = handle_request(data)
            
            self.send_response(status_code)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            self.wfile.write(json.dumps(response_data).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers() 