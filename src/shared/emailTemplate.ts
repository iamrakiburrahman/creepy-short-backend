import {
     IBlockAccount,
     IContact,
     ICreateAccount,
     IHelpContact,
     IHelpReplay,
     IResetPassword,
     IResetPasswordByEmail,
} from '../types/emailTemplate';

const createAccount = (values: ICreateAccount) => {
     const data = {
          to: values.email,
          subject: 'Verify your account',
          html: `<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">

  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.08);">

    <div style="background:#BE3838;padding:25px;text-align:center;">
      <img
        src="https://res.cloudinary.com/dn83fu2pc/image/upload/v1780295427/Logo_uqqpzr.png"
        alt="Creepy Shorts"
        style="width:150px;"
      />
    </div>

    <div style="padding:40px 30px;text-align:center;">

      <h2 style="margin:0 0 15px;color:#BE3838;font-size:28px;">
        Welcome, ${values.name}
      </h2>

      <p style="margin:0 0 25px;color:#555;font-size:16px;line-height:1.6;">
        Thank you for joining Creepy Shorts.
        Please use the verification code below to complete your account setup.
      </p>

      <div style="
        display:inline-block;
        background:#BE3838;
        color:#ffffff;
        font-size:30px;
        font-weight:bold;
        letter-spacing:6px;
        padding:15px 35px;
        border-radius:10px;
        margin-bottom:25px;
      ">
        ${values.otp}
      </div>

      <p style="margin:0;color:#666;font-size:14px;">
        This verification code will expire in 3 minutes.
      </p>

      <p style="margin-top:25px;color:#888;font-size:14px;line-height:1.6;">
        If you did not create an account, you can safely ignore this email.
      </p>

    </div>

    <div style="
      border-top:1px solid #eeeeee;
      padding:20px;
      text-align:center;
      color:#888;
      font-size:13px;
    ">
      © ${new Date().getFullYear()} Creepy Shorts. All rights reserved.
      <br /><br />
      <a
        href="https://creepy-shorts.com"
        style="color:#BE3838;text-decoration:none;font-weight:bold;"
      >
        creepy-shorts.com
      </a>
    </div>

  </div>

</body>`,
     };
     return data;
};
const contact = (values: IContact) => {
     const data = {
          to: values.email,
          subject: 'We’ve Received Your Message – Thank You!',
          html: `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">

    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">

        <img
            src="https://res.cloudinary.com/dn83fu2pc/image/upload/v1780295427/Logo_uqqpzr.png"
            alt="Creepy Shorts"
            style="display: block; margin: 0 auto 25px; width: 150px;"
        />

        <h2 style="color: #BE3838; font-size: 28px; margin-bottom: 20px; text-align: center;">
            Thank You for Contacting Us, ${values.name}!
        </h2>

        <p style="color: #555; font-size: 16px; line-height: 1.7; text-align: center; margin-bottom: 25px;">
            We have successfully received your message. Our support team will review your inquiry and get back to you as soon as possible.
        </p>

        <div style="background-color: #f8f8f8; border-left: 4px solid #BE3838; border-radius: 8px; padding: 20px; margin: 25px 0;">

            <p style="color: #BE3838; font-size: 18px; font-weight: bold; margin-top: 0;">
                Your Message Details
            </p>

            <p><strong>Name:</strong> ${values.name}</p>
            <p><strong>Email:</strong> ${values.email}</p>
            <p><strong>Subject:</strong> ${values.subject}</p>
            <p><strong>Message:</strong></p>

            <div style="background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e5e5e5;">
                ${values.message}
            </div>

        </div>

        <p style="color: #555; font-size: 15px; line-height: 1.7; text-align: center;">
            If your request is urgent, please contact our support team directly.
        </p>


        <div style="border-top: 1px solid #eeeeee; margin-top: 30px; padding-top: 20px; text-align: center;">

            <p style="margin: 0; color: #666;">
                Best Regards,
            </p>

            <p style="margin: 8px 0; font-size: 16px; font-weight: bold; color: #BE3838;">
                Creepy Shorts Team
            </p>

            <a
                href="https://creepy-shorts.com"
                style="color: #BE3838; text-decoration: none;"
            >
                creepy-shorts.com
            </a>

        </div>

    </div>

</body>
</html>
`,
     };
     return data;
};
const resetPassword = (values: IResetPassword) => {
     const data = {
          to: values.email,
          subject: 'Reset your password',
          html: `<div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">

    <div style="background-color: #BE3838; padding: 25px; text-align: center;">
        <img
            src="https://res.cloudinary.com/dn83fu2pc/image/upload/v1780295427/Logo_uqqpzr.png"
            alt="Creepy Shorts"
            style="width: 150px;"
        />
    </div>

    <div style="padding: 35px; text-align: center;">

        <h2 style="color: #BE3838; margin-bottom: 20px;">
            Password Reset Verification
        </h2>

        <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Use the verification code below to reset your password.
        </p>

        <div style="
            background-color: #BE3838;
            color: #ffffff;
            width: 160px;
            padding: 15px;
            margin: 25px auto;
            border-radius: 10px;
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 5px;
        ">
            ${values.otp}
        </div>

        <p style="font-size: 14px; color: #777;">
            This code is valid for 3 minutes.
        </p>

        <div style="
            margin-top: 30px;
            padding: 15px;
            background: #fafafa;
            border-left: 4px solid #BE3838;
            border-radius: 6px;
            text-align: left;
        ">
            <p style="margin: 0; color: #777; font-size: 14px; line-height: 1.6;">
                If you didn't request this code, you can safely ignore this email.
                Someone else may have entered your email address by mistake.
            </p>
        </div>

    </div>

    <div style="
        border-top: 1px solid #eeeeee;
        padding: 20px;
        text-align: center;
    ">
        <p style="margin: 0; color: #888; font-size: 13px;">
            © 2026 Creepy Shorts. All rights reserved.
        </p>

        <p style="margin-top: 10px;">
            <a
                href="https://creepy-shorts.com"
                style="color: #BE3838; text-decoration: none; font-weight: bold;"
            >
                creepy-shorts.com
            </a>
        </p>
    </div>

</div>`,
     };
     return data;
};
const resetPasswordByUrl = (values: IResetPasswordByEmail) => {
     const data = {
          to: values.email,
          subject: 'Reset Your Password',
          html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
      <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="https://res.cloudinary.com/dn83fu2pc/image/upload/v1780295427/Logo_uqqpzr.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <div style="text-align: center;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">We received a request to reset your password. Click the button below to reset it:</p>
          <a href="${values.resetUrl}" target="_blank" style="display: inline-block; background-color: #277E16; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 18px; margin: 20px auto;">Reset Password</a>
          <p style="color: #555; font-size: 16px; line-height: 1.5; margin-top: 20px;">If you didn’t request this, you can ignore this email.</p>
          <p style="color: #b9b4b4; font-size: 14px;">This link will expire in 10 minutes.</p>
        </div>
      </div>
    </body>`,
     };
     return data;
};

const contactFormTemplate = (values: IHelpContact) => {
     const data = {
          to: values.email,
          subject: 'Thank you for reaching out to us',
          html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="https://res.cloudinary.com/dn83fu2pc/image/upload/v1780295427/Logo_uqqpzr.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hello ${values.name},</p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Thank you for reaching out to us. We have received your message:</p>
            <div style="background-color: #f1f1f1; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px;">
                <p style="color: #555; font-size: 16px; line-height: 1.5;">"${values.message}"</p>
            </div>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">We will get back to you as soon as possible. Below are the details you provided:</p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 10px;">Email: ${values.email}</p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 10px;">Phone: ${values.phone}</p>
            <p style="color: #b9b4b4; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">If you need immediate assistance, please feel free to contact us directly at our support number.</p>
        </div>
    </div>
</body>`,
     };
     return data;
};
const helpReplyTemplate = (values: IHelpReplay, adminMessage: string) => {
     const data = {
          to: values.email,
          subject: 'Response to Your Help Request',
          html: `<body style="font-family: 'Roboto', sans-serif; background-color: #f3f3f3; margin: 0; padding: 0; color: #333;">
  <div style="max-width: 650px; margin: 40px auto; background-color: #fff; border-radius: 8px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1); padding: 25px; color: #333;">
    <img src="https://res.cloudinary.com/dn83fu2pc/image/upload/v1780295427/Logo_uqqpzr.png" alt="Logo" style="display: block; margin: 0 auto 20px; width: 150px;" />
    
    <div style="text-align: left; padding: 0 20px;">
      <p style="font-size: 18px; color: #555; line-height: 1.6; margin-bottom: 15px;">Hello ${values.name},</p>
      <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 20px;">Thank you for reaching out! We’ve received your message and our team is working on it. Below are the details:</p>

      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196F3;">
        <p style="font-size: 16px; color: #333; font-weight: bold; margin-bottom: 10px;">Your Message:</p>
        <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">"${values.message}"</p>
      </div>

      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #388e3c;">
        <p style="font-size: 16px; color: #333; font-weight: bold; margin-bottom: 10px;">Our Response:</p>
        <p style="font-size: 16px; color: #388e3c; line-height: 1.6;">"${adminMessage}"</p>
      </div>

      <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 20px;">If you have further questions or need additional assistance, feel free to reach out. We're here to help.</p>
      
      <div style="border-top: 1px solid #f1f1f1; padding-top: 20px; text-align: center;">
        <p style="font-size: 14px; color: #888;">Best regards,</p>
        <p style="font-size: 16px; font-weight: bold; color: #333;">Support Team</p>
        <p style="font-size: 14px; color: #888;">Company Name | <a href="https://www.companywebsite.com" style="color: #2196F3; text-decoration: none;">www.companywebsite.com</a></p>
      </div>
    </div>
  </div>
</body>`,
     };
     return data;
};
const blockAccountTemplate = (values: IBlockAccount) => {
     const data = {
          to: values.email,
          subject: 'Account Blocked Notification',
          html: `<body style="font-family: 'Roboto', sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; color: #333;">

  <div style="max-width: 650px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 6px 18px rgba(0,0,0,0.08); padding: 30px;">

    <div style="text-align: center; margin-bottom: 25px;">
      <img src="https://res.cloudinary.com/dn83fu2pc/image/upload/v1780295427/Logo_uqqpzr.png" alt="Creepy Shorts" style="width: 160px;" />
    </div>

    <div style="padding: 0 15px;">

      <p style="font-size: 20px; color: #444; margin-bottom: 15px;">
        Hello ${values.name},
      </p>

      <p style="font-size: 16px; color: #555; line-height: 1.8; margin-bottom: 20px;">
        We regret to inform you that your account has been blocked due to a violation of our Terms of Service.
      </p>

      <p style="font-size: 16px; color: #555; line-height: 1.8; margin-bottom: 25px;">
        If you believe this action was taken in error or want to appeal this decision, you can contact our support team.
      </p>


      <div style="border-top: 1px solid #eee; padding-top: 25px; text-align: center;">

        <p style="font-size: 14px; color: #888; margin: 0;">
          Best regards,
        </p>

        <p style="font-size: 16px; font-weight: bold; color: #BE3838; margin: 8px 0;">
          Support Team
        </p>

        <a href="https://creepy-shorts.com" style="color: #BE3838; text-decoration: none; font-size: 14px;">
          creepy-shorts.com
        </a>

      </div>

    </div>

  </div>

</body>`,
     };
     return data;
};
export const emailTemplate = {
     createAccount,
     resetPassword,
     resetPasswordByUrl,
     contactFormTemplate,
     contact,
     helpReplyTemplate,
     blockAccountTemplate,
};
