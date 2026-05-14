// 1. Establish the connection to the VS Code API
const vscode = acquireVsCodeApi();

// State management
let allGlyphs = [];

// 2. Listen for the "loadData" command from extension.ts
window.addEventListener("message", (event) => {
  const message = event.data;
  switch (message.command) {
    case "loadData":
      allGlyphs = message.data;
      renderGrid(allGlyphs);
      break;
  }
});

/**
 * Renders the icons into the HTML grid
 * @param {Array} glyphs - The array of glyph objects to display
 */
function renderGrid(glyphs) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  glyphs.forEach((glyph) => {
    const card = document.createElement("div");
    card.className = "glyph-card";

    // Use the hex code and the character for the UI
    card.innerHTML = `
            <div class="icon">${glyph.char}</div>
            <div class="hex">${glyph.hex}</div>
        `;
    card.title = glyph.name;

    // 3. Send the selection back to the editor when clicked
    card.onclick = () => {
      vscode.postMessage({
        value: `\\u${glyph.hex}`, // Perfect for OMP/JSON configs
      });
    };

    grid.appendChild(card);
  });
}

// 4. Handle real-time searching
document.getElementById("search").addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = allGlyphs.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm) ||
      g.hex.toLowerCase().includes(searchTerm),
  );
  renderGrid(filtered);
});
