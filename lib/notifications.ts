/** Alertes optionnelles : email Resend et SMS Twilio.
 * Les erreurs externes sont journalisées sans interrompre l’action des invités.
 */
type Notification = { subject: string; message: string };
export async function sendAdminNotification({subject,message}:Notification) {
  const emails=(process.env.ADMIN_NOTIFY_EMAILS || process.env.ADMIN_EMAILS || "")
    .split(",").map(x=>x.trim()).filter(x=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));
  const apiKey=process.env.RESEND_API_KEY;
  const from=process.env.EMAIL_FROM;
  const site=(process.env.NEXT_PUBLIC_SITE_URL || "https://071727-op.com").replace(/\/$/,"");
  if (emails.length && apiKey && from) {
    try {
      const response=await fetch("https://api.resend.com/emails",{
        method:"POST",
        headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
        body:JSON.stringify({
          from,to:emails,subject:`Mariage 2027 — ${subject}`,
          text:`${message}\n\nAdministration : ${site}/admin`
        })
      });
      if(!response.ok) console.error("Notification Resend rejected",response.status,await response.text());
    } catch(e) { console.error("Notification Resend error",e); }
  }
  // SMS optionnel : compte Twilio, numéro Twilio et destinataires E.164 requis.
  const sid=process.env.TWILIO_ACCOUNT_SID;
  const token=process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom=process.env.TWILIO_FROM;
  const numbers=(process.env.ADMIN_NOTIFY_PHONES || "").split(",").map(x=>x.trim()).filter(x=>/^\+[1-9]\d{7,14}$/.test(x));
  if(sid && token && twilioFrom && numbers.length){
    for(const to of numbers){
      try {
        const body=new URLSearchParams({From:twilioFrom,To:to,Body:`Mariage 2027 — ${subject}. ${site}/admin`});
        const response=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,{
          method:"POST",
          headers:{"Authorization":`Basic ${Buffer.from(sid+":"+token).toString("base64")}`,"Content-Type":"application/x-www-form-urlencoded"},
          body
        });
        if(!response.ok) console.error("Twilio SMS rejected",response.status);
      }catch(e){console.error("Twilio SMS notification error",e)}
    }
  }
}
