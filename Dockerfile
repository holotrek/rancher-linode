# Use the official lightweight Node.js 12 image.
# https://hub.docker.com/_/node
FROM node:12-slim

# Create and change to the app directory.
WORKDIR /home/appusr/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
RUN yarn install --prod

# Copy local code to the container image.
COPY . ./

# Copy certs
COPY certs/thetablestop.* /etc/ssl/
RUN chown root:root /etc/ssl/*
RUN chmod 644 /etc/ssl/*

# Add app user
RUN useradd -r appusr && chown -R appusr:appusr /home/appusr

# Allow app user to run node on 443 
RUN apt-get update && apt-get -y install libcap2-bin
RUN setcap CAP_NET_BIND_SERVICE=+eip /usr/local/bin/node

# Run app as non privileged.
USER appusr

# Run the web service on container startup.
CMD [ "yarn", "serve" ]
