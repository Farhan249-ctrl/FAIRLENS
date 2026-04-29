from flask import Blueprint, request, jsonify
import pandas as pd
import os
from services.metrics import run_premodel_audit, intersectional_spd

# CRITICAL: Define Blueprint FIRST
premodel_bp = Blueprint('premodel', __name__)
DEMO_PATH = os.path.join(os.path.dirname(__file__), '../data/india_loan_demo.csv')

def _safe_load_csv(path_or_fileobj, chunksize=50000):
    chunks = []
    try:
        reader = pd.read_csv(
            path_or_fileobj,
            chunksize=chunksize,
            on_bad_lines='skip',
            low_memory=False
        )
        for chunk in reader:
            chunks.append(chunk)
            if sum(len(c) for c in chunks) >= 100000:
                break
        df = pd.concat(chunks, ignore_index=True)
        df.dropna(how='all', inplace=True)
        
        num_cols = df.select_dtypes(include='number').columns
        for col in num_cols:
            df[col].fillna(df[col].median(), inplace=True)

        cat_cols = df.select_dtypes(include='object').columns
        for col in cat_cols:
            mode = df[col].mode()
            df[col].fillna(mode[0] if len(mode) > 0 else 'Unknown', inplace=True)

        return df, {'rows_loaded': len(df), 'rows_capped': len(df) >= 100000, 'nulls_filled': True}
    except Exception as e:
        raise Exception(f"CSV Load Error: {str(e)}")

@premodel_bp.route('/audit', methods=['POST', 'OPTIONS'])
def audit():
    # Handle CORS Preflight
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json() or {}
        use_demo = data.get('use_demo', False)

        # Handle File Upload vs Demo Data
        source = DEMO_PATH if use_demo else request.files.get('file')
        if not source:
            return jsonify({'error': 'No data source provided'}), 400

        df, load_info = _safe_load_csv(source)

        sensitive_attr = data.get('sensitive_attr', 'gender')
        label_col = data.get('label_col', 'loan_approved')
        privileged_val = data.get('privileged_val', 'Male')

        if sensitive_attr not in df.columns:
            return jsonify({'error': f"Column '{sensitive_attr}' not found."}), 400

        audit_results = run_premodel_audit(df, sensitive_attr, label_col, privileged_val)

        return jsonify({
            'dataset_info': {
                'name': 'India Loan Decisions Dataset' if use_demo else 'Uploaded Dataset',
                'rows': len(df),
                'columns': list(df.columns),
                **load_info
            },
            'audit_results': audit_results,
            'layer': 1,
            'layer_name': 'Pre-Model Data Audit'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@premodel_bp.route('/upload', methods=['POST'])
def upload():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'Only CSV files are supported'}), 400

        sensitive_attr = request.form.get('sensitive_attr', 'gender')
        label_col = request.form.get('label_col', 'loan_approved')
        privileged_val = request.form.get('privileged_val', 'Male')

        df = pd.read_csv(file)
        df.dropna(how='all', inplace=True)

        # Validate columns exist
        if sensitive_attr not in df.columns:
            available = list(df.columns)
            return jsonify({
                'error': f"Column '{sensitive_attr}' not found.",
                'available_columns': available,
                'hint': f"Your CSV has these columns: {', '.join(available)}. Pick one as sensitive attribute."
            }), 400

        if label_col not in df.columns:
            return jsonify({
                'error': f"Label column '{label_col}' not found.",
                'available_columns': list(df.columns)
            }), 400

        audit_results = run_premodel_audit(df, sensitive_attr, label_col, privileged_val)

        return jsonify({
            'dataset_info': {
                'name': file.filename,
                'rows': len(df),
                'columns': list(df.columns),
                'sensitive_attr': sensitive_attr,
                'label_col': label_col,
                'privileged_val': privileged_val,
                'user_uploaded': True
            },
            'audit_results': audit_results,
            'layer': 1,
            'layer_name': 'Pre-Model Data Audit'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@premodel_bp.route('/demo-info', methods=['GET'])
def demo_info():
    return jsonify({
        'name': 'India Loan Decisions Dataset',
        'rows': 600,
        'sensitive_attributes': ['gender', 'caste', 'religion'],
        'bias_embedded': True
    })