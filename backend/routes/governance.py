from flask import Blueprint, request, jsonify
import datetime, uuid
from services.gemini_client import generate_governance_report, generate_remediation_steps

governance_bp = Blueprint('governance', __name__)

# Immutable audit log — use Firebase in production
_audit_trail = []


@governance_bp.route('/report', methods=['POST'])
def report():
    try:
        data = request.get_json() or {}
        metrics = data.get('metrics', {})
        dataset_info = data.get('dataset_info', {})

        report_text = generate_governance_report(metrics, dataset_info)
        audit_id = str(uuid.uuid4())[:8].upper()

        entry = {
            'audit_id': audit_id,
            'timestamp': datetime.datetime.utcnow().isoformat() + 'Z',
            'dataset': dataset_info.get('name', 'Unknown'),
            'sensitive_attr': dataset_info.get('sensitive_attr'),
            'privileged_val': dataset_info.get('privileged_val'),
            'bias_score': metrics.get('bias_score'),
            'verdict': metrics.get('verdict'),
            'metrics_evaluated': list(metrics.keys()),
            'report_generated': True,
            'layer': 'Governance'
        }
        _audit_trail.append(entry)

        return jsonify({
            'audit_id': audit_id,
            'report': report_text,
            'timestamp': entry['timestamp'],
            'layer': 3,
            'layer_name': 'AI Governance Layer'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@governance_bp.route('/remediation', methods=['POST'])
def remediation():
    try:
        data = request.get_json() or {}
        steps = generate_remediation_steps(data.get('metrics', {}))
        return jsonify({'remediation_steps': steps})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@governance_bp.route('/trail', methods=['GET'])
def trail():
    return jsonify({
        'audit_trail': _audit_trail,
        'total_audits': len(_audit_trail),
        'layer': 3,
        'immutable': True
    })
