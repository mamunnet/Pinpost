# MongoDB Connection Troubleshooting Guide

## For MongoDB Compass Connection Issues

If you're experiencing TLS handshake errors with MongoDB Compass, try these connection strings:

### Option 1: With TLS Insecure (Recommended for development)
```
mongodb+srv://pinpostmaria:iubbDYjmSiA5uwyQ@pinpost.4ccvhj6.mongodb.net/?retryWrites=true&w=majority&tls=true&tlsInsecure=true
```

### Option 2: With SSL Certificate Bypass
```
mongodb+srv://pinpostmaria:iubbDYjmSiA5uwyQ@pinpost.4ccvhj6.mongodb.net/?retryWrites=true&w=majority&ssl=true&ssl_cert_reqs=CERT_NONE
```

### Option 3: Standard Connection String (if TLS issues persist)
```
mongodb://pinpostmaria:iubbDYjmSiA5uwyQ@ac-sdcjaht-shard-00-00.4ccvhj6.mongodb.net:27017,ac-sdcjaht-shard-00-01.4ccvhj6.mongodb.net:27017,ac-sdcjaht-shard-00-02.4ccvhj6.mongodb.net:27017/?ssl=true&replicaSet=atlas-123abc-shard-0&authSource=admin&retryWrites=true&w=majority&ssl_cert_reqs=CERT_NONE
```

## For Application (.env file)
The updated connection string in your .env file should work with the enhanced TLS handling in the server code.

## Additional MongoDB Compass Settings
If still having issues in Compass:
1. Go to Connection Settings
2. Under SSL/TLS tab:
   - Set SSL/TLS to "System CA / Atlas Deployment"
   - Or try "Unvalidated (insecure)"
3. Under Advanced Options:
   - Set Read Preference to "Primary"
   - Enable "Retry Writes"

## Troubleshooting Steps
1. First try Option 1 (current .env setting)
2. If still failing, try Option 2
3. For persistent issues, use Option 3
4. Update your system's OpenSSL if possible
5. Check Windows firewall/antivirus settings