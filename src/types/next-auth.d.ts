import { DefaultSession, DefaultUser } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      departmentId?: string | null;
      theme?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: Role;
    departmentId?: string | null;
    theme?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role: Role;
    departmentId?: string | null;
    theme?: string;
  }
}
