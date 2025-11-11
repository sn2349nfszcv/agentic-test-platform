// Keystone-Governance Beta User Agent - Simulates board member/governance professional behavior

import { TestAgent } from '../../core/TestAgent';
import { UserPersona, TestConfig, TestResult, TestStatus } from '../../core/types';

interface KeystoneUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Board {
  id: string;
  name: string;
}

export class KeystoneGovernanceBetaUserAgent extends TestAgent {
  private sessionCookie?: string;
  private user?: KeystoneUser;
  private boards: Board[] = [];

  constructor(agentName: string, persona: UserPersona, config: TestConfig) {
    super(agentName, persona, config);
    this.metrics.stepsTotal = 10;
  }

  async executeTestFlow(): Promise<TestResult> {
    this.logger.info('Starting Keystone-Governance test flow');
    this.status = TestStatus.RUNNING;

    try {
      await this.executeAction('signup_or_login', async () => await this.signupOrLogin(), true);
      await this.humanDelay();

      await this.executeAction('create_board', async () => await this.createBoard(), true);
      await this.humanDelay();

      await this.executeAction('schedule_meeting', async () => await this.scheduleMeeting(), true);
      await this.humanDelay();

      await this.executeAction('create_agenda', async () => await this.createAgenda(), true);
      await this.humanDelay();

      await this.executeAction('upload_documents', async () => await this.uploadDocuments(), true);
      await this.humanDelay();

      await this.executeAction('create_motion', async () => await this.createMotion(), true);
      await this.humanDelay();

      await this.executeAction('record_vote', async () => await this.recordVote(), true);
      await this.humanDelay();

      await this.executeAction('generate_minutes', async () => await this.generateMinutes(), true);
      await this.humanDelay();

      await this.executeAction('track_compliance', async () => await this.trackCompliance(), true);
      await this.humanDelay();

      await this.executeAction('view_governance_analytics', async () => await this.viewGovernanceAnalytics(), true);

      return this.generateResult(TestStatus.COMPLETED, `Successfully completed Keystone-Governance test flow`);
    } catch (error: any) {
      this.logger.error('Test flow failed', { error: error.message });
      return this.generateResult(TestStatus.FAILED, `Test flow failed: ${error.message}`);
    }
  }

  async generateRealisticContent(contentType: string): Promise<any> {
    const prompt = `Generate realistic ${contentType} for a ${this.persona.type} level board member/governance professional.`;
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });
      const content = response.content[0];
      return content.type === 'text' ? content.text : '';
    } catch (error: any) {
      return this.getFallbackContent(contentType);
    }
  }

  private async signupOrLogin(): Promise<void> {
    const email = `${this.agentName.toLowerCase()}@test-keystone.local`;
    const password = 'TestBoard123!'; // pragma: allowlist secret

    try {
      const signupResponse = await this.http.post('/api/auth/signup', {
        email, password, name: this.persona.name, role: 'BOARD_MEMBER',
      });
      this.user = signupResponse.data.user;
      this.sessionCookie = signupResponse.headers['set-cookie']?.[0];
    } catch (error: any) {
      if (error.response?.status === 409) {
        const loginResponse = await this.http.post('/api/auth/signin', { email, password });
        this.user = loginResponse.data.user;
        this.sessionCookie = loginResponse.headers['set-cookie']?.[0];
      } else throw error;
    }

    if (this.sessionCookie) this.http.defaults.headers.Cookie = this.sessionCookie;
  }

  private async createBoard(): Promise<void> {
    const boardName = await this.generateRealisticContent('board_name');
    const response = await this.http.post('/api/boards', {
      name: typeof boardName === 'string' ? boardName : `Test Board ${Date.now()}`,
      type: 'CORPORATE',
    });
    this.boards.push(response.data.board);
    this.logger.info('Board created', { boardId: response.data.board.id });
  }

  private async scheduleMeeting(): Promise<void> {
    if (this.boards.length === 0) throw new Error('No boards');
    await this.http.post('/api/meetings', {
      boardId: this.boards[0].id,
      datetime: new Date(Date.now() + 86400000 * 7).toISOString(),
      type: 'REGULAR',
    });
    this.logger.info('Meeting scheduled');
  }

  private async createAgenda(): Promise<void> {
    if (this.boards.length === 0) throw new Error('No boards');
    const agendaItems = await this.generateRealisticContent('agenda_items');
    await this.http.post('/api/agendas', {
      boardId: this.boards[0].id,
      items: typeof agendaItems === 'string' ? [agendaItems] : ['Review financials', 'Approve strategy'],
    });
    this.logger.info('Agenda created');
  }

  private async uploadDocuments(): Promise<void> {
    if (this.boards.length === 0) throw new Error('No boards');
    await this.http.post('/api/documents', {
      boardId: this.boards[0].id,
      title: 'Board Materials',
      type: 'MEETING_PACK',
    });
    this.logger.info('Documents uploaded');
  }

  private async createMotion(): Promise<void> {
    if (this.boards.length === 0) throw new Error('No boards');
    const motionText = await this.generateRealisticContent('motion_text');
    await this.http.post('/api/motions', {
      boardId: this.boards[0].id,
      text: typeof motionText === 'string' ? motionText : 'Motion to approve budget',
    });
    this.logger.info('Motion created');
  }

  private async recordVote(): Promise<void> {
    if (this.boards.length === 0) throw new Error('No boards');
    await this.http.post('/api/votes', {
      boardId: this.boards[0].id,
      vote: 'FOR',
    });
    this.logger.info('Vote recorded');
  }

  private async generateMinutes(): Promise<void> {
    if (this.boards.length === 0) throw new Error('No boards');
    await this.http.post('/api/minutes/generate', {
      boardId: this.boards[0].id,
    });
    this.logger.info('Minutes generated');
  }

  private async trackCompliance(): Promise<void> {
    if (this.boards.length === 0) throw new Error('No boards');
    await this.http.get(`/api/compliance?boardId=${this.boards[0].id}`);
    this.logger.info('Compliance tracked');
  }

  private async viewGovernanceAnalytics(): Promise<void> {
    const response = await this.http.get('/api/analytics/governance');
    this.logger.info('Governance analytics viewed', { meetingsCount: response.data.total || 0 });
  }

  private getFallbackContent(contentType: string): string {
    const fallbacks: Record<string, string> = {
      board_name: 'Executive Board',
      agenda_items: 'Strategic Planning',
      motion_text: 'Approval of Annual Budget',
    };
    return fallbacks[contentType] || 'Generated governance content';
  }
}
