# Nabz on a Hugging Face Docker Space: one container runs the Express API (127.0.0.1:8787,
# never exposed) and the Next.js site (0.0.0.0:7860), which forwards /api to the API.
FROM node:24-bookworm-slim

ENV NEXT_TELEMETRY_DISABLED=1

# The Space runs the container as user 1000; the node image's "node" user has that ID.
RUN mkdir -p /app && chown node:node /app
USER node
WORKDIR /app

# Dependencies first, so code changes reuse the cached install layers.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci
COPY --chown=node:node frontend/package.json frontend/package-lock.json ./frontend/
RUN npm ci --prefix frontend

COPY --chown=node:node . .

# Empty API URL = same origin; the build bakes in the /api -> backend rewrite.
# NEXT_PUBLIC_DEMO=1 keeps the sign-in demo note so judges can find the crew codes.
ENV NEXT_PUBLIC_API_URL="" \
    API_PROXY_TARGET="http://127.0.0.1:8787" \
    NEXT_PUBLIC_DEMO="1"
RUN npm --prefix frontend run build

ENV NODE_ENV=production
EXPOSE 7860
CMD ["bash", "deploy/huggingface/start.sh"]
