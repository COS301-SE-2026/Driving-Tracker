# Driving Tracker - OmniTech

> An intelligent Android driving companion that unifies sensor fusion, vehicle diagnostics, behavioural analytics, and social engagement into one platform - making safer, more efficient driving accessible and rewarding for everyday drivers.

**Client:** Gendac (Software, Innovations & IoT)

---

## Table of Contents

- [Project Description](#project-description)
- [Documentation](#documentation)
- [Meet OmniTech](#meet-omnitech)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Branching Strategy](#branching-strategy)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Backend & Frontend - Docker Setup](#backend--frontend--docker-setup)
  - [Android App - Android Studio Setup](#android-app--android-studio-setup)

---

## Project Description

Driving Tracker is a COS 301 Capstone Project developed for Gendac (Software, Innovations & IoT). It is a next-generation Android driving assistant that brings together phone sensors, maps, and OBD-II vehicle data to analyse driving behaviour, fuel efficiency, and vehicle health - wrapped in gamification and social features to make safer driving engaging and rewarding.

The system operates across three layers:
- **Data Collection** - phone sensors, GPS, and Bluetooth OBD-II (ELM327) provide a 360° view of vehicle and driver behaviour.
- **Intelligent Analysis** - a modular Azure-hosted backend processes driving patterns, safety scores, eco-driving insights, and vehicle health in real time.
- **Engagement** - leaderboards, badges, weekly challenges, and a family safety network transform raw data into a motivating experience.

---

## Documentation
[Software Requirement Specification](docs/SRS.pdf)\
[Github Project Board](https://github.com/orgs/COS301-SE-2026/projects/56)

---

## Meet OmniTech

| <img src="docs/images/Brayden.jpeg" alt="Brayden Butler" width="280"/>|
|:---:|
| **Brayden Butler** |
| Team Lead • Backend |
| [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/Brayden-ux) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/brayden-butler-b96591328?) |

| <img src="docs/images/Sente.jpeg" alt="Sente Mngomezulu" width="280"/>|
|:---:|
| **Sentelweyinkhosi Mngomezulu** |
| Backend Engineer |
| [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/SenteMngomez) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sentelweyinkhosi-mngomezulu?) |

| <img src="docs/images/Mosa.jpeg" alt="Mosa Leiee" width="280"/>|
|:---:|
| **Mosa Leiee** |
| Frontend Engineer |
| [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/Mosa-L) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mosa-leiee?) |

| <img src="docs/images/Kundai.jpeg" alt="Kundai Ndemera" width="280"/>|
|:---:|
| **Kundai Ndemera** |
| Frontend Engineer |
| [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/kundaindemera) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/kundai-ndemera?) |

| <img src="docs/images/Lesedi.jpeg" alt="Lesedi Padi" width="280"/>|
|:---:|
| **Lesedi Padi** |
| Backend Engineer |
| [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/Padi-le) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/lesedi-padi-b90ba3271?) |

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Mobile** | Kotlin, Android Sensor API, Mapbox, Bluetooth OBD (ELM327), Retrofit |
| **Backend** | Node.js, Express, REST API, WebSockets, JWT Auth |
| **Database** | PostgreSQL, Redis |
| **Infrastructure** | Microsoft Azure App Service, Azure Functions, Azure Blob Storage |
| **Web Dashboard** | React, Next.js, TypeScript, Tailwind CSS |

---

## Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable, prod-ready releases only |
| `develop` | Integration branch - all PRs merge here |
| `feature/name/description` | New feature development |
| `fix/name/description` | Bug fixes |
| `docs/name/description` | Documentation updates |
| `chore/name/description` | Config, tooling, setup |

---

## Getting Started (Install + Run from Scratch)

This project is composed of 3 parts:
- Backend API (Node/Express) 
- Frontend dashboard (Next.js)
- Android app (Android Studio/Gradle)

### Prerequisites

Install every tool below before continuing. Each one is required.

---

#### 1. Node.js (v20)

Node.js is the runtime that powers the backend and frontend build tools. We use version 20.

#### 2. Yarn

Yarn is the package manager used for both the backend and frontend. It is enabled through **corepack**, which ships with Node.js - no separate download needed.

#### 3. Docker Desktop

Docker runs the backend, frontend, and PostgreSQL database inside isolated containers. This means you do not need to install or configure a database manually - Docker handles everything.

#### 4. Android Studio 

Android Studio is the official IDE for building the Android app. It includes the Kotlin compiler, Android SDK, emulator and all build tools.

#### To be completed...