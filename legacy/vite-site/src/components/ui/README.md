# src/components/ui

Pasta reservada para os componentes do shadcn/ui (button, dialog, select, toast...).

O site atual NÃO depende deles — todo o visual está em `src/index.css`.

Se quiser adicioná-los (para novas features como modais, toasts etc.):

```bash
npx shadcn@latest init   # já existe components.json na raiz
npx shadcn@latest add button dialog select toast
# ou tudo de uma vez:
npx shadcn@latest add --all
```
