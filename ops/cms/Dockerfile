# The verified Docker Official Images mirror has the same pinned multi-arch
# digest as Docker Hub, without consuming Docker Hub's anonymous pull quota.
FROM public.ecr.aws/docker/library/node:24.19.0-alpine3.24@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS builder
ARG CMS_EDITOR_V2=0
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/cms/package.json ./apps/cms/package.json
COPY packages/blog-content/package.json ./packages/blog-content/package.json
COPY packages/blog-ui/package.json ./packages/blog-ui/package.json
RUN pnpm install --frozen-lockfile
COPY apps/cms ./apps/cms
COPY packages/blog-content ./packages/blog-content
COPY packages/blog-ui ./packages/blog-ui
ENV NEXT_PUBLIC_CMS_STORAGE=github NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=portfolio-blog-keystatic-lucasr-o NEXT_PUBLIC_CMS_EDITOR_V2=$CMS_EDITOR_V2
RUN pnpm build:cms && test ! -e /app/apps/cms/.next/standalone/apps/cms/.env

FROM public.ecr.aws/docker/library/node:24.19.0-alpine3.24@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43
ARG CMS_EDITOR_V2=0
WORKDIR /app
ENV NODE_ENV=production NEXT_PUBLIC_CMS_STORAGE=github NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=portfolio-blog-keystatic-lucasr-o NEXT_PUBLIC_CMS_EDITOR_V2=$CMS_EDITOR_V2 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=builder --chown=node:node /app/apps/cms/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/cms/.next/static ./apps/cms/.next/static
# The build must never include a machine-local .env. Credentials are supplied
# by the dedicated Compose service only at runtime.
RUN test ! -e /app/apps/cms/.env
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD node -e 'fetch("http://127.0.0.1:3000/api/health").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))'
CMD ["node", "apps/cms/server.js"]
