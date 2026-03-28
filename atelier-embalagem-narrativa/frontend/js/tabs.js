document.addEventListener("DOMContentLoaded", function () {

  const tabButtons = document.querySelectorAll(".tab-button");
  const tabPanels = document.querySelectorAll(".tab-panel");

  function activateTab(tabId) {

    const panelId = "tab-" + tabId;

    tabButtons.forEach((button) => {

      const isActive = button.dataset.tab === tabId;
      button.classList.toggle("active", isActive);

    });

    tabPanels.forEach((panel) => {

      const isActive = panel.id === panelId;
      panel.classList.toggle("active", isActive);

    });

  }

  tabButtons.forEach((button) => {

    button.addEventListener("click", function () {

      activateTab(button.dataset.tab);

    });

  });

  const firstActiveButton = document.querySelector(".tab-button.active");

  if (firstActiveButton) {

    activateTab(firstActiveButton.dataset.tab);

  }

});