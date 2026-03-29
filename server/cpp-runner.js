// server/cpp-runner.js
// Express server pentru rulare C++ în Docker, adaptat pentru proiectul tău

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { exec } = require("child_process");

const app = express();
app.use(cors());
const PORT = 3001; // Poți schimba portul dacă e nevoie

app.use(express.json({ limit: "200kb" }));

function cleanup(dirPath) {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch {}
}

// Endpoint principal pentru testare rapidă
app.get("/cpp-runner", (req, res) => {
  res.send("C++ Runner API activ. Folosește POST /cpp-runner/run pentru a compila și rula cod C++.");
});

// Endpoint pentru rulare cod C++
app.post("/cpp-runner/run", (req, res) => {
  const code = req.body.code;
  const input = req.body.input || "";

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Cod invalid." });
  }

  const id = crypto.randomUUID();
  const workDir = path.join(os.tmpdir(), "cpp-" + id);

  try {
    fs.mkdirSync(workDir, { recursive: true });
    fs.writeFileSync(path.join(workDir, "main.cpp"), code, "utf8");
    fs.writeFileSync(path.join(workDir, "input.txt"), input, "utf8");
  } catch (e) {
    cleanup(workDir);
    return res.json({
      error: "Nu am putut salva fișierele: " + e.message
    });
  }

  const dockerWorkDir = workDir.replace(/\\/g, "/");

  const cmd = `docker run --rm --memory="128m" --cpus="0.5" --pids-limit=64 --network=none --security-opt=no-new-privileges -v "${dockerWorkDir}:/code" gcc:latest bash -c "g++ /code/main.cpp -std=c++17 -O2 -o /code/a.out && /code/a.out < /code/input.txt"`;

  exec(cmd, { timeout: 3000 }, (err, stdout, stderr) => {
    cleanup(workDir);

    if (err) {
      return res.json({
        error: stderr || err.message || "Eroare la compilare/rulare."
      });
    }

    res.json({
      output: stdout || "Programul nu a afișat nimic."
    });
  });
});

app.listen(PORT, () => {
  console.log("C++ runner pornit pe http://localhost:" + PORT);
});
