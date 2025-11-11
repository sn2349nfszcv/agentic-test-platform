// BusinessAdvisor-AI Beta User Agent - Simulates business consultant/owner behavior

import { TestAgent } from '../../core/TestAgent';
import { UserPersona, TestConfig, TestResult, TestStatus } from '../../core/types';

interface BusinessUser {
  id: string;
  email: string;
  name: string;
}

export class BusinessAdvisorAIBetaUserAgent extends TestAgent {
  private sessionCookie?: string;
  private user?: BusinessUser;

  constructor(agentName: string, persona: UserPersona, config: TestConfig) {
    super(agentName, persona, config);
    this.metrics.stepsTotal = 10;
  }

  async executeTestFlow(): Promise<TestResult> {
    this.logger.info('Starting BusinessAdvisor-AI test flow');
    this.status = TestStatus.RUNNING;

    try {
      await this.executeAction('signup_or_login', async () => await this.signupOrLogin(), true);
      await this.humanDelay();
      await this.executeAction('create_business_profile', async () => await this.createBusinessProfile(), true);
      await this.humanDelay();
      await this.executeAction('conduct_swot_analysis', async () => await this.conductSWOTAnalysis(), true);
      await this.humanDelay();
      await this.executeAction('generate_business_plan', async () => await this.generateBusinessPlan(), true);
      await this.humanDelay();
      await this.executeAction('analyze_financials', async () => await this.analyzeFinancials(), true);
      await this.humanDelay();
      await this.executeAction('get_market_insights', async () => await this.getMarketInsights(), true);
      await this.humanDelay();
      await this.executeAction('create_strategy', async () => await this.createStrategy(), true);
      await this.humanDelay();
      await this.executeAction('use_ai_advisor', async () => await this.useAIAdvisor(), true);
      await this.humanDelay();
      await this.executeAction('generate_report', async () => await this.generateReport(), true);
      await this.humanDelay();
      await this.executeAction('view_analytics', async () => await this.viewAnalytics(), true);

      return this.generateResult(TestStatus.COMPLETED, `Successfully completed BusinessAdvisor-AI test flow`);
    } catch (error: any) {
      this.logger.error('Test flow failed', { error: error.message });
      return this.generateResult(TestStatus.FAILED, `Test flow failed: ${error.message}`);
    }
  }

  async generateRealisticContent(contentType: string): Promise<any> {
    const prompt = `Generate realistic ${contentType} for a ${this.persona.type} business consultant/owner.`;
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
    const email = `${this.agentName.toLowerCase()}@test-bizadvisor.local`;
    const password = 'TestBusiness123!'; // pragma: allowlist secret
    try {
      const signupResponse = await this.http.post('/api/auth/signup', {
        email, password, name: this.persona.name, role: 'BUSINESS_OWNER',
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

  private async createBusinessProfile(): Promise<void> {
    const businessName = await this.generateRealisticContent('business_name');
    await this.http.post('/api/business/profile', {
      name: typeof businessName === 'string' ? businessName : 'Test Business',
      industry: 'TECHNOLOGY',
      size: 'SMALL',
    });
    this.logger.info('Business profile created');
  }

  private async conductSWOTAnalysis(): Promise<void> {
    await this.http.post('/api/analysis/swot', {});
    this.logger.info('SWOT analysis conducted');
  }

  private async generateBusinessPlan(): Promise<void> {
    await this.http.post('/api/business-plan/generate', { planType: 'STRATEGIC' });
    this.logger.info('Business plan generated');
  }

  private async analyzeFinancials(): Promise<void> {
    await this.http.post('/api/financials/analyze', { revenue: 500000, expenses: 350000 });
    this.logger.info('Financials analyzed');
  }

  private async getMarketInsights(): Promise<void> {
    await this.http.get('/api/market/insights?industry=TECHNOLOGY');
    this.logger.info('Market insights retrieved');
  }

  private async createStrategy(): Promise<void> {
    const strategyType = await this.makeIntelligentDecision(
      'Which strategy to focus on?',
      ['Growth', 'Cost Reduction', 'Market Expansion', 'Innovation']
    );
    await this.http.post('/api/strategy/create', { type: strategyType.chosen });
    this.logger.info('Strategy created', { type: strategyType.chosen });
  }

  private async useAIAdvisor(): Promise<void> {
    const question = await this.generateRealisticContent('business_question');
    await this.http.post('/api/ai-advisor', {
      question: typeof question === 'string' ? question : 'How to increase profitability?',
    });
    this.logger.info('AI advisor consulted');
  }

  private async generateReport(): Promise<void> {
    await this.http.post('/api/reports/generate', { type: 'EXECUTIVE_SUMMARY' });
    this.logger.info('Report generated');
  }

  private async viewAnalytics(): Promise<void> {
    const response = await this.http.get('/api/analytics');
    this.logger.info('Analytics viewed', { metricsCount: response.data.total || 0 });
  }

  private getFallbackContent(contentType: string): string {
    const fallbacks: Record<string, string> = {
      business_name: 'Tech Solutions Inc',
      business_question: 'What strategies can improve market share?',
    };
    return fallbacks[contentType] || 'Generated business content';
  }
}
