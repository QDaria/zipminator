/**
 * Zipminator Jupyter Book — Interactive Enhancements
 * - Download buttons on Plotly charts (PNG/SVG/HTML)
 * - Collapse/expand all code cells
 * - Download buttons on code cells
 *
 * Note: All content is self-generated (no user input), so DOM creation
 * uses createElement + textContent for safety.
 */

document.addEventListener("DOMContentLoaded", function () {

  // ── Helper: create a button element safely ───────────────
  function makeButton(text, className, title) {
    var btn = document.createElement("button");
    btn.textContent = text;
    btn.className = className;
    btn.title = title;
    return btn;
  }

  // ── Plotly Download Buttons ──────────────────────────────
  function addPlotlyDownloadButtons() {
    var plotlyDivs = document.querySelectorAll(".plotly-graph-div, .js-plotly-plot");
    plotlyDivs.forEach(function (plotDiv) {
      if (plotDiv.dataset.downloadAdded) return;
      plotDiv.dataset.downloadAdded = "true";

      var wrapper = plotDiv.closest(".cell_output") || plotDiv.parentElement;
      var bar = document.createElement("div");
      bar.className = "zm-download-bar";

      var formats = [
        { fmt: "png", label: "PNG" },
        { fmt: "svg", label: "SVG" },
        { fmt: "html", label: "HTML" }
      ];

      formats.forEach(function (f) {
        var btn = makeButton(f.label, "zm-dl-btn", "Download " + f.label);
        btn.dataset.fmt = f.fmt;
        btn.addEventListener("click", function () {
          var title = (plotDiv.layout && plotDiv.layout.title && plotDiv.layout.title.text)
            ? plotDiv.layout.title.text : "chart";
          var filename = title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 40);

          if (f.fmt === "html") {
            var blob = new Blob([plotDiv.outerHTML], { type: "text/html" });
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = filename + ".html";
            a.click();
          } else if (window.Plotly) {
            Plotly.downloadImage(plotDiv, {
              format: f.fmt, width: 1200, height: 700, filename: filename
            });
          }
        });
        bar.appendChild(btn);
      });

      wrapper.insertBefore(bar, plotDiv);
    });
  }

  // ── Code Cell Download Buttons ───────────────────────────
  function addCodeDownloadButtons() {
    document.querySelectorAll("div.highlight pre").forEach(function (pre) {
      if (pre.dataset.dlAdded) return;
      pre.dataset.dlAdded = "true";

      var btn = makeButton("\u2B07", "zm-code-dl", "Download code");
      btn.addEventListener("click", function () {
        var code = pre.textContent;
        var blob = new Blob([code], { type: "text/plain" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "zipminator_code.py";
        a.click();
      });

      var container = pre.closest("div.highlight");
      if (container) {
        container.style.position = "relative";
        container.appendChild(btn);
      }
    });
  }

  // ── Collapse/Expand All Toggle ───────────────────────────
  function addGlobalToggle() {
    var notebook = document.querySelector(".bd-article-container");
    if (!notebook) return;

    var hasHiddenCells = document.querySelectorAll("details.hide, .cell_input").length > 0;
    if (!hasHiddenCells) return;

    var bar = document.createElement("div");
    bar.className = "zm-global-toggle";

    var collapseBtn = makeButton("Collapse All Code", "zm-toggle-btn", "Collapse all code cells");
    var expandBtn = makeButton("Expand All Code", "zm-toggle-btn", "Expand all code cells");

    collapseBtn.addEventListener("click", function () {
      document.querySelectorAll("details.hide").forEach(function (d) { d.removeAttribute("open"); });
      document.querySelectorAll(".cell_input").forEach(function (c) { c.style.display = "none"; });
    });

    expandBtn.addEventListener("click", function () {
      document.querySelectorAll("details.hide").forEach(function (d) { d.setAttribute("open", ""); });
      document.querySelectorAll(".cell_input").forEach(function (c) { c.style.display = ""; });
    });

    bar.appendChild(collapseBtn);
    bar.appendChild(expandBtn);
    notebook.insertBefore(bar, notebook.firstChild);
  }

  // ── Run on load + observe for dynamic Plotly renders ─────
  setTimeout(function () {
    addPlotlyDownloadButtons();
    addCodeDownloadButtons();
    addGlobalToggle();
  }, 1500);

  var observer = new MutationObserver(function () {
    addPlotlyDownloadButtons();
    addCodeDownloadButtons();
  });
  observer.observe(document.body, { childList: true, subtree: true });
});
