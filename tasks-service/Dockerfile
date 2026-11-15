# ==========================================
# Dockerfile - tasks-service
# Multi-stage build com Node.js 20 Alpine
# ==========================================

# Estágio 1: Instalação das dependências de produção
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Estágio 2: Imagem final enxuta para execução (Runtime)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Execução com usuário sem privilégios (boas práticas de segurança em containers)
USER node

# Copia apenas as dependências e o código-fonte necessários
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node src/ ./src/

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
