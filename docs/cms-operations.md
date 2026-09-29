# Operar o CMS no Raspberry Pi

Este roteiro foi executado parcialmente no Pi em 2026-09-29: o checkout dedicado, os três containers e o Tunnel estão ativos, e o hostname externo exige HTTP Basic Auth. O callback de produção no GitHub App e o fluxo completo de edição ainda precisam ser validados. Lucas configurou o Tunnel dedicado `LUCAS-REIS-PORTFOLIO-BLOG-CMS`, o hostname `4fa8522f3d6b.lucas-reis.com` e a rota `http://cms-proxy:8080`. O token original compartilhado em chat foi revogado; o substituto permanece somente no arquivo privado do Pi. Use somente `/home/rp4/portfolio-blog-cms` e o projeto Docker Compose `portfolio-blog-cms`; não pare, recrie, conecte ou altere os containers, redes e Tunnel do Overleaf. O site público não depende da disponibilidade do Pi depois de publicado.

## Pré-requisitos e registro antes de mudar algo

1. No Pi, confira `docker ps --format 'table {{.Names}}\t{{.Status}}'`, `free -h`, `df -h`, `docker compose version` e `node --version`. Guarde o resultado sem senhas. O updater usa Node do host **somente para executar o script**; a aplicação usa Node dentro da imagem. Se o host não tiver Node 18+ e houver impacto em outro projeto ao instalá-lo, pare e planeje uma alternativa isolada. Não substitua o Node do host sem avaliação.
2. Confirme acesso à zona `lucas-reis.com` no Cloudflare e ao [GitHub App](https://github.com/settings/apps/portfolio-blog-keystatic-lucasr-o), instalado apenas em `lucasr-o/portfolio-blog`.
3. Aguarde o workflow **Build CMS ARM64 image** passar em `main`. Verifique no GHCR que o pacote está público, tem manifesto `linux/arm64` e anote o digest de uma imagem aprovada. Não use a tag mutável `:main` no Compose.
4. Use o hostname escolhido `4fa8522f3d6b.lucas-reis.com`, sem tratá-lo como mecanismo de autenticação. O exemplo `0123456789abcdef` dos arquivos não é uma escolha real. Não inclua o token do Tunnel ou senhas no registro operacional.

## Preparar somente o diretório novo

No Pi, como `rp4`, clone o novo repositório em `/home/rp4/portfolio-blog-cms` e confira a branch `main`. Não use o checkout nem os volumes do portfólio antigo ou do Overleaf. Em `ops/cms`, copie `.env.example` para `.env` e `cms.env.example` para `secrets/cms.env`. Crie `secrets/` com permissão `0700`; mantenha ambos os arquivos `.env` com `0600`. Preencha:

- `CMS_IMAGE` com **o digest completo** `ghcr.io/lucasr-o/portfolio-blog-cms@sha256:…` aprovado pelo workflow;
- `CMS_HOSTNAME` com o novo hostname hexadecimal completo;
- `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` com os valores do App já criado; obtenha o segredo do App de forma privada, não o envie em chat, issue, commit ou log. Preserve `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` como valor público fornecido.

Para gerar `KEYSTATIC_SECRET`, use `openssl rand -hex 32`; salve diretamente no arquivo privado. Não copie o arquivo `apps/cms/.env` de outra máquina para o Git. Antes de iniciar, confirme com `git status --short` que nenhum segredo será versionado. `ops/cms/.env`, `ops/cms/secrets/`, `ops/cms/generated/` e `ops/cms/runtime/` são ignorados pelo Git.

O Pi não tem `htpasswd`; evite instalar pacote no host só para isso. Na estação local, onde a ferramenta está disponível, execute `htpasswd -cB ops/cms/secrets/cms.htpasswd lucas` a partir da raiz do checkout: ele solicitará a senha sem colocá-la na linha de comando. Copie o arquivo para `/home/rp4/portfolio-blog-cms/ops/cms/secrets/cms.htpasswd` pelo SSH; não o envie em chat ou Git. Proteja a senha em um gerenciador de senhas. No Pi, os containers `proxy` e `tunnel` usam o UID/GID `1000:1000` do usuário `rp4`, verificado antes do deploy, para ler os arquivos montados com modo `0600`; mantenha a pasta `secrets/` em `0700`. Não publique o hash. HTTP Basic **é uma camada adicional**, não substitui login GitHub. Exija HTTPS externo; nunca digite a senha se o navegador avisar sobre TLS.

## Criar Tunnel dedicado, sem tocar no existente

No painel Cloudflare, confirme o Tunnel dedicado `LUCAS-REIS-PORTFOLIO-BLOG-CMS` e a rota publicada **somente** de `4fa8522f3d6b.lucas-reis.com` para `http://cms-proxy:8080`. Esse nome resolve dentro da rede Compose privada; não exponha porta no Pi nem associe o Tunnel do Overleaf. **O token originalmente compartilhado foi revogado; gere/obtenha um token novo antes de iniciar o conector.** Guarde-o somente em `ops/cms/secrets/tunnel-token`, modo `0600`, sem linha de comando, Git ou saída de logs; não execute `sudo cloudflared service install`, pois o Compose já tem o serviço `tunnel`. O container roda como UID/GID `1000:1000` do dono do arquivo, mantendo o token inacessível aos demais usuários do host. [Tokens do Tunnel](https://developers.cloudflare.com/tunnel/reference/tunnel-tokens/).

No GitHub App, adicione `https://4fa8522f3d6b.lucas-reis.com/api/keystatic/github/oauth/callback` como URL de callback HTTPS de produção. Mantenha o callback local usado no desenvolvimento. Confirme que o hostname e o protocolo no `redirect_uri` exibido durante **Log in with GitHub** são exatamente os aprovados; não habilite callback genérico ou wildcard. O painel final só deve ser acessado pelo hostname do Tunnel.

## Subir e validar

No checkout novo, execute `node ops/cms/render-proxy.mjs`; ele valida o hostname e produz a configuração Nginx. Em `ops/cms`, rode `docker compose config --quiet` antes de subir. Confira que o projeto tem **apenas** `cms`, `proxy` e `tunnel`, rede própria e nenhuma porta de host. Então execute `docker compose up -d` **somente em `ops/cms`**. Não use `docker compose down` para outros diretórios, `docker system prune`, ou comandos globais de Docker.

Confira `docker compose ps` e `docker compose logs --tail=50 cms proxy tunnel` nesse diretório. Os três serviços devem estar em execução, com CMS/proxy saudáveis. Do navegador externo, abra `https://<hex>.lucas-reis.com/keystatic` em janela privada: sem senha deve receber 401; com Basic Auth deve mostrar login GitHub; login, callback, salvar um draft de teste, preview e imagem devem funcionar. Confira também uma API e um asset sem Basic Auth (401), os cabeçalhos `Cache-Control: no-store` e `X-Robots-Tag: noindex`. Nunca publique o draft de teste por engano.

Se o hostname não responder, compare a rota do Tunnel com `http://cms-proxy:8080`, o estado `docker compose ps` do **novo** projeto e os logs limitados dele. Se houver erro `redirect_uri`, corrija o callback exato no App. Não altere as configurações do Tunnel antigo para tentar corrigir o novo.

## Atualização automática e recuperação

`ops/cms/update-cms.mjs` aceita apenas um digest de `ghcr.io/lucasr-o/portfolio-blog-cms`. Ele puxa a tag `:main` apenas para descobrir o candidato e verifica arquitetura ARM64, URL de origem e revisão proveniente da `main`. Se houver commits posteriores apenas no site/documentação, compara as revisões no GitHub e só aceita a imagem quando **nenhuma entrada do build CMS** mudou nesse intervalo; comparação incompleta ou indisponível falha fechada. Reaplica **somente** o serviço `cms` com `docker compose up -d --no-deps cms`. Exige saúde antes e depois. Se falhar, restaura o digest anterior e registra o candidato quebrado em `ops/cms/runtime/failed-image` para não repeti-lo. O script nunca aplica imagem de outro repositório, não reinicia proxy/Tunnel e não opera outros projetos Compose.

Os arquivos `ops/cms/systemd/portfolio-blog-cms-update.{service,timer}` pressupõem o caminho `/home/rp4/portfolio-blog-cms` e usuário/grupo `rp4` com acesso ao Docker. Revise esses valores no Pi antes de copiá-los para `/etc/systemd/system/`; instale **somente** essas duas unidades. Ative com `sudo systemctl daemon-reload` e `sudo systemctl enable --now portfolio-blog-cms-update.timer`. O timer verifica a cada ~15 minutos com pequeno atraso aleatório. Para testar, inicie uma vez `sudo systemctl start portfolio-blog-cms-update.service` e leia `journalctl -u portfolio-blog-cms-update.service -n 80 --no-pager`. Não habilite o timer antes de validar o primeiro deploy e a saúde do CMS.

Para pausar apenas atualizações do CMS: `sudo systemctl disable --now portfolio-blog-cms-update.timer`. Para uma imagem quebrada, confira `runtime/previous-image`, `runtime/failed-image` e `docker compose ps`. Uma execução nova do updater detecta CMS sem saúde e tenta o digest anterior; se o anterior também falhar, ele para sem tocar em outros serviços. Para recuperação manual, substitua apenas `CMS_IMAGE` pelo digest anterior aprovado em `ops/cms/.env` e rode `docker compose up -d --no-deps cms` **nesse projeto**, seguido de inspeção de saúde. Não mude a tag para `latest` nem apague os registros de falha até investigar a causa.

O `git push` para `main` atualiza o site público por um pipeline independente e, se houve mudança no CMS ou pacote compartilhado, cria imagem ARM64. Não há dependência do uptime do Pi para servir páginas; a atualização do editor só ocorre quando o novo digest passa pelo verificador no Pi. Publicações do blog que foram salvas no GitHub são incluídas pelo pipeline público, não pelo ciclo de vida do CMS.
