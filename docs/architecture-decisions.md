Angular Architecture & Deployment Decisions ## Overview

This document records the architectural and deployment decisions made for the Angular frontend, including:

Environment configuration **API** **URL** management Angular production builds Dockerization Nginx Local development vs Docker testing Planned Docker Compose / Kubernetes integration

The purpose of this document is to explain what was done, why it was done, and what is planned next.

## Angular Environment Configuration

The project uses Angular environment files to manage configuration that differs between development and production.

Current files:

src/
└── environments/
    ├── environment.ts
    └── environment.prod.ts
### Development Environment

environment.ts:

export const environment = {
    production: false,
    baseUrl: '[http://**127**.0.0.1:**8000**/',](http://**127**.0.0.1:**8000**/',)
};
Why?

During local development, the Angular application runs separately from the Django backend.

For example:

Angular: [http://localhost:**4200**](http://localhost:**4200**)

Django: [http://**127**.0.0.1:**8000**](http://**127**.0.0.1:**8000**)

Therefore Angular needs to know where the local backend is located.

### Production Environment

environment.prod.ts:

export const environment = {
    production: true,
    baseUrl: '/api/',
};
Why?

The planned production architecture will use a reverse proxy / Ingress to route **API** requests.

The frontend will use:

/api/

instead of hardcoding the Django server's public **URL**.

The planned routing is:

Browser
    |
    v
### Application Domain
    |
    +---- /       ---> Angular
    |
    +---- /api/   ---> Django

This avoids coupling the Angular application to a specific backend hostname.

## Angular File Replacement

The production configuration in angular.json contains:

*fileReplacements*: [
    {
    *replace*: *src/environments/environment.ts*,
    *with*: *src/environments/environment.prod.ts*
    }
]
Why?

Angular services can import:

import { environment } from '.../environments/environment';

The application does not directly import environment.prod.ts.

When Angular performs a production build, Angular replaces:

environment.ts

with:

environment.prod.ts

Therefore the same application code can use:

environment.baseUrl

in both environments.

Development
environment.ts
    |
    v
[http://**127**.0.0.1:**8000**/](http://**127**.0.0.1:**8000**/)
Production
environment.ts
    |
    | Angular file replacement
    v
environment.prod.ts
    |
    v
/api/
4
## Local Development vs Docker

There are two different workflows.

### Local Development

During active development:

ng serve

or:

npm start

is used.

This provides Angular's development server and development features such as:

Hot reload Fast feedback Development source maps Easier debugging

Typical **URL**:

[http://localhost:**4200**](http://localhost:**4200**)

The application uses:

environment.ts ### Dockerized Application

Docker is used when we want to test or deploy the application as a production-like application.

The Docker image contains a production Angular build.

The Docker image does not contain both a development build and a production build.

Instead:

Local development
    |
    v
ng serve
    |
    v
Development environment

Docker
    |
    v
Angular production build
    |
    v
Nginx
    |
    v
Production-like application

This means the Docker image can still be run locally for testing.

For example:

docker run -p **8080**:80 angular-image

Then the application can be accessed through:

[http://localhost:**8080**](http://localhost:**8080**)

Running the production build locally does not mean the entire machine or Docker environment is *production*. It simply means Angular was compiled using its production configuration.

## Dockerfile

The Angular application uses a multi-stage Docker build.

Current Dockerfile:

# ---------- Build stage ----------

**FROM** node:24 AS builder

**WORKDIR** /app

**COPY** package*.json ./

**RUN** npm ci

**COPY** . .

**RUN** npm run build -- --configuration production

# ---------- Production stage ----------

**FROM** nginx:alpine

**COPY** --from=builder /app/dist/lms-student-web/browser /usr/share/nginx/html

**EXPOSE** 80

**CMD** [*nginx*, *-g*, *daemon off;*] ## Why Multi-Stage Docker Build?

The Dockerfile has two stages.

Stage 1: Angular Build **FROM** node:24 AS builder

Node is required to install Angular dependencies and build the application.

The project is copied into the image and dependencies are installed:

**COPY** package*.json ./ **RUN** npm ci **COPY** . .

Then Angular is compiled:

**RUN** npm run build -- --configuration production

This produces the static Angular files under:

dist/lms-student-web/browser Stage 2: Nginx

The final image uses:

**FROM** nginx:alpine

Only the compiled Angular files are copied:

**COPY** --from=builder /app/dist/lms-student-web/browser /usr/share/nginx/html Why?

Angular does not need Node.js to serve the already-built application.

The final application consists of static files such as:

**HTML** **CSS** JavaScript

Nginx is therefore used to serve those files.

This also keeps the final Docker image smaller and avoids putting unnecessary build tools into the runtime container.

## Why npm run build -- --configuration production?

The command:

npm run build -- --configuration production

runs the project's Angular build script using the production configuration.

It is effectively equivalent to:

ng build --configuration production

assuming the project's package.json contains the normal Angular build script.

The production configuration activates:

fileReplacements

so:

environment.ts

is replaced by:

environment.prod.ts

during the build.

## Why EXPOSE 80?

The final container uses Nginx.

Nginx listens on port 80 by default.

Therefore:

**EXPOSE** 80

documents that the container expects **HTTP** traffic on port 80.

It does not by itself publish the port to the host.

For example:

docker run -p **8080**:80 angular-image

means:

Host                     Container

localhost:**8080**  ----->   port 80
    |
    v
    Nginx
    |
    v
    Angular files
## Why CMD [*nginx*, *-g*, *daemon off;*]?

Nginx normally runs as a daemon.

Docker containers need their main process to remain running.

The command:

**CMD** [*nginx*, *-g*, *daemon off;*]

starts Nginx and keeps it running in the foreground.

This allows the Nginx process to remain the main process of the container.

## API URL Strategy

The current strategy is:

Development [http://**127**.0.0.1:**8000**/](http://**127**.0.0.1:**8000**/) Planned production /api/

The production frontend should not depend directly on an Elastic Beanstalk **URL** or another specific backend hostname.

The planned architecture is:

Browser
    |
    v
### Application Domain
    |
    +---- Angular
    |
    +---- /api/
    |
    v
    Django
    |
    v
    MySQL

This will allow the backend infrastructure to change without requiring the frontend source code to contain a specific backend hostname.

12. **CORS**

During local development, Angular and Django may run on different origins.

For example:

Angular: [http://localhost:**4200**](http://localhost:**4200**)

Django: [http://**127**.0.0.1:**8000**](http://**127**.0.0.1:**8000**)

Because these are different origins, browser **CORS** rules may apply.

Django may therefore need to allow the Angular development origin.

This is mainly a local-development concern with the current setup.

Planned production approach

Using the same application domain and routing /api/ through Nginx/Ingress can avoid unnecessary cross-origin requests:

[https://example.com/](https://example.com/)
    |
    +---- Angular
    |
    +---- /api/ ---> Django

The exact Nginx / Kubernetes Ingress configuration will be decided during the deployment stage.