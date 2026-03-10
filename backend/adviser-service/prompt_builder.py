from sentiment import get_bedside_manner

SYSTEM_PROMPT_TEMPLATE = """You are WealthBeing's AI Financial Health Adviser — a clinical expert in personal financial wellness.

PATIENT RECORD:
  Name: {patient_name}, Age: {age}
  Wealth Health Score: {wws}/100 ({health_label})
  Vital Readings:
    - Portfolio Diversity:      {diversification}/100 ({div_status})
    - Liquidity Coverage:       {liquidity}/100 ({liq_status})
    - Behavioural Resilience:   {behavioral}/100 ({beh_status})
    - Growth Momentum:          {growth}/100 ({grw_status})
    - Risk-Reward Alignment:    {risk_reward}/100 ({rsk_status})
  Net Worth: S${net_worth}
  Monthly Cash Flow: Income S${income} | Expenses S${expenses} | Savings Rate {savings_rate}%
  Top 3 Holdings: {top_3}
  Critical Vitals: {critical_vitals}
  Patient Sentiment: {sentiment}

BEDSIDE MANNER:
  {bedside_manner}

RESPONSE FORMAT:
  1. Assessment    (1 short paragraph — what the vitals show)
  2. Diagnosis     (1 short paragraph — root cause of any flags)
  3. Prescription  (numbered list of 2–3 specific, actionable steps with real numbers)
  4. End with exactly one line: "Prescribed Action: [single most important action today]"

RULES:
  - Always reference specific numbers from the patient record. Never give generic advice.
  - Never exceed 4 paragraphs total.
  - Never suggest seeking a financial adviser — you ARE the financial adviser."""


def build_system_prompt(portfolio: dict, wws_data: dict, sentiment: str) -> str:
    patient = portfolio.get("patient", {})
    cashflow = portfolio.get("cashflow", {})
    vitals = wws_data.get("vitals", {})
    assets = portfolio.get("assets", {})

    # Top 3 equity holdings
    holdings = assets.get("equities", {}).get("holdings", [])
    top_3 = ", ".join(f"{h['ticker']} ({int(h['pct_of_equity'] * 100)}%)" for h in holdings[:3])

    monthly_expenses = sum(cashflow.get("monthly_expenses", {}).values())

    return SYSTEM_PROMPT_TEMPLATE.format(
        patient_name=patient.get("name", "Alex"),
        age=patient.get("age", 32),
        wws=wws_data.get("wws", 72),
        health_label=wws_data.get("health_label", "Moderate Health"),
        diversification=vitals.get("diversification", {}).get("score", 74),
        div_status=vitals.get("diversification", {}).get("status", "healthy"),
        liquidity=vitals.get("liquidity", {}).get("score", 67),
        liq_status=vitals.get("liquidity", {}).get("status", "monitor"),
        behavioral=vitals.get("behavioral", {}).get("score", 82),
        beh_status=vitals.get("behavioral", {}).get("status", "healthy"),
        growth=vitals.get("growth_momentum", {}).get("score", 73),
        grw_status=vitals.get("growth_momentum", {}).get("status", "monitor"),
        risk_reward=vitals.get("risk_reward", {}).get("score", 61),
        rsk_status=vitals.get("risk_reward", {}).get("status", "monitor"),
        net_worth=portfolio.get("net_worth", 342000),
        income=cashflow.get("monthly_income", 8500),
        expenses=round(monthly_expenses),
        savings_rate=round(cashflow.get("savings_rate", 0.22) * 100),
        top_3=top_3,
        critical_vitals=", ".join(wws_data.get("critical_vitals", [])) or "None",
        sentiment=sentiment,
        bedside_manner=get_bedside_manner(sentiment),
    )


def build_insight_cards(vitals: dict, portfolio: dict) -> list[dict]:
    """
    Generate the 3 pre-computed Rx insight cards from vital flags.
    Does NOT call Claude — generated purely from data.
    """
    cards = []
    cashflow = portfolio.get("cashflow", {})
    assets = portfolio.get("assets", {})

    # Liquidity card
    emergency_fund = assets.get("cash", {}).get("emergency_fund", 25200)
    monthly_expenses = sum(cashflow.get("monthly_expenses", {}).values())
    target_fund = monthly_expenses * 6
    shortfall = round(target_fund - emergency_fund)
    months_covered = round(emergency_fund / (monthly_expenses or 1), 1)
    cards.append({
        "id": "rx-001",
        "vital": "liquidity",
        "title": "Emergency Fund Gap",
        "body": f"Your liquidity coverage sits at {months_covered} months — below the 6-month target. A shortfall of ~S${shortfall:,}.",
        "prescribed_action": f"Redirect S${round(shortfall / 12):,}/month to your emergency fund for 12 months.",
    })

    # Risk-reward card
    top_holding = portfolio.get("scoring_inputs", {}).get("top_holding_pct", 0.38)
    cards.append({
        "id": "rx-002",
        "vital": "risk_reward",
        "title": "Concentration Risk: NVDA",
        "body": f"NVDA accounts for {round(top_holding * 100)}% of your equity portfolio — above the 35% safe threshold.",
        "prescribed_action": "Sell 5% of NVDA and reallocate to a broad ETF (e.g., VOO).",
    })

    # Growth momentum card
    savings_rate = round(cashflow.get("savings_rate", 0.22) * 100)
    cards.append({
        "id": "rx-003",
        "vital": "growth_momentum",
        "title": "Savings Rate Below Target",
        "body": f"Current savings rate: {savings_rate}%. Target: 30%. At current rate, retirement gap widens by ~S$45,000 by age 45.",
        "prescribed_action": "Automate an additional S$800/month transfer to investments on payday.",
    })

    return cards
