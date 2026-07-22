import asyncio
import json
import random
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.append(str(Path(__file__).parent))

from app.database import AsyncSessionLocal, Base, engine
from app.models.internship import Internship, InternshipSkill
from app.models.skill import Skill
from sqlalchemy import select

MINISTRIES_SECTORS = [
    ("NITI Aayog", "Technology", "Digital Transformation & AI Cell"),
    ("NITI Aayog", "Public Policy", "Policy Research & Governance"),
    ("Ministry of Finance", "Finance", "Economic Policy & Budget Division"),
    ("Ministry of Finance", "Data Science", "Financial Intelligence Unit"),
    ("MeitY", "Cybersecurity", "National Cyber Security Coordinator"),
    ("MeitY", "Technology", "Digital India Development Agency"),
    ("Ministry of Education", "Education", "National Educational Technology Forum"),
    ("Ministry of External Affairs", "Policy", "International Trade & Policy Cell"),
    ("Ministry of Commerce & Industry", "Commerce", "Invest India & Startup India Initiative"),
    ("Ministry of Health & Family Welfare", "Health Tech", "Digital Health Mission"),
    ("Ministry of Environment", "Sustainability", "Climate Change & Green Energy Division"),
    ("Ministry of Rural Development", "Social Development", "E-Panchayat & Rural Tech Cell"),
]

TITLES_BY_SECTOR = {
    "Technology": ["Full Stack Developer Intern", "Cloud Infrastructure Intern", "Software Engineering Intern", "DevOps Assistant"],
    "Public Policy": ["Public Policy Research Intern", "Governance & Analytics Associate", "Policy Documentation Intern"],
    "Finance": ["Financial Analyst Intern", "Economic Research Intern", "Public Finance Assistant"],
    "Data Science": ["Data Analyst Intern", "Machine Learning Trainee", "Data Visualization Intern"],
    "Cybersecurity": ["Cybersecurity Research Intern", "Information Security Associate", "Threat Analysis Assistant"],
    "Education": ["EdTech Research Intern", "Educational Policy Analyst", "Curriculum Digitization Fellow"],
    "Commerce": ["Startup Ecosystem Fellow", "Trade Policy Research Intern", "Investment Promotion Trainee"],
    "Health Tech": ["Health Data Analyst Intern", "Telemedicine Solutions Associate", "Medical Informatics Fellow"],
    "Sustainability": ["Green Energy Research Fellow", "Carbon Footprint Analyst Intern", "Sustainable Tech Trainee"],
    "Social Development": ["Rural Innovation Fellow", "Direct Benefit Transfer Analyst", "Social Impact Tech Intern"],
}

ALL_SKILLS = [
    ("Python", "Programming Languages"),
    ("Data Analysis", "Data Science"),
    ("SQL", "Databases"),
    ("Machine Learning", "AI & ML"),
    ("Communication", "Soft Skills"),
    ("Public Policy", "Policy"),
    ("Research", "Soft Skills"),
    ("Project Management", "Management"),
    ("React", "Web Development"),
    ("Java", "Programming Languages"),
    ("Cloud Computing", "Infrastructure"),
    ("Excel", "Tools"),
    ("Cybersecurity", "Security"),
    ("Node.js", "Web Development"),
    ("Power BI", "Data Science"),
    ("Tableau", "Data Science"),
    ("UI/UX Design", "Design"),
    ("Technical Writing", "Soft Skills"),
    ("Financial Analysis", "Finance"),
    ("GIS", "Geography & Analytics"),
    ("Agile", "Management"),
    ("Deep Learning", "AI & ML"),
    ("Docker", "Infrastructure"),
    ("C++", "Programming Languages"),
    ("Statistics", "Mathematics"),
]

LOCATIONS = ["New Delhi", "Bengaluru", "Mumbai", "Hyderabad", "Pune", "Chennai", "Remote"]
DEGREES = ["Bachelor of Technology", "Master of Technology", "Master of Computer Applications", "Bachelor of Science", "Master of Business Administration", "Any"]

async def seed_database():
    print("[INIT] Initializing Database Schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("[GENERATE] Generating 75 Internship Records...")
    seed_internships_json = []

    # 1. Ensure canonical skills exist in DB
    skill_objects = {}
    async with AsyncSessionLocal() as db:
        for skill_name, cat in ALL_SKILLS:
            res = await db.execute(select(Skill).where(Skill.name == skill_name))
            s_obj = res.scalar_one_or_none()
            if not s_obj:
                s_obj = Skill(name=skill_name, category=cat)
                db.add(s_obj)
                await db.flush()
            skill_objects[skill_name] = s_obj
        await db.commit()

    # 2. Build 75 Internship records
    async with AsyncSessionLocal() as db:
        for i in range(1, 76):
            ministry, sector, company = random.choice(MINISTRIES_SECTORS)
            sector_titles = TITLES_BY_SECTOR.get(sector, ["Project Assistant"])
            title = f"{random.choice(sector_titles)} #{i}"
            location = random.choice(LOCATIONS)
            is_remote = location == "Remote"
            stipend = random.choice([12000, 15000, 18000, 20000, 25000, 30000])
            duration = random.choice([6, 8, 10, 12, 16])
            min_gpa = random.choice([6.0, 6.5, 7.0, 7.5, 8.0])
            req_degree = random.choice(DEGREES)

            # Pick 2-5 skills for this internship
            assigned_skills = random.sample(ALL_SKILLS, k=random.randint(2, 5))

            internship = Internship(
                title=title,
                company=company,
                description=f"Join the {company} team at {ministry}. Work on key PM scheme initiatives, data analytics, and policy design.",
                location=location,
                is_remote=is_remote,
                duration_weeks=duration,
                stipend_amount=stipend,
                stipend_currency="INR",
                is_pm_scheme=True,
                sector=sector,
                ministry=ministry,
                min_gpa=min_gpa,
                required_degree=req_degree,
                is_active=True,
                total_seats=random.randint(2, 15),
                seats_filled=random.randint(0, 2),
            )
            db.add(internship)
            await db.flush()

            # Attach InternshipSkills
            skill_names_list = []
            for s_name, _ in assigned_skills:
                skill_obj = skill_objects[s_name]
                skill_names_list.append(s_name)
                i_skill = InternshipSkill(
                    internship_id=internship.id,
                    skill_id=skill_obj.id,
                    is_required=True,
                    importance_weight=1.0,
                )
                db.add(i_skill)

            # Add to JSON dump list
            seed_internships_json.append({
                "id": str(internship.id),
                "title": title,
                "ministry": ministry,
                "company": company,
                "sector": sector,
                "location": location,
                "is_remote": is_remote,
                "stipend_amount": stipend,
                "duration_weeks": duration,
                "min_gpa": min_gpa,
                "required_degree": req_degree,
                "required_skills": skill_names_list,
            })

        await db.commit()

    # Save JSON dataset
    dataset_dir = Path(__file__).parent.parent / "datasets"
    dataset_dir.mkdir(exist_ok=True)
    json_path = dataset_dir / "internships.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(seed_internships_json, f, indent=2)

    print(f"[SUCCESS] Created 75 internships in Database and saved JSON to {json_path}")

if __name__ == "__main__":
    asyncio.run(seed_database())
