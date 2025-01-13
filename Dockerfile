FROM node:23-slim AS base
COPY . /app
WORKDIR /app

FROM base AS prod-deps
ENV NODE_ENV=production
RUN npm install --production

FROM base AS build
ENV NODE_ENV=development
RUN npm install
RUN npm run build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
CMD [ "node", "./dist/main.js" ]