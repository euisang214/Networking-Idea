FROM node:lts-alpine

ENV NODE_ENV=development

WORKDIR /usr/src/app

# Copy package files
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

# Install dependencies
RUN npm install --silent && mv node_modules ../

# Copy source code
COPY . .

# Change ownership
RUN chown -R node:node /usr/src/app /usr/src/node_modules

EXPOSE 3000
USER node

CMD ["npm", "start"]