---
description: 
globs: 
alwaysApply: true
---
# Architectural Principles

This rule defines the core, non-negotiable architectural constraints of this project.

## 1. Primary Target: Node.js
This is a **Node.js** project. All code in the `src` directory MUST be compatible with the Node.js runtime environment and its module system (`CommonJS` or `ESM` as configured in `package.json`).

## 2. Prohibited Runtimes & APIs

### 2.1. Deno
Code that relies on the `Deno` global object or any Deno-specific APIs is **strictly prohibited**. Any such code must be refactored to use Node.js equivalents or removed if it is obsolete.

### 2.2. VS Code
Code that imports the `vscode` module or relies on the VS Code Extension API is **strictly prohibited** within this project. This codebase is not a VS Code extension. If extension-specific functionality is required, it must be developed in a separate, dedicated project.
