#!/bin/bash
set -e

echo "🚀 Zipminator API Setup Script"
echo "================================"

# Check if Rust CLI exists
if [ ! -f "../cli/target/release/zipminator" ]; then
    echo "❌ Error: Rust CLI binary not found at ../cli/target/release/zipminator"
    echo "Please build it first:"
    echo "  cd ../cli && cargo build --release"
    exit 1
fi

echo "✅ Rust CLI binary found"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example"
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Start Docker services
echo ""
echo "🐳 Starting Docker services (PostgreSQL, Redis, API)..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Run database migrations
echo ""
echo "🗄️  Running database migrations..."
docker-compose exec -T api alembic upgrade head

echo ""
echo "✅ Setup complete!"
echo ""
echo "📍 API running at: http://localhost:8000"
echo "📚 API docs at: http://localhost:8000/docs"
echo "🔍 Health check: http://localhost:8000/health"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f api"
echo ""
echo "To stop services:"
echo "  docker-compose down"
