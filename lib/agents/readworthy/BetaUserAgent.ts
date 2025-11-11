// ReadWorthy Beta User Agent - Simulates real reader behavior

import { TestAgent } from '../../core/TestAgent';
import {
  UserPersona,
  TestConfig,
  TestResult,
  TestStatus,
} from '../../core/types';

interface ReadWorthyBook {
  id: string;
  title: string;
  author: string;
  genre: string;
}

interface ReadWorthyUser {
  id: string;
  email: string;
  name: string;
}

export class ReadWorthyBetaUserAgent extends TestAgent {
  private sessionCookie?: string;
  private user?: ReadWorthyUser;
  private readingList: ReadWorthyBook[] = [];
  private currentBook?: ReadWorthyBook;

  constructor(agentName: string, persona: UserPersona, config: TestConfig) {
    super(agentName, persona, config);
    this.metrics.stepsTotal = 10; // Total expected steps
  }

  /**
   * Execute complete ReadWorthy test flow
   */
  async executeTestFlow(): Promise<TestResult> {
    this.logger.info('Starting ReadWorthy test flow');
    this.status = TestStatus.RUNNING;

    try {
      // Step 1: Sign up / Authentication
      await this.executeAction(
        'signup_or_login',
        async () => await this.signupOrLogin(),
        true
      );
      await this.humanDelay();

      // Step 2: Browse book catalog
      await this.executeAction(
        'browse_catalog',
        async () => await this.browseCatalog(),
        true
      );
      await this.humanDelay();

      // Step 3: Search for books
      await this.executeAction(
        'search_books',
        async () => await this.searchBooks(),
        true
      );
      await this.humanDelay();

      // Step 4: Add books to reading list
      await this.executeAction(
        'add_to_reading_list',
        async () => await this.addToReadingList(),
        true
      );
      await this.humanDelay();

      // Step 5: Start reading a book
      await this.executeAction(
        'start_reading',
        async () => await this.startReading(),
        true
      );
      await this.humanDelay();

      // Step 6: Update reading progress
      await this.executeAction(
        'update_progress',
        async () => await this.updateProgress(),
        true
      );
      await this.humanDelay();

      // Step 7: Leave a review/rating
      if (this.shouldLeaveReview()) {
        await this.executeAction(
          'leave_review',
          async () => await this.leaveReview(),
          true
        );
        await this.humanDelay();
      }

      // Step 8: Get recommendations
      await this.executeAction(
        'get_recommendations',
        async () => await this.getRecommendations(),
        true
      );
      await this.humanDelay();

      // Step 9: Join/browse reading clubs
      if (this.shouldJoinClub()) {
        await this.executeAction(
          'browse_clubs',
          async () => await this.browseClubs(),
          true
        );
        await this.humanDelay();
      }

      // Step 10: View reading statistics
      await this.executeAction(
        'view_statistics',
        async () => await this.viewStatistics(),
        true
      );

      return this.generateResult(
        TestStatus.COMPLETED,
        `Successfully completed ReadWorthy test flow with ${this.metrics.stepsCompleted}/${this.metrics.stepsTotal} steps`
      );
    } catch (error: any) {
      this.logger.error('Test flow failed', { error: error.message });
      return this.generateResult(
        TestStatus.FAILED,
        `Test flow failed at step ${this.metrics.stepsCompleted}: ${error.message}`
      );
    }
  }

