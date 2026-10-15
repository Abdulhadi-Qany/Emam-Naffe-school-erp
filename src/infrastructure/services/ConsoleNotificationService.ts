import type { INotificationService } from '@/src/application/ports/input/INotificationService'
import type { ILogger } from '@/src/application/ports/input/ILogger'

const LANGUAGE_LABELS: Record<'da' | 'ps' | 'en', string> = {
  da: 'دری',
  ps: 'پښتو',
  en: 'English',
}

/**
 * Development/dev notification adapter. Implements the INotificationService
 * port but only logs messages. Swap for a real SMS/Email gateway adapter
 * (e.g. a Ravand/Infobip/SES client) by registering it in the container —
 * no use-case changes required.
 */
export class ConsoleNotificationService implements INotificationService {
  constructor(private readonly logger: ILogger) {}

  public async sendSms(phone: string, message: string, language: 'da' | 'ps' | 'en'): Promise<void> {
    this.logger.info(`[SMS:${LANGUAGE_LABELS[language]}] → ${phone}`, { message })
  }

  public async sendEmail(email: string, subject: string, body: string): Promise<void> {
    this.logger.info(`[EMAIL] → ${email}`, { subject, body })
  }

  public async sendPush(userId: string, title: string, body: string): Promise<void> {
    this.logger.info(`[PUSH] → ${userId}`, { title, body })
  }
}
