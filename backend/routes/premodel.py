from flask import Blueprint, request, jsonify
import pandas as pd, os
from services.metrics import run_premodel_audit


def _safe_load_csv(path_or_fileobj, chunksize=50000):
    """
    Handles: missing values, non-numeric strings, 100k+ rows safely.
    [IMPLEMENT IN PYTHON — NOT AI]
    """
    chunks = []
    reader = pd.read_csv(
        path_or_fileobj,
        chunksize=chunksize,
        on_bad_lines='skip',   # skip malformed rows silently
        low_memory=False
    )
    for chunk in reader:
        chunks.append(chunk)
        if sum(len(c) for c in chunks) >= 100000:
            break  # cap at 100k rows for Cloud Run memory

    df = pd.concat(chunks, ignore_index=True)

    # Drop completely empty rows
    df.dropna(how='all', inplace=True)

    # Fill numeric NaN with column median
    num_cols = df.select_dtypes(include='number').columns
    for col in num_cols:
        df[col].fillna(df[col].median(), inplace=True)

    # Fill categorical NaN with mode
    cat_cols = df.select_dtypes(include='object').columns
    for col in cat_cols:
        mode = df[col].mode()
        df[col].fillna(mode[0] if len(mode) > 0 else 'Unknown', inplace=True)

    return df, {
        'rows_loaded': len(df),
        'rows_capped': len(df) >= 100000,
        'nulls_filled': True
    }

premodel_bp = Blueprint('premodel', __name__)
DEMO_PATH = os.path.join(os.path.dirname(__file__), '../data/india_loan_demo.csv')


@premodel_bp.route('/audit', methods=['POST'])
def audit():
    try:
        data = request.get_json() or {}
        use_demo = data.get('use_demo', False)

        df, load_info = _safe_load_csv(DEMO_PATH if use_demo else request.files['file'])

        sensitive_attr = data.get('sensitive_attr', 'gender')
        label_col = data.get('label_col', 'loan_approved')
        privileged_val = data.get('privileged_val', 'Male')

        if sensitive_attr not in df.columns:
            return jsonify({'error': f"Column '{sensitive_attr}' not found. Available: {list(df.columns)}"}), 400

        audit_results = run_premodel_audit(df, sensitive_attr, label_col, privileged_val)

        return jsonify({
            'dataset_info': {
                'name': 'India Loan Decisions Dataset' if use_demo else 'Uploaded Dataset',
                'rows': len(df),
                'columns': list(df.columns),
                'sensitive_attr': sensitive_attr,
                'label_col': label_col,
                'privileged_val': privileged_val,
                **load_info
            },
            'audit_results': audit_results,
            'layer': 1,
            'layer_name': 'Pre-Model Data Audit'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@premodel_bp.route('/intersectional', methods=['POST'])
def intersectional():
    try:
        data = request.get_json() or {}
        df = pd.read_csv(DEMO_PATH)
        attr1 = data.get('attr1', 'gender')
        attr2 = data.get('attr2', 'caste')
        label_col = data.get('label_col', 'loan_approved')
        from services.metrics import intersectional_spd
        result = intersectional_spd(df, attr1, attr2, label_col)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@premodel_bp.route('/demo-info', methods=['GET'])
def demo_info():
    return jsonify({
        'name': 'India Loan Decisions Dataset',
        'rows': 600,
        'description': '600 Indian loan applications with gender, caste, and religion bias deliberately embedded for demonstration.',
        'sensitive_attributes': ['gender', 'caste', 'religion'],
        'label': 'loan_approved',
        'bias_embedded': True,
        'source': 'Synthetic — reflects documented bias patterns in Indian fintech lending'
    })
