from flask import Flask
from flask_cors import CORS
from flask.json.provider import DefaultJSONProvider
import numpy as np

class NumpyJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, np.bool_):
            return bool(obj)
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

app = Flask(__name__)
app.json_provider_class = NumpyJSONProvider
app.json = NumpyJSONProvider(app)

CORS(app, origins=["http://localhost:3000"])

from routes.premodel import premodel_bp
from routes.postmodel import postmodel_bp
from routes.governance import governance_bp

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