FROM docker.io/rustlang/rust:nightly-slim as backendbuilder
WORKDIR /app
COPY .sqlx .sqlx/
COPY migrations/ ./migrations
COPY src/ ./src
COPY Cargo.toml .
COPY Cargo.lock .
ENV SQLX_OFFLINE="true"
RUN cargo build --release

FROM docker.io/library/debian:bookworm-slim as runner
WORKDIR /app
COPY --from=backendbuilder /app/target/release/rust_sensor .
ENV WEB_ADDRESS=0.0.0.0
ENV WEB_PORT=8070
EXPOSE 8070
ENTRYPOINT ["./rust_sensor"]
