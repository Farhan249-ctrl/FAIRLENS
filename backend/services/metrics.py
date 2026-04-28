"""
FairLens Core Metrics Engine
All 8 fairness metrics implemented from scratch in pure Python/NumPy.
[IMPLEMENT IN PYTHON — NOT AI]
"""
import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors


# ─────────────────────────────────────────────
# METRIC 1: Statistical Parity Difference
# ─────────────────────────────────────────────
def statistical_parity_difference(y_pred, sensitive, privileged_val):
    """
    SPD = P(Ŷ=1 | A=minority) − P(Ŷ=1 | A=majority)
    Threshold: |SPD| < 0.1 → FAIR
    Layer: Pre-Model + Post-Model
    """
    y = np.array(y_pred)
    s = np.array(sensitive)
    priv_rate = float(y[s == privileged_val].mean()) if (s == privileged_val).sum() > 0 else 0
    unpriv_rate = float(y[s != privileged_val].mean()) if (s != privileged_val).sum() > 0 else 0
    spd = unpriv_rate - priv_rate
    return {
        'metric': 'Statistical Parity Difference',
        'formula': 'P(Ŷ=1|minority) − P(Ŷ=1|majority)',
        'value': round(spd, 4),
        'threshold': 0.1,
        'fair': abs(spd) < 0.1,
        'privileged_rate': round(priv_rate, 4),
        'unprivileged_rate': round(unpriv_rate, 4),
        'verdict': 'FAIR' if abs(spd) < 0.1 else 'BIASED',
        'interpretation': (
            f"Unprivileged group receives positive outcomes {abs(spd)*100:.1f}% "
            f"{'less' if spd < 0 else 'more'} than privileged group."
        )
    }


# ─────────────────────────────────────────────
# METRIC 2: Disparate Impact Ratio
# ─────────────────────────────────────────────
def disparate_impact_ratio(y_pred, sensitive, privileged_val):
    """
    DI = P(Ŷ=1 | minority) / P(Ŷ=1 | majority)
    Threshold: 0.8 ≤ DI ≤ 1.25 → FAIR  (four-fifths rule)
    Layer: Pre-Model + Post-Model
    """
    y = np.array(y_pred)
    s = np.array(sensitive)
    priv_rate = float(y[s == privileged_val].mean()) if (s == privileged_val).sum() > 0 else 0
    unpriv_rate = float(y[s != privileged_val].mean()) if (s != privileged_val).sum() > 0 else 0
    di = (unpriv_rate / priv_rate) if priv_rate > 0 else 0
    fair = 0.8 <= di <= 1.25
    return {
        'metric': 'Disparate Impact Ratio',
        'formula': 'P(Ŷ=1|minority) ÷ P(Ŷ=1|majority)',
        'value': round(di, 4),
        'threshold_min': 0.8,
        'threshold_max': 1.25,
        'fair': fair,
        'verdict': 'FAIR' if fair else 'BIASED',
        'interpretation': (
            f"Unprivileged group has {di*100:.1f}% of the privileged group's approval rate. "
            f"{'Meets' if fair else 'VIOLATES'} the four-fifths rule."
        )
    }


# ─────────────────────────────────────────────
# METRIC 3: Equal Opportunity Difference
# ─────────────────────────────────────────────
def equal_opportunity_difference(y_true, y_pred, sensitive, privileged_val):
    """
    EOD = TPR(minority) − TPR(majority)
    Threshold: |EOD| < 0.1 → FAIR
    Layer: Post-Model
    """
    y_t = np.array(y_true)
    y_p = np.array(y_pred)
    s = np.array(sensitive)

    priv_pos = (s == privileged_val) & (y_t == 1)
    unpriv_pos = (s != privileged_val) & (y_t == 1)

    tpr_priv = float(y_p[priv_pos].mean()) if priv_pos.sum() > 0 else 0
    tpr_unpriv = float(y_p[unpriv_pos].mean()) if unpriv_pos.sum() > 0 else 0
    eod = tpr_unpriv - tpr_priv

    return {
        'metric': 'Equal Opportunity Difference',
        'formula': 'TPR(minority) − TPR(majority)',
        'value': round(eod, 4),
        'threshold': 0.1,
        'fair': abs(eod) < 0.1,
        'tpr_privileged': round(tpr_priv, 4),
        'tpr_unprivileged': round(tpr_unpriv, 4),
        'verdict': 'FAIR' if abs(eod) < 0.1 else 'BIASED',
        'interpretation': (
            f"Among truly qualified candidates, unprivileged group is correctly identified "
            f"{abs(eod)*100:.1f}% {'less' if eod < 0 else 'more'} often."
        )
    }


