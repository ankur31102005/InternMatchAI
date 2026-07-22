import asyncio
import time
import httpx

BASE_URL = "http://localhost:8002/api/v1"

async def test_full_flow():
    print("[TEST 1/5] Registering new student account...")
    email = f"test_student_{int(time.time())}@university.edu"
    async with httpx.AsyncClient() as client:
        reg_resp = await client.post(
            f"{BASE_URL}/auth/register",
            json={
                "full_name": "Priya Sharma",
                "email": email,
                "password": "Password123!",
                "phone": "+91-9876543210"
            }
        )
        print(f"  Status: {reg_resp.status_code}")
        assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"

        print("[TEST 2/5] Authenticating and getting JWT access token...")
        login_resp = await client.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": email,
                "password": "Password123!"
            }
        )
        print(f"  Status: {login_resp.status_code}")
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        print("[TEST 3/5] Verifying /auth/me profile endpoint...")
        me_resp = await client.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"  Status: {me_resp.status_code}, User: {me_resp.json().get('full_name')}")
        assert me_resp.status_code == 200

        print("[TEST 4/5] Uploading resume (sample PDF/text)...")
        # Create a sample PDF-like / doc file in memory
        sample_resume_content = (
            b"Priya Sharma\nEmail: priya@university.edu\nGPA: 8.5/10\n"
            b"Degree: Bachelor of Technology in Computer Science\n"
            b"Skills: Python, SQL, Data Analysis, Machine Learning, React, Communication\n"
            b"Experience: Worked on AI models and data visualization dashboards using Python and Power BI.\n"
        )
        files = {
            "file": ("priya_resume.txt", sample_resume_content, "text/plain")
        }
        upload_resp = await client.post(f"{BASE_URL}/resumes/upload", headers=headers, files=files)
        print(f"  Status: {upload_resp.status_code}")
        assert upload_resp.status_code == 201, f"Resume upload failed: {upload_resp.text}"

        print("  Waiting 2 seconds for background skill extraction & profile update...")
        await asyncio.sleep(2.0)

        print("[TEST 5/5] Requesting Personalised AI Recommendations...")
        rec_resp = await client.get(f"{BASE_URL}/recommendations/", headers=headers)
        print(f"  Status: {rec_resp.status_code}")
        assert rec_resp.status_code == 200, f"Recommendation request failed: {rec_resp.text}"

        data = rec_resp.json()
        total = data.get("total", 0)
        items = data.get("items", [])
        print(f"  Received {total} recommendations!")
        assert total > 0, "No recommendations returned!"

        top_rec = items[0]
        print("\n[TOP RECOMMENDATION]")
        print(f"  Title: {top_rec['internship']['title']}")
        print(f"  Ministry/Company: {top_rec['internship']['company']}")
        print(f"  Match Score: {round(top_rec['match_score'] * 100)}%")
        print(f"  Explanation: {top_rec['explanation']}")
        print(f"  Matched Skills: {top_rec['matched_skills']}")
        print(f"  Missing Skills: {top_rec['missing_skills']}")

        print("\n[SUCCESS] ALL INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(test_full_flow())