  /**
   * Generate realistic content based on persona and content type
   */
  async generateRealisticContent(contentType: string): Promise<any> {
    const prompt = `Generate realistic ${contentType} for a ${this.persona.type} level reader testing a book discovery platform.

Persona characteristics:
- Tech Savvy: ${this.persona.characteristics.techSavvy}/10
- Detail Oriented: ${this.persona.characteristics.detailOriented}/10

Generate content that this persona would realistically create.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      return content.type === 'text' ? content.text : '';
    } catch (error: any) {
      this.logger.error('Failed to generate realistic content', {
        contentType,
        error: error.message,
      });
      return this.getFallbackContent(contentType);
    }
  }

  /**
   * Sign up or log in
   */
  private async signupOrLogin(): Promise<void> {
    const email = `${this.agentName.toLowerCase()}@test-readworthy.local`;
    const password = 'TestReader123!'; // pragma: allowlist secret

    this.logger.info('Attempting signup/login', { email });

    try {
      const signupResponse = await this.http.post('/api/auth/signup', {
        email,
        password,
        name: this.persona.name,
      });

      this.user = signupResponse.data.user;
      this.sessionCookie = signupResponse.headers['set-cookie']?.[0];
      this.logger.info('Signup successful', { userId: this.user!.id });
    } catch (error: any) {
      if (error.response?.status === 409) {
        const loginResponse = await this.http.post('/api/auth/signin', {
          email,
          password,
        });

        this.user = loginResponse.data.user;
        this.sessionCookie = loginResponse.headers['set-cookie']?.[0];
        this.logger.info('Login successful', { userId: this.user!.id });
      } else {
        throw error;
      }
    }

    if (this.sessionCookie) {
      this.http.defaults.headers.Cookie = this.sessionCookie;
    }
  }

  /**
   * Browse book catalog
   */
  private async browseCatalog(): Promise<void> {
    this.logger.info('Browsing book catalog');

    // Make decision on how to browse
    const decision = await this.makeIntelligentDecision(
      'How would you like to browse the book catalog?',
      ['By genre', 'By popularity', 'By new releases', 'By recommendations']
    );

    const browseType = decision.chosen.toLowerCase().replace(' ', '_');

    const response = await this.http.get(`/api/books?filter=${browseType}&limit=20`);

    this.logger.info('Catalog browsed', {
      browseType,
      booksFound: response.data.books?.length || 0,
    });
  }

  /**
   * Search for books
   */
  private async searchBooks(): Promise<void> {
    this.logger.info('Searching for books');

    const searchQuery = await this.generateRealisticContent('book_search_query');

    const response = await this.http.get(`/api/books/search?q=${encodeURIComponent(searchQuery)}`);

    this.logger.info('Search completed', {
      query: searchQuery,
      resultsCount: response.data.books?.length || 0,
    });
  }

  /**
   * Add books to reading list
   */
  private async addToReadingList(): Promise<void> {
    this.logger.info('Adding books to reading list');

    // Get some books to add
    const catalogResponse = await this.http.get('/api/books?limit=5');
    const books = catalogResponse.data.books || [];

    // Decide how many to add based on persona
    const count = this.persona.type === 'BEGINNER' ? 1 : this.persona.type === 'EXPERT' ? 5 : 3;

    for (let i = 0; i < Math.min(count, books.length); i++) {
      const book = books[i];
      await this.http.post('/api/reading-list/add', { bookId: book.id });
      this.readingList.push(book);
    }

    this.logger.info('Books added to reading list', { count: this.readingList.length });
  }

  /**
   * Start reading a book
   */
  private async startReading(): Promise<void> {
    if (this.readingList.length === 0) {
      throw new Error('No books in reading list');
    }

    this.currentBook = this.readingList[0];
    this.logger.info('Starting to read', { bookId: this.currentBook.id });

    const response = await this.http.post('/api/reading/start', {
      bookId: this.currentBook.id,
    });

    this.logger.info('Reading session started', {
      sessionId: response.data.sessionId,
    });
  }

  /**
   * Update reading progress
   */
  private async updateProgress(): Promise<void> {
    if (!this.currentBook) {
      throw new Error('No current book');
    }

    this.logger.info('Updating reading progress', { bookId: this.currentBook.id });

    // Simulate reading progress (10-50% based on persona)
    const progress = this.persona.type === 'POWER_USER' ? 50 : this.persona.type === 'EXPERT' ? 30 : 15;

    await this.http.patch('/api/reading/progress', {
      bookId: this.currentBook.id,
      progress,
    });

    this.logger.info('Progress updated', { progress: `${progress}%` });
  }

  /**
   * Leave a review/rating
   */
  private async leaveReview(): Promise<void> {
    if (!this.currentBook) {
      throw new Error('No current book');
    }

    this.logger.info('Leaving review', { bookId: this.currentBook.id });

    const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
    const reviewText = await this.generateRealisticContent('book_review');

    await this.http.post('/api/reviews', {
      bookId: this.currentBook.id,
      rating,
      review: reviewText,
    });

    this.logger.info('Review posted', { rating });
  }

  /**
   * Get personalized recommendations
   */
  private async getRecommendations(): Promise<void> {
    this.logger.info('Getting recommendations');

    const response = await this.http.get('/api/recommendations');

    this.logger.info('Recommendations received', {
      count: response.data.recommendations?.length || 0,
    });
  }

  /**
   * Browse reading clubs
   */
  private async browseClubs(): Promise<void> {
    this.logger.info('Browsing reading clubs');

    const response = await this.http.get('/api/clubs?limit=10');

    this.logger.info('Clubs browsed', {
      count: response.data.clubs?.length || 0,
    });

    // Decide whether to join a club
    if (response.data.clubs && response.data.clubs.length > 0) {
      const decision = await this.makeIntelligentDecision(
        'Would you like to join a reading club?',
        ['Yes, join the first club', 'Browse more clubs', 'Maybe later']
      );

      if (decision.chosen.includes('Yes')) {
        const club = response.data.clubs[0];
        await this.http.post('/api/clubs/join', { clubId: club.id });
        this.logger.info('Joined club', { clubId: club.id });
      }
    }
  }

  /**
   * View reading statistics
   */
  private async viewStatistics(): Promise<void> {
    this.logger.info('Viewing reading statistics');

    const response = await this.http.get('/api/statistics');

    this.logger.info('Statistics retrieved', {
      booksRead: response.data.booksRead || 0,
      totalPages: response.data.totalPages || 0,
    });
  }

  /**
   * Determine if persona should leave a review
   */
  private shouldLeaveReview(): boolean {
    // Experts and power users are more likely to leave reviews
    if (this.persona.type === 'EXPERT' || this.persona.type === 'POWER_USER') {
      return Math.random() > 0.3; // 70% chance
    }
    if (this.persona.type === 'INTERMEDIATE') {
      return Math.random() > 0.5; // 50% chance
    }
    return Math.random() > 0.7; // 30% chance for beginners
  }

  /**
   * Determine if persona should join a club
   */
  private shouldJoinClub(): boolean {
    // Social personas are more likely to join clubs
    if (this.persona.type === 'POWER_USER') {
      return true;
    }
    if (this.persona.type === 'EXPERT') {
      return Math.random() > 0.4; // 60% chance
    }
    return Math.random() > 0.6; // 40% chance for others
  }

  /**
   * Get fallback content when Claude API fails
   */
  private getFallbackContent(contentType: string): string {
    const fallbacks: Record<string, string> = {
      book_search_query: 'science fiction adventure',
      book_review: 'A great read! I really enjoyed the storyline and characters.',
    };

    return fallbacks[contentType] || 'Generated test content';
  }
}