# ─────────────────────────────────────────────
# METRIC 4: Average Odds Difference
# ─────────────────────────────────────────────
def average_odds_difference(y_true, y_pred, sensitive, privileged_val):
    """
    AOD = 0.5 × [(FPR_unpriv − FPR_priv) + (TPR_unpriv − TPR_priv)]
    Threshold: |AOD| < 0.1 → FAIR
    Layer: Post-Model
    """
    y_t = np.array(y_true)
    y_p = np.array(y_pred)
    s = np.array(sensitive)

    priv = s == privileged_val
    unpriv = ~priv

    def safe_mean(arr): return float(arr.mean()) if len(arr) > 0 else 0

    tpr_priv = safe_mean(y_p[priv & (y_t == 1)])
    tpr_unpriv = safe_mean(y_p[unpriv & (y_t == 1)])
    fpr_priv = safe_mean(y_p[priv & (y_t == 0)])
    fpr_unpriv = safe_mean(y_p[unpriv & (y_t == 0)])

    aod = 0.5 * ((tpr_unpriv - tpr_priv) + (fpr_unpriv - fpr_priv))

    return {
        'metric': 'Average Odds Difference',
        'formula': '0.5 × [(FPR_min − FPR_maj) + (TPR_min − TPR_maj)]',
        'value': round(aod, 4),
        'threshold': 0.1,
        'fair': abs(aod) < 0.1,
        'verdict': 'FAIR' if abs(aod) < 0.1 else 'BIASED',
        'interpretation': f"Combined TPR+FPR gap is {abs(aod)*100:.1f}%. Measures overall classification parity."
    }


# ─────────────────────────────────────────────
# METRIC 5: Theil Index
# ─────────────────────────────────────────────
def theil_index(y_pred):
    """
    T = (1/n) × Σ (ŷᵢ/μ) × ln(ŷᵢ/μ)
    Threshold: T < 0.1 → low inequality
    Layer: Pre-Model (outcome distribution inequality)
    """
    y = np.array(y_pred, dtype=float)
    y = np.clip(y, 1e-10, None)
    mu = y.mean()
    if mu < 1e-10:
        return {'metric': 'Theil Index', 'value': 0, 'threshold': 0.1, 'fair': True,
                'verdict': 'FAIR', 'interpretation': 'No positive predictions to measure.'}
    ratio = y / mu
    theil = float(np.mean(ratio * np.log(ratio + 1e-10)))
    return {
        'metric': 'Theil Index',
        'formula': '(1/n) × Σ (ŷᵢ/μ) × ln(ŷᵢ/μ)',
        'value': round(theil, 4),
        'threshold': 0.1,
        'fair': abs(theil) < 0.1,
        'verdict': 'FAIR' if abs(theil) < 0.1 else 'UNEQUAL',
        'interpretation': f"Outcome inequality index: {theil:.4f}. {'Low inequality.' if abs(theil) < 0.1 else 'High inequality in outcome distribution.'}"
    }


