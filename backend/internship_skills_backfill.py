"""
One-time backfill: derive required skills for every internship from its
title + description text, and store them as InternshipSkill rows.

Why: internships imported from Excel have no structured skills, so the
recommendation engine returned a constant skill-match score for all of them.
Extracting skills from the text gives a real, per-internship skill signal.

Run:  docker compose exec backend python internship_skills_backfill.py
Idempotent: skips internships that already have skills.
"""

import asyncio
import re

from sqlalchemy import select, func
from app.database import AsyncSessionLocal
from app.models.internship import Internship, InternshipSkill
from app.models.skill import Skill

# Curated taxonomy: canonical skill -> aliases matched (word-boundary) in text.
SKILL_TAXONOMY: dict[str, list[str]] = {
    # Data & analytics
    "Data Analysis": ["data analysis", "data analyst", "data analytics", "analytics"],
    "SQL": ["sql", "mysql", "postgresql", "database query"],
    "Excel": ["excel", "spreadsheet", "ms excel", "advanced excel"],
    "Statistics": ["statistics", "statistical", "biostatistics"],
    "Power BI": ["power bi", "powerbi"],
    "Tableau": ["tableau"],
    "Data Visualization": ["data visualization", "data visualisation", "dashboard"],
    "Machine Learning": ["machine learning", "ml model", "predictive model"],
    "Python": ["python"],
    "R": ["r programming", " r language"],
    "GIS": ["gis", "geographic information", "remote sensing", "arcgis", "qgis"],
    # Software / IT
    "Java": ["java "],
    "JavaScript": ["javascript", "js "],
    "React": ["react", "reactjs", "react.js"],
    "Node.js": ["node.js", "nodejs", "node js"],
    "HTML/CSS": ["html", "css"],
    "Web Development": ["web development", "web developer", "frontend", "backend"],
    "Cloud Computing": ["cloud", "aws", "azure", "gcp"],
    "Cybersecurity": ["cybersecurity", "cyber security", "information security"],
    "Networking": ["networking", "network administration", "tcp/ip"],
    "Database Management": ["database management", "dbms", "database administration"],
    "IT Support": ["it support", "technical support", "hardware", "troubleshooting"],
    "E-Governance": ["e-governance", "e governance", "digital governance", "egov"],
    # Communication & content
    "Communication": ["communication", "communications", "interpersonal"],
    "Content Writing": ["content writing", "content creation", "copywriting", "blog"],
    "Social Media": ["social media", "facebook", "instagram", "twitter", "outreach"],
    "Graphic Design": ["graphic design", "photoshop", "canva", "illustrator"],
    "Video Editing": ["video editing", "video production", "premiere"],
    "Public Relations": ["public relations", "pr ", "media relations"],
    "Translation": ["translation", "translator", "bilingual"],
    # Management / office
    "Project Management": ["project management", "project coordinat"],
    "MS Office": ["ms office", "microsoft office", "word processing", "powerpoint"],
    "Documentation": ["documentation", "report writing", "record keeping"],
    "Data Entry": ["data entry", "data collection", "data management"],
    "Administration": ["administration", "administrative", "office management"],
    "Coordination": ["coordination", "coordinator", "liaison"],
    "Event Management": ["event management", "event coordination", "events"],
    "Survey": ["survey", "field survey", "data gathering", "enumeration"],
    "Monitoring & Evaluation": ["monitoring and evaluation", "m&e", "impact assessment"],
    # Policy / research / finance
    "Research": ["research", "literature review", "qualitative", "quantitative"],
    "Public Policy": ["public policy", "policy analysis", "governance", "policy research"],
    "Finance": ["finance", "financial", "accounting", "budgeting"],
    "Economics": ["economics", "econometric"],
    "Legal Research": ["legal research", "law ", "compliance", "legal drafting"],
    "Environment": ["environment", "sustainability", "climate", "waste management"],
    "Health": ["public health", "healthcare", "sanitation", "hygiene", "swachh"],
    "Education": ["education", "teaching", "training", "curriculum"],
    "Agriculture": ["agriculture", "farming", "horticulture", "rural development"],
    "Engineering": ["civil engineering", "mechanical", "electrical", "construction"],
    "Marketing": ["marketing", "branding", "campaign", "promotion"],
    "Customer Service": ["customer service", "customer support", "helpdesk"],
    "Teamwork": ["teamwork", "team player", "collaboration"],
    "Problem Solving": ["problem solving", "analytical thinking", "critical thinking"],
    "Time Management": ["time management", "organizational skills", "multitasking"],
}


def extract_skills(text: str) -> list[str]:
    text_lower = f" {text.lower()} "
    found = []
    for canonical, aliases in SKILL_TAXONOMY.items():
        for alias in aliases:
            pattern = r"\b" + re.escape(alias.strip()) + r"\b"
            if re.search(pattern, text_lower):
                found.append(canonical)
                break
    return found


async def main():
    async with AsyncSessionLocal() as db:
        # Cache existing skills by lowercase name.
        skill_rows = (await db.execute(select(Skill))).scalars().all()
        skill_by_name = {s.name.lower(): s for s in skill_rows}

        # Which internships already have skills? (idempotency)
        have = set(
            (
                await db.execute(select(InternshipSkill.internship_id).distinct())
            ).scalars().all()
        )

        internships = (
            await db.execute(
                select(Internship.id, Internship.title, Internship.description).where(
                    Internship.is_active.is_(True)
                )
            )
        ).all()

        total = len(internships)
        processed = 0
        links_created = 0
        pending_links = []

        for iid, title, desc in internships:
            if iid in have:
                continue
            names = extract_skills(f"{title or ''} {desc or ''}")
            for name in names:
                skill = skill_by_name.get(name.lower())
                if not skill:
                    skill = Skill(name=name)
                    db.add(skill)
                    await db.flush()
                    skill_by_name[name.lower()] = skill
                pending_links.append(
                    InternshipSkill(internship_id=iid, skill_id=skill.id)
                )
            processed += 1
            # Commit in batches to keep memory/transaction size sane.
            if len(pending_links) >= 500:
                db.add_all(pending_links)
                links_created += len(pending_links)
                pending_links = []
                await db.commit()
                print(f"  ...{processed}/{total} internships, {links_created} links")

        if pending_links:
            db.add_all(pending_links)
            links_created += len(pending_links)
            await db.commit()

        n_is = (
            await db.execute(select(func.count()).select_from(InternshipSkill))
        ).scalar()
        print(f"Done. Processed {processed} internships.")
        print(f"Total InternshipSkill rows now: {n_is}")


if __name__ == "__main__":
    asyncio.run(main())
