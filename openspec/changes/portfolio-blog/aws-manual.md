# portfolio-blog — roteiro manual de produção

Documento de planejamento revisado em 27/09/2026. **Nenhum recurso foi criado por este guia.** Executar somente na fase de implementação autorizada. Nomes de telas podem mudar; quando houver divergência, conferir o valor efetivo, não aceitar opções pagas por semelhança de nome.

O site será estático no S3/CloudFront. O painel ficará no Raspberry Pi. OAC é a autorização entre CloudFront e S3, não outro servidor. A AWS não hospedará o Keystatic.

## 0. Preparação e valores a preencher

Ter acesso à conta AWS, à zona Cloudflare `lucas-reis.com` e ao GitHub `lucasr-o`. Usar MFA e uma identidade administrativa adequada para o setup; não criar chaves permanentes da conta root ou colocá-las no GitHub.

| Nome usado no guia | Preencher durante implementação |
| --- | --- |
| `ACCOUNT_ID` | ID de 12 dígitos da conta AWS |
| `BUCKET` | Nome único proposto: `portfolio-blog-prod-<account-id>-<sufixo>` |
| `AWS_REGION` | `us-east-1`, padrão proposto para o bucket |
| `DISTRIBUTION_ID` | ID retornado ao criar CloudFront |
| `DISTRIBUTION_DOMAIN` | Nome `d....cloudfront.net`, sem `https://` |
| `CERTIFICATE_ARN` | ARN do certificado ACM em `us-east-1` |
| `DEPLOY_ROLE_ARN` | ARN da role criada na etapa 7 |
| `GITHUB_REPOSITORY` | `lucasr-o/portfolio-blog`, após verificar disponibilidade |
| `GITHUB_OIDC_SUB` | Claim exato do workflow aprovado da `main` |
| `CMS_HOSTNAME` | Subdomínio hexadecimal aleatório de `lucas-reis.com` |
| `DNS_ANTERIOR` | Tipo, valor e estado de proxy do registro atual do apex |

Não publicar senha HTTP, token do Tunnel, client secret GitHub, cookies ou tokens de sessão. IDs e ARNs não substituem autenticação, mas devem ser preenchidos conscientemente nos exemplos.

Pré-requisitos que a implementação ainda entregará:

- Fonte da CloudFront Function em `infra/cloudfront/viewer-request.js` e testes de rotas.
- Workflows de validação, deploy, rollback, agenda e imagem CMS.
- Scripts de publicação por manifesto e recuperação de release.
- Aplicativo CMS, imagem ARM64 e configuração operacional isolada.

As etapas que dependem desses arquivos não podem ser concluídas usando apenas esta proposta. Não improvisar `sync --delete` na raiz do bucket para substituí-los.

## 1. Conferir cobrança antes de criar a distribuição

