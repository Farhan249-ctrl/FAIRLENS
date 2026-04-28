import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

# Global store so bias mirror can reuse trained model
_trained_model = None
_feature_cols = None
_encoders = {}


def train_and_predict(df, label_col, sensitive_attr, return_model=False):
    global _trained_model, _feature_cols, _encoders

    df = df.copy()
    cat_cols = df.select_dtypes(include='object').columns.tolist()
    _encoders = {}

    for col in cat_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        _encoders[col] = le

    _feature_cols = [c for c in df.columns if c != label_col and c != 'applicant_id']
    X = df[_feature_cols].values
    y = df[label_col].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )

    model = RandomForestClassifier(n_estimators=150, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    _trained_model = model

    y_pred_all = model.predict(X)
    y_prob_all = model.predict_proba(X)[:, 1]

    accuracy = float((model.predict(X_test) == y_test).mean())

    if return_model:
        return y, y_pred_all, y_prob_all, X, model, _feature_cols, _encoders, accuracy

    return y, y_pred_all, y_prob_all, X, accuracy


def predict_single_row(row_dict, reference_df, label_col='loan_approved'):
    """Encode a single dict row and predict — used for Bias Mirror"""
    global _trained_model, _feature_cols, _encoders

    if _trained_model is None:
        raise ValueError("Model not trained yet. Run post-model audit first.")

    row_df = pd.DataFrame([row_dict])
    for col, le in _encoders.items():
        if col in row_df.columns and col != label_col:
            val = str(row_df[col].iloc[0])
            known = list(le.classes_)
            if val not in known:
                row_df[col] = 0
            else:
                row_df[col] = le.transform([val])[0]

    # Fill missing feature cols with 0
    for col in _feature_cols:
        if col not in row_df.columns:
            row_df[col] = 0

    X = row_df[_feature_cols].values.astype(float)
    pred = int(_trained_model.predict(X)[0])
    prob = float(_trained_model.predict_proba(X)[0][1])
    return pred, prob
