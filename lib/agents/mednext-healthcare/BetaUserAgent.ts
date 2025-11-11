// MedNext-Healthcare Beta User Agent - Simulates healthcare provider behavior

import { TestAgent } from '../../core/TestAgent';
import { UserPersona, TestConfig, TestResult, TestStatus } from '../../core/types';

interface MedNextUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Patient {
  id: string;
  name: string;
  mrn: string;
}

export class MedNextHealthcareBetaUserAgent extends TestAgent {
  private sessionCookie?: string;
  private user?: MedNextUser;
  private patients: Patient[] = [];

  constructor(agentName: string, persona: UserPersona, config: TestConfig) {
    super(agentName, persona, config);
    this.metrics.stepsTotal = 10;
  }

  async executeTestFlow(): Promise<TestResult> {
    this.logger.info('Starting MedNext-Healthcare test flow');
    this.status = TestStatus.RUNNING;

    try {
      await this.executeAction('signup_or_login', async () => await this.signupOrLogin(), true);
      await this.humanDelay();

      await this.executeAction('create_patient', async () => await this.createPatient(), true);
      await this.humanDelay();

      await this.executeAction('schedule_appointment', async () => await this.scheduleAppointment(), true);
      await this.humanDelay();

      await this.executeAction('create_clinical_note', async () => await this.createClinicalNote(), true);
      await this.humanDelay();

      await this.executeAction('order_lab_tests', async () => await this.orderLabTests(), true);
      await this.humanDelay();

      await this.executeAction('prescribe_medication', async () => await this.prescribeMedication(), true);
      await this.humanDelay();

      await this.executeAction('view_patient_history', async () => await this.viewPatientHistory(), true);
      await this.humanDelay();

      if (this.shouldUseAI()) {
        await this.executeAction('use_clinical_ai', async () => await this.useClinicalAI(), true);
        await this.humanDelay();
      }

      await this.executeAction('generate_report', async () => await this.generateReport(), true);
      await this.humanDelay();

      await this.executeAction('view_analytics', async () => await this.viewAnalytics(), true);

      return this.generateResult(TestStatus.COMPLETED, `Successfully completed MedNext-Healthcare test flow`);
    } catch (error: any) {
      this.logger.error('Test flow failed', { error: error.message });
      return this.generateResult(TestStatus.FAILED, `Test flow failed: ${error.message}`);
    }
  }

  async generateRealisticContent(contentType: string): Promise<any> {
    const prompt = `Generate realistic ${contentType} for a ${this.persona.type} level healthcare provider.`;
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
    const email = `${this.agentName.toLowerCase()}@test-mednext.local`;
    const password = 'TestProvider123!'; // pragma: allowlist secret

    try {
      const signupResponse = await this.http.post('/api/auth/signup', {
        email, password, name: this.persona.name, role: 'PROVIDER',
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

  private async createPatient(): Promise<void> {
    const patientName = await this.generateRealisticContent('patient_name');
    const response = await this.http.post('/api/patients', {
      name: typeof patientName === 'string' ? patientName : `Test Patient ${Date.now()}`,
      dateOfBirth: '1980-01-01',
      gender: 'M',
    });
    this.patients.push(response.data.patient);
    this.logger.info('Patient created', { patientId: response.data.patient.id });
  }

  private async scheduleAppointment(): Promise<void> {
    if (this.patients.length === 0) throw new Error('No patients');
    await this.http.post('/api/appointments', {
      patientId: this.patients[0].id,
      datetime: new Date(Date.now() + 86400000).toISOString(),
      type: 'CONSULTATION',
    });
    this.logger.info('Appointment scheduled');
  }

  private async createClinicalNote(): Promise<void> {
    if (this.patients.length === 0) throw new Error('No patients');
    const note = await this.generateRealisticContent('clinical_note');
    await this.http.post('/api/clinical-notes', {
      patientId: this.patients[0].id,
      note: typeof note === 'string' ? note : 'Patient evaluation complete',
    });
    this.logger.info('Clinical note created');
  }

  private async orderLabTests(): Promise<void> {
    if (this.patients.length === 0) throw new Error('No patients');
    await this.http.post('/api/lab-orders', {
      patientId: this.patients[0].id,
      tests: ['CBC', 'CMP', 'Lipid Panel'],
    });
    this.logger.info('Lab tests ordered');
  }

  private async prescribeMedication(): Promise<void> {
    if (this.patients.length === 0) throw new Error('No patients');
    await this.http.post('/api/prescriptions', {
      patientId: this.patients[0].id,
      medication: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'TID',
    });
    this.logger.info('Medication prescribed');
  }

  private async viewPatientHistory(): Promise<void> {
    if (this.patients.length === 0) throw new Error('No patients');
    await this.http.get(`/api/patients/${this.patients[0].id}/history`);
    this.logger.info('Patient history viewed');
  }

  private async useClinicalAI(): Promise<void> {
    if (this.patients.length === 0) throw new Error('No patients');
    const question = await this.generateRealisticContent('clinical_question');
    await this.http.post('/api/ai-assistant', {
      patientId: this.patients[0].id,
      question: typeof question === 'string' ? question : 'What are the differential diagnoses?',
    });
    this.logger.info('Clinical AI consulted');
  }

  private async generateReport(): Promise<void> {
    if (this.patients.length === 0) throw new Error('No patients');
    const decision = await this.makeIntelligentDecision(
      'Which report format?',
      ['PDF', 'HL7', 'FHIR']
    );
    await this.http.post('/api/reports', {
      patientId: this.patients[0].id,
      format: decision.chosen,
    });
    this.logger.info('Report generated', { format: decision.chosen });
  }

  private async viewAnalytics(): Promise<void> {
    const response = await this.http.get('/api/analytics');
    this.logger.info('Analytics viewed', { patientsCount: response.data.total || 0 });
  }

  private shouldUseAI(): boolean {
    return this.persona.type === 'EXPERT' || this.persona.type === 'POWER_USER' || Math.random() > 0.5;
  }

  private getFallbackContent(contentType: string): string {
    const fallbacks: Record<string, string> = {
      patient_name: 'John Doe',
      clinical_note: 'Patient presents with mild symptoms',
      clinical_question: 'Recommend treatment approach',
    };
    return fallbacks[contentType] || 'Generated medical content';
  }
}