1. Entrar em **Billing and Cost Management** e conferir plano da conta, créditos, validade e benefícios ativos. Anotar o resultado; não assumir que a conta é nova.
2. Comparar o plano CloudFront **Free** com a modalidade pay-as-you-go disponível para essa conta. A oferta consultada apresenta Free a US$ 0/mês, 1 milhão de requisições, 100 GB de transferência e créditos de 5 GB de S3 Standard. Isso não elimina todas as possíveis cobranças do S3. [Preços CloudFront](https://aws.amazon.com/cloudfront/pricing/).
3. Se Free não estiver disponível, verificar a elegibilidade: a documentação lista restrições para contas usando AWS Free Tier. **Não mudar o plano da conta ou selecionar Pro automaticamente.** Registrar o custo/benefício da alternativa e decidir antes da criação. [Restrições dos planos](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/flat-rate-pricing-plan.html#flat-rate-pricing-plan-unsupported-features).
4. Não selecionar logs em tempo real, Origin Shield, Lambda@Edge, recursos WAF pagos extras ou outros serviços sem necessidade. No plano Free, manter apenas a proteção incluída e exigida pelo próprio plano; no pay-as-you-go, WAF separado pode gerar cobrança.
5. Em **Billing → Budgets → Create budget**, usar o modelo de alerta de gasto zero, se disponível, e informar um email que Lucas acompanhe. Opcionalmente criar orçamento mensal baixo, por exemplo US$ 1, como aviso, não autorização de gasto. Não ativar ações automáticas de bloqueio nesta migração. [AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-create.html).
6. Após o primeiro deploy, revisar custos de armazenamento, PUT/GET/LIST, snapshots e demais serviços. Alerta financeiro não é limite rígido e pode chegar após o consumo. [Cobrança S3](https://aws.amazon.com/s3/pricing/).

**Verificação:** escolha registrada, nenhum plano pago contratado inadvertidamente e destinatário dos alertas correto.

## 2. Criar o bucket privado

1. Abrir **S3 → Buckets → Create bucket**.
2. Escolher **General purpose** e região **US East (N. Virginia) — us-east-1**.
3. Informar `BUCKET`. O nome não precisa ser igual ao domínio. Se estiver ocupado, mudar somente o sufixo e atualizar a tabela.
4. Em **Object Ownership**, manter **ACLs disabled / Bucket owner enforced**.
5. Em **Block Public Access**, manter as quatro opções habilitadas.
6. Manter criptografia padrão **SSE-S3**. Não escolher chave KMS customizada para este MVP.
7. Não habilitar Object Lock ou versionamento por padrão: a recuperação planejada usa snapshots explícitos de release. Isso não autoriza desabilitar versionamento em buckets existentes; este é um bucket novo e dedicado.
8. Adicionar tags `Project=portfolio-blog` e `Environment=production` e criar.
9. Em **Properties**, conferir que **Static website hosting** continua **Disabled**.
10. Em **Permissions**, conferir que o bucket não está público. Não alterar CORS: site e mídia usam a mesma origem pública.

Fonte: [criação de bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html), [bloqueio de acesso público](https://docs.aws.amazon.com/AmazonS3/latest/userguide/configuring-block-public-access-bucket.html).

Prefixos que a pipeline usará, sem necessidade de criar pastas vazias no console:

| Prefixo | Finalidade | Leitura por visitante |
| --- | --- | --- |
| `site/` | Conteúdo servido pelo CloudFront | Sim, apenas via CDN |
| `releases/<id>/` | Snapshot e manifesto de uma release | Não |
| `state/` | Registro da última release bem-sucedida | Não |

**Verificação:** bucket privado, região anotada e endpoint de website desabilitado.

## 3. Emitir certificado HTTPS

1. Trocar a região do console para **us-east-1** e abrir **Certificate Manager (ACM)**. CloudFront requer o certificado nessa região. [Requisito regional](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html).
2. Escolher **Request → Request a public certificate**.
3. Informar apenas `lucas-reis.com`. `www` fica fora deste corte; não criar wildcard nem alterar seus registros como efeito colateral.
4. Manter exportação de chave desabilitada. Selecionar **DNS validation** e RSA 2048.
5. Solicitar, abrir o certificado e copiar o par **CNAME name / CNAME value** fornecido. [Solicitação ACM](https://docs.aws.amazon.com/acm/latest/userguide/acm-public-certificates.html).
6. Em **Cloudflare → lucas-reis.com → DNS → Records → Add record**, criar esse CNAME, com **DNS only**. Conferir que o nome não ficou com `.lucas-reis.com` duplicado.
7. Não substituir o registro do site nesta etapa. Não remover MX, SPF, DKIM, DMARC, Tunnel ou registros de outros projetos.
8. Voltar ao ACM e aguardar **Issued**. Guardar `CERTIFICATE_ARN`. Manter o CNAME de validação para renovação. [Validação DNS](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html).

**Verificação:** certificado emitido para `.com`, na região correta, sem alteração do tráfego atual.

## 4. Criar CloudFront com OAC

1. Abrir **CloudFront → Distributions → Create distribution**. Usar distribuição padrão para um único site, não multi-tenant.
2. Dar nome/descrição `portfolio-blog-production` e selecionar o plano validado na etapa 1.
3. Em origem, escolher o bucket S3 criado, usando seu endpoint REST regional. Não usar endereço `s3-website...`.
4. Definir **Origin path** como `/site`, sem barra final.
5. Em acesso à origem, escolher **Origin access control settings (recommended)** e criar `portfolio-blog-oac`, tipo S3, **Sign requests (recommended)**.
6. Em viewer protocol, selecionar **Redirect HTTP to HTTPS**. Métodos permitidos: **GET, HEAD**. Compressão: habilitada.
7. Cache policy: **CachingOptimized** gerenciada. Origin request policy: nenhuma. Não encaminhar o header Host do visitante ao S3 usando políticas extras.
8. Response headers policy: **SecurityHeadersPolicy** gerenciada. Não habilitar CORS aberto ou uma CSP customizada que quebre o bootstrap do Next.
9. Definir **Default root object** como `index.html`, sem `/` inicial.
10. Adicionar alternate domain name `lucas-reis.com` e selecionar o certificado ACM emitido. Usar SNI, não IP dedicado. Selecionar política TLS com mínimo TLS 1.2 ou superior compatível com os navegadores atendidos.
11. Não ativar logs adicionais neste primeiro setup. No plano Free, não remover a Web ACL exigida pelo plano; também não adicionar produtos pagos de segurança fora do pacote.
12. Criar a distribuição. Guardar ID, ARN e domínio `d....cloudfront.net`. Se alguns ajustes não aparecerem no assistente, aplicá-los nas abas **Origins**, **Behaviors** e **Settings** depois da criação.

Em **S3 → BUCKET → Permissions → Bucket policy → Edit**, aplicar a política abaixo substituindo TODOS os campos. Ela limita o OAC a `site/*`; não conceder leitura a todo o bucket só porque o exemplo automático do console sugere `/*`.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadPublicSiteFromThisDistribution",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET/site/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    },
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": ["arn:aws:s3:::BUCKET", "arn:aws:s3:::BUCKET/*"],
      "Condition": { "Bool": { "aws:SecureTransport": "false" } }
    }
  ]
}
```

OAC requer origem S3 normal e assinatura habilitada. O Block Public Access permanece ligado. [Configuração de OAC](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html).

**Verificação:** distribuição usa OAC, bucket policy contém o ARN correto e apenas `site/*` na permissão de leitura CloudFront. A home ainda pode falhar porque o primeiro artefato não foi enviado.

## 5. Configurar rotas e página 404

Esta etapa depende da função entregue e testada durante a implementação. Não usar um fallback universal para `/index.html`.

1. Em **CloudFront → Functions → Create function**, nomear `portfolio-blog-viewer-request`, runtime JavaScript 2.0.
2. Copiar a versão aprovada de `infra/cloudfront/viewer-request.js` para o editor e salvar em Development.
3. Na aba de teste, verificar a matriz abaixo e os casos de segurança das fixtures. Não fazer requests a destinos externos.
4. Publicar em **Live**.
5. Em **Distribution → Behaviors → Default → Edit → Function associations**, associar a função ao evento **Viewer request**. Salvar e aguardar o status de distribuição concluída.

| Request do visitante | Resultado esperado antes do origin path `/site` |
| --- | --- |
| `/` | `/index.html` |
| `/blog/` | `/blog/index.html` |
| `/blog` | Redirecionamento canônico para `/blog/` ou resolução equivalente |
| `/blog/<slug>/` | `/blog/<slug>/index.html` |
| `/_next/static/...js` | Mesmo arquivo |
| Payload de navegação existente no `out/` | Mesmo payload, sem virar HTML |
| `/icon.svg`, `/robots.txt`, `/sitemap.xml` | Mesmo arquivo |
| URI malformada/traversal | Rejeição ou normalização segura, nunca saída do prefixo |

A AWS documenta reescrita de diretórios para `index.html`; esta função precisa também respeitar os arquivos do export específico do projeto. [Exemplo oficial](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/example_cloudfront_functions_url_rewrite_single_page_apps_section.html).

Em **Distribution → Error pages → Create custom error response**:

- Origem **403**: página `/404.html`, resposta **404**, Error caching minimum TTL **0**.
- Origem **404**: página `/404.html`, resposta **404**, Error caching minimum TTL **0**.

Não escolher resposta 200. O S3 privado pode responder 403 para objeto ausente; esse mapeamento também pode esconder uma política OAC errada, por isso um teste de URL inexistente sozinho não valida a origem. [Respostas de erro](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/custom-error-pages-response-code.html).

**Verificação após primeiro deploy:** home e asset conhecido dão 200; URL inventada dá 404 com página adequada; F5 no artigo funciona.

## 6. Conferir cache e metadados dos objetos

A pipeline, não um upload manual recorrente, configurará:

| Objetos | Cache-Control |
| --- | --- |
| HTML, payloads Next, sitemap, robots e assets sem hash | `public, max-age=0, s-maxage=60, must-revalidate` |
| Bundles e imagens com hash no nome | `public, max-age=31536000, immutable` |

`CachingOptimized` não inclui cookies/query strings na chave e tem TTL mínimo de um segundo. Como nenhum conteúdo privado será servido nesta distribuição, isso é aceitável. Não usar essa política para o CMS. [Políticas gerenciadas](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html).

Após publicar, em **S3 → Objects → site/... → Properties**, conferir Cache-Control e Content-Type. HTML deve ser HTML; JS e CSS não podem chegar como HTML; SVG, XML e payloads também devem ter seus tipos adequados. Revisar a navegação real do Next antes de concluir que todas as queries são dispensáveis.

Após cada deploy bem-sucedido, a pipeline invalidará `/*` e aguardará a conclusão. Se precisar diagnosticar manualmente: **Distribution → Invalidations → Create invalidation**, informar `/*`, criar e aguardar **Completed**. A invalidação não limpa o cache do navegador; daí a diferença entre documentos mutáveis e assets com hash. [Invalidação](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html).

## 7. Criar confiança GitHub → AWS sem access key

Fazer esta etapa após criar o novo repositório e a `main`. Os nomes abaixo são propostos e não indicam recursos existentes.

### 7.1 Provedor de identidade

1. Abrir **IAM → Identity providers**. Verificar se `token.actions.githubusercontent.com` já existe; não duplicar.
2. Caso não exista, escolher **Add provider → OpenID Connect**.
3. Provider URL: `https://token.actions.githubusercontent.com`.
4. Audience: `sts.amazonaws.com`.
5. Salvar. Não usar o nome do repositório como audience.

### 7.2 Identificar o subject correto

Na implementação, um diagnóstico restrito na `main` mostrará somente `iss`, `aud` e `sub` do token OIDC, nunca o token completo. Copiar o valor exato de `sub` para `GITHUB_OIDC_SUB` e verificar que termina no contexto da `main`.

Repositórios recentes podem usar IDs imutáveis de owner/repo no subject. Não assumir que o formato antigo `repo:owner/name:ref:refs/heads/main` será o emitido. Se futuramente houver um GitHub Environment, o subject pode mudar; esta proposta não depende de Environment. [OIDC GitHub/AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).

### 7.3 Política de permissão do deploy

Em **IAM → Policies → Create policy → JSON**, criar `portfolio-blog-deploy` usando a política proposta abaixo, com `BUCKET`, `ACCOUNT_ID` e `DISTRIBUTION_ID` substituídos.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadBucketRegion",
      "Effect": "Allow",
      "Action": "s3:GetBucketLocation",
      "Resource": "arn:aws:s3:::BUCKET"
    },
    {
      "Sid": "ListProjectPrefixes",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::BUCKET",
      "Condition": {
        "StringLike": { "s3:prefix": ["site/*", "releases/*", "state/*"] }
      }
    },
    {
      "Sid": "ReadWriteProjectObjects",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": [
        "arn:aws:s3:::BUCKET/site/*",
        "arn:aws:s3:::BUCKET/releases/*",
        "arn:aws:s3:::BUCKET/state/*"
      ]
    },
    {
      "Sid": "RemoveOnlyRecordedSiteAndReleaseObjects",
      "Effect": "Allow",
      "Action": "s3:DeleteObject",
      "Resource": ["arn:aws:s3:::BUCKET/site/*", "arn:aws:s3:::BUCKET/releases/*"]
    },
    {
      "Sid": "RefreshOnlyThisDistribution",
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation", "cloudfront:GetDistribution"],
      "Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
    }
  ]
}
```

Essa política não limita quais objetos dentro dos prefixos podem ser apagados por uma credencial comprometida. A remoção por manifesto é uma proteção do script; IAM limita o alcance ao projeto. O workflow não terá permissão para alterar bucket policy, IAM, DNS, distribuição ou função de rotas. Se o script final precisar outra ação, justificá-la e atualizar guia/testes antes de ampliar a role.

### 7.4 Role e trust policy

1. Em **IAM → Roles → Create role**, escolher identidade web/provedor GitHub, ou trust policy customizada conforme o assistente disponível.
2. Nome: `portfolio-blog-github-deploy`.
3. Associar somente a política `portfolio-blog-deploy` criada acima; não anexar AdministratorAccess, AmazonS3FullAccess ou CloudFrontFullAccess.
4. Em **Trust relationships → Edit trust policy**, conferir o documento abaixo com as substituições completas.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "GITHUB_OIDC_SUB"
        }
      }
    }
  ]
}
```

5. Copiar o ARN da role para a tabela inicial. Configurar sessão curta suficiente ao deploy, não credencial permanente. [Role OIDC no console](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html).

**Verificação:** workflow da `main` consegue assumir a role; uma branch diferente não consegue. Não resolver AccessDenied trocando o subject por `*`.

## 8. Configurar o repositório e primeiro deploy

1. Criar o repositório público com o nome disponível. Antes do primeiro push, revisar conteúdo existente, arquivos ignorados, tokens, anexos pessoais e artefatos de build. Não presumir que tudo que está untracked deve entrar no commit.
2. Em **Repository → Settings → Secrets and variables → Actions → Variables**, cadastrar os nomes que serão usados nos workflows:
   - `AWS_REGION`: `us-east-1`.
   - `AWS_DEPLOY_ROLE_ARN`: role da etapa 7.
   - `S3_BUCKET`: nome do bucket.
   - `CLOUDFRONT_DISTRIBUTION_ID`: ID da distribuição.
   - `PUBLIC_SITE_URL`: `https://lucas-reis.com`.
   - `CLOUDFRONT_DOMAIN`: domínio AWS para o teste técnico anterior ao corte.
3. Os identificadores acima não são chaves de acesso. Não cadastrar `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` para este fluxo.
4. Manter permissões padrão de Actions restritas. O workflow declara `contents: read`; somente os jobs pertinentes recebem `id-token: write` ou `packages: write`.
5. Habilitar notificações de falhas de Actions para Lucas. Conferir que o workflow está na `main` e permite execução manual.
6. Executar a pipeline de primeiro deploy. Ela deve validar, criar snapshot, enviar assets, atualizar documentos, invalidar e testar antes de registrar sucesso.
7. Anotar o commit, release-id e horário. Em S3, conferir `site/index.html`, `site/blog/index.html`, artigo placeholder, `site/404.html` e assets; conferir snapshot e estado em seus prefixos privados.
8. Abrir o domínio técnico CloudFront para teste de origem. Não é um ambiente ou hostname de staging: é a mesma distribuição de produção antes da troca do DNS.

**Verificação:** artefato publicado sem usar o Pi; nenhum arquivo `.env`, corpo de draft, coleção YAML, rota CMS ou segredo no export. O teste de conteúdo deve verificar o artefato inteiro, incluindo payloads estáticos, não apenas o HTML visível.

## 9. Preparar o CMS sem tocar Overleaf

Esta etapa acompanha o deploy público, mas não cria recursos AWS adicionais.

1. Gerar um hostname com 16 a 24 caracteres hexadecimais aleatórios e registrar `CMS_HOSTNAME`. O nome difícil de adivinhar não substitui a senha.
2. No Cloudflare, abrir a área de **Networking/Tunnels** (ou **Networks → Tunnels**, conforme a interface), criar um Tunnel **novo** `portfolio-blog-cms` e selecionar conector Docker. Guardar seu token somente no host administrativo. [Criação de Tunnel](https://developers.cloudflare.com/tunnel/get-started/).
3. Na implementação, preparar `/home/rp4/portfolio-blog-cms` com a configuração dedicada, imagens fixadas, arquivos de segredo e permissões locais restritas. Não copiar ou alterar o compose Overleaf.
4. A rota publicada do Tunnel usará `CMS_HOSTNAME` e serviço interno `http://cms-proxy:8080`, alinhado ao nome/porta da configuração que será entregue. Não apontar para `localhost:3000`, que pertence ao serviço antigo.
5. O proxy solicita usuário/senha HTTP antes de atender qualquer path. Lucas escolhe uma senha própria, diferente da senha de acesso ao Pi. Guardar hash da senha na configuração do proxy; não colocar credenciais na URL.
6. Criar GitHub App do Keystatic a partir do fluxo local documentado, instalar apenas no novo repositório e configurar o callback HTTPS `https://CMS_HOSTNAME/api/keystatic/github/oauth/callback`. O cliente deve usar o hostname real, não a string literal `CMS_HOSTNAME`.
7. Provisionar no serviço CMS `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` e o slug público do app. Segredos não entram na imagem nem no build público. [Setup GitHub Keystatic](https://keystatic.com/docs/github-mode).
8. Subir somente o projeto dedicado. Conferir saúde, limites de memória e estado dos containers Overleaf antes/depois. Não executar comandos globais de restart, down ou prune.
9. Testar janela anônima: painel, API e preview devem exigir HTTP Auth. Depois, testar login GitHub, salvar/reabrir draft, upload e preview sem rebuild do CMS.
10. Validar o atualizador dedicado e rollback de imagem. Não instalar GitHub runner no Pi nem publicar uma porta SSH na internet para Actions.

**Verificação:** apenas Lucas edita; GitHub salva o conteúdo; a prévia usa a versão recém-salva; Overleaf continua intacto.

## 10. Corte do domínio principal

Só prosseguir quando distribuição, certificado, primeiro deploy e painel tiverem sido validados.

1. Em Cloudflare DNS, registrar o valor atual do apex em `DNS_ANTERIOR`, incluindo se está proxied.
2. Conferir que `lucas-reis.com` já está nos alternate domains do CloudFront e a distribuição terminou de propagar.
3. Substituir somente o registro web do apex por **CNAME**, nome `@`, destino `DISTRIBUTION_DOMAIN`, **DNS only**. Resolver eventuais registros A/AAAA conflitantes apenas do apex; preservar MX, TXT e registros de outros serviços.
4. Não adicionar `https://` nem `/` ao destino. Cloudflare faz flattening do CNAME do apex. [CNAME no apex](https://developers.cloudflare.com/dns/cname-flattening/set-up-cname-flattening/).
5. Manter o subdomínio CMS como rota do Tunnel. Não passar o site público pelo proxy Cloudflare neste desenho: queremos visitante → CloudFront.
6. Aguardar a resolução efetiva e executar a lista abaixo. Não desligar o serviço legado antes do aceite.

| Teste | Resultado obrigatório |
| --- | --- |
| `https://lucas-reis.com/` | Home correta, certificado válido |
| HTTP para o site | Redireciona a HTTPS |
| `/blog/` e F5 | Índice carrega diretamente |
| Artigo e F5 | Conteúdo completo e assets corretos |
| Navegar home → blog → artigo → home | Sem erro de payload nem salto incorreto para contato |
| URL inventada | Status 404, não home/200 |
| URL de draft | Status 404 |
| Asset conhecido via S3 sem assinatura | Acesso negado |
| Asset conhecido via CloudFront | 200 e Content-Type correto |
| Caminhos de snapshots/estado pela CDN | Nenhum dado privado retornado |
| HTML, canonical, Open Graph, JSON-LD | Referências canônicas `.com`, não `.dev` |
| Sitemap | Somente home, índice e artigos elegíveis |
| CMS em janela anônima | HTTP Auth antes de conteúdo protegido |

Depois do aceite, avaliar a desativação somente do serviço legado do portfólio. Não remover um tunnel host compartilhado nem tocar `overleaf-cloudflared`.

## 11. Publicação diária, agenda e rollback

**Frontend:** editar, testar localmente e enviar para `main`; acompanhar o workflow até sucesso. Um push não deve ser considerado publicado enquanto os checks e o smoke test não terminarem.

**Blog:** entrar no subdomínio, passar HTTP Auth, fazer login GitHub, escrever Markdown e salvar como draft. Abrir a prévia, corrigir e escolher `published` com data atual/passada ou `scheduled` com data futura. Conferir o fuso mostrado pelo painel. Salvar publica no Git; a visibilidade no site depende do estado, data e sucesso do deploy.

**Agenda:** conferir se o workflow está ativo antes de depender de um agendamento. A verificação prevista é a cada 15 minutos, mais fila e build; não há minuto exato garantido. Após longa inatividade, reativar em **Actions → workflow → Enable workflow**, quando essa opção aparecer, e usar **Run workflow** na `main`. [Limitações de schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

**Rollback de conteúdo:** antes de uma reversão operacional manual, pausar os workflows automáticos de deploy e agenda em **Actions → workflow → menu → Disable workflow**, mantendo disponível o workflow separado de rollback. Em **Actions → workflow de rollback → Run workflow**, selecionar a release retida, confirmar que pertence ao projeto e acompanhar restauração, invalidação e smoke test. Corrigir/reverter a `main` antes de reativar os workflows automáticos, para não republicar o problema. O workflow e seus campos serão entregues na implementação. Não reconstruir um commit antigo com a data atual para simular o mesmo snapshot.

**Rollback do corte:** se houver falha estrutural, restaurar somente o registro web anterior do apex, incluindo o estado de proxy, e confirmar que o serviço legado ainda funciona. Considerar a propagação de DNS/cache. Não alterar os registros de email para reverter o site.

**Rollback do CMS:** aplicar o digest anterior pelo mecanismo dedicado e conferir login/preview. Posts persistem no Git; segredos locais precisam de cópia de recuperação guardada fora do repositório público.

**Retenção:** preservar release ativa, últimas cinco releases bem-sucedidas e snapshots recentes conforme o design. Limpeza é específica por manifesto/identificador; não usar expiração automática de todo `releases/` que possa apagar o rollback de um site sem alterações há meses.

## 12. Diagnóstico rápido

| Sintoma | Conferir antes de alterar permissões |
| --- | --- |
| Tudo retorna 404/403 | OAC, ARN da policy, origin path `/site` e existência de `site/index.html` |
| Só artigos falham no F5 | Função publicada/associada, trailing slash e objeto `index.html` do artigo |
| CSS/JS retorna HTML | Regra de rewrite e fallback de erro; nunca tratar assets como home |
| Conteúdo antigo | Resultado do deploy, metadados Cache-Control e status da invalidação |
| OIDC AccessDenied | `aud`, `sub` real, contexto main vs environment e ARNs; não abrir wildcard |
| Certificado não aparece | Região `us-east-1`, estado Issued e SAN `lucas-reis.com` |
| Callback GitHub falha | Host/protocolo encaminhado, URL cadastrada e cookies de sessão |
| Preview mostra conteúdo antigo | Leitura da revisão GitHub atual e digest do CMS, não apenas checkout da imagem |
| Agenda não publicou | Data/fuso, status do artigo, workflow ativo, fila e último resultado de build |
| Pi sem memória/disco | Métricas do projeto dedicado; não reiniciar/prunar os serviços Overleaf |

Concluir a implantação somente com os testes registrados, IDs reais preenchidos e rollback ensaiado. Este documento sozinho não é evidência de implantação concluída.
