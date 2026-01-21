# Build stage
FROM node:24-alpine AS build

RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git

WORKDIR /opt/app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build Strapi admin panel
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM node:24-alpine AS production

RUN apk add --no-cache vips-dev

WORKDIR /opt/app

# Copy compiled files from build stage (flatten dist structure)
# This makes Strapi treat it as a non-TypeScript project
COPY --from=build /opt/app/dist/config ./config
COPY --from=build /opt/app/dist/src ./src
COPY --from=build /opt/app/node_modules ./node_modules
COPY --from=build /opt/app/package.json ./package.json
COPY --from=build /opt/app/public ./public
COPY --from=build /opt/app/favicon.png ./favicon.png
COPY --from=build /opt/app/dist/build ./build

# Create non-root user
RUN addgroup -g 1001 -S strapi && \
    adduser -S strapi -u 1001 -G strapi && \
    chown -R strapi:strapi /opt/app

USER strapi

EXPOSE 1337

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

CMD ["npm", "run", "start"]
