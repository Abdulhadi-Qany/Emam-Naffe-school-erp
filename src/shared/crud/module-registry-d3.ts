import {
  notifications, notificationPreferences, emailMessages, smsMessages, messages,
  paymentPlans, bankReconciliations, taxSettings, invoiceItems,
  assets, stockMovements, goodsReceiptItems,
} from '@/lib/db/schema';
import type { ModuleRegistration } from '@/src/shared/crud/GenericModule';

/** Registry PART 4c — Notifications, Finance ops, Assets/Stock. */
export const MODULE_REGISTRATIONS_D3: ModuleRegistration[] = [
  { kind: 'Notification', table: notifications as never, tableName: 'notifications', nameColumn: 'title', permission: 'communications', route: 'notifications' },
  { kind: 'NotificationPreference', table: notificationPreferences as never, tableName: 'notification_preferences', permission: 'communications', route: 'notification-preferences' },
  { kind: 'EmailMessage', table: emailMessages as never, tableName: 'email_messages', nameColumn: 'subject', permission: 'communications', route: 'email-messages' },
  { kind: 'SmsMessage', table: smsMessages as never, tableName: 'sms_messages', permission: 'communications', route: 'sms-messages' },
  { kind: 'Message', table: messages as never, tableName: 'messages', nameColumn: 'subject', permission: 'communications', route: 'messages' },
  { kind: 'PaymentPlan', table: paymentPlans as never, tableName: 'payment_plans', permission: 'finance', route: 'payment-plans' },
  { kind: 'BankReconciliation', table: bankReconciliations as never, tableName: 'bank_reconciliations', nameColumn: 'status', permission: 'finance', route: 'bank-reconciliations' },
  { kind: 'TaxSetting', table: taxSettings as never, tableName: 'tax_settings', permission: 'finance', route: 'tax-settings' },
  { kind: 'InvoiceItem', table: invoiceItems as never, tableName: 'invoice_items', permission: 'finance', route: 'invoice-items' },
  { kind: 'Asset', table: assets as never, tableName: 'assets', permission: 'inventory', route: 'assets' },
  { kind: 'StockMovement', table: stockMovements as never, tableName: 'stock_movements', permission: 'inventory', route: 'inventory-movements' },
  { kind: 'GoodsReceiptItem', table: goodsReceiptItems as never, tableName: 'goods_receipt_items', permission: 'inventory', route: 'goods-receipt-items' },
];
