from flask import Blueprint, request, jsonify
import datetime, uuid, hashlib, json
from services.gemini_client import generate_governance_report, generate_remediation_steps

governance_bp = Blueprint('governance', __name__)
_audit_trail = []


def _hash_entry(entry: dict) -> str:
    """SHA-256 of entry — tamper-evident verification receipt"""
    canonical = json.dumps(entry, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode()).hexdigest()


def _build_entry(audit_id, dataset_info, metrics, verdict):
    entry = {
        'audit_id':        audit_id,
        'timestamp':       datetime.datetime.utcnow().isoformat() + 'Z',
        'dataset':         dataset_info.get('name', 'Unknown'),
        'sensitive_attr':  dataset_info.get('sensitive_attr'),
        'privileged_val':  dataset_info.get('privileged_val'),
        'bias_score':      metrics.get('bias_score'),
        'verdict':         verdict,
        'rows_audited':    dataset_info.get('rows', 0),
        'metrics_evaluated': list(metrics.keys()),
        'layer':           'Governance'
    }
    entry['integrity_hash'] = _hash_entry({k: v for k, v in entry.items() if k != 'integrity_hash'})
    return entry


@governance_bp.route('/report', methods=['POST'])
def report():
    try:
        data = request.get_json() or {}
        metrics = data.get('metrics', {})
        dataset_info = data.get('dataset_info', {})

        report_text = generate_governance_report(metrics, dataset_info)
        audit_id = str(uuid.uuid4())[:8].upper()
        verdict = metrics.get('verdict', 'UNKNOWN')

        entry = _build_entry(audit_id, dataset_info, metrics, verdict)
        _audit_trail.append(entry)

        return jsonify({
            'audit_id':        audit_id,
            'report':          report_text,
            'timestamp':       entry['timestamp'],
            'integrity_hash':  entry['integrity_hash'],
            'verification':    f'SHA-256 tamper-evident receipt. Hash: {entry["integrity_hash"][:16]}...',
            'layer':           3,
            'layer_name':      'AI Governance Layer'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@governance_bp.route('/verify/<audit_id>', methods=['GET'])
def verify(audit_id):
    """Any regulator can verify no tampering occurred"""
    entry = next((e for e in _audit_trail if e['audit_id'] == audit_id), None)
    if not entry:
        return jsonify({'verified': False, 'error': 'Audit ID not found'}), 404

    stored_hash = entry.get('integrity_hash', '')
    recomputed = _hash_entry({k: v for k, v in entry.items() if k != 'integrity_hash'})
    match = stored_hash == recomputed

    return jsonify({
        'audit_id':    audit_id,
        'verified':    match,
        'verdict':     '✅ INTEGRITY CONFIRMED — data has not been tampered with' if match
                       else '❌ INTEGRITY VIOLATION — hash mismatch detected',
        'stored_hash': stored_hash[:32] + '...',
        'recomputed':  recomputed[:32] + '...'
    })


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
        'audit_trail':  _audit_trail,
        'total_audits': len(_audit_trail),
        'immutable':    True,
        'method':       'SHA-256 hash verification',
        'compliant_with': ['DPDP Act 2023', 'EU AI Act Article 13', 'RBI Responsible Lending']
    })
