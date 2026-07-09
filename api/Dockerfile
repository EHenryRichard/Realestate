# ─────────────────────────────────────────────────────────────────────────────
# Fast Rust build via cargo-chef (caches the dependency compile as its own layer)
# + mold (a much faster linker). Result: after the first build, changing only the
# app source recompiles just this crate in seconds instead of all ~200 deps.
# ─────────────────────────────────────────────────────────────────────────────

# ── Base image with the build toolchain, cargo-chef, and mold ────────────────
FROM rust:1-bookworm AS chef
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        clang \
        cmake \
        libclang-dev \
        mold \
        perl \
        pkg-config \
    && rm -rf /var/lib/apt/lists/*
RUN cargo install cargo-chef --locked
WORKDIR /app
# Link every Rust build below with mold (faster linking than the default ld).
ENV RUSTFLAGS="-C link-arg=-fuse-ld=mold"

# ── Plan: distill the dependency graph into a small recipe ────────────────────
FROM chef AS planner
COPY Cargo.toml Cargo.lock ./
COPY migrations ./migrations
COPY src ./src
RUN cargo chef prepare --recipe-path recipe.json

# ── Build: compile dependencies (cached), then the application ────────────────
FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
# This layer is reused across builds and only re-runs when Cargo.toml/Cargo.lock
# (i.e. the dependencies) change — NOT when app source changes.
RUN cargo chef cook --release --recipe-path recipe.json
# Now the real source. `sqlx::migrate!` embeds the migrations at compile time, so
# they must be present for this final build.
COPY Cargo.toml Cargo.lock ./
COPY migrations ./migrations
COPY src ./src
RUN cargo build --release

# ── Runtime image ─────────────────────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/sureboy-realty-api /usr/local/bin/sureboy-realty-api

ENV SERVER_HOST=0.0.0.0 \
    SERVER_PORT=8080 \
    UPLOAD_DIR=/app/uploads \
    FFMPEG_PATH=ffmpeg \
    RUST_LOG=info

RUN mkdir -p /app/uploads

EXPOSE 8080

VOLUME ["/app/uploads"]

CMD ["sureboy-realty-api"]
