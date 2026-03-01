#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Audit "fichiers potentiellement inutilisés" orienté Python.
- Analyse statique des imports Python (AST)
- Graphe d'atteignabilité depuis entrypoints
- Scan des références textuelles (assets/configs) par chemins/noms
Aucun changement du repo: lecture seule.

Usage:
  python audit_unused.py --root . --out report.json
"""

from __future__ import annotations

import argparse
import ast
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set, Tuple

# -----------------------------
# Gitignore support (optionnel)
# -----------------------------
def load_gitignore_spec(root: Path):
    """
    Charge .gitignore via pathspec si dispo.
    Retourne une fonction ignore(path: Path)->bool
    """
    gitignore = root / ".gitignore"
    patterns = []
    if gitignore.exists():
        patterns = gitignore.read_text(encoding="utf-8", errors="ignore").splitlines()

    try:
        import pathspec  # type: ignore

        spec = pathspec.PathSpec.from_lines("gitwildmatch", patterns)

        def is_ignored(p: Path) -> bool:
            rel = str(p.relative_to(root)).replace("\\", "/")
            return spec.match_file(rel)

        return is_ignored
    except Exception:
        # Fallback minimal : ignore .git + venv + caches (réglable)
        default_ignores = {
            ".git",
            ".venv",
            "venv",
            "__pycache__",
            ".mypy_cache",
            ".pytest_cache",
            ".ruff_cache",
            "node_modules",
            "dist",
            "build",
        }

        def is_ignored(p: Path) -> bool:
            parts = set(p.parts)
            return any(x in parts for x in default_ignores)

        return is_ignored


# -----------------------------
# Data structures
# -----------------------------
@dataclass(frozen=True)
class PyFileInfo:
    path: Path
    module: str  # module dotted name best-effort
    imports: Set[str]  # imported module names best-effort
    dynamic_import_hints: List[str]


# -----------------------------
# Helpers: project discovery
# -----------------------------
def iter_files(root: Path, is_ignored) -> Iterable[Path]:
    for p in root.rglob("*"):
        if p.is_dir():
            continue
        if is_ignored(p):
            continue
        yield p


def compute_module_name(root: Path, py_path: Path) -> str:
    """
    Best-effort conversion path -> dotted module name.
    Handles packages (folders with __init__.py) partially.
    """
    rel = py_path.relative_to(root)
    parts = list(rel.parts)

    # drop extension
    if parts[-1].endswith(".py"):
        parts[-1] = parts[-1][:-3]

    # remove ".__init__"
    if parts[-1] == "__init__":
        parts = parts[:-1]

    return ".".join(parts)


def detect_entrypoints(root: Path, py_files: List[Path]) -> List[Path]:
    """
    Heuristiques d'entrypoints :
    - fichiers nommés main.py, app.py, run.py, cli.py, server.py, manage.py
    - __main__.py
    - scripts/ bin/ tools/ (top-level)
    """
    names = {"main.py", "app.py", "run.py", "cli.py", "server.py", "manage.py", "__main__.py"}
    entry = []

    for p in py_files:
        if p.name in names:
            entry.append(p)
            continue
        rel = p.relative_to(root).as_posix()
        if rel.startswith(("scripts/", "bin/", "tools/")):
            entry.append(p)

    # Dédupe
    seen = set()
    out = []
    for p in entry:
        if p not in seen:
            out.append(p)
            seen.add(p)
    return out


# -----------------------------
# Parsing imports
# -----------------------------
DYN_IMPORT_PATTERNS = (
    "importlib.import_module",
    "__import__",
)

def parse_python_file(root: Path, py_path: Path) -> PyFileInfo:
    text = py_path.read_text(encoding="utf-8", errors="ignore")
    imports: Set[str] = set()
    dyn_hints: List[str] = []

    # Quick dynamic hints (string search)
    for pat in DYN_IMPORT_PATTERNS:
        if pat in text:
            dyn_hints.append(f"hint:{pat}")

    # AST parse for import statements
    try:
        tree = ast.parse(text, filename=str(py_path))
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name:
                        imports.add(alias.name)
            elif isinstance(node, ast.ImportFrom):
                # node.module can be None for "from . import x"
                if node.module:
                    imports.add(node.module)
                else:
                    imports.add(".")  # marker for relative ambiguous
    except SyntaxError:
        dyn_hints.append("hint:syntax_error_cannot_parse")

    return PyFileInfo(
        path=py_path,
        module=compute_module_name(root, py_path),
        imports=imports,
        dynamic_import_hints=dyn_hints,
    )


def build_module_index(py_infos: List[PyFileInfo]) -> Dict[str, Path]:
    """
    module_name -> file path
    Note: best-effort; multiple files could map to same module in weird layouts.
    """
    idx: Dict[str, Path] = {}
    for info in py_infos:
        if info.module:
            idx.setdefault(info.module, info.path)
    return idx


def resolve_import_to_file(module_index: Dict[str, Path], imported: str) -> Optional[Path]:
    """
    Best-effort resolution:
    - try full module
    - try top-level part
    """
    if imported in module_index:
        return module_index[imported]
    top = imported.split(".")[0]
    # allow module files that match top-level
    if top in module_index:
        return module_index[top]
    return None


# -----------------------------
# Graph reachability
# -----------------------------
def reachable_from_entrypoints(
    py_infos: List[PyFileInfo],
    module_index: Dict[str, Path],
    entrypoints: List[Path],
) -> Tuple[Set[Path], List[Tuple[Path, str]]]:
    info_by_path = {i.path: i for i in py_infos}
    reachable: Set[Path] = set()
    ambiguous: List[Tuple[Path, str]] = []

    stack = list(entrypoints)
    while stack:
        cur = stack.pop()
        if cur in reachable:
            continue
        reachable.add(cur)

        info = info_by_path.get(cur)
        if not info:
            continue

        # flag dynamics
        for hint in info.dynamic_import_hints:
            ambiguous.append((cur, hint))

        for imp in info.imports:
            # ignore external libs: only resolve if points to local module
            target = resolve_import_to_file(module_index, imp)
            if target and target not in reachable:
                stack.append(target)

    return reachable, ambiguous


# -----------------------------
# Textual references for assets/config
# -----------------------------
TEXT_EXTS = {".py", ".md", ".txt", ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".html", ".jinja", ".j2"}
def build_text_corpus(root: Path, files: List[Path]) -> str:
    buf = []
    for p in files:
        if p.suffix.lower() in TEXT_EXTS:
            try:
                buf.append(p.read_text(encoding="utf-8", errors="ignore"))
            except Exception:
                continue
    return "\n".join(buf)


def asset_reference_check(root: Path, corpus: str, asset_path: Path) -> bool:
    """
    Heuristique: on cherche le chemin relatif (posix) ou le nom de fichier.
    """
    rel = asset_path.relative_to(root).as_posix()
    name = asset_path.name
    return (rel in corpus) or (name in corpus)


# -----------------------------
# Main audit
# -----------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".", help="Racine du dépôt")
    ap.add_argument("--out", default="unused_report.json", help="Fichier de sortie JSON")
    ap.add_argument("--include-assets-scan", action="store_true", help="Analyse heuristique des assets non-Python")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    is_ignored = load_gitignore_spec(root)

    all_files = list(iter_files(root, is_ignored))
    py_files = [p for p in all_files if p.suffix.lower() == ".py"]

    # Parse python files
    py_infos = [parse_python_file(root, p) for p in py_files]
    module_index = build_module_index(py_infos)

    # Detect entrypoints
    entrypoints = detect_entrypoints(root, py_files)

    # Reachability
    reachable, ambiguous = reachable_from_entrypoints(py_infos, module_index, entrypoints)

    # Unused candidates: python files not reachable AND not imported by any other local file
    imported_targets: Set[Path] = set()
    for info in py_infos:
        for imp in info.imports:
            t = resolve_import_to_file(module_index, imp)
            if t:
                imported_targets.add(t)

    unused_high_confidence = []
    ambiguous_to_review = []

    for info in py_infos:
        if info.path in reachable:
            continue

        # If never imported by anyone and not an entrypoint -> stronger
        if info.path not in imported_targets and info.path not in entrypoints and not info.dynamic_import_hints:
            unused_high_confidence.append({
                "path": str(info.path.relative_to(root).as_posix()),
                "type": "python",
                "reason": "non atteignable depuis entrypoints + non importé par un module local",
                "evidence": {
                    "reachable": False,
                    "imported_by_local": False,
                    "entrypoint": False,
                    "dynamic_hints": [],
                },
            })
        else:
            ambiguous_to_review.append({
                "path": str(info.path.relative_to(root).as_posix()),
                "type": "python",
                "reason": "non atteignable mais import possible/usage implicite/dynamique",
                "evidence": {
                    "reachable": False,
                    "imported_by_local": info.path in imported_targets,
                    "entrypoint": info.path in entrypoints,
                    "dynamic_hints": info.dynamic_import_hints,
                },
            })

    # Optional: assets scan
    unused_assets_candidates = []
    if args.include_assets_scan:
        corpus = build_text_corpus(root, all_files)
        non_py = [p for p in all_files if p.suffix.lower() != ".py"]

        for p in non_py:
            # ignore typical always-needed repo files
            if p.name in {"README.md", "LICENSE"}:
                continue
            referenced = asset_reference_check(root, corpus, p)
            if not referenced:
                unused_assets_candidates.append({
                    "path": str(p.relative_to(root).as_posix()),
                    "type": "asset_or_config",
                    "reason": "aucune référence textuelle trouvée (heuristique)",
                    "evidence": {
                        "searched_by": ["relative_path", "filename"],
                        "note": "peut être référencé dynamiquement ou par convention",
                    },
                })

    report = {
        "root": str(root),
        "counts": {
            "files_total": len(all_files),
            "python_files": len(py_files),
            "entrypoints_detected": len(entrypoints),
            "unused_high_confidence": len(unused_high_confidence),
            "ambiguous_to_review": len(ambiguous_to_review),
            "unused_assets_candidates": len(unused_assets_candidates),
        },
        "entrypoints": [str(p.relative_to(root).as_posix()) for p in entrypoints],
        "unused_high_confidence": unused_high_confidence,
        "ambiguous_to_review": ambiguous_to_review,
        "unused_assets_candidates": unused_assets_candidates,
        "ambiguous_import_hints": [
            {"path": str(p.relative_to(root).as_posix()), "hint": hint} for p, hint in ambiguous
        ],
    }

    out = Path(args.out).resolve()
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Report written to: {out}")

if __name__ == "__main__":
    main()