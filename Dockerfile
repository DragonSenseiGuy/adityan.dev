# adityan.dev — static site served by nginx with SEO 301 redirects baked in.
# Build:  docker build -t adityan-dev .
# Run:    docker run -p 8080:80 adityan-dev
FROM nginx:1.27-alpine

COPY default.conf /etc/nginx/conf.d/default.conf
# NOT in conf.d/ — the base image globs conf.d/*.conf at http{} level,
# where location directives are illegal. Snippets are only pulled in
# explicitly by default.conf.
COPY nginx-redirects.conf /etc/nginx/snippets/nginx-redirects.conf

COPY . /usr/share/nginx/html

# Config/build files land in the web root via `COPY .` — strip them so
# nothing except real site assets is publicly served.
RUN rm -rf /usr/share/nginx/html/Dockerfile \
           /usr/share/nginx/html/.dockerignore \
           /usr/share/nginx/html/default.conf

EXPOSE 80
