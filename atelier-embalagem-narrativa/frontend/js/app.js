// =============================
// ATELIER DE EMBALAGEM NARRATIVA
// app.js ESTABILIZADO
// =============================


// -----------------------------
// UTILIDADES
// -----------------------------

function safeParseJson(text) {
    try {

        if (!text) return null;

        if (typeof text !== "string") {
            return text;
        }

        text = text.trim();

        // remove markdown
        text = text.replace(/```json/g, "");
        text = text.replace(/```/g, "");

        // remove prefixo "json"
        if (text.startsWith("json")) {
            text = text.substring(4);
        }

        // remove lixo antes do primeiro {
        const start = text.indexOf("{");
        if (start !== -1) {
            text = text.substring(start);
        }

        // remove lixo depois do último }
        const end = text.lastIndexOf("}");
        if (end !== -1) {
            text = text.substring(0, end + 1);
        }

        return JSON.parse(text);

    } catch (err) {

        console.warn("Falha ao interpretar JSON:", err);
        console.warn("Texto recebido:", text);

        return null;
    }
}



// -----------------------------
// DEBUG
// -----------------------------

function debugPrompt(prompt) {

    const el = document.getElementById("debug-prompt");
    if (el) el.textContent = prompt;
}

function debugResponse(response) {

    const el = document.getElementById("debug-response");
    if (el) el.textContent = JSON.stringify(response, null, 2);
}

function debugJson(json) {

    const el = document.getElementById("debug-json");
    if (el) el.textContent = JSON.stringify(json, null, 2);
}



// -----------------------------
// RENDERIZAÇÃO
// -----------------------------

function renderTitles(titles) {

    console.log("Renderizando títulos...");

    const container = document.getElementById("tab-titles");

    if (!container) return;

    container.innerHTML = "";

    titles.forEach(t => {

        const item = document.createElement("div");
        item.className = "result-item";
        item.textContent = t;

        container.appendChild(item);
    });
}



function renderThumbnails(thumbnails) {

    console.log("Renderizando miniaturas...");

    const container = document.getElementById("tab-thumbnails");

    if (!container) return;

    container.innerHTML = "";

    thumbnails.forEach(t => {

        const item = document.createElement("div");
        item.className = "result-item";
        item.textContent = t;

        container.appendChild(item);
    });
}



function renderThumbTexts(texts) {

    console.log("Renderizando textos de thumbnails...");

    const container = document.getElementById("tab-thumbtexts");

    if (!container) return;

    container.innerHTML = "";

    texts.forEach(t => {

        const item = document.createElement("div");
        item.className = "result-item";
        item.textContent = t;

        container.appendChild(item);
    });
}



function renderCombos(combos) {

    console.log("Renderizando combos...");

    const container = document.getElementById("tab-combos");

    if (!container) return;

    container.innerHTML = "";

    combos.forEach(c => {

        const item = document.createElement("div");
        item.className = "result-item";
        item.textContent = c;

        container.appendChild(item);
    });
}



function renderAnalysis(text) {

    console.log("Renderizando análise...");

    const container = document.getElementById("tab-analysis");

    if (!container) return;

    container.innerHTML = text;
}



// -----------------------------
// FALLBACK LOCAL
// -----------------------------

function fallbackLocal() {

    console.warn("Usando fallback local");

    const titles = [
        "O Preço Invisível do Amor",
        "Ela Esperou 10 Anos",
        "O Amor Que o Dinheiro Não Comprou"
    ];

    const thumbnails = [
        "Um homem rico olhando para trás",
        "Uma mulher esperando na estação",
        "Um anel esquecido sobre a mesa"
    ];

    const texts = [
        "10 anos esperando",
        "Ele voltou tarde demais",
        "O amor não tem preço"
    ];

    const combos = [
        "Ela Esperou 10 Anos + Mulher na estação",
        "O Amor Não Comprado + Anel esquecido"
    ];

    const analysis = "Fallback local utilizado. A IA não retornou estrutura válida.";

    renderTitles(titles);
    renderThumbnails(thumbnails);
    renderThumbTexts(texts);
    renderCombos(combos);
    renderAnalysis(analysis);
}



// -----------------------------
// GERAÇÃO COM IA
// -----------------------------

async function generatePackageWithAI() {

    try {

        const story = document.getElementById("story-full").value;

        if (!story) {
            alert("Insira a história primeiro.");
            return;
        }

        const provider = document.getElementById("ai-provider").value;

        const payload = {
            story: story,
            provider: provider
        };

        const prompt = JSON.stringify(payload, null, 2);

        debugPrompt(prompt);

        console.log("Chamando API:", "/api/generate-package");

        const response = await fetch("/api/packaging", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log("Resposta da IA:", data);

        debugResponse(data);

        let rawText = data?.raw_text || data?.text || data?.response || "";

        let parsed = safeParseJson(rawText);

        // suporte Gemini
        if (parsed?.embalagem_narrativa) {
            parsed = parsed.embalagem_narrativa;
        }

        debugJson(parsed);

        if (!parsed) {
            fallbackLocal();
            return;
        }

        const titles =
            parsed.titles ||
            parsed.titulos ||
            [];

        const thumbnails =
            parsed.thumbnails ||
            parsed.miniaturas ||
            [];

        const texts =
            parsed.thumb_texts ||
            parsed.textos_thumbnail ||
            [];

        const combos =
            parsed.combos ||
            parsed.combinacoes ||
            [];

        const analysis =
            parsed.analysis ||
            parsed.analise ||
            "Análise não fornecida.";

        if (!titles.length) {
            fallbackLocal();
            return;
        }

        renderTitles(titles);
        renderThumbnails(thumbnails);
        renderThumbTexts(texts);
        renderCombos(combos);
        renderAnalysis(analysis);

    } catch (err) {

        console.error("ERRO DA API:", err);

        fallbackLocal();
    }
}



// -----------------------------
// BOTÕES
// -----------------------------

document.addEventListener("DOMContentLoaded", () => {

    const btnGenerate = document.getElementById("btn-generate-package");

    if (btnGenerate) {

        btnGenerate.addEventListener("click", async () => {

            await generatePackageWithAI();

        });

    }

});