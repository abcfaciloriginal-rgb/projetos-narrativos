import requests
import os


def chamar_gemini(prompt: str):

    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    response = requests.post(url, json=payload)

    if response.status_code != 200:
        raise Exception(f"Erro Gemini: {response.text}")

    data = response.json()

    return data["candidates"][0]["content"]["parts"][0]["text"]