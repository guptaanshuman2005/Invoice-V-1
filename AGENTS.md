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
