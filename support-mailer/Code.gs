/** Axon support mailer. Set Script Property AXON_SUPPORT_SECRET before deploying. */
function doPost(e) {
  try {
    var payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var expected = PropertiesService.getScriptProperties().getProperty("AXON_SUPPORT_SECRET");
    if (!expected || payload.secret !== expected) return output({ ok: false });
    var sender = String(payload.senderEmail || "").trim();
    var category = String(payload.category || "General question").slice(0, 80);
    var subject = String(payload.subject || "").trim().slice(0, 120);
    var message = String(payload.message || "").trim().slice(0, 5000);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender) || subject.length < 3 || message.length < 10) return output({ ok: false });
    MailApp.sendEmail({ to: "msg2balaa@gmail.com", replyTo: sender, subject: "[Axon Support] " + category + ": " + subject, body: "From: " + sender + "\nCategory: " + category + "\nSubject: " + subject + "\n\n" + message });
    return output({ ok: true });
  } catch (err) { return output({ ok: false }); }
}
function output(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
