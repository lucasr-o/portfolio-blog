# Proposal

## Why

O portfólio já exporta páginas estáticas, mas o blog ainda depende de objetos JavaScript locais e não tem fluxo de publicação. Lucas precisa escrever Markdown pelo navegador e publicar alterações do frontend por Git, mantendo o site disponível independentemente do Raspberry Pi e com custo mínimo.

## What Changes

- Publicar o site existente em `https://lucas-reis.com`, com CloudFront, S3 privado e OAC. Preservar a exportação estática por rota, SEO e navegação React; não substituir isso por um fallback genérico para a home.
- Preparar um novo repositório público, com nome proposto `lucasr-o/portfolio-blog`, e publicação automática da `main` após testes. A disponibilidade do nome será verificada na implementação.
- Separar o site público do aplicativo administrativo Keystatic, hospedado em um serviço ARM64 isolado no Raspberry Pi, acessível por Cloudflare Tunnel em `<hexadecimal>.lucas-reis.com`.
- Proteger todo o painel e suas prévias com HTTP Basic Auth sobre HTTPS, mantendo a autenticação GitHub exigida pelo modo GitHub do Keystatic.
- Oferecer edição de Markdown puro no navegador, imagens, prévia após salvar, rascunhos e agendamento. O corpo Markdown será inicialmente um campo de texto em registros YAML, sem exigir um editor visual ou um plugin experimental.
- Manter o artigo placeholder atual, migrando-o para o novo formato e acrescentando exemplos de formatação. O CMS editará somente o blog, inicialmente em inglês.
- Selecionar posts publicáveis de forma única para home, índice, rotas e sitemap. Rascunhos e agendados poderão ser lidos no repositório público, conforme aceito por Lucas, mas não serão publicados antecipadamente no site.
- Documentar configuração manual da AWS, integração GitHub, operação do painel, corte de DNS e reversão. Terraform não faz parte deste MVP.
- **BREAKING:** substituir o contrato editorial `data/posts.js` pelo conteúdo gerenciado pelo CMS e trocar a origem canônica `.dev` por `.com`; URLs dos artigos existentes serão preservadas.

## Capabilities

### New Capabilities

- `blog-authoring`: edição Markdown no Keystatic, persistência GitHub, prévia protegida e isolamento operacional do painel.
- `static-hosting`: entrega HTTPS por CloudFront/OAC/S3, resolução de rotas, cache e independência do Raspberry Pi.
- `continuous-delivery`: validação, deploy por Git, publicação agendada e recuperação de releases.

### Modified Capabilities

- `blog-experience`: substituir a coleção limitada ao placeholder por artigos Markdown filtrados por estado editorial e data.
- `site-quality`: estabelecer `lucas-reis.com` como origem canônica e excluir conteúdo não publicado dos metadados e sitemap.

## Impact

Afeta `app/`, `data/posts.js`, `data/profile.js`, componentes de artigo, validação, testes, auditoria de bundle e documentação. Introduz aplicativo administrativo separado, conteúdo em Git, renderização segura de Markdown, workflows GitHub Actions e configuração operacional dedicada no Pi.

AWS, Cloudflare, GitHub e Raspberry Pi serão configurados apenas durante implementação autorizada. Esta change cria somente planejamento. Não altera Overleaf, seu túnel, redes, volumes ou containers; não migra automaticamente os artigos do projeto antigo. Redesign, tradução, comentários, busca, newsletter, banco de dados e ambientes de staging ficam fora do escopo.
