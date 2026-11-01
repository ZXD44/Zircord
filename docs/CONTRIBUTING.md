# Contributing to Clicord

Thank you for your interest in contributing to **Clicord**! We welcome community contributions, bug reports, and suggestions.

---

## 🛠️ Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ZirconX/clicord.git
   cd clicord
   ```

2. **Run in Development Mode**:
   ```bash
   node src/discord-rpc.js .
   ```

3. **Rebuild the Rust Shim (Optional)**:
   ```powershell
   rustc -O src/shim/src/main.rs -o bin/agy.exe
   ```

---

## 🎨 Adding New Themes

New themes can be easily added to the `TEMPLATES` object in `src/discord-rpc.js`:

```javascript
myTheme: {
    writing: (lang, file, sub) => `...`,
    reading: (lang, file, sub) => `...`,
    running: (target) => `...`,
    searching: (query) => `...`,
    planning: (task) => `...`,
    idleLang: (lang) => `...`,
    idleGeneric: (folder) => `...`,
    idleRoblox: (place) => `...`,
    afkDetails: () => `...`,
    afkState: (user) => `...`,
    state: (user, folder, git, isRoblox) => `...`,
    gitFormat: (branch, dirty, diff) => `...`
}
```

---

## 📜 Pull Request Guidelines

1. Ensure the code works without external npm dependencies (`net`, `path`, `fs`, and `child_process` only).
2. Follow clean code standards and test compatibility across Windows Terminal, PowerShell, and Command Prompt.
3. Update `README.md` or `CHANGELOG.md` if adding user-facing features.
