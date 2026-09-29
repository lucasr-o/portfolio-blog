# Tasks

A implementação está em andamento; evidências estão em `implementation-log.md`. Etapas externas exigem os acessos/valores reais indicados no guia; não marcar provisionamento como concluído apenas porque seus arquivos foram escritos. Não alterar recursos Overleaf em nenhuma etapa.

## 1. Preparar o workspace e o novo repositório

- [x] 1.1 Registrar baseline do frontend atual e dos comandos documentados, executando lint, testes, build e E2E; separar falhas preexistentes antes de modificar a aplicação.
- [x] 1.2 Verificar a disponibilidade de `lucasr-o/portfolio-blog`, revisar segredos/arquivos locais e preparar o primeiro commit preservando o trabalho existente; verificar a lista de arquivos destinados ao repositório público antes do push e não alterar o repositório antigo.
- [x] 1.3 Adicionar `apps/cms` e pacotes compartilhados ao workspace, mantendo o aplicativo público na raiz; verificar instalação pelo lockfile e builds separados sem rotas CMS no export público.
- [x] 1.4 Documentar os comandos locais de site e painel e a divisão do workspace; validar que os comandos documentados iniciam cada aplicação nas portas locais previstas sem conflito.

## 2. Contrato editorial e conteúdo

- [x] 2.1 Implementar modelo e leitura dos registros YAML com Markdown fonte, estados, datas e campos de mídia; testar round-trip do texto, slug inválido/duplicado, rascunho incompleto e erro de publicação com mensagem por campo.
- [x] 2.2 Implementar a seleção publicável com um cutoff UTC injetável; testar draft, published/futuro, scheduled antes/no instante/depois, fuso São Paulo, empate de datas e coleção vazia usando o seletor real.
- [x] 2.3 Converter o placeholder atual preservando slug, autor e conteúdo, e incluir amostras de Markdown; verificar equivalência dos dados anteriores e que o marcador placeholder não é imposto a todos os posts.
- [x] 2.4 Implementar validação e manifesto de mídia com hashes e dimensões, incluindo limite de 5 MiB, alt text e caminhos permitidos; testar imagem inválida, traversal e exclusão de mídia pertencente somente a drafts do artefato público.
- [x] 2.5 Documentar o formato YAML/corpo Markdown, fuso, campos obrigatórios e semântica de salvar/publicar; validar os exemplos pelo mesmo validador de conteúdo usado no build.

## 3. Integrar conteúdo ao site sem regressões

- [x] 3.1 Implementar renderer compartilhado de Markdown e estilos de código, tabelas e imagens; testar semântica, links inseguros, scripts/HTML hostil, texto alternativo e legibilidade em 320 px sem scroll horizontal da página.
- [x] 3.2 Substituir `data/posts.js` nos consumidores por uma coleção publicável única para home, índice, artigo, parâmetros estáticos e sitemap; testar destaque mais recente, vazio e ausência de rotas/payloads de drafts e agendados futuros no export.
- [x] 3.3 Atualizar origem canônica, metadados, JSON-LD e documentação pública para `lucas-reis.com`; verificar HTML inicial, sitemap e testes SEO sem referências canônicas `.dev` e sem depender de JavaScript do visitante.
- [x] 3.4 Preservar topo, contato, perfil, terminal macOS, reveal ao scroll e ausência de reveal nos artigos; executar testes E2E existentes, incluindo retorno do logo ao topo e ausência de flash sharp-to-blur antes da hidratação.
- [x] 3.5 Adaptar auditoria de bundle aos limites site/CMS e conferir o `out/` inteiro; falhar se incluir dependências do painel, segredos, registros brutos ou corpo de posts não publicáveis, mantendo as verificações de acessibilidade e Lighthouse exigidas.

## 4. Implementar painel e preview

- [x] 4.1 Integrar Keystatic em `apps/cms` com apenas a coleção de blog e campo multiline para Markdown fonte; verificar no navegador digitar, colar, salvar e reabrir sintaxe sem conversão em blocos visuais.
- [x] 4.2 Configurar GitHub storage e GitHub App limitado ao novo repositório, com segredos fora do Git; verificar login, gravação real na `main`, expiração de sessão e falha de save sem confirmação falsa.
- [x] 4.3 Adicionar upload/lista de imagens e referências Markdown copiáveis; verificar arquivo salvo no Git, erro de limite/formato e preview de imagem ainda não publicada.
- [x] 4.4 Implementar índice e rota protegida de preview após salvar, lendo a revisão GitHub atual e usando apresentação compartilhada; verificar que um novo draft aparece sem rebuild do CMS e que slug/path/repositório arbitrários são rejeitados.
- [ ] 4.5 Integrar HTTP Basic Auth ao proxy, proteger todo o hostname e definir no-store/noindex para respostas administrativas; testar desafios sem credenciais em página/API/assets/preview e o ciclo login GitHub → callback → save atrás do proxy HTTPS.
- [x] 4.6 Documentar acesso, Markdown, imagens, rascunhos públicos, preview após salvar e recuperação de sessão; validar o roteiro no navegador com um artigo demonstrativo sem publicá-lo acidentalmente.

