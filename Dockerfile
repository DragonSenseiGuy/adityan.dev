FROM hugomods/hugo:exts-0.154.3 AS build
WORKDIR /src
COPY . .
RUN git clone --depth 1 https://github.com/luizdepra/hugo-coder.git themes/coder
RUN hugo --minify

FROM caddy:2-alpine
COPY --from=build /src/public /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
