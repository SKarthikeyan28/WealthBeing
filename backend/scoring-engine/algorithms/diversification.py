import numpy as np


def compute(allocations: dict) -> float:
    """Shannon entropy across asset class allocations, normalised to 0–100."""
    weights = np.array(list(allocations.values()), dtype=float)
    weights /= weights.sum()
    entropy = -np.sum(weights * np.log(weights + 1e-9))
    max_entropy = np.log(max(len(weights), 2))
    return round(min(100.0, (entropy / max_entropy) * 100), 2)
