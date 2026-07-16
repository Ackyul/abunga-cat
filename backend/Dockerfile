# Usar una imagen oficial de Node.js ligera
FROM node:20-alpine

# Definir directorio de trabajo
WORKDIR /app

# Copiar archivos de definición de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar el código del servidor
COPY . .

# Exponer el puerto por defecto
EXPOSE 3000

# Iniciar la aplicación
CMD ["npm", "start"]
