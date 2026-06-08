import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";
import {
  registerSchoolSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "./auth.validator";

// In production the frontend (e.g. *.vercel.app / *.campusflow.app) and this API
// (Render) are different sites, so the auth cookies are cross-site. Cross-site
// cookies must be SameSite=None *and* Secure or the browser silently drops them
// on every API call. In development (localhost:3000 -> localhost:3001 is same-site)
// keep Strict, since None requires Secure which http://localhost can't satisfy.
const isProd = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? "none" : "strict") as "none" | "strict",
};

export async function registerSchool(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = registerSchoolSchema.parse(req.body);
    const result = await authService.registerSchool(data);
    res.status(201).json({
      success: true,
      message: "School registered successfully",
      data: {
        school: {
          id: result.school.id,
          slug: result.school.slug,
          name: result.school.name,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.loginGlobal(
      data,
      req.ip,
      req.headers["user-agent"],
    );

    res.cookie("access_token", result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refresh_token", result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth/refresh",
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        schoolSlug: result.schoolSlug,
        schoolName: result.schoolName,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      res
        .status(401)
        .json({ success: false, message: "No refresh token provided" });
      return;
    }

    const result = await authService.refreshTokens(token);

    res.cookie("access_token", result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refresh_token", result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth/refresh",
    });

    res.json({ success: true, message: "Tokens refreshed" });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refresh_token;
    if (token) await authService.logout(token);

    res.clearCookie("access_token");
    res.clearCookie("refresh_token", { path: "/api/auth/refresh" });
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await authService.getMe(req.user.userId, req.user.schoolId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await authService.updateProfile(req.user.userId, data);
    res.json({ success: true, message: "Profile updated", data: user });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const data = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user.userId, data);
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
}
