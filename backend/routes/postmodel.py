from flask import Blueprint, request, jsonify
import pandas as pd
import os
import numpy as np
from services.metrics import (
    statistical_parity_difference, disparate_impact_ratio,
    equal_opportunity_difference, average_odds_difference,
    consistency_score, calibration_difference
)
from services.model_trainer import train_and_predict, predict_single_row

postmodel_bp = Blueprint('postmodel', __name__)
DEMO_PATH = os.path.join(os.path.dirname(__file__), '../data/india_loan_demo.csv')

def _clean_metric(metric_dict):
    """Ensures all numpy types are converted to standard Python types for JSON."""
    return {
        'value': float(metric_dict.get('value', 0)),
        'fair': bool(metric_dict.get('fair', False)),
        'description': str(metric_dict.get('description', ''))
    }

@postmodel_bp.route('/audit', methods=['POST', 'OPTIONS'])
def audit():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json() or {}
        use_demo = data.get('use_demo', False)
        df = pd.read_csv(DEMO_PATH)
        
        sensitive_attr = data.get('sensitive_attr', 'gender')
        label_col = data.get('label_col', 'loan_approved')
        privileged_val = data.get('privileged_val', 'Male')

        df.dropna(subset=[label_col], inplace=True)

        y_true, y_pred, y_prob, X_num, accuracy = train_and_predict(df, label_col, sensitive_attr)
        s = df[sensitive_attr].values

        # Explicitly clean every metric to avoid bool_ error
        metrics = {
            'statistical_parity': _clean_metric(statistical_parity_difference(y_pred, s, privileged_val)),
            'disparate_impact': _clean_metric(disparate_impact_ratio(y_pred, s, privileged_val)),
            'equal_opportunity': _clean_metric(equal_opportunity_difference(y_true, y_pred, s, privileged_val)),
            'average_odds': _clean_metric(average_odds_difference(y_true, y_pred, s, privileged_val)),
            'consistency': _clean_metric(consistency_score(X_num, y_pred)),
            'calibration': _clean_metric(calibration_difference(y_true, y_prob, s, privileged_val)),
        }

        fair_count = sum(1 for m in metrics.values() if m['fair'] is True)
        total = len(metrics)
        bias_score = round((1 - fair_count / total) * 100, 1)

        return jsonify({
            'metrics': metrics,
            'model_accuracy': float(accuracy),
            'bias_score': bias_score,
            'verdict': 'FAIR' if fair_count >= total * 0.7 else 'BIASED',
            'layer': 2
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@postmodel_bp.route('/bias-mirror', methods=['POST', 'OPTIONS'])
def bias_mirror():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json() or {}
        row = data.get('row', {})
        sensitive_attr = data.get('sensitive_attr', 'gender')
        flip_to = data.get('flip_to', 'Male')

        df = pd.read_csv(DEMO_PATH)
        df.dropna(subset=['loan_approved'], inplace=True)

        train_and_predict(df, 'loan_approved', sensitive_attr)
        orig_pred, orig_prob = predict_single_row(row, df)

        flipped_row = dict(row)
        flipped_row[sensitive_attr] = flip_to
        flip_pred, flip_prob = predict_single_row(flipped_row, df)

        changed = bool(orig_pred != flip_pred)

        return jsonify({
            'original': {'value': str(row.get(sensitive_attr)), 'decision': int(orig_pred), 'confidence': float(round(orig_prob * 100, 1))},
            'flipped': {'value': str(flip_to), 'decision': int(flip_pred), 'confidence': float(round(flip_prob * 100, 1))},
            'bias_detected': changed,
            'india_context': f"Article 14 violation risk: {changed}"
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500