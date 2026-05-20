# PostgreSQL local (desenvolvimento)

- **Porta:** `5454` no host → `5432` no container
- **Imagem:** PostgreSQL 16

## Subir o banco

```bash
docker compose up -d
```

## Parar

```bash
docker compose down
```

## Conexão

```
postgresql://boilerplate:boilerplate@localhost:5454/boilerplate
```

## Ver logs

```bash
docker compose logs -f postgres
```
