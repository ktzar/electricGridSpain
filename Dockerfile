FROM node:18-alpine as builder
ADD client /app
WORKDIR /app/
RUN npm install
RUN npx vite build



FROM node:17-alpine

ENV DB_FILE=./database.db
ENV PUBLIC_PATH=public
ENV PORT=8080

WORKDIR /app
COPY server ./
COPY --from=builder /app/dist ./public

#COPY client/dist ./public
RUN rm -fR node_modules
RUN npm install --production && npm prune --production
COPY server/database.db ./

EXPOSE 8080
CMD node ./src/index
