# first stage 
FROM node:24 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci 
COPY . .
RUN npm run build -- --configuration production


# second stage
FROM nginx:alpine
COPY --from=builder /app/dist/lms-student-web/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
