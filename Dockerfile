FROM node:16.9.1-bullseye

WORKDIR /app

COPY ./frontend/package.json .
COPY ./frontend/yarn.lock .
COPY ./frontend/public public
COPY ./frontend/config config
COPY ./frontend/src src
COPY ./frontend/.env* .
COPY ./frontend/scripts scripts
COPY ./frontend/.eslint* .
COPY ./frontend/jsconfig.json .
COPY ./frontend/local.js .


RUN yarn install
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN yarn run build
RUN chmod -R o+rX ./build

EXPOSE 3000

CMD ["yarn", "start"]