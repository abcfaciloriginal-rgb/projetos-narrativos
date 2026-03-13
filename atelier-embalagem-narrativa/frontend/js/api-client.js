const API_BASE_URL = "http://127.0.0.1:8000";

export async function requestPackaging({
  provider,
  story,
  niche,
  tone,
  summary,
  logline,
  theme,
  emotion,
  wound,
  contradiction,
  symbol,
  subtext,
  referenceContext
}) {
  const response = await fetch(`${API_BASE_URL}/api/packaging`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      provider,
      story,
      niche,
      tone,
      summary,
      logline,
      theme,
      emotion,
      wound,
      contradiction,
      symbol,
      subtext,
      referenceContext
    })
  });

  if (!response.ok) {
    let errorMessage = "Erro ao chamar a API.";

    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || JSON.stringify(errorData);
    } catch {
      errorMessage = await response.text();
    }

    throw new Error(errorMessage || "Erro ao chamar a API.");
  }

  return response.json();
}