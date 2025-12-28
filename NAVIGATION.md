# Agentic Test Platform - Navigation Guide

**Platform:** Agentic Test Platform
**Category:** Development
**Status:** Active Development
**Last Updated:** 2025-11-20

---

## Quick Reference

### Essential Files

| File | Purpose | Location |
|------|---------|----------|
| README.md | Project overview and setup | Root |
| .env.example | Environment configuration template | Root |
| package.json / requirements.txt | Dependencies | Root |
| src/index.ts | Application entry point | src/ |

### Key Directories

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `src/` | Source code | Main application code |
| `tests/` | Test files | Unit and integration tests |
| `docs/` | Documentation | API docs, guides, architecture |
| `scripts/` | Utility scripts | Build, deploy, maintenance |
| `config/` | Configuration | App config, environment settings |

---

## Directory Structure

```
agentic-test-platform/
├── docs/
│   ├── api/                    # API documentation
│   ├── architecture/           # System architecture docs
│   ├── guides/                 # Development guides
│   └── deployment/             # Deployment instructions
├── src/
│   ├── Scripts/          # Component 1
│   ├── Component 2/          # Component 2
│   └── Component 3/          # Component 3
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests
├── scripts/
│   ├── setup.sh                # Setup script
│   ├── deploy.sh               # Deployment script
│   └── test.sh                 # Test runner
├── config/
│   ├── development.json        # Dev configuration
│   ├── production.json         # Prod configuration
│   └── test.json               # Test configuration
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── README.md                   # Project documentation
└── NAVIGATION.md               # This file
```

---

## Getting Started

### First Time Setup

1. **Read the README**
   - Start with `README.md` for project overview
   - Review setup instructions and prerequisites

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run Database Setup** (if applicable)
   ```bash
   npm run migrate
   ```

5. **Start Development Server**
   ```bash
   ts-node-dev --respawn --transpile-only scripts/run-lumina-tests.ts
   ```

### Development Workflow

1. **Start Coding**
   - Main entry point: `src/index.ts`
   - API routes: `src/routes/`
   - Database models: `src/models/`

2. **Run Tests**
   ```bash
   npm test
   ```

3. **Check Code Quality**
   ```bash
   npm run lint
   ```

---

## Component Guide

### Scripts

**Purpose:** Utility and automation scripts

**Key Files:**
- `deploy/` - Description
- `maintenance/` - Description

**Dependencies:** Component 2, Component 3

### Component 2

**Purpose:** Component description

**Key Files:**
- `file1` - Description
- `file2` - Description

**Dependencies:** None

### Component 3

**Purpose:** Component description

**Key Files:**
- `file1` - Description
- `file2` - Description

**Dependencies:** Component 2

---

## Common Tasks

### Adding a New Feature

1. Create feature branch: `git checkout -b feature/feature-name`
2. Add code in `src/{component}/`
3. Add tests in `tests/unit/{component}/`
4. Update documentation in `docs/`
5. Run tests: `npm test`
6. Commit and push

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm test -- unit

# Integration tests
npm test -- integration

# With coverage
npm test -- --coverage
```

### Building for Production

```bash
# Build command
tsc

# Output location
dist/
```

### Database Operations

```bash
# Create migration
npm run migrate:create

# Run migrations
npm run migrate:run

# Rollback migration
npm run migrate:rollback

# Seed database
npm run seed
```

---

## Configuration

### Environment Variables

**Required:**
- `DATABASE_URL` - Database connection string
- `API_KEY` - API authentication key
- `PORT` - Server port

**Optional:**
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `CACHE_ENABLED` - Enable caching (true/false)
- `MAX_CONNECTIONS` - Maximum database connections

See `.env.example` for complete list.

### Configuration Files

- `config/development.json` - Development settings
- `config/production.json` - Production settings
- `config/test.json` - Test settings

---

## Dependencies

### Core Dependencies

**Backend:**
- Node.js / TypeScript - Core framework
- PostgreSQL (Prisma) - Core framework
- Authentication library - Core framework

**Frontend:** (if applicable)
- N/A - Core framework
- UI component library - Core framework

### Development Dependencies

- Testing framework - Core framework
- Linting tool - Core framework

---

## Testing

### Test Structure

```
tests/
├── unit/                       # Unit tests
│   ├── {component_1}/
│   ├── {component_2}/
│   └── {component_3}/
├── integration/                # Integration tests
│   ├── api/
│   └── database/
└── e2e/                        # End-to-end tests
    └── scenarios/
```

### Running Tests

- **Unit Tests:** Fast, isolated component tests
- **Integration Tests:** Test component interactions
- **E2E Tests:** Full application flow tests

### Test Coverage

Target: 80%+ code coverage

```bash
# Generate coverage report
npm test -- --coverage

# View report
open coverage/index.html
```

---

## Deployment

### Development Deployment

```bash
# Start dev server
ts-node-dev --respawn --transpile-only scripts/run-lumina-tests.ts

# Access at http://localhost:3000
```

### Production Deployment

1. Build production assets
2. Set environment variables
3. Run database migrations
4. Start production server
5. Monitor logs

See `docs/deployment/` for detailed instructions.

### Docker Deployment

```bash
# Build image
docker build -t agentic-test-platform .

# Run container
docker run -p 3000:3000 --env-file .env agentic-test-platform
```

---

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change PORT in .env
   - Kill process: `lsof -ti:3000 | xargs kill -9`

2. **Database connection fails**
   - Check DATABASE_URL in .env
   - Verify database is running
   - Check firewall settings

3. **Dependencies fail to install**
   - Clear cache
   - Delete node_modules / venv
   - Reinstall

### Logs

**Location:** `logs/` directory

**Log Levels:**
- ERROR - Critical issues
- WARN - Warning messages
- INFO - General information
- DEBUG - Detailed debug information

---

## Documentation

### Available Documentation

- **README.md** - Project overview and quick start
- **docs/api/** - API endpoint documentation
- **docs/architecture/** - System architecture
- **docs/guides/** - Development guides
- **docs/deployment/** - Deployment instructions

### Updating Documentation

When making changes:
1. Update relevant docs in `docs/`
2. Update README.md if needed
3. Update this NAVIGATION.md
4. Keep CHANGELOG.md current

---

## Related Resources

### Internal Resources

- **Main APEXDEV Navigation:** `C:/apexdev/NAVIGATION.md`
- **Archive:** `C:/apexdev/archive/`
- **Shared Services:** `C:/apexdev/shared-services/`

### External Resources

- Project Repository: https://github.com/nexusintelligence/agentic-test-platform
- Documentation Site: https://docs.nexusintelligence.com/agentic-test-platform
- Issue Tracker: https://github.com/nexusintelligence/agentic-test-platform/issues

---

## Development Team

### Key Contacts

- **Project Lead:** TBD
- **Tech Lead:** TBD
- **DevOps:** TBD

### Communication

- **Team Chat:** Slack #agentic-test-platform
- **Email:** agentic-test-platform@nexusintelligence.com
- **Stand-ups:** Daily 9:00 AM

---

## Version History

### Current Version: 1.0.0

**Latest Changes:**
- Feature 1
- Feature 2
- Bug fix 1

See CHANGELOG.md for complete version history.

---

## Quick Commands Reference

```bash
# Setup
npm install

# Development
ts-node-dev --respawn --transpile-only scripts/run-lumina-tests.ts

# Testing
npm test

# Building
tsc

# Linting
npm run lint

# Formatting
npm run format
```

---

**Last Updated:** 2025-11-20
**Maintained by:** Nexus Intelligence Development Team
