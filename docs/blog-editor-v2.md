# Novo fluxo de escrita do blog

> Este é o guia do editor português-primeiro em produção desde o corte do commit `3e1a8c2`. O [guia anterior](blog-editor.md) permanece apenas como referência histórica; não use seus campos de data nem seu fluxo de upload no painel atual.

## Escrever e publicar

1. Em **Blog posts → Add**, escreva o **Título original** em português e confira a URL criada. A URL é compartilhada entre os idiomas; depois de publicar, não a altere sem redirecionamento. Em posts antigos, o título original pode continuar em inglês.
2. Escreva o **Resumo** e o **Markdown** na seção **Português**. O campo “Título exibido” é opcional em posts novos: deixe-o vazio para usar o título original ou use-o para atualizar o título mostrado sem mudar a URL.
3. Enquanto escreve, deixe o estado em **Rascunho**. Você pode salvar quantas vezes quiser, mesmo sem tradução. Rascunhos são commits no repositório público; não inclua segredos ou conteúdo confidencial.
4. Quando a versão portuguesa estiver pronta, marque **Publicar versão em português**, mude o estado para **Publicado** e salve. O GitHub registra a primeira publicação; não há campo de data. O site recebe a atualização após a release por push.
5. Mais tarde, preencha título, resumo e Markdown em **English**; marque **Publish English version** e salve. A primeira publicação inglesa recebe sua própria data, sem alterar a data portuguesa. A home e `/blog/` continuam em inglês, logo um artigo só em português não aparece nelas.

Para retirar apenas um idioma, desmarque sua aprovação e salve. Para retirar o artigo inteiro, volte a **Rascunho**. A remoção pública depende de uma release bem-sucedida e não apaga o histórico do GitHub. Não existe mais agendamento nem verificação de 15 em 15 minutos: somente mudanças públicas relevantes acionam build/upload/invalidação; um push que muda só rascunhos termina como verificação sem publicação. A recuperação manual continua disponível no workflow.

## Colar imagem ou GIF no Markdown

Com o cursor no campo **Markdown**, use Ctrl+V para uma imagem copiada ou arraste o arquivo para o campo. Também há **Escolher imagem ou GIF**. O editor pede uma descrição curta antes de inserir a referência no ponto do cursor. Exemplo: `![Pepe](/media/slug/arquivo.gif)`. Você pode usar o mesmo arquivo nos dois idiomas e escrever um texto alternativo diferente em cada Markdown. Colar texto comum não aciona o fluxo de imagem.

São aceitos PNG, JPEG, WebP estático e GIF verdadeiro, cada arquivo com no máximo 5 MiB. GIF pode ter até 120 quadros e fica sujeito a um limite de 24 milhões de pixels decodificados. A capa continua sendo uma imagem estática, não GIF. SVG, links externos tratados como upload e arquivos com extensão disfarçada são rejeitados. O site mostra um quadro estático inicial para economizar recursos; o leitor pode reproduzir/pausar o GIF, respeitando preferência por movimento reduzido.

Imagem e referência Markdown são salvas juntas no mesmo commit. Se o salvamento falhar, mantenha a aba aberta e tente novamente; não presuma que o arquivo chegou ao GitHub. A prévia protegida mostra **apenas a última revisão salva**, nunca imagens ou texto ainda não salvos. Antes de publicar, confira os textos alternativos, especialmente quando o mesmo arquivo aparece em português e inglês.

## Conferir uma publicação

Depois de salvar, confirme que o editor terminou a gravação, veja o commit no GitHub e confira a execução **Publish site**. Se o push alterou somente um rascunho, é esperado que o workflow encerre após o preflight. Para um artigo publicado, confira a URL do idioma, a imagem/GIF, o blog, o sitemap e o artigo em dispositivo móvel. Uma falha de validação bloqueia a release; não transforme o rascunho em público à força.
