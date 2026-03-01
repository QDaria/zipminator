# Zipminator API

FastAPI-based REST API for quantum-secured post-quantum cryptography using Kyber768.

## Features

- **Post-Quantum Cryptography**: Kyber768 key encapsulation mechanism (NIST standardized)
- **Quantum Entropy**: Optional quantum random number generation for key generation
- **RESTful API**: FastAPI with automatic OpenAPI documentation
- **Authentication**: JWT-based user authentication + API key management
- **Rate Limiting**: Redis-based rate limiting for API endpoints
- **Database**: PostgreSQL for user/key storage with SQLAlchemy ORM
- **Logging**: Comprehensive operation logging and metrics
- **Docker**: Containerized deployment with docker-compose

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  FastAPI App │────▶│  Rust CLI   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────┴───────┐
                    │              │
              ┌─────▼────┐   ┌────▼─────┐
              │PostgreSQL│   │  Redis   │
              └──────────┘   └──────────┘
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Rust CLI binary at `../cli/target/release/zipminator`

### 1. Clone and Setup

```bash
cd /Users/mos/dev/zipminator/api

# Copy environment file
cp .env.example .env

# Edit .env if needed (defaults work for local development)
```

### 2. Run with Docker Compose

```bash
# Start all services (PostgreSQL, Redis, API)
docker-compose up -d

# View logs
docker-compose logs -f api

# API will be available at http://localhost:8000
```

### 3. Initialize Database

```bash
# Run migrations
docker-compose exec api alembic upgrade head
```

### 4. Access API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## Development Setup

### Local Development (without Docker)

```bash
# Install dependencies
pip install -r requirements.txt

# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run migrations
alembic upgrade head

# Start development server
uvicorn src.main:app --reload --port 8000
```

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## API Endpoints

### Health

- `GET /health` - Basic health check
- `GET /ready` - Readiness check (verifies all services)

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

### API Keys

- `POST /v1/keys/` - Create API key
- `GET /v1/keys/` - List API keys
- `GET /v1/keys/{id}` - Get API key details
- `DELETE /v1/keys/{id}` - Delete API key
- `PATCH /v1/keys/{id}/deactivate` - Deactivate API key

### Cryptography

- `POST /v1/keygen` - Generate Kyber768 keypair
- `POST /v1/encrypt` - Encrypt data
- `POST /v1/decrypt` - Decrypt data

## Usage Examples

### 1. Register and Login

```bash
# Register user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword123"}'

# Login to get JWT token
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword123"}'
```

### 2. Create API Key

```bash
# Create API key (requires JWT token)
curl -X POST http://localhost:8000/v1/keys/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My API Key", "rate_limit": 1000}'
```

### 3. Generate Keypair

```bash
# Generate Kyber768 keypair
curl -X POST http://localhost:8000/v1/keygen \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"use_quantum": false}'
```

### 4. Encrypt Data

```bash
# Encrypt data (plaintext must be base64-encoded)
curl -X POST http://localhost:8000/v1/encrypt \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "public_key": "BASE64_PUBLIC_KEY",
    "plaintext": "SGVsbG8sIHdvcmxkIQ=="
  }'
```

### 5. Decrypt Data

```bash
# Decrypt data
curl -X POST http://localhost:8000/v1/decrypt \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "secret_key": "BASE64_SECRET_KEY",
    "ciphertext": "BASE64_CIPHERTEXT"
  }'
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v
```

### Test Coverage

Current test suite includes 15+ tests covering:
- Health checks (3 tests)
- Authentication (6 tests)
- API key management (7 tests)
- Cryptographic operations (4 tests)

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://zipminator:dev_password@localhost:5432/zipminator_dev` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `SECRET_KEY` | JWT secret key | `your-secret-key-change-in-production` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token expiration | `30` |
| `CLI_PATH` | Path to Rust CLI binary | `../cli/target/release/zipminator` |
| `CORS_ORIGINS` | Allowed CORS origins | `["http://localhost:3000"]` |
| `DEFAULT_RATE_LIMIT` | Default rate limit (req/hour) | `1000` |

