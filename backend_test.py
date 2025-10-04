import requests
import sys
import json
from datetime import datetime

class PenLinkAPITester:
    def __init__(self, base_url="https://penlink-social-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.username = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = {
            "test": name,
            "status": "PASS" if success else "FAIL",
            "details": details
        }
        self.test_results.append(result)
        print(f"{status} - {name}: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success:
                try:
                    response_data = response.json()
                    details += f", Response: {json.dumps(response_data, indent=2)[:200]}..."
                except:
                    details += f", Response: {response.text[:200]}..."
            else:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Error: {response.text[:200]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_auth_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        self.username = f"testuser_{timestamp}"
        test_data = {
            "username": self.username,
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!",
            "bio": "Test user bio"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_auth_login(self):
        """Test user login"""
        if not self.username:
            self.log_test("User Login", False, "No username available for login test")
            return False
            
        test_data = {
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            200,
            data=test_data
        )
        return success

    def test_auth_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_blog_post(self):
        """Test creating a blog post"""
        test_data = {
            "title": "Test Blog Post",
            "content": "This is a comprehensive test blog post content with multiple paragraphs.\n\nIt includes various formatting and should be properly stored in the database.",
            "excerpt": "This is a test blog post excerpt",
            "tags": ["test", "blog", "api"]
        }
        
        success, response = self.run_test(
            "Create Blog Post",
            "POST",
            "blogs",
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            self.blog_id = response['id']
            return True
        return False

    def test_get_blogs(self):
        """Test getting all blogs"""
        success, response = self.run_test(
            "Get All Blogs",
            "GET",
            "blogs",
            200
        )
        return success

    def test_get_blog_detail(self):
        """Test getting a specific blog"""
        if not hasattr(self, 'blog_id'):
            self.log_test("Get Blog Detail", False, "No blog ID available")
            return False
            
        success, response = self.run_test(
            "Get Blog Detail",
            "GET",
            f"blogs/{self.blog_id}",
            200
        )
        return success

    def test_create_short_post(self):
        """Test creating a short post"""
        test_data = {
            "content": "This is a test short post, similar to a tweet! #testing #api"
        }
        
        success, response = self.run_test(
            "Create Short Post",
            "POST",
            "posts",
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            self.post_id = response['id']
            return True
        return False

    def test_get_posts(self):
        """Test getting all posts"""
        success, response = self.run_test(
            "Get All Posts",
            "GET",
            "posts",
            200
        )
        return success

    def test_get_feed(self):
        """Test getting combined feed"""
        success, response = self.run_test(
            "Get Combined Feed",
            "GET",
            "feed",
            200
        )
        return success

    def test_like_blog(self):
        """Test liking a blog post"""
        if not hasattr(self, 'blog_id'):
            self.log_test("Like Blog Post", False, "No blog ID available")
            return False
            
        success, response = self.run_test(
            "Like Blog Post",
            "POST",
            f"likes/blog/{self.blog_id}",
            200
        )
        return success

    def test_unlike_blog(self):
        """Test unliking a blog post"""
        if not hasattr(self, 'blog_id'):
            self.log_test("Unlike Blog Post", False, "No blog ID available")
            return False
            
        success, response = self.run_test(
            "Unlike Blog Post",
            "DELETE",
            f"likes/blog/{self.blog_id}",
            200
        )
        return success

    def test_like_post(self):
        """Test liking a short post"""
        if not hasattr(self, 'post_id'):
            self.log_test("Like Short Post", False, "No post ID available")
            return False
            
        success, response = self.run_test(
            "Like Short Post",
            "POST",
            f"likes/post/{self.post_id}",
            200
        )
        return success

    def test_comment_on_blog(self):
        """Test commenting on a blog"""
        if not hasattr(self, 'blog_id'):
            self.log_test("Comment on Blog", False, "No blog ID available")
            return False
            
        test_data = {
            "content": "This is a test comment on the blog post!"
        }
        
        success, response = self.run_test(
            "Comment on Blog",
            "POST",
            f"comments/blog/{self.blog_id}",
            200,
            data=test_data
        )
        return success

    def test_get_blog_comments(self):
        """Test getting blog comments"""
        if not hasattr(self, 'blog_id'):
            self.log_test("Get Blog Comments", False, "No blog ID available")
            return False
            
        success, response = self.run_test(
            "Get Blog Comments",
            "GET",
            f"comments/blog/{self.blog_id}",
            200
        )
        return success

    def test_comment_on_post(self):
        """Test commenting on a short post"""
        if not hasattr(self, 'post_id'):
            self.log_test("Comment on Post", False, "No post ID available")
            return False
            
        test_data = {
            "content": "This is a test comment on the short post!"
        }
        
        success, response = self.run_test(
            "Comment on Post",
            "POST",
            f"comments/post/{self.post_id}",
            200,
            data=test_data
        )
        return success

    def test_get_user_profile(self):
        """Test getting user profile"""
        if not self.username:
            self.log_test("Get User Profile", False, "No username available")
            return False
            
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            f"users/{self.username}",
            200
        )
        return success

    def test_get_user_blogs(self):
        """Test getting user's blogs"""
        if not self.username:
            self.log_test("Get User Blogs", False, "No username available")
            return False
            
        success, response = self.run_test(
            "Get User Blogs",
            "GET",
            f"users/{self.username}/blogs",
            200
        )
        return success

    def test_get_user_posts(self):
        """Test getting user's posts"""
        if not self.username:
            self.log_test("Get User Posts", False, "No username available")
            return False
            
        success, response = self.run_test(
            "Get User Posts",
            "GET",
            f"users/{self.username}/posts",
            200
        )
        return success

    def test_create_story(self):
        """Test creating a story"""
        test_data = {
            "content": "This is a test story! Check out this amazing moment 📸",
            "media_url": "https://example.com/test-image.jpg"
        }
        
        success, response = self.run_test(
            "Create Story",
            "POST",
            "stories",
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            self.story_id = response['id']
            return True
        return False

    def test_get_stories(self):
        """Test getting all stories"""
        success, response = self.run_test(
            "Get All Stories",
            "GET",
            "stories",
            200
        )
        return success

    def test_view_story(self):
        """Test viewing a story (incrementing view count)"""
        if not hasattr(self, 'story_id'):
            self.log_test("View Story", False, "No story ID available")
            return False
            
        success, response = self.run_test(
            "View Story",
            "POST",
            f"stories/{self.story_id}/view",
            200
        )
        return success

    def test_get_user_stories(self):
        """Test getting user's stories"""
        if not self.user_id:
            self.log_test("Get User Stories", False, "No user ID available")
            return False
            
        success, response = self.run_test(
            "Get User Stories",
            "GET",
            f"stories/user/{self.user_id}",
            200
        )
        return success

    def test_trending_content(self):
        """Test trending algorithm - should return content sorted by engagement"""
        # First, let's create some content and interactions to test trending
        
        # Create additional content for trending test
        blog_data = {
            "title": "Trending Test Blog",
            "content": "This blog should appear in trending due to high engagement",
            "tags": ["trending", "test"]
        }
        
        success, blog_response = self.run_test(
            "Create Trending Test Blog",
            "POST",
            "blogs",
            200,
            data=blog_data
        )
        
        if success and 'id' in blog_response:
            trending_blog_id = blog_response['id']
            
            # Like the blog multiple times (would need multiple users in real scenario)
            self.run_test(
                "Like Trending Blog",
                "POST",
                f"likes/blog/{trending_blog_id}",
                200
            )
            
            # Comment on the blog
            comment_data = {"content": "Great trending content!"}
            self.run_test(
                "Comment on Trending Blog",
                "POST",
                f"comments/blog/{trending_blog_id}",
                200,
                data=comment_data
            )
        
        # Now test if we can get the feed (which should show trending content)
        success, response = self.run_test(
            "Get Trending Content (via Feed)",
            "GET",
            "feed",
            200
        )
        
        return success

    def test_auth_login_existing_user(self):
        """Test login with existing user credentials"""
        if not self.username:
            self.log_test("Login Existing User", False, "No username available for login test")
            return False
            
        # Use the same email from registration (stored in self.username timestamp)
        user_timestamp = self.username.split('_')[1] if '_' in self.username else datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"test_{user_timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "Login Existing User",
            "POST", 
            "auth/login",
            200,
            data=test_data
        )
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting PenLink API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)

        # Authentication tests
        if not self.test_auth_register():
            print("❌ Registration failed, stopping tests")
            return self.get_results()

        self.test_auth_me()
        self.test_auth_login_existing_user()

        # Content creation tests
        self.test_create_blog_post()
        self.test_create_short_post()
        self.test_create_story()

        # Content retrieval tests
        self.test_get_blogs()
        self.test_get_posts()
        self.test_get_feed()
        self.test_get_blog_detail()
        self.test_get_stories()

        # Interaction tests
        self.test_like_blog()
        self.test_unlike_blog()
        self.test_like_post()
        self.test_comment_on_blog()
        self.test_get_blog_comments()
        self.test_comment_on_post()
        
        # Stories interaction tests
        self.test_view_story()
        self.test_get_user_stories()

        # User profile tests
        self.test_get_user_profile()
        self.test_get_user_blogs()
        self.test_get_user_posts()
        
        # Trending algorithm test
        self.test_trending_content()

        return self.get_results()

    def get_results(self):
        """Get test results summary"""
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%" if self.tests_run > 0 else "No tests run")
        
        failed_tests = [test for test in self.test_results if test['status'] == 'FAIL']
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": len(failed_tests),
            "success_rate": (self.tests_passed/self.tests_run)*100 if self.tests_run > 0 else 0,
            "test_details": self.test_results
        }

def main():
    tester = PenLinkAPITester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if results["failed_tests"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())