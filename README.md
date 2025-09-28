# Maildog

An overkill email client.

## Usage

Simply download the [latest release](https://github.com/v3xlabs/maildog/releases/latest) and run it.

```bash
# curl https://
```

All files are stored under the `~/.maildog` directory. The database is stored in `~/.maildog/database.db`.

### Docker

```yaml
services:
  maildog:
    image: v3xlabs/maildog:latest
    ports:
      - 8080:8080
    volumes:
      - ~/.maildog:/root/.maildog
    environment:
      - MAILDOG_SMTP_HOST=smtp.gmail.com
      - MAILDOG_SMTP_PORT=587
      - MAILDOG_SMTP_USER=your@email.com
```

```sh
docker compose up -d
```

## Development

```sh
nix develop
```
