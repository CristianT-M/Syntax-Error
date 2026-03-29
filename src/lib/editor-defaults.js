export const starterFiles = [
  {
    id: '1',
    name: 'index.html',
    content: `<!DOCTYPE html>
<html lang="ro">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div class="app">
      <h1>Syntax Error</h1>
      <p>Monaco editor cu Run button.</p>
      <button id="btn">Apasă-mă</button>

      <script src="script.js"></script>
    </div>
  </body>
</html>`,
  },
  {
    id: '2',
    name: 'styles.css',
    content: `body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #0b1220;
  color: white;
}

.app {
  min-height: 100vh;
  display: grid;
  place-items: center;
  text-align: center;
}

button {
  padding: 12px 18px;
  border: none;
  border-radius: 10px;
  background: #2563eb;
  color: white;
  cursor: pointer;
}`,
  },
  {
    id: '3',
    name: 'script.js',
    content: `document.getElementById('btn')?.addEventListener('click', () => {
  alert('Merge preview-ul!')
})`,
  },
]