---
description: 
globs: 
alwaysApply: true
---
# Debugging and Triage Strategy

This rule defines the systematic approach for tackling a large number of build and linter errors.

## 1. Triage Errors First
When facing numerous errors, the first step is to categorize them. This provides a clear picture of the problems. Common categories include:
- **Configuration Errors:** Issues in `tsconfig.json`, `package.json`, etc.
- **Import/Module Resolution Errors:** The compiler cannot find a module or its types.
- **Type-Checking Errors:** Type mismatches, missing properties, etc. (`TS2339`, `TS2345`).

## 2. Fix Foundational Errors First
Always resolve errors in the following order of priority:
1.  **Configuration Errors**
2.  **Import/Module Resolution Errors**
3.  **Type-Checking Errors**

Fixing foundational issues first often resolves dozens of subsequent type-checking errors automatically.

## 3. Work One Category at a Time
Address all errors of a single, high-priority category before moving to the next. Do not mix fixing type errors with fixing import errors.

## 4. Re-run Build Frequently
After fixing a small batch of errors (5-10), re-run the `npm run build` command. This provides quick feedback, ensures no new issues were introduced, and updates the list of remaining errors.
