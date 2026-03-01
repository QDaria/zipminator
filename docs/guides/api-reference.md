# API Reference

The Zipminator API is a FastAPI application providing HTTP access to post-quantum cryptographic operations. Interactive documentation is available at `/docs` (Swagger UI) and `/redoc` (ReDoc) when the server is running.

**Base URL:** `http://localhost:8000` (development) or `https://api.zipminator.com` (production)

---

## Authentication

The API uses two authentication mechanisms:

### JWT Bearer Tokens

Used for user management and API key administration. Obtained via the `/auth/login` endpoint.

```
Authorization: Bearer <jwt-token>
```

Tokens expire after 30 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`).

### API Keys

Used for cryptographic operations (`/v1/*` endpoints). Created via the `/v1/keys/` endpoint. API keys are prefixed with `zip_` and transmitted as Bearer tokens.

```
Authorization: Bearer zip_<key>
```

API keys are hashed with SHA-256 before storage. The plaintext key is only returned once, at creation time.

---

## Endpoints

### Health and Readiness

#### `GET /health`

Basic health check. No authentication required.

**Response** `200 OK`:

```json
{
  "status": "healthy",
  "version": "0.1.0",
  "service": "zipminator-api"
}
```

#### `GET /ready`

Readiness check that verifies all dependencies (database, Redis, Rust CLI binary). No authentication required.

**Response** `200 OK` (all services healthy):

```json
{
  "status": "ready",
  "services": {
    "database": "ok",
    "redis": "ok",
    "cli": "ok"
  }
}
```

**Response** `503 Service Unavailable` (one or more services degraded):

```json
{
  "status": "not_ready",
  "services": {
    "database": "ok",
    "redis": "error: Connection refused",
    "cli": "ok"
  }
}
```

---

### User Management

#### `POST /auth/register`

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `email` | string (email) | yes | Valid email address |
| `password` | string | yes | 8-100 characters |

**Response** `201 Created`:

```json
{
  "id": 1,
  "email": "user@example.com",
  "is_active": true,
  "created_at": "2025-11-17T12:00:00Z"
}
```

**Errors:**

| Status | Detail |
|---|---|
| `400` | Email already registered |

---

#### `POST /auth/login`

Authenticate and receive a JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** `200 OK`:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Errors:**

| Status | Detail |
|---|---|
| `401` | Incorrect email or password |
| `403` | User account is inactive |

---

#### `GET /auth/me`

Get current user information. Requires JWT authentication.

**Response** `200 OK`:

```json
{
  "id": 1,
  "email": "user@example.com",
  "is_active": true,
  "created_at": "2025-11-17T12:00:00Z"
}
```

---

### API Key Management

All key management endpoints require JWT authentication.

#### `POST /v1/keys/`

Create a new API key.

**Request Body:**

```json
{
  "name": "production-key",
  "rate_limit": 1000
}
```

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `name` | string | yes | -- | 1-100 characters |
| `rate_limit` | integer | no | 1000 | 1-10000 requests/hour |

**Response** `201 Created`:

```json
{
  "id": 1,
  "name": "production-key",
  "key": "zip_a1b2c3d4e5f6...",
  "rate_limit": 1000,
  "is_active": true,
  "created_at": "2025-11-17T12:00:00Z",
  "last_used_at": null
}
```

The `key` field is only included in the creation response. Store it securely; it cannot be retrieved later.

---

#### `GET /v1/keys/`

List all API keys for the authenticated user. Keys are returned without the plaintext key value.

**Response** `200 OK`:

```json
{
  "keys": [
    {
      "id": 1,
      "name": "production-key",
      "key": null,
      "rate_limit": 1000,
      "is_active": true,
      "created_at": "2025-11-17T12:00:00Z",
      "last_used_at": "2025-11-17T14:30:00Z"
    }
  ],
  "total": 1
}
```

---

#### `GET /v1/keys/{key_id}`

Get details for a specific API key.

**Response** `200 OK`: Same schema as individual key in the list response.

**Errors:**

| Status | Detail |
|---|---|
| `404` | API key not found |

---

#### `DELETE /v1/keys/{key_id}`

Permanently delete an API key.

**Response** `204 No Content`

**Errors:**

| Status | Detail |
|---|---|
| `404` | API key not found |

---

#### `PATCH /v1/keys/{key_id}/deactivate`

Deactivate an API key without deleting it. Deactivated keys return `403 Forbidden` on use.

**Response** `200 OK`: Updated key object with `is_active: false`.

**Errors:**

| Status | Detail |
|---|---|
| `404` | API key not found |

---

### Cryptographic Operations

All crypto endpoints require API key authentication.

#### `POST /v1/keygen`

Generate a CRYSTALS-Kyber-768 keypair.

**Request Body:**

```json
{
  "use_quantum": false
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `use_quantum` | boolean | no | `false` | Use quantum entropy for key generation |

**Response** `200 OK`:

```json
{
  "public_key": "base64-encoded-1184-bytes...",
  "secret_key": "base64-encoded-2400-bytes...",
  "algorithm": "kyber768",
  "quantum_entropy": false
}
```

| Field | Description |
|---|---|
| `public_key` | Base64-encoded Kyber-768 public key (1184 bytes raw) |
| `secret_key` | Base64-encoded Kyber-768 secret key (2400 bytes raw) |
| `algorithm` | Always `"kyber768"` |
| `quantum_entropy` | Whether quantum entropy was used for generation |

**Example:**

```bash
curl -X POST http://localhost:8000/v1/keygen \
  -H "Authorization: Bearer zip_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"use_quantum": true}'
```

---

#### `POST /v1/encrypt`

Encrypt data using a Kyber-768 public key. The plaintext is encrypted with AES-256-GCM using the KEM-derived shared secret as the symmetric key.

**Request Body:**

```json
{
  "public_key": "base64-encoded-public-key",
  "plaintext": "base64-encoded-plaintext"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `public_key` | string | yes | Base64-encoded Kyber-768 public key |
| `plaintext` | string | yes | Base64-encoded plaintext data |

**Response** `200 OK`:

```json
{
  "ciphertext": "base64-encoded-ciphertext",
  "shared_secret": "base64-encoded-32-byte-shared-secret",
  "algorithm": "kyber768",
  "bytes_encrypted": 26
}
```

**Example:**

```bash
PLAINTEXT=$(echo -n "Sensitive data" | base64)

curl -X POST http://localhost:8000/v1/encrypt \
  -H "Authorization: Bearer zip_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"public_key\": \"$PUBLIC_KEY\", \"plaintext\": \"$PLAINTEXT\"}"
```

---

#### `POST /v1/decrypt`

Decrypt data using a Kyber-768 secret key.

**Request Body:**

```json
{
  "secret_key": "base64-encoded-secret-key",
  "ciphertext": "base64-encoded-ciphertext"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `secret_key` | string | yes | Base64-encoded Kyber-768 secret key |
| `ciphertext` | string | yes | Base64-encoded ciphertext from encrypt |

**Response** `200 OK`:

```json
{
  "plaintext": "base64-encoded-plaintext",
  "shared_secret": "base64-encoded-32-byte-shared-secret",
  "algorithm": "kyber768",
  "bytes_decrypted": 26
}
```

**Example:**

```bash
curl -X POST http://localhost:8000/v1/decrypt \
  -H "Authorization: Bearer zip_your_api_key" \
  -H "Content-Type: application/json" \
  -d "{\"secret_key\": \"$SECRET_KEY\", \"ciphertext\": \"$CIPHERTEXT\"}"
```

---

## Rate Limiting

Each API key has an independent rate limit (default: 1000 requests/hour, configurable up to 10000). Rate limit state is tracked in Redis.

When the rate limit is exceeded, the API returns:

```
HTTP 429 Too Many Requests
```

The `last_used_at` timestamp on each API key is updated on every successful request.

---

## Error Responses

All errors follow a consistent format:

```json
{
  "detail": "Human-readable error message"
}
```

### Common Error Codes

| Status Code | Meaning | Common Causes |
|---|---|---|
| `400` | Bad Request | Invalid input, duplicate email |
| `401` | Unauthorized | Missing, expired, or invalid token/API key |
| `403` | Forbidden | Inactive user or deactivated API key |
| `404` | Not Found | Resource does not exist or does not belong to user |
| `422` | Validation Error | Request body fails Pydantic validation |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Cryptographic operation failure, backend error |

### Validation Errors

FastAPI returns detailed validation errors for malformed requests:

```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "password"],
      "msg": "String should have at least 8 characters",
      "input": "short",
      "ctx": {"min_length": 8}
    }
  ]
}
```

---

## Full Workflow Example

A complete encrypt-then-decrypt workflow using `curl`:

```bash
# 1. Register
curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo12345678"}'

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo12345678"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# 3. Create API key
API_KEY=$(curl -s -X POST http://localhost:8000/v1/keys/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"demo","rate_limit":100}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['key'])")

# 4. Generate keypair
KEYS=$(curl -s -X POST http://localhost:8000/v1/keygen \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"use_quantum":false}')
PK=$(echo $KEYS | python3 -c "import sys,json;print(json.load(sys.stdin)['public_key'])")
SK=$(echo $KEYS | python3 -c "import sys,json;print(json.load(sys.stdin)['secret_key'])")

# 5. Encrypt
PLAINTEXT=$(echo -n "Hello, post-quantum world!" | base64)
ENCRYPTED=$(curl -s -X POST http://localhost:8000/v1/encrypt \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"public_key\":\"$PK\",\"plaintext\":\"$PLAINTEXT\"}")
CT=$(echo $ENCRYPTED | python3 -c "import sys,json;print(json.load(sys.stdin)['ciphertext'])")

# 6. Decrypt
DECRYPTED=$(curl -s -X POST http://localhost:8000/v1/decrypt \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"secret_key\":\"$SK\",\"ciphertext\":\"$CT\"}")
echo $DECRYPTED | python3 -c "import sys,json,base64;print(base64.b64decode(json.load(sys.stdin)['plaintext']).decode())"
# Output: Hello, post-quantum world!
```

---

## OpenAPI Specification

The full OpenAPI 3.0 specification is available at:

- JSON: `GET /openapi.json`
- Swagger UI: `GET /docs`
- ReDoc: `GET /redoc`
