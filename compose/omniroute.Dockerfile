FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install build dependencies for native modules and proxychains
RUN apk add --no-cache python3 make g++ proxychains-ng

# Configure Proxychains to use Jakarta Proxy (Tencent)
RUN echo "strict_chain" > /etc/proxychains.conf && \
    echo "proxy_dns" >> /etc/proxychains.conf && \
    echo "remote_dns_subnet 224" >> /etc/proxychains.conf && \
    echo "tcp_read_time_out 15000" >> /etc/proxychains.conf && \
    echo "tcp_connect_time_out 8000" >> /etc/proxychains.conf && \
    echo "[ProxyList]" >> /etc/proxychains.conf && \
    echo "http 43.157.202.234 8888" >> /etc/proxychains.conf

# Install omniroute globally
RUN npm install -g omniroute

# OmniRoute exposes API and dashboard on 20128
EXPOSE 20128

# Run OmniRoute using Proxychains
CMD ["proxychains4", "omniroute"]
