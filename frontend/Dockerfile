FROM node:lts-alpine

# Run locally
ENV NODE_ENV=development
# Run productione
# ENV NODE_ENV=production

WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

# Run locally
RUN npm install --silent && mv node_modules ../ \
    && chown -R node:node /usr/src/app /usr/src/node_modules
# Run production
# RUN npm install --production --silent && mv node_modules ../

COPY . .
EXPOSE 80
USER node
CMD ["npm", "start"]
