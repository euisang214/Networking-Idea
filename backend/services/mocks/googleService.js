class MockGoogleService {
  async verifyIdToken() {
    return { sub: 'mock-id', email: 'mock@example.com', given_name: 'Mock', family_name: 'User' };
  }
  async getAvailability() {
    return [];
  }
}
module.exports = new MockGoogleService();
