# Design

## Context

Ver [proposal.md](proposal.md) para motivação e escopo. Este documento descreve uma solução proposta, não infraestrutura já configurada.

Observações do projeto:

- Next.js 16.3.6, React 19.3.0, JavaScript, CSS Modules, Node 24 e pnpm 11. O `next.config.mjs` já usa `output: "export"`, `trailingSlash: true` e imagens sem otimizador em runtime.
- `data/posts.js` fornece uma coleção, ordenação e busca síncronas usadas pela home, índice, artigo, sitemap e testes. O corpo atual usa `introduction` e `sections[].paragraphs`.
- `app/blog/[slug]/page.jsx` gera as rotas em build; a home assume que existe pelo menos um post. O label de placeholder está fixo no template.
- `app/layout.jsx`, `data/profile.js` e testes SEO ainda apontam para `.dev`. O email já é `contato@lucas-reis.com`.
- Há testes Vitest/Playwright e auditoria dos client boundaries. O gerenciador de reveal, terminal macOS, logos, foto e interações atuais devem permanecer; artigos continuam sem reveal.
- A inspeção anterior do Pi encontrou ARM64, aproximadamente 2 GiB de RAM disponível e 18 GiB livres, Node 20 e um serviço antigo do portfólio. Isso é uma fotografia, não garantia de capacidade futura. Existem serviços host e containers de Overleaf que não pertencem a esta mudança.
- O repositório local ainda não tem commit inicial nem remote; os arquivos existentes são trabalho do usuário. O repositório antigo é referência, não destino de substituição.

## Goals / Non-Goals

**Goals:**

- Separar publicação pública, edição e entrega de conteúdo em limites verificáveis.
- Manter um único modelo editorial e um único renderer de artigo entre site e prévia.
- Tornar falhas de build recuperáveis, sem credenciais AWS permanentes no GitHub ou acesso de CI à rede residencial.
- Fornecer operações manuais reproduzíveis para uma única produção de baixo tráfego.

**Non-Goals:**

- Reescrever a aplicação em outra stack, migrar tudo para TypeScript/Tailwind ou redesenhar a interface.
- Expor APIs administrativas no CloudFront, rodar Node no S3 ou consultar o Pi durante a visita pública.
- Editor colaborativo, preview instantâneo de alterações ainda não salvas, edição do portfólio pelo CMS, tradução ou publicação com garantia de minuto exato.
- Serviço próprio de autenticação, banco de dados, GitHub runner no Pi ou administração global do Docker.

## Decisions

### 1. Dois aplicativos, um novo repositório

Preservar o aplicativo público nos caminhos atuais da raiz. Acrescentar `apps/cms/` como aplicativo Next/Node separado e pacotes compartilhados para contrato editorial e apresentação do artigo. O workspace terá scripts explícitos para site e CMS, sem mover o portfólio inteiro só para padronizar diretórios.

Estrutura-alvo, ainda não criada:

```text
app/, components/, public/     site atual, exportado para out/
apps/cms/                     Keystatic, autenticacao e preview Node
packages/blog-content/        esquema de dados, validacao, Markdown
packages/blog-ui/             apresentacao compartilhada do artigo
content/posts/                registros editoriais
content/media/                uploads editoriais originais
infra/cloudfront/             funcao de rotas e fixtures
ops/cms/                      compose e procedimentos isolados
scripts/                      build, entrega e recuperacao
.github/workflows/            CI/CD
```

O export público não inclui rotas Keystatic, dependências do editor, arquivos originais de conteúdo ou segredos. A documentação instalada do Next confirma que export estático não suporta cookies, POST dinâmico ou Draft Mode; esconder o painel em produção não resolve essa incompatibilidade. Separar aplicações é preferível a criar um build que alterna silenciosamente entre servidor e export.

### 2. Markdown fonte, usando mecanismos estáveis do Keystatic

