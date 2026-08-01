export async function sendTelegramDocument(chatId: string, documentBuffer: Buffer, filename: string, caption?: string) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_TOKEN) return;

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`;

  const formData = new FormData();
  formData.append('chat_id', chatId);
  if (caption) formData.append('caption', caption);
  
  // Create a Blob from the Buffer
  const blob = new Blob([documentBuffer], { type: 'application/pdf' });
  formData.append('document', blob, filename);

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    console.error('Failed to send telegram document:', await res.text());
  }
}
