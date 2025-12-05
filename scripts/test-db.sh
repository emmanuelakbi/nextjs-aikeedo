#!/bin/bash

# Test Database Management Script
# This script helps manage the PostgreSQL test database for the Next.js application

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

case "$1" in
  start)
    echo "Starting test database..."
    docker-compose -f docker-compose.test.yml up -d
    echo "Waiting for database to be ready..."
    sleep 5
    echo "Test database is ready at postgresql://aikeedo:password@localhost:5433/aikeedo_dev"
    ;;
    
  stop)
    echo "Stopping test database..."
    docker-compose -f docker-compose.test.yml down
    echo "Test database stopped"
    ;;
    
  restart)
    echo "Restarting test database..."
    docker-compose -f docker-compose.test.yml restart
    echo "Test database restarted"
    ;;
    
  reset)
    echo "Resetting test database (this will delete all data)..."
    docker-compose -f docker-compose.test.yml down -v
    docker-compose -f docker-compose.test.yml up -d
    echo "Waiting for database to be ready..."
    sleep 5
    echo "Running migrations..."
    npm run db:migrate
    echo "Test database reset complete"
    ;;
    
  migrate)
    echo "Running database migrations..."
    npm run db:migrate
    echo "Migrations complete"
    ;;
    
  seed)
    echo "Seeding test database..."
    npm run db:seed
    echo "Seeding complete"
    ;;
    
  logs)
    docker-compose -f docker-compose.test.yml logs -f postgres-test
    ;;
    
  status)
    docker-compose -f docker-compose.test.yml ps
    ;;
    
  *)
    echo "Test Database Management Script"
    echo ""
    echo "Usage: $0 {start|stop|restart|reset|migrate|seed|logs|status}"
    echo ""
    echo "Commands:"
    echo "  start    - Start the test database container"
    echo "  stop     - Stop the test database container"
    echo "  restart  - Restart the test database container"
    echo "  reset    - Reset the database (delete all data and run migrations)"
    echo "  migrate  - Run database migrations"
    echo "  seed     - Seed the database with test data"
    echo "  logs     - Show database logs"
    echo "  status   - Show database container status"
    echo ""
    exit 1
    ;;
esac
