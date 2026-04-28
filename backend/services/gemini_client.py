import google.generativeai as genai
import os, json
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv('GEMINI_API_KEY', ''))
_model = genai.GenerativeModel('gemini-1.5-flash')


def generate_governance_report(metrics: dict, dataset_info: dict) -> str:
    """[USE GEMINI HERE] — Layer 3 Explainability"""
    prompt = f"""You are an AI Ethics Auditor writing a formal governance report for an Indian financial AI system.

AUDIT CONTEXT:
- Dataset: {dataset_info.get('name', 'India Loan Dataset')}
- Sensitive Attribute Tested: {dataset_info.get('sensitive_attr', 'gender')}
- Privileged Group: {dataset_info.get('privileged_val', 'Male')}
- Rows Analysed: {dataset_info.get('rows', 600)}

COMPUTED FAIRNESS METRICS:
- Statistical Parity Difference: {metrics.get('statistical_parity', {}).get('value', 'N/A')} (threshold ±0.1)
  Verdict: {metrics.get('statistical_parity', {}).get('verdict', 'N/A')}
- Disparate Impact Ratio: {metrics.get('disparate_impact', {}).get('value', 'N/A')} (threshold 0.8–1.25)
  Verdict: {metrics.get('disparate_impact', {}).get('verdict', 'N/A')}
- Overall Bias Score: {metrics.get('bias_score', 'N/A')}/100
- Overall Verdict: {metrics.get('verdict', 'N/A')}

Write a FORMAL GOVERNANCE REPORT using these EXACT 5 sections:

## EXECUTIVE SUMMARY
(2 sentences. Non-technical language. State clearly whether bias exists.)

## BIAS FINDINGS
(Cite the exact numbers above. State which groups are disadvantaged and by how much.)

## INDIA-SPECIFIC RISK ASSESSMENT
(Specifically address caste, gender, or religion bias implications for Indian society. Reference documented patterns of algorithmic discrimination in Indian fintech.)

## LEGAL EXPOSURE
(Reference Indian Constitution Article 14, 15, 16 on equality. Reference IT Act 2000. Mention DPDP Act 2023.)

## REQUIRED ACTIONS
(3 numbered, specific, technically feasible steps to fix this bias.)

Be precise. Use the real numbers. Do not be generic."""

    try:
        response = _model.generate_content(prompt)
        return response.text
    except Exception as e:
        return _fallback_report(metrics, dataset_info, str(e))


def generate_remediation_steps(metrics: dict) -> list:
    """[USE GEMINI HERE] — Remediation suggestions"""
    spd = metrics.get('statistical_parity', {}).get('value', 0)
    di = metrics.get('disparate_impact', {}).get('value', 1)
    verdict = metrics.get('verdict', 'UNKNOWN')

    prompt = f"""You are a bias mitigation engineer.
Metrics: SPD={spd}, DI={di}, Verdict={verdict}

Return ONLY a valid JSON array with exactly 3 objects. No markdown, no explanation.
Format: [{{"step":1,"action":"...","method":"...","impact":"..."}}]"""

    try:
        response = _model.generate_content(prompt)
        text = response.text.strip().lstrip('```json').lstrip('```').rstrip('```').strip()
        return json.loads(text)
    except:
        return [
            {"step": 1, "action": "Apply Reweighing Preprocessor",
             "method": "Assign inverse probability weights to training samples",
             "impact": "Expected SPD reduction of 40–60%"},
            {"step": 2, "action": "Group-Specific Threshold Optimization",
             "method": "Lower approval threshold for unprivileged group by 0.05–0.15",
             "impact": "Improves Disparate Impact toward 1.0"},
            {"step": 3, "action": "Remove Proxy Features",
             "method": "Drop PIN code / district columns that correlate with caste/religion",
             "impact": "Reduces indirect discrimination without losing predictive power"}
        ]


def _fallback_report(metrics, dataset_info, error):
    spd = metrics.get('statistical_parity', {}).get('value', 'N/A')
    di = metrics.get('disparate_impact', {}).get('value', 'N/A')
    verdict = metrics.get('verdict', 'UNKNOWN')
    attr = dataset_info.get('sensitive_attr', 'Unknown')

    return f"""## EXECUTIVE SUMMARY
This audit of the {dataset_info.get('name', 'dataset')} detected {verdict} outcomes across the '{attr}' attribute. Immediate review is required.

## BIAS FINDINGS
Statistical Parity Difference: {spd} (threshold ±0.1). Disparate Impact Ratio: {di} (threshold 0.8–1.25). Overall Bias Score: {metrics.get('bias_score', 'N/A')}/100.

## INDIA-SPECIFIC RISK ASSESSMENT
Bias in '{attr}' attribute directly maps to documented patterns of caste and gender discrimination in Indian fintech. Marginalised communities face systemic exclusion.

## LEGAL EXPOSURE
Potential violation of Article 14 (Equality before law), Article 15 (Prohibition of discrimination). DPDP Act 2023 requires fair automated processing.

## REQUIRED ACTIONS
1. Apply sample reweighing to balance training distribution.
2. Audit proxy features (PIN code, district) for indirect discrimination.
3. Implement group-specific decision thresholds.

[Note: Gemini API error — {error}. Fallback report generated.]"""
