# Frontend of MySportWeb, served by nginx with the API on the same origin
FROM node:22-trixie-slim AS build
RUN npm install -g pnpm@12.14.0
WORKDIR /src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# empty: the browser calls /api and /MEDIA on the origin of the page, nginx sends them to the backend
ARG VITE_BACKEND_URL=""
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN pnpm run build

FROM nginx:1.30-trixie
# a template: BACKEND_URL is set at start by the entrypoint of the nginx image
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /src/dist /usr/share/nginx/html
ENV BACKEND_URL=http://backend:8080
# NGINX_LOCAL_RESOLVERS for nginx.conf.template: the DNS servers of the container (Docker's), to look the backend
# up again when its address changes
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
# Content-Security-Policy: the browser blocks what the policy doesn't allow; Content-Security-Policy-Report-Only
# only reports it (see nginx.conf.template)
ENV CSP_HEADER=Content-Security-Policy
EXPOSE 80