## 5. Entrega estática e automação pública

- [x] 5.1 Implementar a CloudFront Function planejada com fixtures do export real; testar `/`, rotas com/sem barra, assets, queries e payloads Next, erro 404 e resistência a traversal/URI malformada.
- [x] 5.2 Implementar geração de manifesto, snapshot de release e upload ordenado com metadados corretos; testar planejamento de chaves, inclusão de assets antes de documentos e ausência de operações fora dos prefixos do projeto.
- [x] 5.3 Implementar retirada de objetos mutáveis por manifesto, invalidação e smoke tests, incluindo restore em falha; simular erro após cada fase e verificar recuperação de snapshot anterior sem apagar bundles retidos.
- [x] 5.4 Criar workflows de PR/main com dependências fixadas, checks antes de mutações, OIDC, concorrência e rejeição de candidato obsoleto por commit/cutoff; testar jobs do mesmo commit com datas diferentes e ausência de credenciais de deploy em PR/fork.
- [x] 5.5 Criar agendamento, preflight de comparação com o estado publicado e execução manual; testar relógio controlado, check sem mudança sem build/upload/invalidation, falha de leitura de estado e scheduled vencido usando o fluxo normal.
- [x] 5.6 Implementar rollback manual separado e retenção por manifestos; verificar que release ativa/últimas cinco/recentes sobrevivem à limpeza, que restauração usa o artefato original e que o roteiro permite pausar automações sem desabilitar o rollback.
- [x] 5.7 Atualizar o roteiro AWS e documentação de publicação com nomes reais dos workflows/scripts, permissões efetivamente usadas e diagnóstico de cron inativo; conferir cada referência e executar os procedimentos de simulação local.

## 6. Empacotar e operar o CMS no Raspberry Pi

- [x] 6.1 Criar imagem ARM64 de produção e workflow GHCR somente para código CMS/compartilhado, sem embutir segredos; verificar digest, arquitetura, build reproduzível e saúde da imagem.
- [x] 6.2 Criar configuração Compose isolada para CMS, proxy e Tunnel, sem portas host nem docker.sock; validar a configuração, limites de memória, rede própria, logs limitados e referência exclusiva a recursos `portfolio-blog-cms`.
- [x] 6.3 Implementar atualizador dedicado que aplica somente imagens aprovadas do repositório fixo por digest e restaura o digest anterior em falha; testar atualização saudável, imagem quebrada, erro de rede e nenhuma operação em outros projetos.
- [x] 6.4 Documentar instalação, segredos, atualização, health check e recuperação do painel; verificar que o procedimento não inclui comandos Docker globais, reutilização do tunnel Overleaf ou substituição do Node host.

## 7. Provisionar AWS e conectar GitHub

- [ ] 7.1 Com Lucas, preencher os valores operacionais do guia e confirmar elegibilidade/custos da conta, região, notificações e plano CloudFront; registrar a escolha sem contratar upgrade pago automaticamente.
- [ ] 7.2 Configurar manualmente bucket, certificado, distribuição/OAC, política, função, cache e 404 seguindo `aws-manual.md`; verificar no console configurações efetivas, Block Public Access e limite de leitura `site/*` antes de alterar DNS.
- [ ] 7.3 Criar/verificar provedor OIDC, identificar o subject real da `main` e aplicar role/policies restritas; testar autenticação do job autorizado e rejeição de branch não autorizada sem gerar access key permanente.
- [ ] 7.4 Cadastrar variáveis do repositório, publicar o primeiro artefato pelo pipeline e preencher IDs no registro operacional; validar domínio técnico CloudFront, URL inexistente, snapshot privado e acesso direto S3 negado.

## 8. Ativar o painel e fazer o corte controlado

- [x] 8.1 Revalidar memória/disco e registrar estado dos serviços existentes no Pi; criar somente diretório/rede/serviços dedicados, Tunnel novo, hostname hexadecimal e credenciais do CMS, verificando que o Overleaf mantém configuração e saúde.
- [ ] 8.2 Validar no hostname final o fluxo HTTP Auth → GitHub → Markdown → save → preview → publicação, incluindo upload e erro de autenticação; registrar commit e versão de painel, sem compartilhar tokens em evidências.
- [ ] 8.3 Registrar DNS anterior e trocar somente o apex para CloudFront em DNS-only; verificar HTTPS, F5, navegação, assets, SEO, 404 e preservação de email/Overleaf conforme a matriz do guia.
- [ ] 8.4 Ensaiar publicação agendada, despublicação e rollback de release, além da independência do site em relação ao CMS; verificar coleção/sitemap/cache coerentes e os resultados dos smoke tests após recuperação.
- [ ] 8.5 Entregar registro dos recursos reais, custos observados e instruções operacionais verificadas; obter aceite antes de desativar somente o serviço legado do portfólio, mantendo Overleaf e sua infraestrutura intactos.
