// ===========================
// ATELIER NARRATIVO
// PIPELINE ESTILO "CONTADOR"
// ===========================

const ETAPAS_UI = ["lapidar", "embalar", "refinar"];

const state = {
  etapaAtual: "lapidar",
  textosPorEtapa: {
    lapidar: "",
    embalar: "",
    refinar: "",
  },
  entradaPorEtapa: {
    lapidar: "",
    embalar: "",
    refinar: "",
  },
};

const $ = (id) => document.getElementById(id);

function showResult(text) {
  const box = $("result-box");
  if (!box) return;

  if (box.tagName === "TEXTAREA" || box.tagName === "INPUT") {
    box.value = text;
  } else {
    box.textContent = text;
  }
}

function uiToState(stage) {
  if (stage === "lapidar") {
    state.entradaPorEtapa.lapidar = $("in_lapidar")?.value || "";
    state.textosPorEtapa.lapidar = $("out_lapidar")?.value || "";
  }
  if (stage === "embalar") {
    state.entradaPorEtapa.embalar = $("in_embalar")?.value || "";
    state.textosPorEtapa.embalar = $("result-box")?.value || $("result-box")?.textContent || "";
  }
  if (stage === "refinar") {
    state.entradaPorEtapa.refinar = $("in_refinar")?.value || "";
    state.textosPorEtapa.refinar = $("out_refinar")?.value || "";
  }
}

function stateToUI(stage) {
  if (stage === "lapidar") {
    if ($("in_lapidar")) $("in_lapidar").value = state.entradaPorEtapa.lapidar || "";
    if ($("out_lapidar")) $("out_lapidar").value = state.textosPorEtapa.lapidar || "";
  }
  if (stage === "embalar") {
    if ($("in_embalar")) $("in_embalar").value = state.entradaPorEtapa.embalar || "";
    const out = state.textosPorEtapa.embalar || "";
    if ($("result-box")) {
      if ($("result-box").tagName === "TEXTAREA" || $("result-box").tagName === "INPUT") {
        $("result-box").value = out;
      } else {
        $("result-box").textContent = out;
      }
    }
  }
  if (stage === "refinar") {
    if ($("in_refinar")) $("in_refinar").value = state.entradaPorEtapa.refinar || "";
    if ($("out_refinar")) $("out_refinar").value = state.textosPorEtapa.refinar || "";
  }
}

function getNarrationReference(){
  return document.getElementById("narration-ref").value;
}

function analyzeStoryLocal(text) {
  if (!text || !text.trim()) {
    alert("Insira a história.");
    return "História vazia.";
  }
  
  const narrationRef = getNarrationReference();
  let analysis = "ANÁLISE LOCAL\n\nLogline (rústica):\n\n";
  
  const sentences = text.split(".").filter((s) => s.trim().length > 10);
  const logline = sentences[0] || text.trim().slice(0, 200);
  analysis += logline;
  
  if (narrationRef && narrationRef.trim()) {
    analysis += "\n\nREFERÊNCIA DE ESTILO NARRATIVO:\n" + narrationRef + "\n\nINSTRUÇÃO:\nUse o estilo acima como influência.\nNÃO copie o texto.\nAbsorva ritmo, emoção e forma narrativa.";
  }
  
  return analysis;
}

async function callPackagingAPI(story) {
  const providerEl = $("ai-provider");
  const provider = providerEl ? providerEl.value : "gemini";

  const payload = {
    story: story,
    provider: provider,
  };

  showResult("IA pensando...\n");

  const response = await fetch("/api/packaging", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  let text = data.raw_text || JSON.stringify(data, null, 2);
  return text;
}

async function executarEtapa(stage) {
  uiToState(stage);
  state.etapaAtual = stage;

  if (stage === "lapidar") {
    const entrada = state.entradaPorEtapa.lapidar || "";
    const out = analyzeStoryLocal(entrada);
    state.textosPorEtapa.lapidar = out || "";
    stateToUI("lapidar");
    return;
  }

  if (stage === "embalar") {
    const baseText =
      state.textosPorEtapa.lapidar ||
      state.entradaPorEtapa.embalar;

    if (!baseText || !baseText.trim()) {
      alert("Sem texto para embalar. Use o Lapidar ou preencha a entrada do Embalar.");
      return;
    }

    try {
      const out = await callPackagingAPI(baseText);
      state.textosPorEtapa.embalar = out || "";
      stateToUI("embalar");
    } catch (err) {
      console.error(err);
      showResult("Erro na API:\n\n" + err);
    }
    return;
  }

  if (stage === "refinar") {
    const entrada = state.entradaPorEtapa.refinar || state.textosPorEtapa.embalar;
    if (!entrada || !entrada.trim()) {
      alert("Sem conteúdo para refinar. Envie algo a partir do Embalar.");
      return;
    }
    // Refinamento local simples: apenas copia a entrada, mantendo espaço para curadoria manual.
    state.entradaPorEtapa.refinar = entrada;
    state.textosPorEtapa.refinar = entrada;
    stateToUI("refinar");
    return;
  }
}

function enviarParaProxima(stage) {
  uiToState(stage);
  const idx = ETAPAS_UI.indexOf(stage);
  if (idx < 0 || idx === ETAPAS_UI.length - 1) return;

  const next = ETAPAS_UI[idx + 1];

  if (stage === "lapidar") {
    state.entradaPorEtapa[next] = state.textosPorEtapa.lapidar || state.entradaPorEtapa.lapidar || "";
  } else if (stage === "embalar") {
    state.entradaPorEtapa[next] = state.textosPorEtapa.embalar || "";
  }

  stateToUI(next);
}

async function listarProjetos() {
  const res = await fetch("/api/projetos");
  const data = await res.json();
  const select = document.getElementById("listaProjetos");
  select.innerHTML = "";
  data.projetos.forEach(nome => {
    const option = document.createElement("option");
    option.value = nome;
    option.textContent = nome;
    select.appendChild(option);
  });
}

async function carregarProjeto() {
  const nome = document.getElementById("listaProjetos").value;
  const res = await fetch(`/api/projetos/${nome}`);
  const data = await res.json();
  document.getElementById("textoLapidar").value = data.texto || "";
  document.getElementById("resultadoLapidar").value = data.resultado || "";
  document.getElementById("narration-ref").value = data.referencia || "";
  document.getElementById("roteiroDiretor").value = data.roteiro || "";
  document.getElementById("outputDiretor").value = data.output || "";
}

document.addEventListener("DOMContentLoaded", () => {
  listarProjetos();
  if (window.initCreativeDirection) {
    window.initCreativeDirection();
  }
});