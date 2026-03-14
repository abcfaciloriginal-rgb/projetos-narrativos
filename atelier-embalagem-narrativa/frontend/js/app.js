import { requestPackaging } from "./api-client.js";
import {
loadCreator,
loadNiche,
loadVisualLanguage,
loadSymbolTheme,
loadEngine,
buildReferenceContext
} from "./library-loader.js";

document.addEventListener("DOMContentLoaded", function () {
  const btnAnalyzeStory = document.getElementById("btn-analyze-story");
  const btnGeneratePackage = document.getElementById("btn-generate-package");
  const btnRefineSelected = document.getElementById("btn-refine-selected");
  const btnExportSession = document.getElementById("btn-export-session");

  const sessionStatus = document.getElementById("session-status");

  const creativeReference = document.getElementById("creative-reference");
 
 const aiProvider = document.getElementById("ai-provider");

  const symbolTheme = document.getElementById("symbol-theme");
  const videoNiche = document.getElementById("video-niche");
  const visualLanguage = document.getElementById("visual-language");
  const dramaticIntensity = document.getElementById("dramatic-intensity");

  const storyTitle = document.getElementById("story-title");
  const storyFull = document.getElementById("story-full");
  const storySummary = document.getElementById("story-summary");
  const storyLogline = document.getElementById("story-logline");
  const themeCentral = document.getElementById("theme-central");
  const emotionDominant = document.getElementById("emotion-dominant");
  const coreWound = document.getElementById("core-wound");
  const humanContradiction = document.getElementById("human-contradiction");
  const symbolMain = document.getElementById("symbol-main");
  const subtextCentral = document.getElementById("subtext-central");

  function updateWorkflowStep(stepIndex) {
    const steps = document.querySelectorAll(".workflow-step");
    steps.forEach((step, index) => {
      step.classList.toggle("active", index === stepIndex);
    });
  }

  function validateStoryInput() {
    return storyFull && storyFull.value.trim().length > 20;
  }

  function analyzeStoryLocally() {
    const coreEmotion = emotionDominant?.value || "não definida";
    const coreSymbol = symbolMain?.value.trim() || "não definido";
    const coreContradiction =
      humanContradiction?.value.trim() || "não definida";
    const coreWoundValue = coreWound?.value.trim() || "não definida";

    const selectedCreator = creativeReference?.value || "nenhuma";
    const selectedSymbolTheme = symbolTheme?.value || "nenhuma";
    const selectedNiche = videoNiche?.value || "não informado";
    const selectedVisualLanguage = visualLanguage?.value || "nenhuma";

    const tabCore = document.getElementById("tab-core");

    if (!tabCore) return;

    tabCore.innerHTML = `
      <article class="result-card">
        <h3>Núcleo Extraído</h3>
        <p><strong>Ferida central:</strong> ${escapeHtml(coreWoundValue)}</p>
        <p><strong>Contradição humana:</strong> ${escapeHtml(coreContradiction)}</p>
        <p><strong>Emoção dominante:</strong> ${escapeHtml(coreEmotion)}</p>
        <p><strong>Símbolo principal:</strong> ${escapeHtml(coreSymbol)}</p>
        <p><strong>Pergunta invisível:</strong> ${escapeHtml(generateInvisibleQuestion())}</p>
        <p><strong>Promessa de clique:</strong> ${escapeHtml(generateClickPromise())}</p>
        <hr style="margin: 12px 0; border-color: #333;">
        <p><strong>Nicho:</strong> ${escapeHtml(selectedNiche)}</p>
        <p><strong>Referência criativa:</strong> ${escapeHtml(selectedCreator)}</p>
        <p><strong>Linguagem visual:</strong> ${escapeHtml(selectedVisualLanguage)}</p>
        <p><strong>Família simbólica:</strong> ${escapeHtml(selectedSymbolTheme)}</p>
      </article>
    `;
  }

  function generatePackageLocally() {
    renderTitles();
    renderThumbnails();
    renderThumbTexts();
    renderCombos();
    renderAnalysis();
    renderFinalDirection();
  }

  async function generatePackageWithAI() {

  const provider = aiProvider?.value || "gemini";

  const selectedCreator = creativeReference?.value || "";
  const selectedSymbolTheme = symbolTheme?.value || "";
  const selectedNiche = videoNiche?.value || "";
  const selectedVisualLanguage = visualLanguage?.value || "";

  const [
creatorData,
nicheData,
visualLanguageData,
symbolData,
clickPsychology,
suspenseEngine
] = await Promise.all([

loadCreator(selectedCreator),
loadNiche(selectedNiche),
loadVisualLanguage(selectedVisualLanguage),
loadSymbolTheme(selectedSymbolTheme),
loadEngine("click_psychology"),
loadEngine("suspense_hitchcock")

]);

  const referenceContext = buildReferenceContext({

creator: creatorData,
niche: nicheData,
visualLanguage: visualLanguageData,
symbolTheme: symbolData,
clickPsychology,
suspenseEngine

});

  console.log("Contexto criativo carregado:", referenceContext);

  const result = await requestPackaging({
    provider,
    story: storyFull.value.trim(),
    niche: selectedNiche,
    tone: selectedVisualLanguage,
    summary: storySummary?.value.trim() || "",
    logline: storyLogline?.value.trim() || "",
    theme: themeCentral?.value.trim() || "",
    emotion: emotionDominant?.value || "",
    wound: coreWound?.value.trim() || "",
    contradiction: humanContradiction?.value.trim() || "",
    symbol: symbolMain?.value.trim() || "",
    subtext: subtextCentral?.value.trim() || "",
    referenceContext
  });

  console.log("Resposta da IA:", result);

  let parsed = safeParseJson(result.raw_text);

if (!parsed) {

console.warn("JSON inválido. Tentando novamente...");

const retry = await requestPackaging({
provider,
story: storyFull.value.trim(),
niche: selectedNiche,
tone: selectedVisualLanguage,
summary: storySummary?.value.trim() || "",
logline: storyLogline?.value.trim() || "",
theme: themeCentral?.value.trim() || "",
emotion: emotionDominant?.value || "",
wound: coreWound?.value.trim() || "",
contradiction: humanContradiction?.value.trim() || "",
symbol: symbolMain?.value.trim() || "",
subtext: subtextCentral?.value.trim() || "",
referenceContext
});

parsed = safeParseJson(retry.raw_text);

if (!parsed) {

console.warn("Retry também falhou. Usando fallback local.");

generatePackageLocally();
return;

}

}

  const titles = parsed.titles || [];
  const thumbnails = parsed.thumbnails || [];
  const thumbTexts = parsed.thumb_texts || [];
  const combos = parsed.combos || [];

  if (
    titles.length === 0 &&
    thumbnails.length === 0 &&
    thumbTexts.length === 0 &&
    combos.length === 0
  ) {

    console.warn("IA não retornou estrutura esperada. Usando fallback local.");

    generatePackageLocally();

    return;
  }

  renderTitlesFromAI(titles);
  renderThumbnailsFromAI(thumbnails);
  renderThumbTextsFromAI(thumbTexts);
  renderCombosFromAI(combos);

  renderAnalysis();
  renderFinalDirection();
}

  function renderTitles() {
    const tabTitles = document.getElementById("tab-titles");
    const titleBase = storyTitle?.value.trim() || "Esta História";

    if (!tabTitles) return;

    const titles = [

applyCuriosityGap(titleBase),

"Ele Só Entendeu Quando Já Era Tarde",

"O Que Esta História Revela em Silêncio",

`${titleBase}: A Ferida Que Ninguém Viu`,

"Nem Toda Perda Faz Barulho"

];

    tabTitles.innerHTML = titles
      .map(
        (title, index) => `
        <article class="result-card title-card">
          <header class="card-header">
            <span class="card-tag">Título ${index + 1}</span>
            <span class="card-score">Força: ${(9 - index * 0.2).toFixed(1)}</span>
          </header>
          <h3>${escapeHtml(title)}</h3>
          <div class="card-meta">
            <p><strong>Mecanismo:</strong> curiosidade emocional</p>
            <p><strong>Emoção:</strong> ${escapeHtml(emotionDominant?.value || "dor silenciosa")}</p>
            <p><strong>Risco:</strong> baixo</p>
          </div>
          <footer class="card-actions">
            <button type="button">Copiar</button>
            <button type="button">Favoritar</button>
            <button type="button">Refinar</button>
          </footer>
        </article>
      `
      )
      .join("");
  }

  function renderTitlesFromAI(titles) {
    const tabTitles = document.getElementById("tab-titles");
    if (!tabTitles) return;

    tabTitles.innerHTML = titles
      .slice(0, 5)
      .map(
        (title, index) => `
        <article class="result-card title-card">
          <header class="card-header">
            <span class="card-tag">Título ${index + 1}</span>
            <span class="card-score">IA</span>
          </header>
          <h3>${escapeHtml(title)}</h3>
          <div class="card-meta">
            <p><strong>Mecanismo:</strong> embalagem narrativa</p>
            <p><strong>Emoção:</strong> ${escapeHtml(emotionDominant?.value || "não definida")}</p>
            <p><strong>Risco:</strong> moderado</p>
          </div>
          <footer class="card-actions">
            <button type="button">Copiar</button>
            <button type="button">Favoritar</button>
            <button type="button">Refinar</button>
          </footer>
        </article>
      `
      )
      .join("");
  }

  function renderThumbnails() {
    const tabThumbnails = document.getElementById("tab-thumbnails");
    const symbol = symbolMain?.value.trim() || "cadeira vazia";

    if (!tabThumbnails) return;

    const concepts = [
      `Um personagem isolado no escuro diante de ${symbol}, iluminado por uma faixa de luz.`,
      `${symbol} em primeiro plano, fundo escuro, silêncio visual, contraste forte.`,
      `Rosto em sombra parcial + detalhe simbólico de ${symbol}.`
    ];

    tabThumbnails.innerHTML = concepts
      .map(
        (concept, index) => `
        <article class="result-card thumbnail-card">
          <header class="card-header">
            <span class="card-tag">Miniatura ${index + 1}</span>
            <span class="card-score">Força visual: ${(9.4 - index * 0.3).toFixed(1)}</span>
          </header>
          <h3>${escapeHtml(concept)}</h3>
          <div class="card-meta">
            <p><strong>Símbolo:</strong> ${escapeHtml(symbol)}</p>
            <p><strong>Emoção:</strong> ${escapeHtml(emotionDominant?.value || "vazio")}</p>
            <p><strong>Contraste:</strong> luz vs sombra</p>
            <p><strong>Risco de clichê:</strong> baixo</p>
          </div>
          <footer class="card-actions">
            <button type="button">Copiar</button>
            <button type="button">Favoritar</button>
            <button type="button">Refinar</button>
          </footer>
        </article>
      `
      )
      .join("");
  }

  function renderThumbnailsFromAI(thumbnails) {
    const tabThumbnails = document.getElementById("tab-thumbnails");
    if (!tabThumbnails) return;

    tabThumbnails.innerHTML = thumbnails
      .slice(0, 5)
      .map(
        (thumb, index) => `
        <article class="result-card thumbnail-card">
          <header class="card-header">
            <span class="card-tag">Miniatura ${index + 1}</span>
            <span class="card-score">IA</span>
          </header>
          <h3>${escapeHtml(thumb.concept || "Conceito não informado")}</h3>
          <div class="card-meta">
            <p><strong>Símbolo:</strong> ${escapeHtml(thumb.symbol || "não informado")}</p>
            <p><strong>Emoção:</strong> ${escapeHtml(thumb.emotion || "não informada")}</p>
            <p><strong>Contraste:</strong> visual</p>
            <p><strong>Risco de clichê:</strong> moderado</p>
          </div>
          <footer class="card-actions">
            <button type="button">Copiar</button>
            <button type="button">Favoritar</button>
            <button type="button">Refinar</button>
          </footer>
        </article>
      `
      )
      .join("");
  }

  function renderThumbTexts() {
    const tabThumbtexts = document.getElementById("tab-thumbtexts");
    if (!tabThumbtexts) return;

    const texts = [
      "Tarde Demais",
      "Ele Não Viu",
      "Já Era",
      "Silêncio",
      "Quando Acordou"
    ];

    tabThumbtexts.innerHTML = `
      <article class="result-card thumbtext-list-card">
        <h3>Textos Curtos</h3>
        <ul class="thumbtext-list">
          ${texts
            .map(
              (text, index) => `
            <li>
              <span class="thumbtext">${escapeHtml(text)}</span>
              <span class="thumbtext-score">Força: ${(9 - index * 0.2).toFixed(1)}</span>
              <button type="button">Copiar</button>
              <button type="button">♥</button>
            </li>
          `
            )
            .join("")}
        </ul>
      </article>
    `;
  }

  function renderThumbTextsFromAI(texts) {
    const tabThumbtexts = document.getElementById("tab-thumbtexts");
    if (!tabThumbtexts) return;

    tabThumbtexts.innerHTML = `
      <article class="result-card thumbtext-list-card">
        <h3>Textos Curtos</h3>
        <ul class="thumbtext-list">
          ${texts
            .slice(0, 5)
            .map(
              (text) => `
            <li>
              <span class="thumbtext">${escapeHtml(text)}</span>
              <span class="thumbtext-score">IA</span>
              <button type="button">Copiar</button>
              <button type="button">♥</button>
            </li>
          `
            )
            .join("")}
        </ul>
      </article>
    `;
  }

  function renderCombos() {
    const tabCombos = document.getElementById("tab-combos");
    const title = storyTitle?.value.trim() || "História";
    const symbol = symbolMain?.value.trim() || "símbolo central";

    if (!tabCombos) return;

    tabCombos.innerHTML = `
      <article class="result-card combo-card">
        <header class="card-header">
          <span class="card-tag">Perfil: Equilibrado</span>
        </header>

        <h3>Cartaz Possível 01</h3>

        <div class="combo-block">
          <p><strong>Título:</strong> ${escapeHtml(title)}: O Que Só Se Vê Tarde Demais</p>
          <p><strong>Miniatura:</strong> personagem isolado diante de ${escapeHtml(symbol)}</p>
          <p><strong>Texto curto:</strong> Tarde Demais</p>
          <p><strong>Público provável:</strong> emocional / reflexivo</p>
          <p><strong>Coerência com o canal:</strong> 9.4</p>
          <p><strong>Potencial de clique:</strong> 8.8</p>
        </div>

        <footer class="card-actions">
          <button type="button">Favoritar</button>
          <button type="button">Copiar combinação</button>
        </footer>
      </article>
    `;
  }

  function renderCombosFromAI(combos) {
    const tabCombos = document.getElementById("tab-combos");
    if (!tabCombos) return;

    tabCombos.innerHTML = combos
      .slice(0, 3)
      .map(
        (combo, index) => `
        <article class="result-card combo-card">
          <header class="card-header">
            <span class="card-tag">Perfil: IA ${index + 1}</span>
          </header>

          <h3>Cartaz Possível ${index + 1}</h3>

          <div class="combo-block">
            <p><strong>Título:</strong> ${escapeHtml(combo.title || "não informado")}</p>
            <p><strong>Miniatura:</strong> ${escapeHtml(combo.visual_concept || "não informado")}</p>
            <p><strong>Texto curto:</strong> ${escapeHtml(combo.thumb_text || "não informado")}</p>
            <p><strong>Justificativa:</strong> ${escapeHtml(combo.why_it_works || "não informada")}</p>
          </div>

          <footer class="card-actions">
            <button type="button">Favoritar</button>
            <button type="button">Copiar combinação</button>
          </footer>
        </article>
      `
      )
      .join("");
  }

  function renderAnalysis() {
    const tabAnalysis = document.getElementById("tab-analysis");
    if (!tabAnalysis) return;

    tabAnalysis.innerHTML = `
      <article class="result-card analysis-card">
        <h3>Leitura de Força — Título Selecionado</h3>
        <p><strong>Curiosidade:</strong> 9.1</p>
        <p><strong>Clareza:</strong> 8.6</p>
        <p><strong>Emoção:</strong> 9.3</p>
        <p><strong>Singularidade:</strong> 8.2</p>
        <p><strong>Potencial de clique:</strong> 8.8</p>
        <p><strong>Coerência com a história:</strong> 9.4</p>
        <p><strong>Coerência com o canal:</strong> 9.6</p>
      </article>

      <article class="result-card analysis-card">
        <h3>Leitura de Força — Miniatura Selecionada</h3>
        <p><strong>Leitura imediata:</strong> 9.0</p>
        <p><strong>Impacto emocional:</strong> 9.2</p>
        <p><strong>Força simbólica:</strong> 9.4</p>
        <p><strong>Limpeza visual:</strong> 9.1</p>
        <p><strong>Memorabilidade:</strong> 8.5</p>
        <p><strong>Risco de excesso:</strong> 2.0</p>
      </article>
    `;
  }

  function renderFinalDirection() {
    const tabFinalDirection = document.getElementById("tab-final-direction");
    const symbol = symbolMain?.value.trim() || "símbolo central";

    if (!tabFinalDirection) return;

    tabFinalDirection.innerHTML = `
      <article class="result-card final-direction-card">
        <h3>Direção Final</h3>
        <p><strong>Melhor direção:</strong> trabalhar perda silenciosa, ausência e revelação tardia.</p>
        <p><strong>Símbolo recomendado:</strong> ${escapeHtml(symbol)}</p>
        <p><strong>Tom ideal:</strong> emocional, minimalista e filosófico.</p>
        <p><strong>Observação editorial:</strong> esta história responde melhor a silêncio visual do que a choque direto.</p>
      </article>
    `;
  }

  function generateInvisibleQuestion() {
    const logline = storyLogline?.value.trim() || "";
    const summary = storySummary?.value.trim() || "";

    if (logline) {
      return `O que esta história esconde por trás de: "${truncate(logline, 80)}"?`;
    }

    if (summary) {
      return "O que realmente estava em jogo nessa dor silenciosa?";
    }

    return "O que só se percebe quando já é tarde?";
  }

function applyCuriosityGap(title) {

if (!title) return title;

const patterns = [

"o que ninguém percebeu",
"o detalhe que mudou tudo",
"o erro que quase todos cometem",
"o lado que ninguém vê",
"o momento em que tudo mudou"

];

const pattern = patterns[Math.floor(Math.random()*patterns.length)];

return `${pattern} em: ${title}`;

}

  function generateClickPromise() {
    const theme = themeCentral?.value.trim() || "";
    const wound = coreWound?.value.trim() || "";

    if (theme && wound) {
      return `${theme} + ${wound} + curiosidade emocional`;
    }

    if (theme) {
      return `${theme} + contraste humano`;
    }

    return "revelação tardia + tensão emocional";
  }

  function truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + "...";
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeParseJson(text) {

if (!text) return null;

try {
return JSON.parse(text);
} catch {}

let cleaned = text
.replace(/```json/gi,"")
.replace(/```/g,"")
.trim();

const start = cleaned.indexOf("{");
const end = cleaned.lastIndexOf("}");

if (start !== -1 && end !== -1) {
cleaned = cleaned.substring(start, end + 1);
}

try {
return JSON.parse(cleaned);
} catch {

console.warn("Falha ao interpretar JSON da IA.");

return null;

}

 }

  btnAnalyzeStory?.addEventListener("click", function () {
    if (!validateStoryInput()) {
      alert("Cole uma história um pouco mais completa antes de analisar.");
      return;
    }

    analyzeStoryLocally();
    sessionStatus.value = "historia-analisada";
    updateWorkflowStep(1);
    alert("História analisada. O núcleo dramático foi extraído.");
  });

  btnGeneratePackage?.addEventListener("click", async function () {
    if (!validateStoryInput()) {
      alert("Primeiro insira a história completa.");
      return;
    }

    btnGeneratePackage.disabled = true;
    btnGeneratePackage.textContent = "Gerando...";

    try {
  await generatePackageWithAI();
  sessionStatus.value = "embalagem-gerada";
  updateWorkflowStep(2);
  alert("Embalagem gerada com IA.");

} catch (error) {

  console.error("ERRO DA API:", error);

  alert(
    "Erro ao chamar a API:\n\n" +
    (error.message || "Erro desconhecido") +
    "\n\nVeja o console do navegador (F12) para mais detalhes."
  );

  generatePackageLocally();
  sessionStatus.value = "embalagem-gerada";
  updateWorkflowStep(2);

} finally {

  btnGeneratePackage.disabled = false;
  btnGeneratePackage.textContent = "Gerar Embalagem";

}
  });


  btnRefineSelected?.addEventListener("click", function () {
    alert("Na próxima etapa vamos transformar este botão em refinamento real por item selecionado.");
    updateWorkflowStep(3);
  });

  btnExportSession?.addEventListener("click", function () {
    const data = {
      sessionName: document.getElementById("session-name")?.value || "",
      storyTitle: storyTitle?.value || "",
      storyFull: storyFull?.value || "",
      storySummary: storySummary?.value || "",
      storyLogline: storyLogline?.value || "",
      themeCentral: themeCentral?.value || "",
      emotionDominant: emotionDominant?.value || "",
      coreWound: coreWound?.value || "",
      humanContradiction: humanContradiction?.value || "",
      symbolMain: symbolMain?.value || "",
      subtextCentral: subtextCentral?.value || ""
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "atelier-sessao.json";
    link.click();
    URL.revokeObjectURL(url);
  });

  const tabButtons = document.querySelectorAll(".tab-button");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabButtons.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      if (tabPanels[index]) {
        tabPanels[index].classList.add("active");
      }
    });
  });
});