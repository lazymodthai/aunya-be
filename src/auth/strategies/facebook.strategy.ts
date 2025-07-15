
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    // ตรวจสอบว่า environment variables มีค่า
    const clientID = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    const callbackURL = process.env.FACEBOOK_CALLBACK_URL;

    if (!clientID || !clientSecret || !callbackURL) {
      throw new InternalServerErrorException('Facebook credentials are not configured.');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: 'email',
      profileFields: ['emails', 'name'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    try {
      const { name, emails } = profile;

      // ตรวจสอบว่า emails มีค่าและไม่ใช่ array ว่าง
      if (!emails || emails.length === 0) {
        return done(new Error('No email found in Facebook profile'), null);
      }

      // ตรวจสอบว่า name มีค่า
      if (!name) {
        return done(new Error('No name found in Facebook profile'), null);
      }

      const user = {
        email: emails[0].value,
        firstName: name.givenName || '',
        lastName: name.familyName || '',
      };

      const payload = {
        user,
        accessToken,
      };

      done(null, payload);
    } catch (error) {
      done(error, null);
    }
  }
}