FROM node:20-bookworm-slim

WORKDIR /app

COPY frontend-react/package.json frontend-react/package-lock.json ./frontend-react/
# Railway inyecta NODE_ENV=production durante la imagen. Sin esto, npm omite Vite.
RUN cd frontend-react && npm ci --include=dev

COPY frontend-react ./frontend-react
ENV VITE_API_URL=
RUN cd frontend-react && npm run build

COPY backend-muni/package.json backend-muni/package-lock.json ./backend-muni/
WORKDIR /app/backend-muni
RUN npm ci --omit=optional

COPY backend-muni ./

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "src/server.js"]
