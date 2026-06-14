import logging
from typing import Optional, List, Dict, Any
from config import PROFILE, EDUCATION, EXPERIENCE, PROJECTS, PUBLICATIONS, CERTIFICATIONS, SIH_ACHIEVEMENT, SKILLS
from models import (
    ProfileOutput, EducationOutput, ExperienceItem, ProjectItem,
    PublicationItem, CertificationItem, SihAchievementOutput, SkillsOutput
)

logger = logging.getLogger(__name__)

async def get_profile() -> Dict[str, Any]:
    """
    Get Gokul's core candidate profile details.
    Returns contact information, portfolio, and location.
    """
    try:
        output = ProfileOutput(**PROFILE)
        return output.model_dump()
    except Exception as e:
        logger.error(f"Error in get_profile: {e}")
        return {"error": str(e), "success": False}

async def get_education() -> Dict[str, Any]:
    """
    Get Gokul's education details.
    Returns degree, college, university, GPA, and graduation year.
    """
    try:
        output = EducationOutput(**EDUCATION)
        return output.model_dump()
    except Exception as e:
        logger.error(f"Error in get_education: {e}")
        return {"error": str(e), "success": False}

async def get_experience(role_filter: Optional[str] = None) -> List[Dict[str, Any]] | Dict[str, Any]:
    """
    Get Gokul's internship and work experience.
    Optionally filters by role name (case-insensitive).
    """
    try:
        filtered_experience = []
        for exp in EXPERIENCE:
            if role_filter:
                if role_filter.lower() not in exp["role"].lower():
                    continue
            # Validate item
            item = ExperienceItem(**exp)
            filtered_experience.append(item.model_dump())
        return filtered_experience
    except Exception as e:
        logger.error(f"Error in get_experience: {e}")
        return {"error": str(e), "success": False}

async def get_projects(tags: Optional[List[str]] = None) -> List[Dict[str, Any]] | Dict[str, Any]:
    """
    Get Gokul's projects.
    Optionally filters projects that match ANY of the provided tags (case-insensitive match).
    """
    try:
        filtered_projects = []
        for proj in PROJECTS:
            if tags:
                proj_tags_lower = [t.lower() for t in proj.get("tags", [])]
                match = any(tag.lower() in proj_tags_lower for tag in tags)
                if not match:
                    continue
            item = ProjectItem(**proj)
            filtered_projects.append(item.model_dump())
        return filtered_projects
    except Exception as e:
        logger.error(f"Error in get_projects: {e}")
        return {"error": str(e), "success": False}

async def get_skills(category: Optional[str] = None) -> Dict[str, Any]:
    """
    Get Gokul's technical skills.
    Optionally filters by category: languages, frameworks, cloud, ml, certifications.
    Returns all skills if no category is specified.
    """
    try:
        # If a category is requested, validate it and return only that category's list or error
        if category:
            cat_lower = category.lower()
            if cat_lower in SKILLS:
                return {cat_lower: SKILLS[cat_lower]}
            else:
                return {"error": f"Invalid category: {category}. Choose from languages, frameworks, cloud, ml, certifications.", "success": False}
        
        # Validate full skills dictionary
        output = SkillsOutput(**SKILLS)
        return output.model_dump()
    except Exception as e:
        logger.error(f"Error in get_skills: {e}")
        return {"error": str(e), "success": False}

async def get_publications() -> List[Dict[str, Any]] | Dict[str, Any]:
    """
    Get Gokul's research publications.
    Returns paper title, venue, and year.
    """
    try:
        output_list = []
        for pub in PUBLICATIONS:
            item = PublicationItem(**pub)
            output_list.append(item.model_dump())
        return output_list
    except Exception as e:
        logger.error(f"Error in get_publications: {e}")
        return {"error": str(e), "success": False}

async def get_certifications() -> List[Dict[str, Any]] | Dict[str, Any]:
    """
    Get Gokul's certifications.
    Returns credential name, issuer, score (if any), and year.
    """
    try:
        output_list = []
        for cert in CERTIFICATIONS:
            item = CertificationItem(**cert)
            output_list.append(item.model_dump())
        return output_list
    except Exception as e:
        logger.error(f"Error in get_certifications: {e}")
        return {"error": str(e), "success": False}

async def get_sih_achievement() -> Dict[str, Any]:
    """
    Get Gokul's Smart India Hackathon (SIH) 2025 results.
    """
    try:
        output = SihAchievementOutput(achievement=SIH_ACHIEVEMENT)
        return output.model_dump()
    except Exception as e:
        logger.error(f"Error in get_sih_achievement: {e}")
        return {"error": str(e), "success": False}
