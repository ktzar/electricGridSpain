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
COPY scripts/update_daily.sh /etc/periodic/daily/update_daily.sh
COPY scripts/update_hourly.sh /etc/periodic/hourly/update_hourly.sh

EXPOSE 8080
CMD node ./src/index
