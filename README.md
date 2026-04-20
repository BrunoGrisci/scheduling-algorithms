# scheduling-algorithms

<p align="right">
  <strong>English</strong> |
  <a href="README.pt-BR.md">Português (Brasil)</a>
</p>

**scheduling-algorithms** is an interactive, browser-based educational webtool for three classical greedy scheduling problems:

- **Interval Scheduling**
- **Interval Partitioning**
- **Scheduling to Minimize Maximum Lateness**

The tool was built for classroom use and makes the algorithmic decisions visible through synchronized **code**, **data structure**, **interval**, **graph**, and **proof** views.

It follows the project requirements in `instructions.md` and the technical references in `refs/`, especially Chapter 4 of *Algorithm Design* by Jon Kleinberg and Éva Tardos.

🔗 **GitHub Pages target:** https://brunogrisci.github.io/scheduling-algorithms/  
🔗 **GitHub repository:** https://github.com/BrunoGrisci/scheduling-algorithms

![Overview of the scheduling-algorithms webtool](docs/screenshots/overview.png)

---

## ✨ Features

### Core functionality
- Switch between the three scheduling problems from a single control panel.
- Choose among both **optimal** and **nonoptimal** greedy strategies so students can compare success and failure cases.
- Load **reference-backed presets** from `refs/intervalos.py` and `refs/aulas1718.tex`.
- Generate **random instances** with configurable size.
- Import custom instances from **CSV**.
- Step through each execution with:
  - **Run step**
  - **Auto run**
  - **Run to completion**
  - configurable playback speeds from **0.25x** to **10x**

### Synchronized visualizations
- **Code view** with highlighted pseudocode line.
- **Data structure view** showing sorted items, conflicts, slack, current focus, and the evolving greedy solution.
- **Interval diagram view**:
  - compatible / rejected intervals for interval scheduling,
  - room allocation for interval partitioning,
  - scheduled jobs, deadlines, and lateness for maximum lateness.
- **Graph view**:
  - conflict graph for interval problems,
  - inversion graph for maximum lateness.
- **Proof view** for the three correct greedy algorithms:
  - **stays ahead** for earliest-finish-time-first interval scheduling,
  - **structural bound** for earliest-start-time-first interval partitioning,
  - **exchange argument** for earliest-deadline-first maximum lateness.

### Usability & UI
- Projector-oriented layout with large typography and high-contrast visual states.
- **Light mode / dark mode** toggle.
- **English / Brazilian Portuguese** toggle.
- In-page **help modal** and **references modal**.
- Fully client-side, with no backend or external framework.

---

## 📄 Input format

### Interval Scheduling / Interval Partitioning CSV
```csv
id,start,finish
A,0,3
B,2,5
```

### Scheduling to Minimize Lateness CSV
```csv
job,length,deadline
a,3,7
b,2,5
```

Notes:
- The header row is optional.
- For interval problems, `finish` must be strictly greater than `start`.
- For lateness instances, `length` must be positive.

---

## 🧠 Pedagogical goals

This tool was designed to help students:
- compare natural greedy rules that **fail** against those that are **provably optimal**,
- understand how sorting order changes the resulting solution,
- track the exact state of the greedy algorithm at each step,
- connect the implementation to the proof patterns used in the references,
- inspect the role of conflict counts, overlap depth, deadlines, slack, and lateness.

It is suitable for:
- undergraduate algorithms courses,
- classroom demonstrations with a projector,
- guided exercises about greedy correctness arguments,
- self-study with interactive examples and CSV-based experimentation.

---

## 🌐 Internationalization (i18n)

- Full support for **English** and **Brazilian Portuguese**
- UI labels, help text, references, proof descriptions, and feedback messages are bilingual
- Switching language does **not** reset the current problem instance

---

## 🛠️ Tech stack

- Vanilla **HTML / CSS / JavaScript**
- ES modules
- No external UI framework
- Browser-hosted and compatible with **GitHub Pages**
- Lightweight Node-based verification via:
  ```bash
  npm test
  ```

---

## 🧪 Verification

The repository includes a small regression-style test file that checks:
- optimal interval scheduling on the reference instance,
- counterexamples for the nonoptimal greedy variants,
- optimal interval partitioning versus failing heuristics,
- maximum lateness examples from the lecture slides,
- CSV parsing for both input formats.

Browser validation was also used to confirm:
- theme toggle,
- language toggle,
- problem switching,
- proof tab rendering,
- auto-run behavior.

---

## 🚀 Future work (ideas)

- Add more reference-derived preset instances from additional slides and figures.
- Add editable table cells for direct in-browser instance editing.
- Add export to CSV for the current instance and solution.
- Add richer proof animations for the exchange and stays-ahead arguments.
- Add optional complexity overlays that show the active data structure operations step by step.

---
## 🎓 Credits

**Developed by**  
**Prof. Bruno Iochins Grisci**  
Departamento de Informática Teórica  
Instituto de Informática – Universidade Federal do Rio Grande do Sul (UFRGS)  
🔗 https://brunogrisci.github.io/  
🔗 https://www.inf.ufrgs.br/site/  
🔗 https://www.ufrgs.br/site/

**Technical references used in this project**
- Jon Kleinberg and Éva Tardos, *Algorithm Design*, Chapter 4
- `refs/aulas1718.tex`
- `refs/intervalos.py`
- Princeton greedy demos for earliest-finish-time-first and earliest-start-time-first

**Development note**  
This webtool was created with the assistance of **Generative AI (GPT-5.4)**.

---
## 📦 License

This project is licensed under the **MIT License**.

You are free to use, modify, and redistribute it for academic and educational purposes, provided proper attribution is given.

See the `LICENSE` file for details.

---

If you use this tool in teaching or research, a citation or link back to the repository is appreciated.

## 📚 Citation

If you use this tool in academic work (papers, theses, technical reports, or teaching material), please cite it as:

```bibtex
@software{Grisci_scheduling_algorithms,
  author       = {Bruno Iochins Grisci},
  title        = {{scheduling-algorithms}: An Interactive Visualizer for Greedy Scheduling Algorithms},
  year         = {2026},
  url          = {https://github.com/BrunoGrisci/scheduling-algorithms},
  note         = {Educational web-based software},
}
```

---
## 🔄 See also

- **Projeto e Análise de Algoritmos**
  Repository: https://github.com/BrunoGrisci/projeto-e-analise-de-algoritmos

