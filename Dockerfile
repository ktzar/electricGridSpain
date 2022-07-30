FROM node:17-alpine

ENV DB_FILE=./database.db
ENV PUBLIC_PATH=public
ENV PORT=8080

WORKDIR /app
COPY server ./
COPY client/dist ./public
RUN rm -fR node_modules
RUN npm install
COPY server/database.db ./

EXPOSE 8080
CMD node ./src/index
