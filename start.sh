#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
INSTALL_DIR="/opt/.cache/system-updates/ai-enhancer"
PORT=47823
SERVER_IP="72.61.170.227"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  AI Image Enhancer - Secure Deployment    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📍 Install Path:${NC} ${INSTALL_DIR}"
echo -e "${YELLOW}🔌 Port:${NC} ${PORT}"
echo -e "${YELLOW}🌐 Server IP:${NC} ${SERVER_IP}"
echo -e "${YELLOW}⚙️  No Nginx:${NC} Using Python static server"
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Error: Please run as root${NC}"
    echo "Usage: sudo ./start.sh"
    exit 1
fi

# Create hidden directory
echo -e "${BLUE}[1/7]${NC} Creating hidden directory..."
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"
echo -e "${GREEN}✓${NC} Directory created"

# Install Docker
echo -e "${BLUE}[2/7]${NC} Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓${NC} Docker installed"
else
    echo -e "${GREEN}✓${NC} Docker already installed"
fi

# Install Docker Compose
echo -e "${BLUE}[3/7]${NC} Checking Docker Compose..."
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose..."
    apt-get update -qq
    apt-get install -y -qq docker-compose-plugin
    echo -e "${GREEN}✓${NC} Docker Compose installed"
else
    echo -e "${GREEN}✓${NC} Docker Compose already installed"
fi

# Stop existing
echo -e "${BLUE}[4/7]${NC} Stopping existing containers..."
docker compose down 2>/dev/null || true
echo -e "${GREEN}✓${NC} Stopped"

# Build images
echo -e "${BLUE}[5/7]${NC} Building Docker images..."
echo -e "${YELLOW}⏳ This will take 10-15 minutes (downloading AI models)${NC}"
docker compose build

echo -e "${GREEN}✓${NC} Images built"

# Start services
echo -e "${BLUE}[6/7]${NC} Starting services..."
docker compose up -d
echo -e "${GREEN}✓${NC} Services started"

# Health check
echo -e "${BLUE}[7/7]${NC} Checking service health..."
HEALTH_URL="http://localhost:${PORT}/health"

for i in {1..60}; do
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} All services healthy"
        break
    fi
    
    if [ $i -eq 60 ]; then
        echo -e "${RED}❌ Health check timeout${NC}"
        echo "Showing logs:"
        docker compose logs --tail=50
        exit 1
    fi
    
    echo -ne "  Waiting for services... ${i}/60\r"
    sleep 2
done

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      DEPLOYMENT SUCCESSFUL ✅               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Access Information:${NC}"
echo -e "  🌐 URL: ${GREEN}http://${SERVER_IP}:${PORT}${NC}"
echo -e "  📁 Path: ${YELLOW}${INSTALL_DIR}${NC}"
echo ""
echo -e "${BLUE}Container Status:${NC}"
docker compose ps
echo ""
echo -e "${BLUE}Quick Commands:${NC}"
echo -e "  View logs:    ${YELLOW}cd ${INSTALL_DIR} && docker compose logs -f${NC}"
echo -e "  Stop:         ${YELLOW}cd ${INSTALL_DIR} && docker compose down${NC}"
echo -e "  Restart:      ${YELLOW}cd ${INSTALL_DIR} && docker compose restart${NC}"
echo -e "  Status:       ${YELLOW}cd ${INSTALL_DIR} && docker compose ps${NC}"
echo ""
echo -e "${GREEN}✨ Your hidden AI enhancer is ready!${NC}"
