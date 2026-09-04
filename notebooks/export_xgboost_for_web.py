"""
Export the trained XGBoost v1 pitch predictor to a compact JSON that can be
loaded and inferred on in the browser (no Python at runtime).

The web engine reimplements xgboost's `multi:softprob` prediction:
    raw[c] = base_score[c] + sum of leaf values over trees assigned to class c
    prob[c] = softmax(raw)[c]

This script:
  1. Loads notebooks/xgboost_v1_model.joblib
  2. Sanity-checks the tree format (numeric splits only, default_left all 0)
  3. Emits a stripped-down, rounded JSON at public/data/xgboost-pitch-model.json
  4. Verifies the stripped representation reproduces predict_proba (max abs err)

Regenerate whenever the notebook retrains:
    cd notebooks && ../.venv/Scripts/python.exe export_xgboost_for_web.py
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import joblib
import numpy as np

NOTEBOOKS = Path(__file__).parent
OUT_PATH = NOTEBOOKS.parent / "public" / "data" / "xgboost-pitch-model.json"
FIXTURE_PATH = NOTEBOOKS / "xgboost_v1_proba_fixture.json"


def main() -> None:
    model = joblib.load(NOTEBOOKS / "xgboost_v1_model.joblib")
    booster = model.get_booster()

    meta = json.loads((NOTEBOOKS / "xgboost_v1_metadata.json").read_text())
    pitch_types = meta["pitch_types"]
    feature_names = meta["features"]

    raw = json.loads(booster.save_raw(raw_format="json"))
    learner = raw["learner"]
    gbm = learner["gradient_booster"]["model"]
    trees = gbm["trees"]
    tree_info = gbm["tree_info"]

    # ---- format guards -------------------------------------------------
    for tree in trees:
        # xgboost >=3 JSON uses 0=numerical / 1=categorical; all splits here are numerical.
        assert all(t == 0 for t in tree["split_type"]), "categorical split found"
        assert all(d == 0 for d in tree["default_left"]), "non-zero default_left found"
        assert len(tree["base_weights"]) == len(tree["split_conditions"]) == len(tree["left_children"])

    base_score = json.loads(learner["learner_model_param"]["base_score"])
    assert len(base_score) == len(pitch_types), "base_score length mismatch"

    def r6(x: float) -> float:
        """Round to 6 significant digits (float32-ish precision, shrinks JSON)."""
        if x == 0:
            return 0.0
        return float(f"{x:.6g}")

    compact = {
        "model_version": "v1",
        "pitch_types": pitch_types,
        "pitch_type_mapping": meta["pitch_type_mapping"],
        "features": feature_names,
        "base_score": [r6(x) for x in base_score],
        "trees": [
            {
                "c": info,
                "l": tree["left_children"],
                "r": tree["right_children"],
                "s": [r6(x) for x in tree["split_conditions"]],
                "f": tree["split_indices"],
            }
            for info, tree in zip(tree_info, trees)
        ],
    }

    OUT_PATH.write_text(json.dumps(compact, separators=(",", ":")))
    print(f"wrote {OUT_PATH} ({OUT_PATH.stat().st_size / 1e6:.1f} MB, {len(trees)} trees)")

    # ---- verify the stripped representation against predict_proba ------
    rng = np.random.default_rng(0)
    n = 200
    X = rng.uniform(size=(n, len(feature_names)))
    expected = model.predict_proba(X)

    def predict_proba_stripped(x: np.ndarray) -> np.ndarray:
        raws = np.array(base_score, dtype=float)
        for tree, info in zip(compact["trees"], tree_info):
            node = 0
            l, r, s, f = tree["l"], tree["r"], tree["s"], tree["f"]
            while l[node] != -1 and r[node] != -1:
                node = l[node] if x[f[node]] < s[node] else r[node]
            raws[info] += s[node]
        e = np.exp(raws - raws.max())
        return e / e.sum()

    got = np.array([predict_proba_stripped(row) for row in X])
    max_err = float(np.abs(got - expected).max())
    print(f"max |stripped - predict_proba| over {n} random rows: {max_err:.2e}")
    assert max_err < 1e-3, "stripped inference diverged from xgboost"

    # Keep a small fixture so the JS engine can be unit-checked with node.
    idx = rng.choice(n, size=10, replace=False)
    fixture = {
        "features": feature_names,
        "pitch_types": pitch_types,
        "rows": [
            {"x": [round(float(v), 6) for v in X[i]], "proba": [round(float(p), 6) for p in expected[i]]}
            for i in idx
        ],
    }
    FIXTURE_PATH.write_text(json.dumps(fixture, indent=1))
    print(f"wrote {FIXTURE_PATH}")


if __name__ == "__main__":
    main()