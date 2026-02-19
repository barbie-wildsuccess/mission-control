# Contributing to Mission Control

Thank you for your interest in contributing to Mission Control! 🎯

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YourUsername/mission-control-template.git
   cd mission-control-template
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up Convex**:
   ```bash
   npx convex dev
   ```
5. **Start the dev server**:
   ```bash
   npm run dev
   ```

## Making Changes

1. **Create a new branch** for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and test thoroughly

3. **Commit with a clear message**:
   ```bash
   git commit -m "Add: Feature description"
   ```

   Commit message prefixes:
   - `Add:` - New features
   - `Fix:` - Bug fixes
   - `Update:` - Updates to existing features
   - `Docs:` - Documentation changes
   - `Style:` - Code style changes (formatting, etc.)
   - `Refactor:` - Code refactoring
   - `Test:` - Adding or updating tests

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** on GitHub

## Code Style

- Use TypeScript for all code
- Follow existing code formatting (Prettier + ESLint)
- Add comments for complex logic
- Keep components small and focused
- Use Tailwind CSS for styling

## Testing

Before submitting a PR:
- [ ] Test locally with `npm run dev`
- [ ] Check for TypeScript errors: `npm run build`
- [ ] Test all affected features
- [ ] Verify no console errors in browser
- [ ] Test on mobile view (responsive design)

## Pull Request Guidelines

- **Title:** Clear, descriptive title
- **Description:** What changes you made and why
- **Screenshots:** If UI changes, include before/after screenshots
- **Testing:** Describe how you tested the changes
- **Breaking changes:** Note any breaking changes

## Reporting Bugs

Found a bug? Please open an [issue](https://github.com/YourUsername/mission-control-template/issues) with:

- **Title:** Short, descriptive title
- **Description:** What happened vs what you expected
- **Steps to reproduce:** How to recreate the bug
- **Environment:** OS, browser, Node.js version
- **Screenshots/Logs:** If applicable

## Feature Requests

Have an idea? Open an [issue](https://github.com/YourUsername/mission-control-template/issues) with:

- **Title:** Feature name
- **Problem:** What problem does this solve?
- **Solution:** Your proposed solution
- **Alternatives:** Other solutions you considered

## Questions?

- Check the [docs/](docs/) folder first
- Search [existing issues](https://github.com/YourUsername/mission-control-template/issues)
- Open a new issue with the "question" label

---

Thank you for contributing! 🚀
