// uiControls.js
// Small helpers shared across pages for sliders & info panels.
// Attached to window.LoRaSim (so it works under file:// without ES module imports).

(function () {
  window.LoRaSim = window.LoRaSim || {};

  function wireSliderValueText(root) {
    const r = root || document;
    const sliders = r.querySelectorAll("input[type=range]");
    sliders.forEach((slider) => {
      const span = r.querySelector(`.slider-value[data-for="${slider.id}"]`);
      if (!span) return;
      const update = () => {
        span.textContent = slider.value;
      };
      slider.addEventListener("input", update);
      update();
    });
  }

  function wireInfoPanels(root) {
    const r = root || document;
    r.querySelectorAll(".info-icon[data-info-target]").forEach((btn) => {
      const id = btn.getAttribute("data-info-target");
      const panel = r.getElementById(id);
      if (!panel) return;
      btn.addEventListener("click", () => {
        panel.classList.toggle("visible");
      });
    });
  }

  window.LoRaSim.uiControls = {
    wireSliderValueText,
    wireInfoPanels
  };
})();