Usar inicialmente um campo `fields.text({ multiline: true })`, com label claro `Markdown`, para o corpo. O usuário digita e cola a sintaxe diretamente; não precisa converter blocos visuais. Título, resumo, estado, datas, tags e imagens têm campos próprios.

Persistir cada artigo como registro YAML em `content/posts/<slug>.yaml`, com o corpo Markdown em uma string. Isso não é um arquivo `.md` com frontmatter: é uma escolha explícita de formato do MVP. O usuário não precisará editar YAML pelo painel. Não passar o campo de texto como `contentField`, pois esse recurso aceita os campos de documento suportados, não texto simples. Essa escolha evita manter um editor customizado ou uma API interna do Keystatic. [Campo de texto](https://keystatic.com/docs/fields/text), [formatos](https://keystatic.com/docs/format-options).

A sintaxe mínima é Markdown com títulos, parágrafos, listas, links, imagens, citações, tabelas, código inline e blocos cercados com linguagem. Não habilitar MDX executável, scripts, iframes ou HTML arbitrário. O parser/renderizador deverá impedir URLs executáveis e renderizar exemplos HTML como código/texto seguro. Realce de sintaxe será feito no build/servidor, sem enviar o editor ou um realçador pesado ao visitante.

Contrato editorial:

| Campo | Regra |
| --- | --- |
| slug | Único, letras minúsculas/números/hífens; preservar o slug do placeholder. Renomear um slug já publicado exige migração de URL explícita. |
| title / summary | Obrigatórios para publicação; resumo também alimenta descrição e previews. |
| author | Lucas Reis por padrão. |
| status | `draft`, `published` ou `scheduled`; novo artigo começa em `draft`. |
| publishedAt | Instante ISO 8601 com fuso explícito, obrigatório fora de draft. UI e prévia explicam o horário em `America/Sao_Paulo`; armazenamento normalizado em UTC. |
| updatedAt | Instante válido para atualização editorial; não substitui a data original na ordenação. |
| tags | Lista de textos curtos. |
| body | String Markdown fonte; obrigatória para publicação. |
| cover / images | Upload, alt text e referência local; capa opcional. |
| isPlaceholder | Mantém a indicação somente nos artigos demonstrativos. |

Permitir salvar rascunhos incompletos; exigir integridade de estrutura e slug mesmo nesses registros. Erros em um artigo candidato à publicação bloqueiam o deploy com caminho/campo identificável. Calcular tempo de leitura a partir do corpo, em vez de manter outro valor manual.

O placeholder atual será convertido sem alterar sua URL. Acrescentar exemplos curtos de tabela, imagem e bloco de código na demonstração. Não importar automaticamente textos do repositório antigo: ele serve como referência técnica.

### 3. Persistência e prévia sem depender de um checkout antigo no Pi

Keystatic em modo GitHub grava conteúdo e mídia no novo repositório. Para o uso individual, trabalhar inicialmente na `main`; o estado `draft` controla a publicação, não uma estratégia obrigatória de branches. O GitHub App terá acesso somente ao novo repositório. O login GitHub continua necessário além da senha HTTP. [Modo GitHub](https://keystatic.com/docs/github-mode).

No MVP, a prévia acontece **depois de salvar**: abrir a página protegida de previews, escolher o artigo e carregar o conteúdo salvo no GitHub. A prévia resolve a versão atual da `main`, usa o mesmo renderer/CSS do site e informa o commit e estado editorial exibidos. Não ler apenas arquivos embutidos na imagem do CMS, porque ficariam desatualizados após o primeiro post.

Usar autorização GitHub da sessão e permissões do repositório para buscar dados. Não aceitar URL arbitrária, repositório arbitrário ou caminho livre na API de preview; validar slug e limitar paths às coleções/mídias conhecidas. Não criar PAT permanente como atalho. Após expiração da sessão, pedir login novamente.

Preview e suas imagens ficam sob o mesmo hostname protegido, sem cache compartilhado, com `Cache-Control: private, no-store` e `X-Robots-Tag: noindex, nofollow`. Esses headers complementam, mas não substituem, autenticação. Links de navegação pública da prévia apontam para `.com`, não para rotas inexistentes do painel.

### 4. Mídia editorial independente do Pi

Uploads ficam no Git, fora de `public/` do frontend. A publicação copia somente mídias referenciadas pelos artigos publicáveis para o artefato público, gerando URLs com hash de conteúdo e dimensões conhecidas. A origem do arquivo permanece recuperável no repositório.

Oferecer upload de PNG, JPEG ou WebP com alt text e limite inicial de 5 MiB por imagem. Mostrar a referência Markdown para copiar no corpo. Rejeitar caminhos externos à coleção; não buscar imagens de URLs arbitrárias durante o build. Não alterar os SVGs confiáveis do portfólio já existentes.

O renderer resolve referências da coleção para o manifesto de mídia público ou para o endpoint protegido de preview. Assim, uma imagem recém-salva aparece na prévia antes do deploy sem tornar o site público dependente do painel.

### 5. Regra única de publicação

Capturar um único `publicationTime` UTC no início do job. Um artigo é elegível quando tem estado `published` ou `scheduled`, metadados válidos e `publishedAt <= publicationTime`. `draft` nunca é elegível. Alterar para `published` com data futura não antecipa a publicação.

Home, `/blog/`, rotas de artigo, metadados, dados estruturados, sitemap e manifesto de mídias usam exatamente o mesmo conjunto. Ordenar por `publishedAt` decrescente, com slug como desempate determinístico. Tratar coleção vazia sem falha: índice com mensagem curta e Latest Writing omitido.

Compatibilidade confirmada durante implementação em 2026-09-27: Next 16.3.6 rejeita uma lista vazia em `generateStaticParams()` com `output: export`. Após alinhamento com Lucas, a geração usará o parâmetro técnico `__empty__` somente quando não houver artigos elegíveis. Ele não é um slug editorial válido, não contém conteúdo e resolve obrigatoriamente para `notFound()`. O Next ainda emite payloads intermediários dessa rota; o script de build remove somente `out/blog/__empty__/` antes da auditoria e entrega. O export final deve conter zero arquivos dessa rota; uma auditoria bloqueia qualquer vazamento desse parâmetro em caminhos públicos. Não adicionar post fictício, entrada no sitemap ou fallback público 200 para resolver essa limitação.

As imagens com hash usam um GET estático que entrega os mesmos bytes no desenvolvimento e no export, verificando o hash contra o manifesto. A mesma limitação do Next se aplica quando não há imagens: gerar somente um parâmetro técnico que responde 404 e remover `out/media/posts/__empty__` antes da auditoria, sem publicar um asset fictício.

Quando a data de um scheduled chega, o build passa a incluí-lo; não é necessário um commit automático trocando status. Despublicar significa voltar a draft e executar novo deploy: remover também os objetos antigos de artigo/payload do prefixo público e invalidar o cache. Isso não apaga o histórico público no GitHub.

### 6. AWS manual e site estático por rota

Fluxos:

```text
Visitante --> CloudFront --> [OAC assina requisicao] --> S3 privado/site/
Lucas --> Tunnel dedicado --> proxy Basic Auth --> CMS --> GitHub
GitHub Actions --> testes/build --> S3 + invalidacao CloudFront
```

Usar S3 REST, não website endpoint; origin path `/site`, Block Public Access e ACLs desabilitadas. A política OAC concede leitura somente de `site/*` para o ARN da distribuição. Snapshots de release ficam em `releases/*` e estado de deploy em `state/*`, sem acesso pelo OAC. Usar criptografia SSE-S3; KMS não é necessário neste escopo. [OAC](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html).

Uma CloudFront Function de viewer-request normaliza as rotas e acrescenta `index.html` às URLs de página. Não alterar arquivos, query strings necessárias à navegação ou payloads estáticos exportados pelo Next. Rejeitar traversal/encodings ambíguos e manter a chave resolvida sob o prefixo público. A implementação será testada contra o `out/` real desta versão, não somente exemplos tradicionais de SPA.

Respostas de objeto inexistente usam `404.html` com status HTTP 404. Para o S3 privado sem ListBucket do leitor, ausência pode retornar 403: mapear 403 e 404 para a página 404, nunca para home/200. Como esse mapeamento pode esconder erro de OAC, o smoke test sempre verifica também uma página e um asset conhecidos.

Cache proposto, compatível com políticas gerenciadas:

- Um comportamento default com `CachingOptimized`, sem cookies ou query strings na chave. Seu TTL mínimo é um segundo: não serve para conteúdo privado, mas esta distribuição entrega somente arquivos públicos.
- Objetos mutáveis HTML, payloads Next, sitemap e robots com `Cache-Control: public, max-age=0, s-maxage=60, must-revalidate`.
- Arquivos realmente versionados por hash em `/_next/static/*` e `/media/posts/*` com um ano e `immutable`, por metadado do objeto, sem precisar de outro comportamento.
- Imagens antigas do portfólio sem hash continuam com TTL curto, não immutable. Compressão habilitada; métodos GET/HEAD. O teste de navegação confirma os payloads reais antes de considerar dispensável a query string no cache.

Não criar política customizada incompatível com o plano Free. Usar `SecurityHeadersPolicy` gerenciada; não adicionar CSP bloqueadora antes de compatibilizar os scripts inline de bootstrap/Next. [Políticas de cache](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html), [headers gerenciados](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-response-headers-policies.html).

ACM em `us-east-1`. Cloudflare continua como DNS: apex em DNS-only para CloudFront e somente o hostname do CMS passa pelo Tunnel. Não tocar MX, TXT de email nem registros Overleaf. `.dev` não pertence ao usuário; não criar redirects a partir dele. `www` não é requisito deste MVP e não será alterado automaticamente.

### 7. CI/CD e recuperação

Executar validação de conteúdo, lint, testes unitários, export, auditoria do artefato, testes de navegação/acessibilidade e verificações SEO antes de qualquer mutação pública. O job de deploy depende desses checks; jobs de teste não recebem a role AWS. Lighthouse deve cumprir o requisito existente de 90 por categoria sob perfil consistente. Fixar versões/lockfile e actions por SHA revisado.

O job de deploy usa OIDC com credenciais temporárias, restrito ao novo repositório e à `main`; não criar access key AWS. O formato exato de `sub` será inspecionado no repositório novo, pois os claims de repositórios recentes podem incluir IDs imutáveis. PRs/forks executam testes sem permissão de deploy. [OIDC AWS/GitHub](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).

Serializar deploys com uma única concurrency group, sem interromper um deploy em andamento. Antes de publicar, confirmar que o commit ainda é o HEAD da `main`; um build ultrapassado não pode substituir release mais recente. Para candidatos do mesmo commit, rejeitar também cutoff de publicação anterior ao da release ativa, evitando que um job lento esconda um agendado recém-publicado. Para rollback manual, a execução deve entrar na mesma fila e registrar a exceção deliberada.

Protocolo de entrega:

1. Gerar artefato e manifesto com commit, horário de publicação, hashes, chaves mutáveis e lista de posts.
2. Guardar snapshot em `releases/<release-id>/`, onde release-id inclui commit e execução/horário; o mesmo commit pode publicar novos agendados depois.
3. Enviar assets imutáveis antes dos documentos que os referenciam.
4. Atualizar HTML, payloads e demais objetos mutáveis com Content-Type e Cache-Control corretos. Excluir somente chaves mutáveis retiradas que constem no manifesto anterior; não usar limpeza ampla do bucket.
5. Invalidar `/*`, esperar conclusão e executar smoke tests; só então gravar `state/current-release.json` como bem-sucedido.
6. Se houver falha após mudanças públicas, reaplicar o snapshot anterior e invalidar novamente. Mesmo com restauração bem-sucedida, o job original permanece falho. Não tentar rollback quando o deploy não chegou a modificar produção.

Essa estratégia é recuperável, mas **não promete troca global atômica**: S3 e caches podem mostrar versões diferentes brevemente. Preservar bundles antigos reduz a quebra de sessões já abertas. Manter as últimas cinco releases bem-sucedidas, a release ativa e snapshots com menos de 30 dias; limpeza separada e auditável. Não configurar expiração cega que possa apagar a única release ativa durante meses sem posts.

### 8. Agendamento e alterações do painel

Um workflow verifica posts vencidos a cada 15 minutos, fora do minuto zero (`7,22,37,52`). Seu preflight confiável na `main` pode assumir a role temporária apenas para ler o manifesto em `state/`; não escreve em produção. Se o conjunto publicável não mudou desde o último deploy, não faz build, upload nem invalidação. Em alteração, usa o mesmo pipeline de release com todos os checks. Incluir execução manual para recuperação. Falha ao ler o estado não equivale a ausência de posts: reportar erro e permitir repetição manual, sem sobrescrever produção por suposição.

Cron GitHub pode atrasar e é desabilitado após 60 dias sem atividade em repositórios públicos; documentar a reativação e a conferência de execuções antes de depender de uma data agendada. Não prometer SLA, manter commits artificiais ou criar um serviço pago só para evitar essa limitação. [Eventos agendados](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

Alteração de frontend sempre publica pela pipeline pública. Quando código/configuração do CMS ou pacotes compartilhados mudarem, CI também gera imagem ARM64 versionada no GHCR. Um atualizador local dedicado verifica novas imagens aprovadas, aplica pelo digest somente o projeto Compose `portfolio-blog-cms`, testa saúde e volta ao digest anterior em falha. Conteúdo novo é lido do GitHub, não exige reconstruir essa imagem. Nenhum runner GitHub recebe acesso SSH à LAN.

### 9. Isolamento do Raspberry Pi

Usar diretório novo, por exemplo `/home/rp4/portfolio-blog-cms`, projeto Compose e rede próprios. Serviços: CMS Node 24, proxy com Basic Auth e `cloudflared` dedicado. Sem portas publicadas no host, host networking, mounts globais ou docker.sock nos containers; o Tunnel fala com o proxy pela rede própria. Não reutilizar `overleaf-cloudflared` nem editar `cloudflared.service` existente.

Build da imagem ocorre no CI. Começar com teto de memória de 768 MiB para CMS, 64 MiB para proxy e 128 MiB para Tunnel, validando os limites com carga real antes do corte. Rotacionar logs e manter poucas imagens de CMS identificadas, sem executar `docker system prune`. O atualizador host deve aceitar apenas imagem/repositório fixados, não comandos vindos de conteúdo editorial.

Basic Auth protege também API, callback OAuth, preview, imagens e assets administrativos. O proxy preserva host/esquema HTTPS corretos para OAuth, remove credenciais Basic antes de encaminhar ao aplicativo e não registra senhas, cookies ou tokens. Persistir segredos em arquivos locais de acesso restrito, fora do Git e da imagem. A primeira validação integrada testa login, callback, gravação e preview atrás do proxy.

### 10. Custos e execução manual

O guia [aws-manual.md](aws-manual.md) descreve o console e os pontos de validação. Preferência: plano CloudFront Free quando elegível; caso indisponível, analisar pay-as-you-go e benefícios da conta antes de criar a distribuição. O plano Free do produto não é o mesmo que o plano gratuito da conta AWS. Não autorizar upgrade pago automaticamente nem prometer custo total zero. [Planos CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/flat-rate-pricing-plan.html).

Não adicionar EC2, RDS, NAT Gateway, Route 53 hospedado ou logs de alto volume. S3 cobra operações e armazenamento fora dos benefícios aplicáveis; snapshots, mídia e requisições de build entram na revisão de custo. Alertas financeiros não interrompem gastos automaticamente.

## Risks / Trade-offs

- [Registro YAML em vez de arquivo `.md`] -> Edição continua sendo Markdown puro; documentar formato e validar round-trip de strings. Converter a `.md` no futuro não exige trocar o site público.
- [Dados editoriais públicos antes de publicar] -> Aceito pelo usuário; interface/documentação distinguem salvar no Git de publicar no site. Nunca armazenar segredos no corpo.
- [Pi indisponível] -> Site e imagens publicados permanecem na AWS; painel volta ao restaurar energia/rede. Publicações agendadas já salvas não dependem do Pi.
- [Preview diferente do site após mudança de renderer] -> Compartilhar código e atualizar imagem do CMS quando esses pacotes mudarem; expor versão na página de saúde.
- [Campos malformados ou conteúdo inseguro] -> Validação antes de publicar, renderer sem execução de HTML/MDX e testes reais com links/scripts hostis.
- [Cache, objetos removidos e deploy interrompido] -> Manifestos, retenção de bundles, smoke test, remoção restrita e restauração por snapshot.
- [Limitações Free/cron e mudanças de console] -> Confirmar elegibilidade no momento da execução; registrar recursos efetivos e indicar procedimento manual de recuperação.
- [Recursos compartilhados do Pi] -> Revalidar capacidade, limites dedicados e comparação de saúde dos containers Overleaf antes/depois, sem reiniciá-los.

## Migration Plan

1. Implementar e testar conteúdo/renderer e painel local, preservando todas as rotas e ajustes visuais existentes.
2. Verificar disponibilidade do novo nome, revisar arquivos/segredos antes do primeiro push, criar o repositório público e habilitar o fluxo GitHub. Não apagar nem sobrescrever o repositório antigo.
3. Validar Keystatic + GitHub + Basic Auth e preview em serviço dedicado; concluir a imagem ARM64 e o procedimento de recuperação do painel.
4. Executar as etapas manuais AWS do guia; verificar política OAC, certificado, função, cache e OIDC.
5. Publicar primeiro artefato pelo pipeline, testar a distribuição AWS tecnicamente sem criar hostname de staging e validar o novo CMS. Não alterar o apex antes disso.
6. Trocar somente o registro DNS público de `lucas-reis.com` para CloudFront, preservar os demais, e verificar HTTPS, F5 em artigo, SEO, mídia e 404 real.
7. Manter configuração anterior do portfólio disponível para reversão durante a aceitação. Desativar seu serviço antigo apenas após aceite, sem tocar Overleaf ou túnel compartilhado.
8. Ensaiar rollback e agendamento com fixture controlada; registrar evidências e instruções de operação.

Rollback público: antes do corte, nada muda para os visitantes. Depois do corte, restaurar snapshot anterior para falhas de conteúdo; para falha estrutural de migração, restaurar o registro DNS anterior e confirmar o serviço legado. Em rollback operacional manual, pausar workflows automáticos de deploy/agenda, manter o workflow de rollback separado disponível e corrigir/reverter a `main` antes de reativar a automação, para não republicar o problema. DNS e cache têm propagação, não troca instantânea. Rollback CMS usa digest anterior, mantendo segredos e conteúdo Git.

## Open Questions

Somente valores operacionais a preencher durante execução: disponibilidade de `lucasr-o/portfolio-blog`, identificadores AWS, elegibilidade do plano da conta, hostname hexadecimal gerado, credenciais novas escolhidas por Lucas e confirmação de capacidade do Pi no dia do deploy. O guia contém campos para esses valores; eles não impedem implementar o contrato definido.
