FROM hugomods/hugo:exts-0.154.3 AS build
WORKDIR /src
COPY . .
RUN git init && git submodule update --init --recursive
RUN hugo --minify

FROM caddy:2-alpine
COPY --from=build /src/public /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
