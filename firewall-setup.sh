#!/bin/bash
set -e

PORT=47823

echo "🔥 Configuring Firewall"
echo "━━━━━━━━━━━━━━━━━━━━━━"

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root"
    exit 1
fi

# Install UFW
if ! command -v ufw &> /dev/null; then
    apt-get update -qq
    apt-get install -y -qq ufw
fi

# Reset and configure
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH and custom port
ufw allow 22/tcp comment 'SSH'
ufw allow ${PORT}/tcp comment 'AI Enhancer'

# Block common ports
ufw deny 80/tcp comment 'Block HTTP'
ufw deny 443/tcp comment 'Block HTTPS'
ufw deny 8000/tcp
ufw deny 8080/tcp
ufw deny 3000/tcp

ufw --force enable

echo ""
echo "✅ Firewall configured"
echo ""
ufw status verbose
