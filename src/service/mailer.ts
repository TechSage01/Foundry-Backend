import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const generateHtml = (code: string) => {
  return`
    <html>
    <body>
      <h3>
        Your verification code is ${code}.It expires in 5 minutes. If you didn't request this, ignore this email.
      </h3>
    </body>
    </html>
    `;
}

export const sendOtpMail = async (to: string, code: string) => { 
  await resend.emails.send({
    from: "Foundry <foundry@myclivo.com>",
    to: to,
    subject: "Your OTP Code",
    html: generateHtml(code)
  }) 
}