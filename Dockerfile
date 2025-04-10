# Użyj Node.js jako podstawy
FROM node:18

# Ustaw katalog roboczy
WORKDIR /app

# Skopiuj pliki package.json i package-lock.json
COPY package*.json ./

# Zainstaluj zależności
RUN npm install

# Skopiuj całą resztę kodu
COPY . .

# Wystaw port 3000 (jeśli twój serwer działa na innym — zmień)
EXPOSE 8090

# Uruchom serwer
CMD ["node", "server.js"]