# ─────────────────────────────────────────────
# METRIC 6: Individual Fairness (Consistency Score)
# ─────────────────────────────────────────────
def consistency_score(X_numeric, y_pred, k=5):
    """
    CS = 1 − (1/n) × Σ |ŷᵢ − avg(ŷ_neighbors)|
    Threshold: CS > 0.8 → FAIR
    Layer: Post-Model
    """
    try:
        X = np.array(X_numeric, dtype=float)
        y = np.array(y_pred, dtype=float)
        n = len(y)
        k_actual = min(k, n - 1)

        nn = NearestNeighbors(n_neighbors=k_actual + 1, metric='euclidean')
        nn.fit(X)
        _, indices = nn.kneighbors(X)

        total_diff = sum(
            abs(y[i] - y[indices[i][1:]].mean())
            for i in range(n)
        )
        score = float(1 - (total_diff / n))
        return {
            'metric': 'Individual Fairness (Consistency)',
            'formula': '1 − (1/n) × Σ |ŷᵢ − avg(ŷ_kNN)|',
            'value': round(score, 4),
            'threshold': 0.8,
            'fair': score > 0.8,
            'verdict': 'FAIR' if score > 0.8 else 'INCONSISTENT',
            'interpretation': f"Similar applicants treated similarly: {score*100:.1f}% consistent."
        }
    except Exception as e:
        return {'metric': 'Individual Fairness', 'value': None, 'fair': None,
                'verdict': 'ERROR', 'interpretation': str(e)}


# ─────────────────────────────────────────────
# METRIC 7: Calibration Difference
# ─────────────────────────────────────────────
def calibration_difference(y_true, y_prob, sensitive, privileged_val, n_bins=10):
    """
    ECE per group, then ECE_unprivileged − ECE_privileged
    Threshold: |diff| < 0.1 → FAIR
    Layer: Governance
    """
    def ece(yt, yp):
        err = 0.0
        for i in range(n_bins):
            lo, hi = i / n_bins, (i + 1) / n_bins
            mask = (yp >= lo) & (yp < hi)
            if mask.sum() > 0:
                err += (mask.sum() / len(yp)) * abs(float(yt[mask].mean()) - float(yp[mask].mean()))
        return err

    y_t = np.array(y_true)
    y_p = np.array(y_prob)
    s = np.array(sensitive)

    priv = s == privileged_val
    ece_priv = ece(y_t[priv], y_p[priv])
    ece_unpriv = ece(y_t[~priv], y_p[~priv])
    diff = ece_unpriv - ece_priv

    return {
        'metric': 'Calibration Difference',
        'formula': 'ECE(minority) − ECE(majority)',
        'value': round(diff, 4),
        'ece_privileged': round(ece_priv, 4),
        'ece_unprivileged': round(ece_unpriv, 4),
        'threshold': 0.1,
        'fair': abs(diff) < 0.1,
        'verdict': 'FAIR' if abs(diff) < 0.1 else 'MISCALIBRATED',
        'interpretation': (
            f"Probability calibration gap: {abs(diff)*100:.2f}%. "
            f"{'Model equally reliable for all groups.' if abs(diff) < 0.1 else 'Model is less reliable for unprivileged group.'}"
        )
    }


# ─────────────────────────────────────────────
# METRIC 8: Counterfactual Fairness (Bias Mirror)
# ─────────────────────────────────────────────
def counterfactual_fairness_score(df, sensitive_attr, predict_fn, privileged_val):
    """
    For each row: flip sensitive attribute, check if decision changes.
    CF Score = 1 − (# decisions changed / total)
    Threshold: CF Score > 0.9 → FAIR
    Layer: Governance (WOW FACTOR)
    """
    changed = 0
    total = len(df)

    for _, row in df.iterrows():
        orig_decision = predict_fn(row.to_dict())

        flipped = row.to_dict()
        current = flipped[sensitive_attr]
        unique_vals = df[sensitive_attr].unique().tolist()
        others = [v for v in unique_vals if v != current]
        if not others:
            continue
        flipped[sensitive_attr] = others[0]

        flip_decision = predict_fn(flipped)
        if orig_decision != flip_decision:
            changed += 1

    score = 1 - (changed / total) if total > 0 else 1.0
    return {
        'metric': 'Counterfactual Fairness',
        'formula': '1 − (decisions_changed / total)',
        'value': round(score, 4),
        'decisions_changed': changed,
        'total_tested': total,
        'threshold': 0.9,
        'fair': score > 0.9,
        'verdict': 'FAIR' if score > 0.9 else 'COUNTERFACTUALLY BIASED',
        'interpretation': (
            f"{changed} out of {total} decisions changed when only the protected attribute was flipped. "
            f"{'Minimal causal influence of protected attribute.' if score > 0.9 else 'Protected attribute is causally influencing decisions.'}"
        )
    }


