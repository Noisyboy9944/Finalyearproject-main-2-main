import requests
import sys
from datetime import datetime
import json

class UniLearnHubAPITester:
    def __init__(self, base_url="https://learn-scroll-hub.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.program_id = None
        self.subject_id = None
        self.unit_id = None
        self.video_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test backend health endpoint"""
        success, response = self.run_test(
            "Backend Health Check",
            "GET", 
            "",
            200
        )
        return success

    def test_seed_data(self):
        """Test seeding the database"""
        success, response = self.run_test(
            "Seed Database",
            "POST",
            "seed",
            200
        )
        return success

    def test_register(self, email, password, full_name):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": email,
                "password": password,
                "full_name": full_name
            }
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token received: {self.token[:20]}...")
            return True
        return False

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": email,
                "password": password
            }
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token received: {self.token[:20]}...")
            return True
        return False

    def test_get_programs(self):
        """Test getting all programs"""
        success, response = self.run_test(
            "Get Programs",
            "GET",
            "programs",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            self.program_id = response[0].get('id')
            print(f"   Found {len(response)} programs, first ID: {self.program_id}")
            return True
        return False

    def test_get_program_subjects(self):
        """Test getting subjects for a program"""
        if not self.program_id:
            print("❌ No program ID available")
            return False
            
        success, response = self.run_test(
            "Get Program Subjects",
            "GET",
            f"programs/{self.program_id}/subjects",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            self.subject_id = response[0].get('id')
            print(f"   Found {len(response)} subjects, first ID: {self.subject_id}")
            return True
        return False

    def test_get_subject_units(self):
        """Test getting units for a subject"""
        if not self.subject_id:
            print("❌ No subject ID available")
            return False
            
        success, response = self.run_test(
            "Get Subject Units",
            "GET",
            f"subjects/{self.subject_id}/units",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            self.unit_id = response[0].get('id')
            print(f"   Found {len(response)} units, first ID: {self.unit_id}")
            return True
        return False

    def test_get_unit_videos(self):
        """Test getting videos for a unit"""
        if not self.unit_id:
            print("❌ No unit ID available")
            return False
            
        success, response = self.run_test(
            "Get Unit Videos",
            "GET",
            f"units/{self.unit_id}/videos",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            self.video_id = response[0].get('id')
            print(f"   Found {len(response)} videos, first ID: {self.video_id}")
            return True
        return False

    def test_get_unit_notes(self):
        """Test getting course notes for a unit"""
        if not self.unit_id:
            print("❌ No unit ID available")
            return False
            
        success, response = self.run_test(
            "Get Unit Course Notes",
            "GET",
            f"units/{self.unit_id}/notes",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} course notes")
            return True
        return False

    def test_user_personal_notes(self):
        """Test User Personal Notes API (JWT-authenticated editable notes)"""
        if not self.unit_id:
            print("❌ No unit_id available for notes testing")
            return False
        
        if not self.token:
            print("❌ No authentication token available")
            return False

        print(f"\n🔍 Testing User Personal Notes API for unit: {self.unit_id}")
        
        # Test 1: Initial GET (should be null/empty)
        print("\n   1️⃣ Testing initial GET (should return null)")
        success, initial_note = self.run_test(
            "Get Initial User Note (null expected)",
            "GET",
            f"user-notes/{self.unit_id}",
            200,
            auth_required=True
        )
        if success:
            if initial_note is None:
                print("   ✅ Initial note is null as expected")
            else:
                print(f"   ⚠️ Found existing note: {str(initial_note)[:100]}...")
        else:
            return False

        # Test 2: Create a note with PUT
        print("\n   2️⃣ Testing note creation with PUT")
        create_content = "# My Study Notes\n\nThis is a test note with **bold** text and `code snippets`.\n\n## Key Points\n- Point 1\n- Point 2"
        
        success, created_note = self.run_test(
            "Create User Note",
            "PUT",
            f"user-notes/{self.unit_id}",
            200,
            data={"content": create_content},
            auth_required=True
        )
        if success and created_note:
            print(f"   ✅ Note created - ID: {created_note.get('id', 'N/A')}")
            print(f"   Content length: {len(created_note.get('content', ''))}")
            print(f"   Updated at: {created_note.get('updated_at', 'N/A')}")
        else:
            return False

        # Test 3: Retrieve the created note
        print("\n   3️⃣ Testing note retrieval after creation")
        success, retrieved_note = self.run_test(
            "Get Created User Note",
            "GET",
            f"user-notes/{self.unit_id}",
            200,
            auth_required=True
        )
        if success and retrieved_note:
            if retrieved_note.get('content') == create_content:
                print("   ✅ Retrieved note matches created content")
            else:
                print("   ❌ Content mismatch between created and retrieved note")
                return False
        else:
            return False

        # Test 4: Update the note
        print("\n   4️⃣ Testing note update")
        update_content = "# Updated Study Notes\n\nThis note has been updated!\n\n## New Section\nAdditional information added."
        
        success, updated_note = self.run_test(
            "Update User Note",
            "PUT",
            f"user-notes/{self.unit_id}",
            200,
            data={"content": update_content},
            auth_required=True
        )
        if success and updated_note:
            print(f"   ✅ Note updated - Content length: {len(updated_note.get('content', ''))}")
            print(f"   Updated at: {updated_note.get('updated_at', 'N/A')}")
        else:
            return False

        # Test 5: Verify the update
        print("\n   5️⃣ Testing note retrieval after update")
        success, final_note = self.run_test(
            "Get Updated User Note",
            "GET",
            f"user-notes/{self.unit_id}",
            200,
            auth_required=True
        )
        if success and final_note:
            if final_note.get('content') == update_content:
                print("   ✅ Retrieved note matches updated content")
            else:
                print("   ❌ Content mismatch after update")
                return False
        else:
            return False

        # Test 6: Test unauthorized access (no token)
        print("\n   6️⃣ Testing unauthorized access (no token)")
        url = f"{self.base_url}/user-notes/{self.unit_id}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 401:
                print("   ✅ Correctly rejected unauthorized request (401)")
            else:
                print(f"   ❌ Expected 401, got {response.status_code}")
                return False
        except Exception as e:
            print(f"   ❌ Error testing unauthorized access: {e}")
            return False

        # Test 7: Test invalid token
        print("\n   7️⃣ Testing invalid token")
        invalid_headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid-token-12345'
        }
        
        try:
            response = requests.get(url, headers=invalid_headers, timeout=10)
            if response.status_code == 401:
                print("   ✅ Correctly rejected invalid token (401)")
            else:
                print(f"   ❌ Expected 401 for invalid token, got {response.status_code}")
                return False
        except Exception as e:
            print(f"   ❌ Error testing invalid token: {e}")
            return False

        print("\n   🎉 ALL USER PERSONAL NOTES TESTS PASSED!")
        return True

    def test_get_stats(self):
        """Test getting platform statistics"""
        success, response = self.run_test(
            "Get Platform Stats",
            "GET",
            "stats",
            200
        )
        if success and isinstance(response, dict):
            stats_keys = ['programs', 'subjects', 'videos', 'students']
            if all(key in response for key in stats_keys):
                print(f"   Stats: {response['programs']} programs, {response['subjects']} subjects, {response['videos']} videos, {response['students']} students")
                return True
        return False

    def test_explore_courses(self):
        """Test explore courses endpoint"""
        success, response = self.run_test(
            "Explore Courses",
            "GET",
            "explore",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            print(f"   Found {len(response)} programs with nested subjects")
            # Check structure
            first_program = response[0]
            if 'subjects' in first_program and 'subjects_count' in first_program:
                print(f"   First program has {first_program.get('subjects_count', 0)} subjects")
                return True
        return False

    def test_chatbot(self):
        """Test chatbot functionality"""
        session_id = f"test-session-{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Test sending a message
        success, response = self.run_test(
            "Send Chat Message",
            "POST",
            "chat",
            200,
            data={
                "message": "What courses are available in the BCA program?",
                "session_id": session_id
            }
        )
        
        if success and 'reply' in response and 'session_id' in response:
            print(f"   Bot reply: {response['reply'][:100]}...")
            
            # Test getting chat history
            success2, history = self.run_test(
                "Get Chat History",
                "GET",
                f"chat/history/{session_id}",
                200
            )
            
            if success2 and isinstance(history, list) and len(history) >= 2:
                print(f"   Chat history has {len(history)} messages")
                return True
        return False

    def test_individual_endpoints(self):
        """Test individual resource endpoints"""
        results = []
        
        # Test individual program
        if self.program_id:
            success, response = self.run_test(
                "Get Individual Program",
                "GET",
                f"programs/{self.program_id}",
                200
            )
            results.append(success)
        
        # Test individual subject
        if self.subject_id:
            success, response = self.run_test(
                "Get Individual Subject",
                "GET",
                f"subjects/{self.subject_id}",
                200
            )
            results.append(success)
        
        # Test individual unit
        if self.unit_id:
            success, response = self.run_test(
                "Get Individual Unit",
                "GET",
                f"units/{self.unit_id}",
                200
            )
            results.append(success)
        
        # Test individual video
        if self.video_id:
            success, response = self.run_test(
                "Get Individual Video",
                "GET",
                f"videos/{self.video_id}",
                200
            )
            results.append(success)
        
        return all(results) if results else False

def main():
    print("🚀 Starting UniLearnHub API Tests")
    print("=" * 50)
    
    # Setup
    tester = UniLearnHubAPITester()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    test_email = f"student_{timestamp}@unilearnhub.com"
    test_password = "SecurePass123!"
    test_name = f"Student User {timestamp}"

    # Test sequence - following the exact order from review request
    tests = [
        ("Backend Health Check", lambda: tester.test_health_check()),
        ("Seed Database (FIRST)", lambda: tester.test_seed_data()),
        ("User Registration", lambda: tester.test_register(test_email, test_password, test_name)),
        ("User Login", lambda: tester.test_login(test_email, test_password)),
        ("Get Programs (should return 3)", lambda: tester.test_get_programs()),
        ("Get Individual Program", lambda: tester.test_individual_endpoints() if hasattr(tester, 'program_id') and tester.program_id else False),
        ("Get Program Subjects", lambda: tester.test_get_program_subjects()),
        ("Get Subject Units", lambda: tester.test_get_subject_units()),
        ("Get Unit Videos", lambda: tester.test_get_unit_videos()),
        ("Get Unit Course Notes", lambda: tester.test_get_unit_notes()),
        ("User Personal Notes API", lambda: tester.test_user_personal_notes()),
        ("Get Platform Stats", lambda: tester.test_get_stats()),
        ("Explore Courses", lambda: tester.test_explore_courses()),
        ("AI Chatbot Test", lambda: tester.test_chatbot()),
        ("Individual Resource Endpoints", lambda: tester.test_individual_endpoints()),
    ]

    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)

    # Print final results
    print("\n" + "=" * 50)
    print("📊 FINAL TEST RESULTS")
    print("=" * 50)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%" if tester.tests_run > 0 else "No tests run")
    
    if failed_tests:
        print(f"\n❌ Failed tests: {', '.join(failed_tests)}")
        print("\n🔍 Key Test Requirements:")
        print("- Seed endpoint must be tested FIRST (creates 3 programs)")
        print("- Auth endpoints must work (register + login)")
        print("- Programs endpoint should return 3 programs after seed")
        print("- All CRUD endpoints should work with proper data flow")
        print("- Chatbot should integrate with emergentintegrations LLM")
        print("- Stats endpoint should show counts after seeding")
    else:
        print("\n✅ All tests passed!")

    # Return appropriate exit code
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())