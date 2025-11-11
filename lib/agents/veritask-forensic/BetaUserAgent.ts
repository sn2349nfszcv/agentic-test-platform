// Veritask-Forensic Beta User Agent - Simulates forensic investigator behavior

import FormData from 'form-data';
import { TestAgent } from '../../core/TestAgent';
import { UserPersona, TestConfig, TestResult, TestStatus } from '../../core/types';

interface VeritaskUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ForensicCase {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
}

export class VeritaskForensicBetaUserAgent extends TestAgent {
  private sessionCookie?: string;
  private user?: VeritaskUser;
  private cases: ForensicCase[] = [];
  private currentCase?: ForensicCase;

  constructor(agentName: string, persona: UserPersona, config: TestConfig) {
    super(agentName, persona, config);
    this.metrics.stepsTotal = 11;
  }

  async executeTestFlow(): Promise<TestResult> {
    this.logger.info('Starting Veritask-Forensic test flow');
    this.status = TestStatus.RUNNING;

    try {
      await this.executeAction('signup_or_login', async () => await this.signupOrLogin(), true);
      await this.humanDelay();

      await this.executeAction('create_case', async () => await this.createCase(), true);
      await this.humanDelay();

      await this.executeAction('upload_evidence', async () => await this.uploadEvidence(), true);
      await this.humanDelay();

      await this.executeAction('analyze_evidence', async () => await this.analyzeEvidence(), true);
      await this.humanDelay();

      await this.executeAction('generate_chain_custody', async () => await this.generateChainOfCustody(), true);
      await this.humanDelay();

      await this.executeAction('create_timeline', async () => await this.createTimeline(), true);
      await this.humanDelay();

      await this.executeAction('tag_evidence', async () => await this.tagEvidence(), true);
      await this.humanDelay();

      await this.executeAction('generate_report', async () => await this.generateReport(), true);
      await this.humanDelay();

      if (this.shouldCollaborate()) {
        await this.executeAction('share_case', async () => await this.shareCase(), true);
        await this.humanDelay();
      }

      await this.executeAction('export_evidence', async () => await this.exportEvidence(), true);
      await this.humanDelay();

      await this.executeAction('view_case_analytics', async () => await this.viewCaseAnalytics(), true);

      return this.generateResult(TestStatus.COMPLETED, `Successfully completed Veritask-Forensic test flow`);
    } catch (error: any) {
      this.logger.error('Test flow failed', { error: error.message });
      return this.generateResult(TestStatus.FAILED, `Test flow failed: ${error.message}`);
    }
  }

  async generateRealisticContent(contentType: string): Promise<any> {
    const prompt = `Generate realistic ${contentType} for a ${this.persona.type} level forensic investigator.`;
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
    const email = `${this.agentName.toLowerCase()}@test-veritask.local`;
    const password = 'TestInvestigator123!'; // pragma: allowlist secret

    try {
      const signupResponse = await this.http.post('/api/auth/signup', {
        email, password, name: this.persona.name, role: 'INVESTIGATOR',
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

  private async createCase(): Promise<void> {
    const caseTitle = await this.generateRealisticContent('case_title');
    const response = await this.http.post('/api/cases', {
      title: typeof caseTitle === 'string' ? caseTitle : `Case-${this.agentName}`,
      type: 'DIGITAL_FORENSICS',
      priority: 'MEDIUM',
    });
    this.currentCase = response.data.case;
    if (this.currentCase) {
      this.cases.push(this.currentCase);
      this.logger.info('Case created', { caseId: this.currentCase.id });
    }
  }

  private async uploadEvidence(): Promise<void> {
    if (!this.currentCase) throw new Error('No active case');
    const formData = new FormData();
    formData.append('caseId', this.currentCase.id);
    formData.append('type', 'DIGITAL');
    const buffer = Buffer.from('Sample evidence data');
    formData.append('file', buffer, { filename: 'evidence.dat', contentType: 'application/octet-stream' });

    await this.http.post('/api/evidence/upload', formData, { headers: formData.getHeaders() });
    this.logger.info('Evidence uploaded');
  }

  private async analyzeEvidence(): Promise<void> {
    if (!this.currentCase) throw new Error('No active case');
    await this.http.post('/api/evidence/analyze', { caseId: this.currentCase.id });
    this.logger.info('Evidence analyzed');
  }

  private async generateChainOfCustody(): Promise<void> {
    if (!this.currentCase) throw new Error('No active case');
    await this.http.post('/api/cases/chain-of-custody', { caseId: this.currentCase.id });
    this.logger.info('Chain of custody generated');
  }

  private async createTimeline(): Promise<void> {
    if (!this.currentCase) throw new Error('No active case');
    await this.http.post('/api/timeline/create', { caseId: this.currentCase.id });
    this.logger.info('Timeline created');
  }

  private async tagEvidence(): Promise<void> {
    if (!this.currentCase) throw new Error('No active case');
    await this.http.post('/api/evidence/tag', {
      caseId: this.currentCase.id,
      tags: ['digital', 'analyzed', 'priority'],
    });
    this.logger.info('Evidence tagged');
  }

  private async generateReport(): Promise<void> {
    if (!this.currentCase) throw new Error('No active case');
    const decision = await this.makeIntelligentDecision(
      'Which report format would you prefer?',
      ['PDF', 'DOCX', 'HTML']
    );
    await this.http.post('/api/reports/generate', {
      caseId: this.currentCase.id,
      format: decision.chosen,
    });
    this.logger.info('Report generated', { format: decision.chosen });
  }

  private async shareCase(): Promise<void> {
    if (!this.currentCase) throw new Error('No active case');
    await this.http.post('/api/cases/share', {
      caseId: this.currentCase.id,
      recipientEmail: 'colleague@test-veritask.local',
    });
    this.logger.info('Case shared');
  }

  private async exportEvidence(): Promise<void> {
    if (!this.currentCase) throw new Error('No active case');
    await this.http.post('/api/evidence/export', { caseId: this.currentCase.id });
    this.logger.info('Evidence exported');
  }

  private async viewCaseAnalytics(): Promise<void> {
    const response = await this.http.get('/api/analytics/cases');
    this.logger.info('Analytics viewed', { casesCount: response.data.total || 0 });
  }

  private shouldCollaborate(): boolean {
    return this.persona.type === 'EXPERT' || this.persona.type === 'POWER_USER' || Math.random() > 0.6;
  }

  private getFallbackContent(contentType: string): string {
    const fallbacks: Record<string, string> = {
      case_title: 'Digital Evidence Investigation',
    };
    return fallbacks[contentType] || 'Generated forensic content';
  }
}
