export interface INotificationService {
  sendSms(phone: string, message: string, language: 'da' | 'ps' | 'en'): Promise<void>
  sendEmail(email: string, subject: string, body: string): Promise<void>
  sendPush(userId: string, title: string, body: string): Promise<void>
}
