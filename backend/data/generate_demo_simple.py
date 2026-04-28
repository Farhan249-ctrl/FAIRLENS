import pandas as pd
import numpy as np

print("Generating India loan demo dataset...")

np.random.seed(42)
N = 600

genders = np.random.choice(['Male', 'Female'], N, p=[0.55, 0.45])
castes = np.random.choice(['General', 'OBC', 'SC', 'ST'], N, p=[0.30, 0.40, 0.20, 0.10])
religions = np.random.choice(['Hindu', 'Muslim', 'Christian', 'Sikh', 'Other'], N, p=[0.75, 0.14, 0.06, 0.03, 0.02])
states = np.random.choice(['Maharashtra', 'Uttar Pradesh', 'Tamil Nadu', 'Bihar', 'Gujarat', 'Rajasthan', 'West Bengal'], N)
monthly_income = np.random.lognormal(10.5, 0.7, N).astype(int)
credit_score = np.clip(np.random.normal(665, 85, N), 300, 900).astype(int)
loan_amount = np.random.choice([50000, 100000, 200000, 500000, 750000, 1000000], N)
employment = np.random.choice(['Salaried', 'Self-Employed', 'Gig Worker', 'Daily Wage', 'Unemployed'], N, p=[0.40, 0.28, 0.15, 0.12, 0.05])
education = np.random.choice(['Post-Graduate', 'Graduate', '12th Pass', '10th Pass', 'Primary'], N, p=[0.18, 0.32, 0.28, 0.16, 0.06])
existing_loans = np.random.randint(0, 4, N)

base = (
    (credit_score - 300) / 600 * 0.35 +
    np.log1p(monthly_income) / np.log1p(monthly_income.max()) * 0.30 +
    (employment == 'Salaried').astype(float) * 0.15 +
    (education == 'Graduate').astype(float) * 0.10 +
    (1 - existing_loans / 4) * 0.10
)

gender_bias = np.where(genders == 'Male', +0.14, -0.06)
caste_bias = np.where(castes == 'General', +0.10,
             np.where(castes == 'OBC',     +0.02,
             np.where(castes == 'SC',      -0.13, -0.19)))
religion_bias = np.where(religions == 'Hindu',    +0.05,
                np.where(religions == 'Muslim',   -0.11,
                np.where(religions == 'Christian', -0.04, 0.0)))

final_prob = np.clip(base + gender_bias + caste_bias + religion_bias, 0.04, 0.96)
loan_approved = (np.random.random(N) < final_prob).astype(int)

df = pd.DataFrame({
    'applicant_id':          [f'IND{1000+i}' for i in range(N)],
    'gender':                genders,
    'caste':                 castes,
    'religion':              religions,
    'state':                 states,
    'monthly_income':        monthly_income,
    'credit_score':          credit_score,
    'loan_amount_requested': loan_amount,
    'employment_type':       employment,
    'education':             education,
    'existing_loans':        existing_loans,
    'loan_approved':         loan_approved
})

df.to_csv('india_loan_demo.csv', index=False)

print('✅ Generated india_loan_demo.csv')
print(f'\nApproval by gender:\n{df.groupby("gender")["loan_approved"].mean().round(3)}')
print(f'\nApproval by caste:\n{df.groupby("caste")["loan_approved"].mean().round(3)}')
print(f'\nApproval by religion:\n{df.groupby("religion")["loan_approved"].mean().round(3)}')
print(f'\nOverall approval rate: {df["loan_approved"].mean():.3f}')
