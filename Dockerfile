# ZoomDev OS — imagem única: compila o frontend e serve tudo em uma porta.
FROM node:22-slim

WORKDIR /app

# Dependências primeiro, para aproveitar o cache de camadas
COPY package*.json ./
COPY server/package*.json ./server/
COPY web/package*.json ./web/
RUN npm ci

# Código e build do frontend
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# O servidor detecta web/dist e serve a aplicação junto com a API
CMD ["npm", "start"]
