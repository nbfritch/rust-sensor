FROM docker.io/oven/bun:1-slim as uibuilder
WORKDIR /app
COPY ui ui/
WORKDIR /app/ui
RUN bun install
RUN bun run build

FROM docker.io/rustlang/rust:nightly-slim as backendbuilder
WORKDIR /app
COPY --from=uibuilder /app/ui/dist ./ui/dist
COPY .sqlx .sqlx/
COPY migrations/ ./migrations
COPY src/ ./src
COPY build.rs .
COPY Cargo.toml .
COPY Cargo.lock .
ENV IS_CONTAINER_BUILD="true"
ENV SQLX_OFFLINE="true"
RUN cargo build --release

FROM docker.io/library/debian:bookworm-slim as runner
WORKDIR /app
COPY --from=backendbuilder /app/target/release/rust_sensor .
COPY templates/ ./templates
ENV WEB_ADDRESS=0.0.0.0
ENV WEB_PORT=8080
EXPOSE 8080
ENTRYPOINT ["./rust_sensor"]
