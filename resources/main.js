const vscode = acquireVsCodeApi();
let glyphs = [];

// This will be called once we load the JSON data
function updateGrid(filter = "") {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  const filtered = glyphs.filter(
    (g) =>
      g.name.toLowerCase().includes(filter.toLowerCase()) ||
      g.hex.toLowerCase().includes(filter.toLowerCase()),
  );

  filtered.forEach((g) => {
    const card = document.createElement("div");
    card.className = "glyph-card";
    card.innerHTML = `
            <div class="icon">${g.char}</div>
            <div class="hex">${g.hex}</div>
        `;
    card.title = g.name;

    card.onclick = () => {
      // Insert the format used in OMP/JSON configs
      vscode.postMessage({ value: `\\u${g.hex}` });
    };
    grid.appendChild(card);
  });
}

document.getElementById("search").oninput = (e) => updateGrid(e.target.value);
