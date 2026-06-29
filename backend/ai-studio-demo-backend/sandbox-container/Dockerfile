FROM node:20-slim

# Install essential tools for sandbox projects
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    git \
    curl \
    wget \
    zip \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create workspace
RUN mkdir -p /workspace/project && chown -R node:node /workspace

# Copy sandbox server
COPY sandbox-server.js /workspace/sandbox-server.js
RUN chown node:node /workspace/sandbox-server.js

# Install common global tools
RUN npm install -g npm@latest vite create-vite typescript 2>/dev/null || true

# Switch to non-root user
USER node
WORKDIR /workspace

EXPOSE 3000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "sandbox-server.js"]
