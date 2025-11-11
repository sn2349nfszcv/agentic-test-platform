// Scholarly-AI Beta User Agent - Simulates real researcher behavior

import FormData from 'form-data';
import { TestAgent } from '../../core/TestAgent';
import {
  UserPersona,
  TestConfig,
  TestResult,
  TestStatus,
} from '../../core/types';

interface ScholarlyPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
}

interface ScholarlyUser {
  id: string;
  email: string;
  name: string;
  affiliation?: string;
}

export class ScholarlyBetaUserAgent extends TestAgent {
  private sessionCookie?: string;
  private user?: ScholarlyUser;
  private papers: ScholarlyPaper[] = [];
  private currentProject?: { id: string; name: string };

  constructor(agentName: string, persona: UserPersona, config: TestConfig) {
    super(agentName, persona, config);
    this.metrics.stepsTotal = 11; // Total expected steps
  }

  /**
   * Execute complete Scholarly-AI test flow
   */
  async executeTestFlow(): Promise<TestResult> {
    this.logger.info('Starting Scholarly-AI test flow');
    this.status = TestStatus.RUNNING;

    try {
      // Step 1: Sign up / Authentication
      await this.executeAction(
        'signup_or_login',
        async () => await this.signupOrLogin(),
        true
      );
      await this.humanDelay();

      // Step 2: Create research project
      await this.executeAction(
        'create_project',
        async () => await this.createProject(),
        true
      );
      await this.humanDelay();

      // Step 3: Upload research paper
      await this.executeAction(
        'upload_paper',
        async () => await this.uploadPaper(),
        true
      );
      await this.humanDelay();

      // Step 4: Search academic database
      await this.executeAction(
        'search_database',
        async () => await this.searchDatabase(),
        true
      );
      await this.humanDelay();

      // Step 5: Generate citations
      await this.executeAction(
        'generate_citations',
        async () => await this.generateCitations(),
        true
      );
      await this.humanDelay();

      // Step 6: Create bibliography
      await this.executeAction(
        'create_bibliography',
        async () => await this.createBibliography(),
        true
      );
      await this.humanDelay();

      // Step 7: Use AI research assistant
      await this.executeAction(
        'use_ai_assistant',
        async () => await this.useAIAssistant(),
        true
      );
      await this.humanDelay();

      // Step 8: Collaborate with researchers (advanced users)
      if (this.shouldCollaborate()) {
        await this.executeAction(
          'setup_collaboration',
          async () => await this.setupCollaboration(),
          true
        );
        await this.humanDelay();
      }

      // Step 9: Export research
      await this.executeAction(
        'export_research',
        async () => await this.exportResearch(),
        true
      );
      await this.humanDelay();

      // Step 10: View analytics
      await this.executeAction(
        'view_analytics',
        async () => await this.viewAnalytics(),
        true
      );
      await this.humanDelay();

      // Step 11: Explore advanced features (experts only)
      if (this.persona.type === 'EXPERT' || this.persona.type === 'POWER_USER') {
        await this.executeAction(
          'explore_advanced',
          async () => await this.exploreAdvancedFeatures(),
          false
        );
      }

      return this.generateResult(
        TestStatus.COMPLETED,
        `Successfully completed Scholarly-AI test flow with ${this.metrics.stepsCompleted}/${this.metrics.stepsTotal} steps`
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
    const prompt = `Generate realistic ${contentType} for a ${this.persona.type} level researcher testing an academic research platform.

Persona characteristics:
- Tech Savvy: ${this.persona.characteristics.techSavvy}/10
- Detail Oriented: ${this.persona.characteristics.detailOriented}/10

Generate academic content that this researcher would realistically create.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
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
    const email = `${this.agentName.toLowerCase()}@test-scholarly.edu`;
    const password = 'TestResearcher123!'; // pragma: allowlist secret

    this.logger.info('Attempting signup/login', { email });

    try {
      const signupResponse = await this.http.post('/api/auth/signup', {
        email,
        password,
        name: this.persona.name,
        affiliation: 'Test University',
        role: 'RESEARCHER',
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
   * Create research project
   */
  private async createProject(): Promise<void> {
    this.logger.info('Creating research project');

    const projectName = await this.generateRealisticContent('research_project_name');

    const response = await this.http.post('/api/projects', {
      name: typeof projectName === 'string' ? projectName : `Research Project - ${this.agentName}`,
      description: 'AI-powered academic research project',
      field: 'Computer Science',
    });

    this.currentProject = response.data.project;
    this.logger.info('Project created', { projectId: this.currentProject!.id });
  }

  /**
   * Upload research paper
   */
  private async uploadPaper(): Promise<void> {
    if (!this.currentProject) throw new Error('No active project');

    this.logger.info('Uploading research paper');

    // Generate realistic paper content
    const paperTitle = await this.generateRealisticContent('paper_title');
    const paperAbstract = await this.generateRealisticContent('paper_abstract');

    const formData = new FormData();
    formData.append('projectId', this.currentProject.id);
    formData.append('title', typeof paperTitle === 'string' ? paperTitle : 'Test Paper');
    formData.append('abstract', typeof paperAbstract === 'string' ? paperAbstract : 'Abstract...');

    // Simulate paper file
    const paperContent = await this.generateRealisticContent('paper_content');
    const buffer = Buffer.from(typeof paperContent === 'string' ? paperContent : 'Paper content');
    formData.append('file', buffer, {
      filename: 'research-paper.pdf',
      contentType: 'application/pdf',
    });

    const response = await this.http.post('/api/papers/upload', formData, {
      headers: formData.getHeaders(),
    });

    this.papers.push(response.data.paper);
    this.logger.info('Paper uploaded', { paperId: response.data.paper.id });
  }

  /**
   * Search academic database
   */
  private async searchDatabase(): Promise<void> {
    this.logger.info('Searching academic database');

    const searchQuery = await this.generateRealisticContent('academic_search_query');

    const response = await this.http.get(`/api/search?q=${encodeURIComponent(
      typeof searchQuery === 'string' ? searchQuery : 'artificial intelligence'
    )}&limit=20`);

    this.logger.info('Search completed', {
      resultsCount: response.data.papers?.length || 0,
    });
  }

  /**
   * Generate citations
   */
  private async generateCitations(): Promise<void> {
    if (this.papers.length === 0) throw new Error('No papers uploaded');

    this.logger.info('Generating citations', { paperId: this.papers[0].id });

    // Decide citation format based on persona
    const decision = await this.makeIntelligentDecision(
      'Which citation format would you prefer?',
      ['APA', 'MLA', 'Chicago', 'IEEE']
    );

    const response = await this.http.post('/api/citations/generate', {
      paperId: this.papers[0].id,
      format: decision.chosen,
    });

    this.logger.info('Citations generated', {
      format: decision.chosen,
      count: response.data.citations?.length || 0,
    });
  }

  /**
   * Create bibliography
   */
  private async createBibliography(): Promise<void> {
    if (!this.currentProject) throw new Error('No active project');

    this.logger.info('Creating bibliography');

    const response = await this.http.post('/api/bibliography/create', {
      projectId: this.currentProject.id,
      format: 'APA',
    });

    this.logger.info('Bibliography created', {
      entriesCount: response.data.entries?.length || 0,
    });
  }

  /**
   * Use AI research assistant
   */
  private async useAIAssistant(): Promise<void> {
    if (this.papers.length === 0) throw new Error('No papers uploaded');

    this.logger.info('Using AI research assistant');

    const question = await this.generateRealisticContent('research_question');

    const response = await this.http.post('/api/ai-assistant', {
      paperId: this.papers[0].id,
      question: typeof question === 'string' ? question : 'What are the key findings?',
    });

    this.logger.info('AI assistant response received', {
      responseLength: response.data.answer?.length || 0,
    });
  }

  /**
   * Setup collaboration
   */
  private async setupCollaboration(): Promise<void> {
    if (!this.currentProject) throw new Error('No active project');

    this.logger.info('Setting up collaboration');

    // Make decision on collaboration type
    const decision = await this.makeIntelligentDecision(
      'How would you like to collaborate?',
      [
        'Invite specific researchers',
        'Share with research group',
        'Make project public',
        'Request peer review',
      ]
    );

    const collaborationType = decision.chosen.toLowerCase().replace(' ', '_');

    await this.http.post('/api/collaboration/setup', {
      projectId: this.currentProject.id,
      type: collaborationType,
    });

    this.logger.info('Collaboration setup complete', { type: collaborationType });
  }

  /**
   * Export research
   */
  private async exportResearch(): Promise<void> {
    if (!this.currentProject) throw new Error('No active project');

    this.logger.info('Exporting research');

    // Decide export format
    const decision = await this.makeIntelligentDecision(
      'Which format would you like to export to?',
      ['PDF', 'LaTeX', 'Word', 'Markdown']
    );

    const response = await this.http.post('/api/export', {
      projectId: this.currentProject.id,
      format: decision.chosen,
    });

    this.logger.info('Research exported', {
      format: decision.chosen,
      fileSize: response.data.size || 0,
    });
  }

  /**
   * View analytics
   */
  private async viewAnalytics(): Promise<void> {
    if (!this.currentProject) throw new Error('No active project');

    this.logger.info('Viewing analytics');

    const response = await this.http.get(`/api/analytics?projectId=${this.currentProject.id}`);

    this.logger.info('Analytics retrieved', {
      papersCount: response.data.papersCount || 0,
      citationsCount: response.data.citationsCount || 0,
    });
  }

  /**
   * Explore advanced features
   */
  private async exploreAdvancedFeatures(): Promise<void> {
    this.logger.info('Exploring advanced features');

    const decision = await this.makeIntelligentDecision(
      'Which advanced feature would you like to explore?',
      [
        'API integration',
        'Batch processing',
        'Custom workflows',
        'Advanced search filters',
      ]
    );

    this.logger.info('Advanced feature selected', { feature: decision.chosen });

    await this.delay(2000);
  }

  /**
   * Determine if persona should setup collaboration
   */
  private shouldCollaborate(): boolean {
    // More experienced users are more likely to collaborate
    if (this.persona.type === 'POWER_USER') return true;
    if (this.persona.type === 'EXPERT') return Math.random() > 0.3; // 70% chance
    if (this.persona.type === 'INTERMEDIATE') return Math.random() > 0.5; // 50% chance
    return Math.random() > 0.7; // 30% chance for beginners
  }

  /**
   * Get fallback content when Claude API fails
   */
  private getFallbackContent(contentType: string): string {
    const fallbacks: Record<string, string> = {
      research_project_name: 'AI and Machine Learning Research',
      paper_title: 'Advances in Neural Network Architectures',
      paper_abstract: 'This paper explores recent developments in neural network design...',
      paper_content: 'Introduction\n\nRecent advances in artificial intelligence...',
      academic_search_query: 'deep learning transformers',
      research_question: 'What are the main contributions of this paper?',
    };

    return fallbacks[contentType] || 'Generated academic content';
  }
}
