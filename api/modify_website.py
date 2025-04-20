from http.server import BaseHTTPRequestHandler
import os
import json
import google.generativeai as genai
import traceback
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini client
def get_client():
    try:
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")

        genai.configure(api_key=api_key)
        return genai.GenerativeModel('gemini-1.5-flash')
    except Exception as e:
        print(f"Error initializing Gemini client: {str(e)}")
        traceback.print_exc()
        raise

def handle_request(request_body):
    try:
        if not request_body:
            return {'error': 'No JSON data received'}, 400

        modification = request_body.get('modificationDescription')
        current_html = request_body.get('currentHtml')
        current_css = request_body.get('currentCss')
        current_js = request_body.get('currentJs', '')

        if not all([modification, current_html, current_css]):
            return {'error': 'Missing required fields'}, 400

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

        model = get_client()
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                top_p=0.8,
                top_k=40,
                max_output_tokens=2048,
            )
        )

        return {'result': response.text}, 200

    except Exception as e:
        print(f"Error in handle_request: {str(e)}")
        traceback.print_exc()
        return {
            'error': str(e),
            'traceback': traceback.format_exc()
        }, 500

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            print("Received POST request to modify_website")
            content_length = int(self.headers['Content-Length'])
            request_body = self.rfile.read(content_length)
            data = json.loads(request_body)
            print(f"Request data: {data.keys()}")

            response_data, status_code = handle_request(data)
            print(f"Response status: {status_code}")

            self.send_response(status_code)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()

            response_json = json.dumps(response_data)
            print(f"Sending response: {response_json[:100]}...")
            self.wfile.write(response_json.encode())
        except Exception as e:
            print(f"Error in handler.do_POST: {str(e)}")
            traceback.print_exc()
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = json.dumps({
                'error': str(e),
                'traceback': traceback.format_exc()
            })
            self.wfile.write(error_response.encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()