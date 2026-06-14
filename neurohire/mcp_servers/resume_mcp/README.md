# Resume MCP Server

The `resume-mcp` server is a dedicated service within the NeuroHire architecture that manages and exposes candidate profiles, resumes, and career details for candidate **Gokul**. It is designed to expose candidate credentials to downstream agent workflows.

## Configuration & Specs

- **Port**: `8001`
- **Default Port HTTP Endpoint**: `http://localhost:8001`
- **Mock Mode Support**: Fully supported. Exposes predefined static structures with verification validation.
- **FastAPI / Uvicorn runner**: Runs `main.py` which loads FastAPI endpoints and MCP capabilities.

## Exposed Tools

All tools are decorated with `@self_healing` to ensure resilient error handling and graceful fallback formatting.

### 1. `get_profile`
- **Description**: Returns Gokul's core contact details, social links (GitHub, portfolio), and location.
- **Arguments**: None
- **Returns**: candidate profile JSON (`ProfileOutput`).

### 2. `get_education`
- **Description**: Returns graduation degree, institute, university, GPA, and year.
- **Arguments**: None
- **Returns**: education details (`EducationOutput`).

### 3. `get_experience`
- **Description**: Returns list of experiences including internship role, description, and period.
- **Arguments**:
  - `role_filter` (Optional `str`): Filter experiences containing this substring.
- **Returns**: list of matching experience objects.

### 4. `get_projects`
- **Description**: Returns projects with project name, live links, and descriptions.
- **Arguments**:
  - `tags` (Optional `List[str]`): Filters projects matching any of the specified tag keywords.
- **Returns**: list of projects.

### 5. `get_skills`
- **Description**: Returns key languages, frameworks, cloud platforms, and ML skills.
- **Arguments**:
  - `category` (Optional `str`): Returns only a specific category like `languages`, `frameworks`, `cloud`, or `ml`.
- **Returns**: skills dictionary.

### 6. `get_publications`
- **Description**: Exposes research paper publications.
- **Arguments**: None
- **Returns**: list of publications.

### 7. `get_certifications`
- **Description**: Returns certifications with issuer and credential details.
- **Arguments**: None
- **Returns**: list of certifications.

### 8. `get_sih_achievement`
- **Description**: Exposes Gokul's performance, team lead title, and results in Smart India Hackathon (SIH) 2025.
- **Arguments**: None
- **Returns**: SIH achievement summary.

## Running the Server

Make sure the parent directory virtual environment is active:
```bash
# Activate virtual environment
..\..\venv\Scripts\Activate.ps1 # On Windows
source ../../venv/bin/activate  # On Linux/macOS

# Run with uvicorn
uvicorn main:app --port 8001
```
