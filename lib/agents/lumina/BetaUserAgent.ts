// LUMINA Beta User Agent - Simulates real author behavior

import FormData from 'form-data';
import { TestAgent } from '../../core/TestAgent';
import {
  UserPersona,
  TestConfig,
  TestResult,
  TestStatus,
} from '../../core/types';

interface LuminaBook {
  id: string;
  title: string;
  author: string;
  genre: string;
}

interface LuminaUser {
  id: string;
  email: string;
  name: string;
}

export class LuminaBetaUserAgent extends TestAgent {
  private sessionCookie?: string;
  private user?: LuminaUser;
  private book?: LuminaBook;
  private generatedContent: any[] = [];

  constructor(agentName: string, persona: UserPersona, config: TestConfig) {
    super(agentName, persona, config);
    this.metrics.stepsTotal = 12; // Total expected steps
  }

  /**
   * Execute complete LUMINA test flow
   */
  async executeTestFlow(): Promise<TestResult> {
    this.logger.info('Starting LUMINA test flow');
    this.status = TestStatus.RUNNING;

    try {
      // Step 1: Sign up / Authentication
      await this.executeAction(
        'signup_or_login',
        async () => await this.signupOrLogin(),
        true
      );
      await this.humanDelay();

      // Step 2: Upload manuscript
      await this.executeAction(
        'upload_manuscript',
        async () => await this.uploadManuscript(),
        true
      );
      await this.humanDelay();

      // Step 3: Extract quotes
      await this.executeAction(
        'extract_quotes',
        async () => await this.extractQuotes(),
        true
      );
      await this.humanDelay();

      // Step 4: Generate email campaign
      await this.executeAction(
        'generate_email_campaign',
        async () => await this.generateEmailCampaign(),
        true
      );
      await this.humanDelay();

      // Step 5: Generate social media content
      await this.executeAction(
        'generate_social_content',
        async () => await this.generateSocialContent(),
        true
      );
      await this.humanDelay();

      // Step 6: Generate blog content
      await this.executeAction(
        'generate_blog_content',
        async () => await this.generateBlogContent(),
        true
      );
      await this.humanDelay();

      // Step 7: Schedule social media posts
      await this.executeAction(
        'schedule_social_posts',
        async () => await this.scheduleSocialPosts(),
        true
      );
      await this.humanDelay();

      // Step 8: Invoke Quote Curator Agent
      if (this.shouldUseAgent('quote_curator')) {
        await this.executeAction(
          'invoke_quote_curator',
          async () => await this.invokeAgent('quote_curator'),
          true
        );
        await this.humanDelay();
      }

      // Step 9: Invoke Email Optimizer Agent
      if (this.shouldUseAgent('email_optimizer')) {
        await this.executeAction(
          'invoke_email_optimizer',
          async () => await this.invokeAgent('email_optimizer'),
          true
        );
        await this.humanDelay();
      }

      // Step 10: View analytics
      await this.executeAction(
        'view_analytics',
        async () => await this.viewAnalytics(),
        true
      );
      await this.humanDelay();

      // Step 11: Check agent status
      await this.executeAction(
        'check_agent_status',
        async () => await this.checkAgentStatus(),
        true
      );
      await this.humanDelay();

      // Step 12: Explore additional features (based on persona)
      if (this.persona.type === 'EXPERT' || this.persona.type === 'POWER_USER') {
        await this.executeAction(
          'explore_advanced_features',
          async () => await this.exploreAdvancedFeatures(),
          false
        );
      }

      return this.generateResult(
        TestStatus.COMPLETED,
        `Successfully completed LUMINA test flow with ${this.metrics.stepsCompleted}/${this.metrics.stepsTotal} steps`
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
    const prompt = `Generate realistic ${contentType} for a ${this.persona.type} level author testing a book marketing platform.

Persona characteristics:
- Tech Savvy: ${this.persona.characteristics.techSavvy}/10
- Detail Oriented: ${this.persona.characteristics.detailOriented}/10

Generate content that this persona would realistically create.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
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
    const email = `${this.agentName.toLowerCase()}@test-lumina.local`;
    const password = 'TestUser123!'; // pragma: allowlist secret

    this.logger.info('Attempting signup/login', { email });

    // Try to sign up first
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
      // If signup fails (user exists), try login
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

    // Update HTTP client with session cookie
    if (this.sessionCookie) {
      this.http.defaults.headers.Cookie = this.sessionCookie;
    }
  }

  /**
   * Upload manuscript
   */
  private async uploadManuscript(): Promise<void> {
    this.logger.info('Uploading manuscript');

    // Generate realistic book metadata
    const bookMetadata = await this.generateRealisticContent('book_metadata');

    const formData = new FormData();
    formData.append('title', `Test Book - ${this.agentName}`);
    formData.append('author', this.persona.name);
    formData.append('genre', 'FICTION');
    formData.append(
      'description',
      typeof bookMetadata === 'string' ? bookMetadata : 'A compelling story about...'
    );

    // Simulate manuscript file (in real test, would use actual file)
    const manuscriptContent = await this.generateRealisticContent('manuscript_excerpt');
    const buffer = Buffer.from(typeof manuscriptContent === 'string' ? manuscriptContent : 'Sample manuscript content');
    formData.append('file', buffer, {
      filename: 'manuscript.txt',
      contentType: 'text/plain',
    });

    const response = await this.http.post('/api/manuscripts/upload', formData, {
      headers: formData.getHeaders(),
    });

    this.book = response.data.book;
    this.logger.info('Manuscript uploaded', { bookId: this.book!.id });
  }

  /**
   * Extract quotes from manuscript
   */
  private async extractQuotes(): Promise<void> {
    if (!this.book) throw new Error('No book uploaded');

    this.logger.info('Extracting quotes', { bookId: this.book.id });

    const response = await this.http.post('/api/content/quotes/extract', {
      bookId: this.book.id,
      minQuotes: 20,
      maxQuotes: 50,
    });

    this.generatedContent.push({
      type: 'quotes',
      data: response.data,
    });

    this.logger.info('Quotes extracted', {
      count: response.data.quotes?.length || 0,
    });
  }

  /**
   * Generate email campaign
   */
  private async generateEmailCampaign(): Promise<void> {
    if (!this.book) throw new Error('No book uploaded');

    this.logger.info('Generating email campaign', { bookId: this.book.id });

    const response = await this.http.post('/api/content/email/generate', {
      bookId: this.book.id,
      campaignType: 'launch',
      sequences: 5,
    });

    this.generatedContent.push({
      type: 'email_campaign',
      data: response.data,
    });

    this.logger.info('Email campaign generated');
  }

  /**
   * Generate social media content
   */
  private async generateSocialContent(): Promise<void> {
    if (!this.book) throw new Error('No book uploaded');

    this.logger.info('Generating social media content', { bookId: this.book.id });

    const response = await this.http.post('/api/content/generate', {
      bookId: this.book.id,
      contentType: 'social',
      platforms: ['twitter', 'facebook', 'instagram'],
    });

    this.generatedContent.push({
      type: 'social_media',
      data: response.data,
    });

    this.logger.info('Social media content generated');
  }

  /**
   * Generate blog content
   */
  private async generateBlogContent(): Promise<void> {
    if (!this.book) throw new Error('No book uploaded');

    this.logger.info('Generating blog content', { bookId: this.book.id });

    const response = await this.http.post('/api/content/generate', {
      bookId: this.book.id,
      contentType: 'blog',
    });

    this.generatedContent.push({
      type: 'blog',
      data: response.data,
    });

    this.logger.info('Blog content generated');
  }

  /**
   * Schedule social media posts
   */
  private async scheduleSocialPosts(): Promise<void> {
    if (!this.book) throw new Error('No book uploaded');

    this.logger.info('Scheduling social media posts', { bookId: this.book.id });

    const response = await this.http.post('/api/social/schedule', {
      bookId: this.book.id,
      platform: 'twitter',
      content: 'Excited to announce my new book!',
      scheduledFor: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    });

    this.logger.info('Social post scheduled', { postId: response.data.id });
  }

  /**
   * Invoke an agent
   */
  private async invokeAgent(agentType: string): Promise<void> {
    if (!this.book) throw new Error('No book uploaded');

    this.logger.info('Invoking agent', { agentType, bookId: this.book.id });

    const response = await this.http.post('/api/agents/execute', {
      agentType,
      bookId: this.book.id,
    });

    this.logger.info('Agent invoked', {
      executionId: response.data.executionId,
    });
  }

  /**
   * Check if persona would use this agent
   */
  private shouldUseAgent(agentType: string): boolean {
    // Beginners might skip agents, experts always use them
    if (this.persona.type === 'BEGINNER') {
      return Math.random() > 0.5; // 50% chance
    }
    if (this.persona.type === 'INTERMEDIATE') {
      return Math.random() > 0.3; // 70% chance
    }
    return true; // Experts and power users always use agents
  }

  /**
   * View analytics
   */
  private async viewAnalytics(): Promise<void> {
    if (!this.book) throw new Error('No book uploaded');

    this.logger.info('Viewing analytics', { bookId: this.book.id });

    const response = await this.http.get(`/api/content/performance?bookId=${this.book.id}`);

    this.logger.info('Analytics retrieved', {
      metrics: Object.keys(response.data).length,
    });
  }

  /**
   * Check agent status
   */
  private async checkAgentStatus(): Promise<void> {
    this.logger.info('Checking agent status');

    const response = await this.http.get('/api/agents/status');

    this.logger.info('Agent status retrieved', {
      agents: response.data.agents?.length || 0,
    });
  }

  /**
   * Explore advanced features (expert/power users only)
   */
  private async exploreAdvancedFeatures(): Promise<void> {
    this.logger.info('Exploring advanced features');

    // Make decision about which advanced feature to explore
    const decision = await this.makeIntelligentDecision(
      'Which advanced feature would you like to explore?',
      [
        'Worktree management',
        'Agent configuration',
        'API integration',
        'Bulk operations',
      ]
    );

    this.logger.info('Advanced feature selected', { feature: decision.chosen });

    // Simulate exploring the feature
    await this.delay(2000);
  }

  /**
   * Get fallback content when Claude API fails
   */
  private getFallbackContent(contentType: string): string {
    const fallbacks: Record<string, string> = {
      book_metadata: 'An exciting new book in the fiction genre',
      manuscript_excerpt: 'Chapter 1: The journey begins...',
    };

    return fallbacks[contentType] || 'Generated test content';
  }
}
