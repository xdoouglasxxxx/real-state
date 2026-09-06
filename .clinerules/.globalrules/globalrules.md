# GLOBAL RULES — DIRETRIZES GERAIS DO USUÁRIO

## 1. IDIOMA E COMUNICAÇÃO
- Responda e documente sempre em Português do Brasil (pt-BR).
- Seja objetivo, prático e direto ao ponto. Evite preâmbulos longos, saudações repetitivas e explicações teóricas genéricas.
- Ao apresentar alterações de código, mostre o trecho exato modificado e indique claramente o arquivo e local da aplicação.

## 2. AMBIENTE DE EXECUÇÃO (WINDOWS & POWERSHELL)
- O ambiente de desenvolvimento é **Windows** rodando **PowerShell**.
- **NUNCA** utilize `&&` para encadear comandos no terminal. O PowerShell não aceita essa sintaxe; utilize `;` para separar comandos sequenciais.
- **NUNCA** execute comandos nativos do Bash/Linux no terminal, como `ls -la`, `cat`, `rm -rf` ou `touch`. Utilize os equivalentes do PowerShell (`dir`, `type`, `del`, `New-Item`) ou dê preferência às ferramentas internas do Cline para ler/escrever arquivos.
- Preste atenção a caminhos de arquivos que contêm espaços ou caracteres especiais no Windows.

## 3. PADRÕES DE CÓDIGO E ENGENHARIA
- Utilize **TypeScript** com tipagem estrita. Evite `any` e prefira `unknown` acompanhado de validação do tipo (narrowing).
- Tipagem do TypeScript não substitui validação em runtime: valide dados de formulários, APIs e URLs com parse explícito (`String(formData.get(...) ?? "")`, helpers em `src/lib/validators.ts`). O projeto NÃO usa Zod — não o adicione sem aprovação.
- Prefira funções pequenas, modulares e focadas em uma única responsabilidade.
- Siga padrões modernos de ES6+, mantendo o código limpo, sem variáveis não utilizadas ou código morto.

## 4. SEGURANÇA E BOAS PRÁTICAS
- Nunca insira chaves de API, senhas, tokens de acesso ou segredos diretamente no código-fonte. Mantenha essas informações em arquivos `.env`.
- Nunca proponha reduções nas regras de segurança (como desabilitar RLS, ignorar autenticação ou remover validações de permissão/tenant) para contornar erros ou fazer testes passarem.

## 5. POSTURA E TRABALHO DA IA
- **Inspecione antes de alterar:** Sempre leia o arquivo existente e entenda o estilo do projeto antes de propor modificações.
- **Não suprima erros:** Trate exceções de forma explícita e nunca use blocos `try/catch` vazios para esconder falhas (atenção: `redirect()` do Next lança exceção — relance com `rethrowRedirect`).
- **Validação contínua:** Rode `npx tsc --noEmit` e as validações relevantes após modificações significativas; nunca declare validação que não foi executada.
