SENTIMENT_INSTRUCTIONS: dict[str, str] = {
    "stressed": (
        "The patient is stressed or anxious. Be calm and reassuring. "
        "Lead with what is healthy before addressing concerns. "
        "Defer complex decisions. Keep recommendations simple and immediate."
    ),
    "unsure": (
        "The patient is unsure or confused. Be educational and patient. "
        "Explain ONE concept clearly with no jargon. Give one next step only."
    ),
    "okay": (
        "The patient feels okay. Provide a standard clinical assessment. "
        "Balanced, professional, and objective."
    ),
    "great": (
        "The patient feels great and confident. Be ambitious and growth-oriented. "
        "Highlight optimisation opportunities and stretch goals."
    ),
    "celebrating": (
        "The patient is celebrating a milestone. Be affirming and warm. "
        "Use a 'clean bill of health' tone. Acknowledge the achievement before advising."
    ),
}


def get_bedside_manner(sentiment: str) -> str:
    return SENTIMENT_INSTRUCTIONS.get(sentiment, SENTIMENT_INSTRUCTIONS["okay"])
