# ZoomDev OS — imagem única: compila o frontend e serve tudo em uma porta.
FROM node:22-slim

WORKDIR /app

# Dependências primeiro, para aproveitar o cache de camadas entre builds
COPY package*.json ./
COPY server/package*.json ./server/
COPY web/package*.json ./web/
# --no-audit e --no-fund evitam chamadas de rede desnecessárias e deixam o
# build mais rápido e previsível em runners com pouca memória.
RUN npm ci --no-audit --no-fund

# Código e build do frontend
COPY . .
RUN npm run build

ENV NODE_ENV=production
# Onde os dados ficam. Em plataformas com volume (Railway, Render), aponte o
# volume para este caminho e os dados sobrevivem aos deploys.
ENV ZOOMDEV_DATA_DIR=/app/data
RUN mkdir -p /app/data

# A porta vem do ambiente (Railway e Render injetam PORT automaticamente).
# O 4000 é só o padrão para rodar local.
EXPOSE 4000

# O servidor detecta web/dist e serve a aplicação junto com a API
CMD ["npm", "start"]
