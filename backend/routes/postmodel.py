from flask import Blueprint, request, jsonify
import pandas as pd
import os
from services.metrics import (
    statistical_parity_difference, disparate_impact_ratio,
    equal_opportunity_difference, average_odds_difference,
    consistency_score, calibration_difference
)
from services.model_trainer import train_and_predict, predict_single_row

postmodel_bp = Blueprint('postmodel', __name__)
DEMO_PATH = os.path.join(os.path.dirname(__file__), '../data/india_loan_demo.csv')

@postmodel_bp.route('/audit', methods=['POST', 'OPTIONS'])
def audit():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json() or {}
        use_demo = data.get('use_demo', False)

        if not use_demo:
            return jsonify({'error': 'Post-model audit currently requires demo data'}), 400

        df = pd.read_csv(DEMO_PATH)
        sensitive_attr = data.get('sensitive_attr', 'gender')
        label_col = data.get('label_col', 'loan_approved')
        privileged_val = data.get('privileged_val', 'Male')

        # Model Logic
        y_true, y_pred, y_prob, X_num, accuracy = train_and_predict(df, label_col, sensitive_attr)
        s = df[sensitive_attr].values

        metrics = {
            'statistical_parity': statistical_parity_difference(y_pred, s, privileged_val),
            'disparate_impact': disparate_impact_ratio(y_pred, s, privileged_val),
            'equal_opportunity': equal_opportunity_difference(y_true, y_pred, s, privileged_val),
            'average_odds': average_odds_difference(y_true, y_pred, s, privileged_val),
            'consistency': consistency_score(X_num, y_pred),
            'calibration': calibration_difference(y_true, y_prob, s, privileged_val),
        }

        fair_count = sum(1 for m in metrics.values() if m.get('fair') is True)
        total = len(metrics)
        bias_score = round((1 - fair_count / total) * 100, 1)

        return jsonify({
            'metrics': metrics,
            'model_accuracy': round(accuracy, 4),
            'bias_score': bias_score,
            'verdict': 'FAIR' if fair_count >= total * 0.7 else 'BIASED',
            'layer': 2
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500