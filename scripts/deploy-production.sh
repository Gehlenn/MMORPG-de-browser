#!/bin/bash

# Production Deployment Script
# Usage: ./scripts/deploy-production.sh

set -e

echo "🚀 Starting Production Deployment - Gehlenn MMORPG v0.4.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "Node.js/npm is not installed"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    print_success "All dependencies checked"
}

# Validate environment variables
validate_env() {
    print_status "Validating environment variables..."
    
    if [ ! -f ".env.production" ]; then
        print_error ".env.production file not found"
        print_status "Please copy .env.example to .env.production and configure your values"
        exit 1
    fi
    
    # Load environment variables
    source .env.production
    
    # Check required variables
    required_vars=("DATABASE_URL" "SUPABASE_URL" "REDIS_URL" "JWT_SECRET" "SESSION_SECRET")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] || [[ "${!var}" == *"["* ]]; then
            print_error "Environment variable $var is not set or contains placeholder"
            exit 1
        fi
    done
    
    print_success "Environment variables validated"
}

# Build and test locally
build_local() {
    print_status "Building and testing locally..."
    
    # Clean previous builds
    npm run clean || true
    
    # Install dependencies
    npm ci
    
    # Run tests
    npm run test
    
    # Build production
    npm run build
    
    print_success "Local build completed"
}

# Deploy to Railway (Backend)
deploy_backend() {
    print_status "Deploying backend to Railway..."
    
    cd server
    
    # Deploy to Railway
    railway login
    railway deploy
    
    # Get the deployed URL
    BACKEND_URL=$(railway domain)
    
    cd ..
    
    print_success "Backend deployed to: $BACKEND_URL"
}

# Deploy to Vercel (Frontend)
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    cd client
    
    # Deploy to Vercel
    vercel --prod
    
    # Get the deployed URL
    FRONTEND_URL=$(vercel ls --scope me | grep "gehlenn-mmorpg" | awk '{print $3}')
    
    cd ..
    
    print_success "Frontend deployed to: $FRONTEND_URL"
}

# Setup Supabase database
setup_database() {
    print_status "Setting up Supabase database..."
    
    # Check if supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        print_warning "Supabase CLI not found. Installing..."
        npm install -g supabase
    fi
    
    # Login and setup
    supabase login
    supabase link --project-ref $(grep SUPABASE_URL .env.production | cut -d'/' -f4 | cut -d'.' -f1)
    
    # Run migrations
    supabase db push
    
    print_success "Database setup completed"
}

# Setup Redis Cloud
setup_redis() {
    print_status "Setting up Redis Cloud..."
    
    print_warning "Please manually configure Redis Cloud at https://redis.cloud/"
    print_status "Update REDIS_URL in .env.production with your Redis Cloud connection string"
    
    read -p "Press Enter after configuring Redis Cloud..."
}

# Run health checks
health_check() {
    print_status "Running health checks..."
    
    # Load environment variables
    source .env.production
    
    # Check backend health
    if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Check frontend accessibility
    if curl -f "$FRONTEND_URL" > /dev/null 2>&1; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        exit 1
    fi
    
    print_success "All health checks passed"
}

# Main deployment flow
main() {
    print_status "Starting production deployment process..."
    
    check_dependencies
    validate_env
    build_local
    setup_database
    setup_redis
    deploy_backend
    deploy_frontend
    health_check
    
    print_success "🎉 Production deployment completed successfully!"
    print_status "Backend URL: $BACKEND_URL"
    print_status "Frontend URL: $FRONTEND_URL"
    print_status "Version: 0.4.0"
}

# Handle errors
trap 'print_error "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@"
