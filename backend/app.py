from flask import Flask
from flask_cors import CORS
from routes.premodel import premodel_bp
from routes.postmodel import postmodel_bp
from routes.governance import governance_bp

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(premodel_bp, url_prefix='/api/premodel')
app.register_blueprint(postmodel_bp, url_prefix='/api/postmodel')
app.register_blueprint(governance_bp, url_prefix='/api/governance')

@app.route('/api/health')
def health():
    return {
        'status': 'online',
        'system': 'FairLens v1.0',
        'layers': ['Pre-Model Audit', 'Post-Model Audit', 'AI Governance'],
        'india_specific': True
    }

if __name__ == '__main__':
    app.run(debug=True, port=5000)
