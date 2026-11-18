FROM node:20-alpine
# Define a pasta principal de trabalho dentro do container
WORKDIR /app

# Copia apenas os arquivos de dependências primeiro (otimiza o cache do Docker)
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia o restante dos arquivos (Index.js, Public, views, etc.) para o container
COPY . .

# Expõe a porta padrão da aplicação (altere se o seu Index.js usar outra porta)
EXPOSE 3000

# Comando para iniciar a aplicação apontando para o seu arquivo principal
CMD ["node", "Index.js"]