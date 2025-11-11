// AHPRA-Pro Beta User Agent - Simulates healthcare professional registration/compliance behavior

import { TestAgent } from '../../core/TestAgent';
import { UserPersona, TestConfig, TestResult, TestStatus } from '../../core/types';

interface AHPRAUser {
  id: string;
  email: string;
  name: string;
  profession: string;
}

export class AHPRAProBetaUserAgent extends TestAgent {
  private sessionCookie?: string;
  private user?: AHPRAUser;

  constructor(agentName: string, persona: UserPersona, config: TestConfig) {
    super(agentName, persona, config);
    this.metrics.stepsTotal = 9;
  }

  async executeTestFlow(): Promise<TestResult> {
    this.logger.info('Starting AHPRA-Pro test flow');
    this.status = TestStatus.RUNNING;

    try {
      await this.executeAction('signup_or_login', async () => await this.signupOrLogin(), true);
      await this.humanDelay();
      await this.executeAction('submit_registration', async () => await this.submitRegistration(), true);
      await this.humanDelay();
      await this.executeAction('upload_credentials', async () => await this.uploadCredentials(), true);
      await this.humanDelay();
      await this.executeAction('complete_cpd', async () => await this.completeCPD(), true);
      await this.humanDelay();
      await this.executeAction('submit_renewal', async () => await this.submitRenewal(), true);
      await this.humanDelay();
      await this.executeAction('track_compliance', async () => await this.trackCompliance(), true);
      await this.humanDelay();
      await this.executeAction('generate_certificate', async () => await this.generateCertificate(), true);
      await this.humanDelay();
      await this.executeAction('view_notifications', async () => await this.viewNotifications(), true);
      await this.humanDelay();
      await this.executeAction('view_dashboard', async () => await this.viewDashboard(), true);

      return this.generateResult(TestStatus.COMPLETED, `Successfully completed AHPRA-Pro test flow`);
    } catch (error: any) {
      this.logger.error('Test flow failed', { error: error.message });
      return this.generateResult(TestStatus.FAILED, `Test flow failed: ${error.message}`);
    }
  }

  async generateRealisticContent(contentType: string): Promise<any> {
    const prompt = `Generate realistic ${contentType} for a ${this.persona.type} healthcare professional.`;
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022', max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });
      const content = response.content[0];
      return content.type === 'text' ? content.text : '';
    } catch (error: any) {
      return this.getFallbackContent(contentType);
    }
  }

  private async signupOrLogin(): Promise<void> {
    const email = `${this.agentName.toLowerCase()}@test-ahpra.local`;
    const password = 'TestProfessional123!'; // pragma: allowlist secret
    try {
      const signupResponse = await this.http.post('/api/auth/signup', {
        email, password, name: this.persona.name, profession: 'DOCTOR',
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

  private async submitRegistration(): Promise<void> {
    await this.http.post('/api/registrations', { profession: 'DOCTOR', specialization: 'GENERAL_PRACTICE' });
    this.logger.info('Registration submitted');
  }

  private async uploadCredentials(): Promise<void> {
    await this.http.post('/api/credentials/upload', { type: 'QUALIFICATION', title: 'MBBS' });
    this.logger.info('Credentials uploaded');
  }

  private async completeCPD(): Promise<void> {
    await this.http.post('/api/cpd/complete', { hours: 50, category: 'CLINICAL' });
    this.logger.info('CPD completed');
  }

  private async submitRenewal(): Promise<void> {
    await this.http.post('/api/registrations/renew', { year: 2025 });
    this.logger.info('Renewal submitted');
  }

  private async trackCompliance(): Promise<void> {
    await this.http.get('/api/compliance/status');
    this.logger.info('Compliance tracked');
  }

  private async generateCertificate(): Promise<void> {
    await this.http.post('/api/certificates/generate', { type: 'REGISTRATION' });
    this.logger.info('Certificate generated');
  }

  private async viewNotifications(): Promise<void> {
    await this.http.get('/api/notifications');
    this.logger.info('Notifications viewed');
  }

  private async viewDashboard(): Promise<void> {
    const response = await this.http.get('/api/dashboard');
    this.logger.info('Dashboard viewed', { status: response.data.status || 'OK' });
  }

  private getFallbackContent(contentType: string): string {
    return 'Generated AHPRA content';
  }
}
