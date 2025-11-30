#!/usr/bin/env python3
"""
Simple HTTP server with API proxy (NO NGINX!)
Serves static files and proxies API requests to backend
"""

import os
import http.server
import socketserver
import urllib.request
import urllib.error
from urllib.parse import urlparse

PORT = int(os.environ.get('PORT', 47823))
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://backend:38291')
STATIC_DIR = '/app/dist'

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler with API proxy support"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path.startswith('/api/'):
            self.proxy_request('GET')
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'healthy')
        else:
            # Serve static files or index.html for SPA routes
            file_path = STATIC_DIR + self.path
            if not os.path.exists(file_path) or os.path.isdir(file_path):
                self.path = '/index.html'
            super().do_GET()
    
    def do_POST(self):
        """Handle POST requests (proxy to backend)"""
        if self.path.startswith('/api/'):
            self.proxy_request('POST')
        else:
            self.send_error(404)
    
    def do_DELETE(self):
        """Handle DELETE requests (proxy to backend)"""
        if self.path.startswith('/api/'):
            self.proxy_request('DELETE')
        else:
            self.send_error(404)
    
    def proxy_request(self, method):
        """Proxy request to backend"""
        try:
            # Build backend URL
            backend_path = BACKEND_URL + self.path
            
            # Read request body for POST
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else None
            
            # Create request
            req = urllib.request.Request(
                backend_path,
                data=body,
                method=method
            )
            
            # Copy relevant headers
            for header in ['Content-Type', 'Authorization']:
                if header in self.headers:
                    req.add_header(header, self.headers[header])
            
            # Send request to backend
            with urllib.request.urlopen(req, timeout=300) as response:
                # Copy response
                self.send_response(response.status)
                
                # Copy response headers
                for header, value in response.headers.items():
                    if header.lower() not in ['connection', 'transfer-encoding']:
                        self.send_header(header, value)
                
                self.end_headers()
                
                # Copy response body
                self.wfile.write(response.read())
        
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(e.read())
        
        except Exception as e:
            self.send_error(500, str(e))
    
    def log_message(self, format, *args):
        """Custom logging"""
        print(f"{self.address_string()} - {format % args}")

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), ProxyHTTPRequestHandler) as httpd:
        print(f"🚀 Server running on port {PORT}")
        print(f"📁 Serving static files from: {STATIC_DIR}")
        print(f"🔗 Proxying /api/* to: {BACKEND_URL}")
        httpd.serve_forever()
