# Escrever no blog

## Estado atual

**Referência histórica do editor antigo; não use este fluxo em produção.** O painel atual usa o [fluxo português-primeiro](blog-editor-v2.md), sem data manual nem upload em duas gravações. As instruções abaixo ficam preservadas apenas para entender registros e operações anteriores ao corte.

Repositório: [lucasr-o/portfolio-blog](https://github.com/lucasr-o/portfolio-blog). O aplicativo `portfolio-blog-keystatic-lucasr-o` está instalado somente nele, com escrita em conteúdo e leitura de metadados/pull requests. Não ampliar a instalação para outros repositórios.

## Acesso

Em desenvolvimento, `pnpm dev:cms` usa arquivos locais por padrão. Para testar o GitHub, use `NEXT_PUBLIC_CMS_STORAGE=github pnpm dev:cms` e abra `http://127.0.0.1:3001/keystatic`. As credenciais ficam em `apps/cms/.env`, ignorado pelo Git; nunca compartilhe esse arquivo ou seu conteúdo. Não exponha o servidor de desenvolvimento à internet.

O acesso de produção é pelo hostname hexadecimal registrado na documentação operacional: primeiro a senha HTTP, depois **Log in with GitHub**. São duas proteções diferentes. O acesso do GitHub não substitui a senha HTTP.

## Escrever e salvar

1. Confira que a branch selecionada é **main**. As prévias deste MVP sempre leem a `main`, mesmo que você selecione outra branch no editor.
2. Entre em **Blog posts → Add**. Escolha o título e confira o **URL slug**: letras minúsculas, números e hífens. Não renomeie uma URL já publicada sem planejar seu redirecionamento.
3. Mantenha **Draft — not on the website** enquanto escreve. Cole ou digite Markdown no campo **Markdown**; ele não é um editor de blocos visuais.
4. Clique **Create** ou **Save**. Espere a gravação terminar e o indicador **Unsaved** desaparecer. Reabra o registro para confirmar o conteúdo.
5. Clique **Preview** para ver a versão salva. Também é possível abrir `/preview` no mesmo servidor do painel e escolher um artigo.

O rascunho pode ficar sem resumo, corpo ou data. A prévia lista os campos ainda necessários em **Before publication**. Um registro inválido para publicação não produz uma release pública bem-sucedida.

**Rascunhos não são confidenciais:** salvá-los grava um commit em um repositório público. Não coloque segredos, relatórios privados ou dados de clientes, nem mesmo em rascunhos.

## Markdown e imagens

São suportados títulos, parágrafos, listas, links, citações, tabelas, código inline e blocos cercados por três crases. HTML bruto, scripts e MDX executável não são habilitados. Datas com fuso explícito são normalizadas para UTC; a prévia também mostra o horário de São Paulo. Exemplo: `2026-10-01T09:00:00-03:00`.

Para inserir uma imagem:

1. Em **Images → Add → Choose file**, selecione PNG, JPEG ou WebP estático de até **5 MiB**. Use a extensão em minúsculas. GIF e SVG não são aceitos no blog; os SVGs existentes do portfólio não são alterados.
2. Preencha **Alternative text**, descrevendo o que importa na imagem, e confirme **Add**.
3. Salve o artigo. Abra **Preview → Image references — copy into Markdown**.
4. Copie a referência exibida, cole-a no campo Markdown e salve novamente.
5. Recarregue a prévia. Ela mostra o novo commit e a imagem, mesmo que o artigo continue como draft. Não é necessário reconstruir ou reiniciar o CMS.

O primeiro campo **Image file**, fora de **Images**, é a capa opcional. Para uma imagem aparecer no corpo, use sua referência Markdown. Imagens externas não são baixadas automaticamente. O build e a prévia verificam a decodificação, o tamanho e a correspondência entre formato e extensão.

## Publicação e retirada

Depois que a entrega automática for ativada:

- **Draft**: o artigo não entra no site nem no sitemap.
- **Published**: entra em uma entrega bem-sucedida quando a data de publicação já tiver chegado. O fluxo em preparação remove a opção Scheduled e a verificação periódica; não planeje publicações futuras por data.

Preencha título, resumo, autor, corpo, data com fuso e textos alternativos antes de publicar. A data futura não é antecipada por selecionar Published. Salvar, visualizar uma prévia e publicar são eventos distintos: confira o resultado do workflow e o site público.

Para retirar um artigo, volte para Draft, salve e aguarde uma entrega bem-sucedida. Isso não apaga seu histórico público no GitHub.

## Falha ao salvar ou sessão encerrada

Se aparecer **Unsaved**, erro de rede, permissão ou conflito, não suponha que houve gravação. Copie o Markdown ainda não salvo para um arquivo local antes de recarregar ou refazer o login. Uma sessão encerrada pode produzir a mensagem nativa `[Network] No Content`.

Abra o editor em outra aba, entre novamente com GitHub e depois reabra o artigo salvo. Compare com seu texto local antes de reaplicá-lo. Se houver conflito, não sobrescreva cegamente: confira a revisão atual na `main`. Em falha persistente, verifique se o App ainda tem acesso somente ao repositório correto, se o GitHub está disponível e se a data possui fuso.

Na prévia, **Preview unavailable** não altera conteúdo. Faça login novamente e recarregue. A prévia identifica o commit exibido; alterações não salvas nunca aparecem nela.

## Demonstração validada

`cms-markdown-demonstration` foi criado no navegador e continua como **draft**, sem data de publicação. Contém Markdown, tabela, código, quebra de linha e uma imagem da UFABC. A prévia acompanha as revisões salvas no GitHub; o artigo não entra no export público. Serve como exemplo de edição, não como uma publicação profissional.

Ver também [o contrato editorial](editorial-content.md) e a [documentação oficial do modo GitHub](https://keystatic.com/docs/github-mode).
