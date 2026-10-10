# Corte do editor português-primeiro

Este roteiro é para uma única migração supervisionada. O CMS está no Raspberry Pi, separado do site estático no CloudFront. **Não executar antes de a nova imagem ARM64, a simulação de migração e o estado de rollback terem sido conferidos.** Não executar nenhum `docker compose` sobre o projeto do Overleaf.

## Preparação sem afetar produção

1. Publicar e verificar primeiro o leitor dual-format e o novo código com `ops/cms/editor-v2-enabled` **ausente**. Nessa fase, o workflow normal continua gerando a imagem antiga do editor em `:main`.
2. No GitHub, executar manualmente **Build CMS ARM64 image** na `main` com `candidate_v2=true`. Essa execução cria uma tag `candidate-v2-...`, valida arquitetura, ausência de `.env`, variante e `/api/health`, mas **não** substitui a tag `:main` nem o CMS em uso.
3. Validar o novo editor localmente com dados migrados, incluindo novo post em português, reabertura, alteração de título sem mudar URL, imagem colada e retirada de um idioma. Conferir que o candidato corresponde à revisão atual; se arquivos do CMS mudarem depois, refazer a imagem candidata.
4. Rodar `node scripts/migration-dry-run.mjs` e revisar cada linha. CWES deve manter `2026-10-09T18:00:00.000Z` em inglês e português. O rascunho `security-reviews-that-move-at-product-speed` perde apenas datas antigas sem publicação. Nenhuma URL ou hash público pode mudar. Preservar também o manifesto S3 ativo e o digest atual do CMS para rollback.

## Janela curta do editor

1. Avisar que o editor ficará indisponível e não iniciar nenhuma edição nele. Pausar o timer **somente** `portfolio-blog-cms-update.timer` e parar apenas o serviço `tunnel` do Compose `portfolio-blog-cms`, deixando o túnel do Overleaf intacto. Confirmar que o subdomínio do CMS não dá acesso externo durante o corte.
2. Reexecutar `node scripts/migration-dry-run.mjs` e usar o `planSha256` **daquela execução**, sem novas edições, em `node scripts/migration-dry-run.mjs --apply <planSha256>`. A aplicação recusa plano alterado e guarda os YAML anteriores em `.cache/blog-migration-backup/<planSha256>/`. Criar `ops/cms/editor-v2-enabled` contendo exatamente `enabled`. Fazer **um commit** na `main` com os três YAML e o marcador, sem segredos. Esse marcador faz o workflow de imagem publicar a variante V2 em `:main` nas próximas mudanças do CMS; não removê-lo após o corte.
3. Aguardar **Publish site** e **Build CMS ARM64 image** dessa revisão. Se qualquer um falhar, manter o túnel do CMS parado e investigar. A release do site não deve publicar rascunhos nem alterar as URLs existentes.
4. Com a nova imagem `:main` validada, iniciar/confirmar a saúde do serviço `cms` no Compose dedicado e executar o atualizador do CMS uma vez, verificando que ele escolheu o digest V2. Só então iniciar novamente o serviço `tunnel` dedicado. Retomar o timer de atualização **apenas se ele existia e estava ativo antes do corte**; não instalar um timer novo como parte desta migração.
5. Entrar pelo subdomínio hexadecimal com HTTP Auth + GitHub. Reabrir CWES, confirmar português e inglês, salvar um rascunho sem publicação e testar a prévia salva. Conferir `/`, `/blog/`, `/blog/review-cwes/`, `/pt/blog/review-cwes/`, busca, sitemap, imagens e 404 no domínio público. Registrar os digests/commits finais.

## Reversão

- **Antes do commit de migração:** restaurar apenas o digest antigo do CMS dedicado e reabrir seu túnel/timer. O formato antigo ainda está íntegro.
- **Após o commit, antes de qualquer novo save no formato V2:** preferir corrigir o novo editor; se for necessário voltar o conteúdo, recuperar os arquivos YAML exatos do commit anterior em uma mudança revisada e conferir o manifesto do site antes de reabrir o editor antigo.
- **Após um save V2:** **não** voltar ao editor inglês-primeiro. Manter o túnel do CMS parado e reparar o editor V2, ou usar outra imagem que leia `editorial`. Para falha do site, usar o snapshot de S3/CloudFront existente; isso não modifica o conteúdo no GitHub.

Não expor o token do Tunnel, `.env`, senha HTTP ou credenciais em logs, commits ou comandos compartilhados.

## Registro do corte de 9–10/10/2026

- Migração aplicada com plano SHA-256 `fe192cc2a9df523648f0cb35b5c8a1bd6236be6cceff77810c50dbe70270224c` e publicada no commit `3e1a8c2c854c76cb602b9c53f9778192f23f8543`. A comparação antes/depois manteve rotas, conteúdo público, busca e mídia; CWES reteve sua data aprovada em ambos os idiomas.
- Workflows da revisão: **Publish site** `37995190622` e **Build CMS ARM64 image** `37995190562`, ambos concluídos com sucesso. A imagem `:main` verificada é ARM64, tem marcador V2 e aponta para o mesmo commit.
- O atualizador dedicado trocou `sha256:894284f4eef261e0e9a0e596ffa6f6e02bb7caf2ffa2cc5723f915c77ce45296` por `sha256:f19e0648f0196a6f12e88f705449b72d91f48069e6d732017efd2f6512361263`; o CMS e o proxy ficaram saudáveis. O túnel dedicado foi reaberto após essa verificação. Sem autenticação, seu hostname retorna HTTP 401.
- O unit `portfolio-blog-cms-update.timer` estava `not-found` e `inactive` antes e depois; nenhum timer foi instalado ou ativado. Nenhum serviço do Overleaf foi alterado.
- Verificação pública inicial: home, índices EN/PT, artigo CWES EN/PT, busca EN/PT, sitemap, imagem e 404 responderam com status e tipos adequados. Lucas confirmou no navegador autenticado que o editor V2 abre, exibe português primeiro, preserva o inglês de CWES e mostra a prévia protegida do rascunho salvo.
- O Keystatic fixado serializa o campo `editorial` e os arquivos externos na mesma lista de adições e envia **uma** mutação GitHub `createCommitOnBranch` por Save. Em teste isolado do editor V2, o slug de um registro antigo em inglês permaneceu estável, a imagem e o Markdown reapareceram após salvar, e uma falha simulada manteve o trabalho para nova tentativa.
- Teste móvel de mídia animada: fixture de 640×360, 12 quadros; com movimento reduzido, o HTML e o navegador carregaram primeiro somente o poster de 9.985 bytes. Nenhuma transferência ou decodificação do GIF ocorreu antes de Play. Depois do acionamento explícito, o GIF de 27.897 bytes carregou uma vez; pausa voltou ao poster sem deslocamento mensurável. Os limites de entrada continuam em 5 MiB, 120 quadros e 24 milhões de pixels decodificados.
