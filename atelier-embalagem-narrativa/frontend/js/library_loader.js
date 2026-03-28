// Loader simples (estilo "contador"): expõe initCreativeDirection no window.
// Este arquivo é carregado como <script> (não module) em `index.html`.

window.initCreativeDirection = async function () {
  try {
    const response = await fetch("/api/library");
    const data = await response.json();

    populateSelect("creatorSelect", data.creators);
    populateSelect("nicheSelect", data.niches);
    populateSelect("visualSelect", data.visual_languages);
    populateSelect("symbolSelect", data.symbols);
  } catch (error) {
    console.error("Erro ao carregar library:", error);
  }
};

function populateSelect(selectId, items) {
  const select = document.getElementById(selectId);
  if (!select || !items) return;

  select.innerHTML = '<option value="">Selecione...</option>';
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  });
}