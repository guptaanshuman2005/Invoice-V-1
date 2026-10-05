# Workflow & Deployment Rules

## Automatic GitHub & Vercel Updates (Mandatory)
- **Do not wait for the user to ask**: After completing any task, bug fix, feature, or code modification, **always proactively commit and push** the changes to GitHub and verify deployment.
- **Workflow**:
  1. Verify the code compiles without errors (`npx tsc --noEmit` or build check).
  2. Stage modified files (`git add <files>`).
  3. Commit with a clear, standard commit message (`git commit -m "..."`).
  4. Push directly to remote branch (`git push origin main`).
  5. Check deployment status via `vercel ls invoicepro` to ensure the Vercel production build is successful.
  6. Include the commit hash and Vercel live URL in the completion summary.

## CodeRabbit & Senior Architect Review Protocol (Mandatory)
Every code modification, feature, or refactor must pass the following internal CodeRabbit-style review before deployment:
1. **Correctness & Logic Integrity**: Check for off-by-one errors, undefined variable handling, floating-point currency issues, and state sync bugs.
2. **Security & Sanitization**: Ensure no unescaped user inputs, no leaked credentials/tokens, and safe local storage & API interactions.
3. **Performance & Re-renders**: Avoid inline object recreations in tight render loops, verify React dependency arrays, and check for bundle bloat.
4. **Ponytail / Minimal Code Principle**: Avoid installing new npm packages if native browser APIs (`fetch`, `<input type="date">`, `window.print`) or existing repository utilities (`invoiceUtils.ts`, `validation.ts`) can solve it. Write clean, direct, minimal code (YAGNI).
5. **Edge Case & Null Safety**: Ensure fallback values for empty lists, missing client records, zero tax rates, and uninitialized bank accounts.
6. **CodeRabbit Review Summary**: In completion reports, provide a structured CodeRabbit-style summary highlighting Architecture, Bug/Edge Case Mitigations, and Performance Impact.
