FROM node:current-alpine3.14
WORKDIR /app
COPY . /app
RUN npm i --registry https://registry.npm.taobao.org
CMD ["node","index.js"]