# ─────────────────────────────────────────────
# INTERSECTIONAL BIAS — Gender × Caste × Religion
# [WOW FACTOR] [INDIA-SPECIFIC ANGLE]
# ─────────────────────────────────────────────
def intersectional_spd(df, attr1, attr2, label_col):
    """
    Computes SPD for every combination of attr1 × attr2.
    Finds most discriminated intersection.
    e.g. SC-caste + Female vs General-caste + Male
    """
    results = []
    groups = df.groupby([attr1, attr2])[label_col].mean()
    overall_mean = df[label_col].mean()

    for (val1, val2), rate in groups.items():
        count = len(df[(df[attr1] == val1) & (df[attr2] == val2)])
        spd = float(rate - overall_mean)
        results.append({
            'group': f'{val1} × {val2}',
            'attr1': str(val1),
            'attr2': str(val2),
            'approval_rate': round(float(rate), 4),
            'spd_from_mean': round(spd, 4),
            'count': count,
            'severe': abs(spd) > 0.15,
            'verdict': 'SEVERELY DISADVANTAGED' if spd < -0.15
                       else 'DISADVANTAGED' if spd < -0.05
                       else 'ADVANTAGED' if spd > 0.05
                       else 'NEAR PARITY'
        })

    results.sort(key=lambda x: x['spd_from_mean'])

    most_disadvantaged = results[0] if results else None
    most_advantaged = results[-1] if results else None
    gap = round(
        (most_advantaged['approval_rate'] - most_disadvantaged['approval_rate'])
        if most_disadvantaged and most_advantaged else 0,
        4
    )

    return {
        'metric': 'Intersectional Bias Analysis',
        'attr1': attr1,
        'attr2': attr2,
        'all_groups': results,
        'most_disadvantaged': most_disadvantaged,
        'most_advantaged': most_advantaged,
        'intersectional_gap': gap,
        'severe': gap > 0.2,
        'verdict': 'SEVERE INTERSECTIONAL BIAS' if gap > 0.2
                   else 'MODERATE' if gap > 0.1
                   else 'MILD',
        'india_note': (
            f"In India, intersection of {attr1} and {attr2} creates "
            f"compounded discrimination. The gap between most and least "
            f"advantaged group is {gap*100:.1f} percentage points."
        )
    }


# ─────────────────────────────────────────────
# MASTER AUDIT RUNNER
# ─────────────────────────────────────────────
def run_premodel_audit(df, sensitive_attr, label_col, privileged_val):
    y = df[label_col].values
    s = df[sensitive_attr].values

    spd = statistical_parity_difference(y, s, privileged_val)
    di = disparate_impact_ratio(y, s, privileged_val)
    theil = theil_index(y)

    group_dist = df[sensitive_attr].value_counts(normalize=True).round(4).to_dict()
    group_approval = df.groupby(sensitive_attr)[label_col].mean().round(4).to_dict()

    bias_score = min(100, round(
        abs(spd['value']) * 60 +
        max(0, (1 - di['value']) if di['value'] < 1 else (di['value'] - 1.25)) * 40
    , 1))

    biased_count = sum([
        not spd['fair'], not di['fair'], not theil['fair']
    ])

    return {
        'statistical_parity': spd,
        'disparate_impact': di,
        'theil_index': theil,
        'group_distribution': {str(k): v for k, v in group_dist.items()},
        'group_approval_rates': {str(k): v for k, v in group_approval.items()},
        'bias_score': bias_score,
        'biased_metrics': biased_count,
        'total_metrics': 3,
        'verdict': 'BIASED' if bias_score > 25 else ('BORDERLINE' if bias_score > 10 else 'FAIR'),
        'layer': 'Pre-Model Data Audit'
    }
