FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install omniroute globally
RUN npm install -g omniroute

# OmniRoute exposes API and dashboard on 20128
EXPOSE 20128

# Run OmniRoute
CMD ["omniroute"]
