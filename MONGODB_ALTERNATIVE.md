# Alternative MongoDB Connection (If SSL Still Fails)

## Problem
The `mongodb+srv://` connection string requires SSL/TLS and DNS SRV lookups, which can fail in Docker containers.

## Solution: Direct Connection String

Replace the connection string in `docker-compose.yml` and `backend/.env` with:

```
MONGO_URL=mongodb://pinpostmaria:iubbDYjmSiA5uwyQ@ac-sdcjaht-shard-00-00.4ccvhj6.mongodb.net:27017,ac-sdcjaht-shard-00-01.4ccvhj6.mongodb.net:27017,ac-sdcjaht-shard-00-02.4ccvhj6.mongodb.net:27017/?ssl=false&authSource=admin&replicaSet=atlas-lwh8k0-shard-0
```

### Changes:
- ✅ Uses `mongodb://` instead of `mongodb+srv://`
- ✅ Direct server addresses (no DNS SRV lookup)
- ✅ `ssl=false` to bypass SSL handshake completely
- ✅ Explicit `authSource` and `replicaSet`

### Note:
MongoDB Atlas requires SSL by default, so `ssl=false` might not work. If it doesn't, the only remaining option is to:

1. **Use a different MongoDB provider** (not Atlas)
2. **Set up MongoDB Atlas VPC peering** (advanced)
3. **Use a MongoDB proxy/tunnel** in Docker
4. **Downgrade Python version** to 3.9 (known to have better SSL compatibility)