## Project Structure

```
api/
├── src/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── models/              # Pydantic models
│   │   ├── auth.py
│   │   ├── crypto.py
│   │   └── keys.py
│   ├── routes/              # API endpoints
│   │   ├── health.py
│   │   ├── auth.py
│   │   ├── keys.py
│   │   └── crypto.py
│   ├── services/            # Business logic
│   │   ├── rust_cli.py      # Rust CLI wrapper
│   │   ├── auth.py          # Authentication
│   │   └── rate_limit.py    # Rate limiting
│   ├── db/                  # Database
│   │   ├── database.py      # SQLAlchemy setup
│   │   ├── models.py        # DB models
│   │   └── migrations/      # Alembic migrations
│   └── middleware/          # Middleware
│       ├── auth.py
│       └── logging.py
├── tests/                   # Test suite
├── docker-compose.yml       # Docker Compose config
├── Dockerfile               # Docker image
├── requirements.txt         # Python dependencies
├── alembic.ini             # Alembic configuration
└── README.md               # This file
```

## Database Schema

### Users
- `id`: Primary key
- `email`: Unique email address
- `password_hash`: Bcrypt hashed password
- `is_active`: Account status
- `created_at`: Registration timestamp

### API Keys
- `id`: Primary key
- `user_id`: Foreign key to users
- `key_hash`: SHA256 hashed API key
- `name`: Human-readable name
- `rate_limit`: Requests per hour limit
- `is_active`: Key status
- `created_at`: Creation timestamp
- `last_used_at`: Last usage timestamp

### Encryption Logs
- `id`: Primary key
- `user_id`: Foreign key to users
- `api_key_id`: Foreign key to API keys
- `operation`: encrypt/decrypt/keygen
- `bytes_processed`: Data size
- `used_quantum`: Quantum entropy flag
- `duration_ms`: Operation duration
- `success`: Success flag
- `created_at`: Operation timestamp

## Performance

- **Key Generation**: ~35 μs (Rust CLI)
- **Encryption**: ~50 μs (Rust CLI)
- **Decryption**: ~45 μs (Rust CLI)
- **API Overhead**: ~10-20 ms (including database logging)

## Security

- **Password Hashing**: Bcrypt with automatic salt
- **JWT Tokens**: HS256 algorithm, 30-minute expiration
- **API Keys**: SHA256 hashed, rate-limited
- **CORS**: Configurable allowed origins
- **Rate Limiting**: Redis-based, per API key
- **SQL Injection**: SQLAlchemy ORM prevents injection
- **Input Validation**: Pydantic models validate all inputs

## Production Deployment

### Environment Variables (Production)

```bash
# Generate secure secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Update .env
SECRET_KEY=<generated-secret-key>
DATABASE_URL=postgresql://user:pass@prod-db:5432/zipminator
REDIS_URL=redis://prod-redis:6379
CORS_ORIGINS=["https://yourdomain.com"]
```

### Docker Production Build

```bash
# Build production image
docker build -t zipminator-api:latest .

# Run with production settings
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  -e SECRET_KEY="..." \
  zipminator-api:latest
```

## Troubleshooting

### Rust CLI Not Found

```bash
# Verify CLI binary exists
ls -la ../cli/target/release/zipminator

# If not, build it
cd ../cli
cargo build --release
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
alembic upgrade head
```

### Redis Connection Errors

```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

## Roadmap

- [ ] Web dashboard for key management
- [ ] Batch encryption endpoints
- [ ] WebSocket support for real-time operations
- [ ] Metrics and monitoring (Prometheus)
- [ ] Multi-factor authentication
- [ ] S3 integration for encrypted file storage
- [ ] Kubernetes deployment manifests

## License

Dual licensed:
- MIT License (open-source use)
- Commercial License (enterprise use)

See LICENSE file for details.

## Support

- Documentation: http://localhost:8000/docs
- Issues: GitHub Issues
- Email: support@zipminator.io
