# Build stage
FROM node:25-alpine3.22
RUN apk add --no-cache git yq-go ast-grep jq

WORKDIR /build

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN npm run build

# Verify installations
RUN node --version \
  && npm --version \
  && jq --version \
  && yq --version \
  && ast-grep --version

ENTRYPOINT ["./bin/run.js"]

CMD ["--help"]
