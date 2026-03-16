const LIBRARY_BASE = "../library";

async function loadJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Não foi possível carregar a biblioteca: ${path}`);
  }

  return response.json();
}

function normalizeValue(value) {
  return value ? String(value).trim() : "";
}

export async function loadCreator(name) {
  const normalized = normalizeValue(name);
  if (!normalized) return null;
  return loadJson(`${LIBRARY_BASE}/creators/${normalized}.json`);
}

export async function loadNiche(name) {
  const normalized = normalizeValue(name);
  if (!normalized) return null;
  return loadJson(`${LIBRARY_BASE}/niches/${normalized}.json`);
}

export async function loadVisualLanguage(name) {
  const normalized = normalizeValue(name);
  if (!normalized) return null;
  return loadJson(`${LIBRARY_BASE}/visual_languages/${normalized}.json`);
}

export async function loadSymbols() {
  return loadJson(`${LIBRARY_BASE}/symbols/narrativa.json`);
}

export async function loadSymbolTheme(theme) {
  const normalized = normalizeValue(theme);
  if (!normalized) return null;

  const symbols = await loadSymbols();
  return symbols[normalized] || null;
}

export async function loadEngine(name) {

  const normalized = normalizeValue(name);
  if (!normalized) return null;

  try {

    const path = `${LIBRARY_BASE}/engines/${normalized}.json`;
    const response = await fetch(path);

    if (!response.ok) {
      console.warn(`Engine não encontrada: ${normalized}`);
      return null;
    }

    return await response.json();

  } catch (error) {

    console.warn("Erro ao carregar engine:", normalized);
    return null;

  }

}

export function buildReferenceContext({
  creator,
  niche,
  visualLanguage,
  symbolTheme
}) {
  return {
    creator_reference: creator
      ? {
          name: creator.name,
          essence: creator.essence,
          core_principles: creator.core_principles || [],
          visual_grammar: creator.visual_grammar || {},
          title_grammar: creator.title_grammar || {},
          inspiration_mode: creator.inspiration_mode || ""
        }
      : null,

    niche_reference: niche
      ? {
          name: niche.name,
          essence: niche.essence,
          core_principles: niche.core_principles || [],
          visual_grammar: niche.visual_grammar || {},
          title_grammar: niche.title_grammar || {},
          inspiration_mode: niche.inspiration_mode || ""
        }
      : null,

    visual_language_reference: visualLanguage
      ? {
          name: visualLanguage.name,
          essence: visualLanguage.essence,
          core_principles: visualLanguage.core_principles || [],
          visual_grammar: visualLanguage.visual_grammar || {},
          title_grammar: visualLanguage.title_grammar || {},
          inspiration_mode: visualLanguage.inspiration_mode || ""
        }
      : null,

    symbolic_reference: symbolTheme
      ? {
          core_idea: symbolTheme.core_idea,
          symbol_family: symbolTheme.symbol_family || [],
          visual_traits: symbolTheme.visual_traits || [],
          inspiration_mode: symbolTheme.inspiration_mode || ""
        }
      : null
  };
}