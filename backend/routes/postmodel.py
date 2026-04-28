from flask import Blueprint, request, jsonify
import pandas as pd, os
from services.metrics import (
    statistical_parity_difference, disparate_impact_ratio,
    equal_opportunity_difference, average_odds_difference,
    consistency_score, calibration_difference
)
from services.model_trainer import train_and_predict, predict_single_row

postmodel_bp = Blueprint('postmodel', __name__)
DEMO_PATH = os.path.join(os.path.dirname(__file__), '../data/india_loan_demo.csv')


@postmodel_bp.route('/audit', methods=['POST'])
def audit():
    try:
        data = request.get_json() or {}
        use_demo = data.get('use_demo', False)

        df = pd.read_csv(DEMO_PATH) if use_demo else None
        if df is None:
            return jsonify({'error': 'Post-model audit requires demo data or a pre-uploaded session'}), 400

        sensitive_attr = data.get('sensitive_attr', 'gender')
        label_col = data.get('label_col', 'loan_approved')
        privileged_val = data.get('privileged_val', 'Male')

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
            'fair_count': fair_count,
            'total_metrics': total,
            'bias_score': bias_score,
            'verdict': 'FAIR' if fair_count >= total * 0.7 else 'BIASED',
            'layer': 2,
            'layer_name': 'Post-Model Decision Audit'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@postmodel_bp.route('/bias-mirror', methods=['POST'])
def bias_mirror():
    """[WOW FACTOR] Counterfactual: flip attribute, see if decision changes"""
    try:
        data = request.get_json() or {}
        row = data.get('row', {})
        sensitive_attr = data.get('sensitive_attr', 'gender')
        flip_to = data.get('flip_to', 'Female')

        df = pd.read_csv(DEMO_PATH)

        # Ensure model is trained
        train_and_predict(df, 'loan_approved', sensitive_attr)

        orig_pred, orig_prob = predict_single_row(row, df)

        flipped_row = dict(row)
        flipped_row[sensitive_attr] = flip_to
        flip_pred, flip_prob = predict_single_row(flipped_row, df)

        changed = orig_pred != flip_pred

        return jsonify({
            'original': {
                'value': row.get(sensitive_attr, '?'),
                'decision': orig_pred,
                'label': 'APPROVED ✓' if orig_pred == 1 else 'REJECTED ✗',
                'confidence': round(orig_prob * 100, 1)
            },
            'flipped': {
                'value': flip_to,
                'decision': flip_pred,
                'label': 'APPROVED ✓' if flip_pred == 1 else 'REJECTED ✗',
                'confidence': round(flip_prob * 100, 1)
            },
            'bias_detected': changed,
            'confidence_shift': round(abs(orig_prob - flip_prob) * 100, 1),
            'verdict': (
                '⚠️ BIAS CONFIRMED — Decision changed when ONLY the protected attribute was flipped. '
                'No other feature changed.'
                if changed else
                '✅ Decision unchanged — protected attribute did not influence this outcome.'
            ),
            'india_context': (
                f"In India, this means a {row.get(sensitive_attr, 'person')} and a {flip_to} "
                f"with IDENTICAL financial profiles receive DIFFERENT loan decisions. "
                f"This is a violation of Article 14 of the Indian Constitution."
                if changed else
                f"This individual applicant was treated fairly regardless of {sensitive_attr}."
            )
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
