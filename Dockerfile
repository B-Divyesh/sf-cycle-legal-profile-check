FROM node:22-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json vite.config.ts ./
COPY frontend ./frontend
RUN npm ci && npm run build

FROM rust:1.90-alpine AS backend
RUN apk add --no-cache musl-dev
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
ARG BUILD_SHA=dev
ARG GIT_SHA=dev
ARG SOURCE_COMMIT=dev
ENV BUILD_SHA=$BUILD_SHA GIT_SHA=$GIT_SHA SOURCE_COMMIT=$SOURCE_COMMIT
RUN cargo build --release

FROM alpine:3.22
RUN apk add --no-cache ca-certificates && addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=backend /app/target/release/cycle-legal-profile-check /usr/local/bin/cycle-legal-profile-check
COPY --from=frontend /app/dist ./dist
RUN mkdir /data && chown app:app /data
USER app
ENV PORT=8080 DATABASE_URL=sqlite:///data/cycle-legal.sqlite?mode=rwc
EXPOSE 8080
ENTRYPOINT ["cycle-legal-profile-check"]
